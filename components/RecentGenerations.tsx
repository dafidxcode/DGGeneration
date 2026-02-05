import React, { useEffect, useState } from 'react';
import { mediaService, SavedMedia } from '../services/mediaService';
import { Play, Download, Clock, Image as ImageIcon, Music, Video } from 'lucide-react';

interface RecentGenerationsProps {
    userId: string;
    type?: 'VIDEO' | 'MUSIC' | 'IMAGE';
    onSelect?: (url: string) => void;
}

export const RecentGenerations: React.FC<RecentGenerationsProps> = ({ userId, type, onSelect }) => {
    const [media, setMedia] = useState<SavedMedia[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMedia = async () => {
        setIsLoading(true);
        try {
            const data = await mediaService.getUserMedia(userId, type);
            setMedia(data);
        } catch (error) {
            console.error('Failed to fetch user media', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchMedia();
        }
    }, [userId, type]);

    if (isLoading) {
        return <div className="p-4 text-center text-xs text-slate-500 animate-pulse">Loading history...</div>;
    }

    if (media.length === 0) {
        return (
            <div className="text-center py-10 opacity-50">
                <div className="inline-block p-4 rounded-full bg-white/5 mb-3">
                    <Clock className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-400">No generated media found.</p>
                <p className="text-xs text-slate-500 mt-1">Start creating to see your history here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-up">
            <div className="flex items-center gap-2 px-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Recent Generations</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {media.map((item) => (
                    <div
                        key={item.id}
                        className="group relative aspect-video bg-black/20 rounded-xl overflow-hidden border border-white/5 hover:border-violet-500/30 transition-all hover:scale-[1.02] cursor-pointer"
                        onClick={() => onSelect && onSelect(item.url)}
                    >
                        {/* Media Preview */}
                        {item.type === 'VIDEO' ? (
                            <video src={item.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" muted loop onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()} />
                        ) : item.type === 'MUSIC' ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20">
                                <Music className="w-8 h-8 text-violet-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ) : (
                            <img src={item.url} alt={item.metadata?.originalName || 'Generated Image'} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                        )}

                        {/* Overlay Info */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                            <p className="text-[10px] text-white font-medium truncate">{item.prompt || 'Untitled'}</p>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-[9px] text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        mediaService.downloadMedia(item.url);
                                    }}
                                    className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white"
                                >
                                    <Download className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        {/* Play Icon for Video/Music */}
                        {(item.type === 'VIDEO' || item.type === 'MUSIC') && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                                <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                                    <Play className="w-3 h-3 text-white ml-0.5" />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
