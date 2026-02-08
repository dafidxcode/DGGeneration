export interface PollResult {
    ok: boolean;
    status: 'processing' | 'done' | 'failed';
    requestId?: string;
    url?: string;         // For final media URL
    video_url?: string;   // Specific for Video
    image_url?: string;   // Specific for Image
    audio_url?: string;   // Specific for Music (single)
    data?: any[];         // Specific for Music (list of tracks)
    records?: any[];      // Alternative for Music list
    message?: string;
    error?: string;
    result?: string[]; // Added to support video result array
}

export async function pollStatus(endpoint: string, requestId: string, intervalMs: number = 5000): Promise<PollResult> {
    return new Promise((resolve, reject) => {
        const checkStatus = async () => {
            try {
                // Construct URL with requestId
                // Handle relative URLs by providing base
                const url = new URL(endpoint, window.location.origin);
                url.searchParams.set('requestId', requestId);



                const response = await fetch(url.toString());

                if (!response.ok) {
                    throw new Error(`Polling failed with status: ${response.status}`);
                }

                const data: PollResult = await response.json();

                if (data.status === 'done') {
                    resolve(data);
                } else if (data.status === 'failed') {
                    reject(new Error('Generation failed during processing. Please try again.'));
                } else {
                    // Still processing, wait and recurse
                    setTimeout(checkStatus, intervalMs);
                }

            } catch (error) {
                reject(error);
            }
        };

        // Start the first check
        checkStatus();
    });
}
