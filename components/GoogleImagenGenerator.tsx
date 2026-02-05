import React, { useState } from 'react';
import { GenerationStatus } from '../types';
import { Button } from './Button';
import { Settings, Sparkles, Download, Activity, Wand2, Image as ImageIcon, Trash2, RefreshCw, Edit, Video } from 'lucide-react';

interface GeneratedImage {
    id: string;
    url: string;
    prompt: string;
    negativePrompt?: string;
    style: string;
    ratio: string;
    timestamp: number;
}

import { userService } from '../services/firebase';
import { mediaService } from '../services/mediaService';
import { RecentGenerations } from './RecentGenerations';

interface GoogleImagenGeneratorProps {
    onNavigateToVideo?: (imageUrl: string) => void;
    user: any;
}

export const GoogleImagenGenerator: React.FC<GoogleImagenGeneratorProps> = ({ onNavigateToVideo, user }) => {
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
    // const [resultUrl, setResultUrl] = useState<string | null>(null); // Deprecated for single result
    const [results, setResults] = useState<GeneratedImage[]>([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [style, setStyle] = useState('photorealistic');
    const [showNegative, setShowNegative] = useState(false);
    const [retryingIds, setRetryingIds] = useState<string[]>([]);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        // Check Access Limit
        const canGenerate = await userService.checkLimit(user.uid, 'imagen');
        if (!canGenerate) {
            setErrorMsg('Daily usage limit reached. Upgrade to Premium for more.');
            setStatus(GenerationStatus.FAILED);
            return;
        }

        setStatus(GenerationStatus.PROCESSING);
        setErrorMsg('');

        // We want 2 images. Since the API might be single-gen, we'll fire 2 requests.
        // If the API supports batch, we would use that. Assuming single given previous code.
        const requests = [1, 2].map(async (_) => {
            try {
                const endpoint = 'https://viinapi.netlify.app/api/imagen';
                const currentPrompt = prompt;
                const currentNeg = negativePrompt;
                const currentStyle = style;
                const currentRatio = aspectRatio;

                // Combine prompt and negative prompt as requested
                const finalPrompt = currentNeg ? `${currentPrompt} --no ${currentNeg}` : currentPrompt;

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: finalPrompt,
                        style: currentStyle,
                        ratio: currentRatio
                    })
                });

                const data = await response.json();

                if (!data.success && !data.ok && data.status !== 'processing') {
                    throw new Error('Unable to start generation.');
                }

                const requestId = data.requestId;
                if (!requestId) throw new Error('No Request ID');

                const { pollStatus } = await import('../services/api');
                const finalResult = await pollStatus(endpoint, requestId, 8000);

                if (finalResult.image_url) {
                    let finalUrl = finalResult.image_url;
                    // Save & Cache
                    try {
                        const savedMedia = await mediaService.saveAndCacheMedia(
                            user.uid,
                            'IMAGE',
                            finalUrl,
                            finalPrompt,
                            {
                                image_url: finalUrl,
                                model: currentStyle,
                                ratio: currentRatio,
                                negativePrompt: currentNeg,
                                engine: 'imagen'
                            }
                        );
                        finalUrl = savedMedia.url;
                    } catch (e) {
                        console.error('Failed to save imagen to DB:', e);
                    }

                    return {
                        id: requestId || Math.random().toString(36),
                        url: finalUrl,
                        prompt: currentPrompt,
                        negativePrompt: currentNeg,
                        style: currentStyle,
                        ratio: currentRatio,
                        timestamp: Date.now()
                    } as GeneratedImage;
                }
                return null;
            } catch (err) {
                console.error(err);
                return null;
            }
        });

        try {
            const resultsRaw = await Promise.all(requests);
            const successful = resultsRaw.filter((r): r is GeneratedImage => r !== null);

            if (successful.length > 0) {
                // Increment usage only if at least one image was generated
                await userService.incrementUsage(user.uid, 'imagen');
                // Prepend new results
                setResults(prev => [...successful, ...prev]);
                setStatus(GenerationStatus.COMPLETED);

                // No extra save loop needed

            } else {
                throw new Error('Image generation failed. Please try again.');
            }
        } catch (err: any) {
            console.error(err);
            setStatus(GenerationStatus.FAILED);
            setErrorMsg('Image generation failed. Please try again.');
        }
    };

    const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});

    const handleDownload = async (url: string, id: string) => {
        try {
            setDownloadProgress(prev => ({ ...prev, [id]: 10 }));

            // Simulation of progress since we can't reliably get Content-Length from opaque proxy
            const progressInterval = setInterval(() => {
                setDownloadProgress(prev => {
                    const current = prev[id] || 0;
                    if (current >= 90) return prev;
                    return { ...prev, [id]: current + 10 };
                });
            }, 200);

            const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Network response was not ok');

            const blob = await response.blob();

            clearInterval(progressInterval);
            setDownloadProgress(prev => ({ ...prev, [id]: 100 }));

            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `google-imagen-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            // Reset after short delay
            setTimeout(() => {
                setDownloadProgress(prev => {
                    const newState = { ...prev };
                    delete newState[id];
                    return newState;
                });
            }, 1000);

        } catch (error) {
            console.warn('Proxy download failed, trying direct:', error);
            setDownloadProgress(prev => {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            });
            window.open(url, '_blank');
        }
    };

    const handleDelete = (id: string) => {
        setResults(prev => prev.filter(r => r.id !== id));
    };

    const handleReEdit = (img: GeneratedImage) => {
        setPrompt(img.prompt);
        setNegativePrompt(img.negativePrompt || '');
        setStyle(img.style);
        setAspectRatio(img.ratio);
        // Should we scroll to top?
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRetry = async (img: GeneratedImage) => {
        if (retryingIds.includes(img.id)) return;

        setRetryingIds(prev => [...prev, img.id]);

        try {
            const endpoint = 'https://viinapi.netlify.app/api/imagen';

            // Combine prompt and negative prompt as requested
            const finalPrompt = img.negativePrompt ? `${img.prompt} --no ${img.negativePrompt}` : img.prompt;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: finalPrompt,
                    style: img.style,
                    ratio: img.ratio
                })
            });

            const data = await response.json();

            if (!data.success && !data.ok && data.status !== 'processing') {
                throw new Error(data.error || 'Unable to start generation.');
            }

            const requestId = data.requestId;
            if (!requestId) throw new Error('No Request ID returned');

            // Poll for result
            const { pollStatus } = await import('../services/api');
            const finalResult = await pollStatus(endpoint, requestId, 8000);

            if (finalResult.image_url) {
                // Success - Update the image in place or with new ID but same position
                const newImage: GeneratedImage = {
                    id: requestId || Math.random().toString(36), // New ID for uniqueness
                    url: finalResult.image_url,
                    prompt: img.prompt,
                    negativePrompt: img.negativePrompt,
                    style: img.style,
                    ratio: img.ratio,
                    timestamp: Date.now()
                };

                setResults(prev => prev.map(r => r.id === img.id ? newImage : r));
            } else {
                throw new Error('No image URL in final response');
            }

        } catch (err) {
            console.error('Retry failed', err);
            // Optionally set global error or toast
        } finally {
            setRetryingIds(prev => prev.filter(id => id !== img.id));
        }
    };

    const generateSingle = async (p: string, np: string, s: string, r: string) => {
        // ... Similar logic to handleGenerate but meant for "Retry" button
        // For brevity, I'll just use handleReEdit behavior for now as it's safer for the "Regenerate" request to be explicit.
        handleReEdit({ prompt: p, negativePrompt: np, style: s, ratio: r } as GeneratedImage);
        // Automatically triggering might be annoying if they want to tweak.
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Tool Header */}
            <div className="flex items-end justify-between border-b border-white/5 pb-6">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                        <Activity className="w-3 h-3" />
                        AI Images
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                        Google Imagen 4.0
                    </h1>
                    <p className="text-slate-400 max-w-lg font-light text-lg">
                        State of the art photorealism from Google Deep-Mind.
                    </p>
                </div>
                <div className="hidden md:block">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-blue-500/20">
                        <ImageIcon className="w-8 h-8 text-white" />
                    </div>
                </div>
            </div>

            {/* Control Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Input Area */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="glass-card rounded-3xl p-1.5 transition-all hover:border-blue-500/30 group">
                        <div className="relative bg-surface rounded-[1.2rem] overflow-hidden">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the image you want to create (e.g. 'A futuristic city with flying cars')..."
                                className="w-full bg-transparent border-none text-white placeholder-slate-600 focus:ring-0 p-6 min-h-[200px] resize-none text-lg leading-relaxed selection:bg-blue-500/30"
                            />

                            {showNegative && (
                                <div className="px-6 pb-6 animate-in slide-in-from-top-2">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={negativePrompt}
                                            onChange={(e) => setNegativePrompt(e.target.value)}
                                            placeholder="Negative prompt (e.g. blurry, low quality, ugly)..."
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-red-200 placeholder-red-500/30 focus:border-red-500/50 transition-colors"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-red-500/50 uppercase">
                                            Negative
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-surface to-transparent pointer-events-none" />
                        </div>
                        <div className="px-6 py-4 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    Ready
                                </div>
                                <button
                                    onClick={() => setShowNegative(!showNegative)}
                                    className={`text-xs font-bold uppercase tracking-wider transition-colors ${showNegative ? 'text-red-400' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {showNegative ? '- Remove Negative' : '+ Negative Prompt'}
                                </button>
                            </div>
                            <Button
                                onClick={handleGenerate}
                                isLoading={status === GenerationStatus.PROCESSING}
                                className="px-8 h-12 rounded-xl text-sm font-bold tracking-wide shadow-xl shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-none"
                            >
                                GENERATE IMAGEN
                                <Wand2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Settings Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-card rounded-3xl p-6 h-full border-t border-white/10">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
                            <Settings className="w-4 h-4 text-blue-400" />
                            Parameters
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs text-slate-500 font-medium">Style Preset</label>
                                <div className="space-y-2">
                                    {['Whisk', 'DeepMind', 'Gemini'].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setStyle(s)}
                                            className={`w-full text-left px-4 py-3 text-sm rounded-xl border transition-all font-medium capitalize ${style === s
                                                ? 'bg-blue-500/20 border-blue-500 text-white'
                                                : 'bg-surface border-white/5 text-slate-400 hover:bg-white/5'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span>{s.replace('-', ' ')}</span>
                                                {style === s && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs text-slate-500 font-medium">Aspect Ratio</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['1:1', '16:9', '9:16'].map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setAspectRatio(r)}
                                            className={`px-2 py-3 text-sm rounded-xl border transition-all font-medium ${aspectRatio === r
                                                ? 'bg-blue-500/20 border-blue-500 text-white'
                                                : 'bg-surface border-white/5 text-slate-400 hover:bg-white/5'
                                                }`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Output Display - Grid Layout */}
            {(status === GenerationStatus.PROCESSING || results.length > 0) && (
                <div className="animate-fade-up space-y-8">
                    {status === GenerationStatus.PROCESSING && (
                        <div className="glass-card rounded-[2rem] p-8 bg-black/40 backdrop-blur-sm border border-blue-500/20 flex flex-col items-center justify-center min-h-[300px]">
                            <div className="relative w-20 h-20 mb-6">
                                <div className="absolute inset-0 rounded-full border-2 border-white/5"></div>
                                <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 border-r-cyan-500 border-b-indigo-500 border-l-transparent animate-spin"></div>
                                <div className="absolute inset-4 rounded-full bg-blue-500/20 blur-xl animate-pulse"></div>
                            </div>
                            <div className="text-center">
                                <p className="text-white font-bold tracking-widest text-sm animate-pulse">
                                    Generating with Google Imagen
                                </p>
                                <p className="text-slate-500 text-xs mt-1">Please wait...</p>
                            </div>
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {results.map((img) => (
                                <div key={img.id} className="glass-card rounded-2xl overflow-hidden border border-white/10 group relative animate-in fade-in zoom-in-95">
                                    {/* Image */}
                                    <div className="aspect-square relative bg-black/50">
                                        <img
                                            src={img.url}
                                            alt={img.prompt}
                                            className={`w-full h-full object-cover transition-all ${retryingIds.includes(img.id) ? 'blur-sm scale-105' : ''}`}
                                        />

                                        {/* Loading Overlay for Retry */}
                                        {retryingIds.includes(img.id) && (
                                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 backdrop-blur-sm z-20">
                                                <div className="w-8 h-8 relative">
                                                    <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
                                                    <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                                                </div>
                                                <span className="text-xs font-bold text-white tracking-widest animate-pulse">REGENERATING</span>
                                            </div>
                                        )}

                                        {/* Top-Right Actions (Always Visible or on Hover?) User asked for top-right. Let's make them persistent or hover but clearly top-right. */}
                                        {!retryingIds.includes(img.id) && (
                                            <div className="absolute top-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleDownload(img.url, img.id)}
                                                    className="p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-all hover:scale-105 border border-white/10"
                                                    title="Download"
                                                    disabled={!!downloadProgress[img.id]}
                                                >
                                                    {downloadProgress[img.id] ? (
                                                        <div className="relative w-4 h-4">
                                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 24 24">
                                                                <circle
                                                                    className="text-slate-600"
                                                                    strokeWidth="4"
                                                                    stroke="currentColor"
                                                                    fill="transparent"
                                                                    r="10"
                                                                    cx="12"
                                                                    cy="12"
                                                                />
                                                                <circle
                                                                    className="text-white transition-all duration-200 ease-in-out"
                                                                    strokeWidth="4"
                                                                    strokeDasharray={2 * Math.PI * 10}
                                                                    strokeDashoffset={2 * Math.PI * 10 - (downloadProgress[img.id] / 100) * 2 * Math.PI * 10}
                                                                    strokeLinecap="round"
                                                                    stroke="currentColor"
                                                                    fill="transparent"
                                                                    r="10"
                                                                    cx="12"
                                                                    cy="12"
                                                                />
                                                            </svg>
                                                        </div>
                                                    ) : (
                                                        <Download className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(img.id)}
                                                    className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 backdrop-blur-md transition-all hover:scale-105 border border-red-500/20"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="p-4 border-t border-white/5 bg-surface/50">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleReEdit(img)}
                                                    disabled={retryingIds.includes(img.id)}
                                                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Edit className="w-3 h-3" /> Re-Edit
                                                </button>
                                                <button
                                                    onClick={() => handleRetry(img)}
                                                    disabled={retryingIds.includes(img.id)}
                                                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <RefreshCw className={`w-3 h-3 ${retryingIds.includes(img.id) ? 'animate-spin' : ''}`} />
                                                    {retryingIds.includes(img.id) ? 'Retrying...' : 'Retry'}
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => onNavigateToVideo && onNavigateToVideo(img.url)}
                                                disabled={retryingIds.includes(img.id)}
                                                className="px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-xs font-bold text-violet-300 border border-violet-500/20 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Video className="w-3 h-3" /> Create Video
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {status === GenerationStatus.FAILED && (
                <div className="text-center max-w-md mx-auto p-8 rounded-2xl bg-red-500/5 border border-red-500/20 mt-8">
                    <p className="text-red-400 font-bold mb-2">GENERATION FAILED</p>
                    <p className="text-sm text-slate-400">{errorMsg}</p>
                </div>
            )}

            {/* Recent Generations */}
            <RecentGenerations userId={user.uid} type="IMAGE" />
        </div>
    );
};

