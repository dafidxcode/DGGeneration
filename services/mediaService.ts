import { getFirestore, collection, addDoc, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getApp } from 'firebase/app';

// Helper to get DB instance safely
const getDb = () => {
    try {
        return getFirestore(getApp());
    } catch (e) {
        // If app not initialized, it will be handled by firebase.ts init logic usually,
        // but for safety in independent modules:
        console.warn("Firestore access before init?");
        throw e;
    }
};

export interface SavedMedia {
    id: string;
    userId: string;
    type: 'VIDEO' | 'MUSIC' | 'IMAGE' | 'TTS';
    url: string; // External URL
    prompt: string;
    metadata?: any;
    createdAt: number;
    expiresAt: number;
}

export const mediaService = {
    // Save ONLY metadata to Firestore
    async saveAndCacheMedia(userId: string, type: 'VIDEO' | 'MUSIC' | 'IMAGE' | 'TTS', url: string, prompt: string, metadata?: any) {
        try {
            const db = getDb();
            const mediaRef = collection(db, 'media');
            const now = Date.now();
            // 3 days expiration
            const expiresAt = now + (3 * 24 * 60 * 60 * 1000);

            const newMedia = {
                userId,
                type,
                url, // Storing the remote URL directly
                prompt,
                metadata,
                createdAt: now,
                expiresAt: expiresAt
            };

            const docRef = await addDoc(mediaRef, newMedia);

            // Return local object conformant to interface
            return {
                id: docRef.id,
                ...newMedia
            } as SavedMedia;

        } catch (e) {
            console.error("Error saving media metadata:", e);
            // Fallback: return a temporary object so UI doesn't crash, but it won't be saved
            return {
                id: 'temp-' + Date.now(),
                userId,
                type,
                url,
                prompt,
                metadata,
                createdAt: Date.now(),
                expiresAt: Date.now() + 86400000
            } as SavedMedia;
        }
    },

    async getUserMedia(userId: string, type?: 'VIDEO' | 'MUSIC' | 'IMAGE' | 'TTS') {
        try {
            const db = getDb();
            const mediaRef = collection(db, 'media');
            // Remove orderBy to avoid index issues. Client-side sort instead.
            let q = query(mediaRef, where("userId", "==", userId));

            if (type) {
                q = query(mediaRef, where("userId", "==", userId), where("type", "==", type));
            }

            const querySnapshot = await getDocs(q);
            const now = Date.now();

            const validDocs: SavedMedia[] = [];

            // Lazy Deletion Logic
            querySnapshot.docs.forEach((docSnap) => {
                const data = docSnap.data() as any;
                // Check if expired
                if (data.expiresAt && data.expiresAt < now) {
                    // Fire and forget delete
                    deleteDoc(doc(db, 'media', docSnap.id)).catch(err => console.error("Lazy delete failed", err));
                } else {
                    validDocs.push({
                        id: docSnap.id,
                        userId: data.userId,
                        type: data.type,
                        url: data.url,
                        prompt: data.prompt,
                        metadata: data.metadata,
                        createdAt: data.createdAt,
                        expiresAt: data.expiresAt || 0
                    });
                }
            });

            // Sort by createdAt desc (Newest first)
            validDocs.sort((a, b) => b.createdAt - a.createdAt);

            return validDocs;
        } catch (e) {
            console.error("Error fetching media history:", e);
            return [];
        }
    },

    async deleteMedia(mediaId: string) {
        try {
            const db = getDb();
            await deleteDoc(doc(db, 'media', mediaId));
        } catch (e) {
            console.error("Error deleting media:", e);
        }
    },

    // Stub for downloading if needed by UI, but strictly just opens the link now
    // as we aren't proxying or storing locally.
    downloadMedia(url: string) {
        window.open(url, '_blank');
    }
};
