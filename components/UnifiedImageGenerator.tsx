import React, { useState } from 'react';
import { GenerationStatus } from '../types';
import { Button } from './Button';
import { Settings, Sparkles, Download, Activity, Wand2, Image as ImageIcon, Trash2, RefreshCw, Edit, Video } from 'lucide-react';

interface GeneratedImage {
    id: string;
    url: string;
    prompt: string;
    negativePrompt?: string;
    style?: string; // For Imagen
    ratio: string;
    timestamp: number;
    engine: 'nano' | 'imagen';
}

import { userService } from '../services/firebase';
import { mediaService } from '../services/mediaService';
import { RecentGenerations } from './RecentGenerations';

interface UnifiedImageGeneratorProps {
    onNavigateToVideo?: (imageUrl: string) => void;
    user: any;
}

type EngineType = 'nano' | 'imagen';

export const UnifiedImageGenerator: React.FC<UnifiedImageGeneratorProps> = ({ onNavigateToVideo, user }) => {
    // Shared State
    const [engine, setEngine] = useState<EngineType>('nano');
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
    const [results, setResults] = useState<GeneratedImage[]>([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [retryingIds, setRetryingIds] = useState<string[]>([]);
    const [showNegative, setShowNegative] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});

    // Nano Specific State
    const [nanoModel, setNanoModel] = useState('nano-banana-pro');

    // Imagen Specific State
    const [imagenStyle, setImagenStyle] = useState('photorealistic');

    const BASE_URL = import.meta.env.VITE_BASE_URL || '';

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        const limitKey = engine === 'nano' ? 'image' : 'imagen';
        const canGenerate = await userService.checkLimit(user.uid, limitKey);

        if (!canGenerate) {
            setErrorMsg('Daily usage limit reached. Upgrade to Premium for more.');
            setStatus(GenerationStatus.FAILED);
            return;
        }

        setStatus(GenerationStatus.PROCESSING);
        setErrorMsg('');

        // Define API endpoint and payload based on engine
        const endpoint = engine === 'nano'
            ? `${BASE_URL}/api/image`
            : `${BASE_URL}/api/imagen`;

        // Number of requests: Nano usually uses 2 parallel requests in the original code. Imagen uses 2 as well in the original code.
        // We will stick to the pattern of generating 2 images if the API supports it or via parallel requests.
        // Original Nano: [1, 2].map...
        // Original Imagen: [1, 2].map...

        const requests = [1, 2].map(async (_) => {
            try {
                const currentPrompt = prompt;
                const currentNeg = negativePrompt;
                const currentRatio = aspectRatio;

                // Construct Payload
                const payload: any = {
                    prompt: currentNeg ? `${currentPrompt} --no ${currentNeg}` : currentPrompt,
                    ratio: currentRatio
                };

                if (engine === 'nano') {
                    payload.model = nanoModel === 'nano-banana-pro' ? 'nano-banana' : nanoModel;
                } else {
                    payload.style = imagenStyle;
                }

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!data.success && !data.ok && data.status !== 'processing') {
                    throw new Error(data.error || 'Unable to start generation.');
                }

                const requestId = data.requestId;
                let finalUrl = null;

                // Handle immediate done or polling
                if (data.status === 'done' || (data.image_url && !data.error)) {
                    finalUrl = data.image_url;
                } else if (requestId) {
                    const { pollStatus } = await import('../services/api');
                    // Note: pollStatus might need the FULL url if it doesn't prepend base, but existing code passed 'endpoint' which was full URL.
                    // We passed `${BASE_URL}/api/...` so it should be fine.
                    const finalResult = await pollStatus(endpoint, requestId, 8000);
                    finalUrl = finalResult.image_url;
                }

                if (finalUrl) {
                    // Save & Cache
                    try {
                        const savedMedia = await mediaService.saveAndCacheMedia(
                            user.uid,
                            'IMAGE',
                            finalUrl,
                            currentPrompt,
                            {
                                image_url: finalUrl,
                                model: engine === 'nano' ? nanoModel : 'imagen-3.0-generate-001', // or just 'imagen' if generic
                                ratio: currentRatio,
                                engine: engine,
                                style: engine === 'imagen' ? imagenStyle : undefined
                            }
                        );
                        finalUrl = savedMedia.url;
                    } catch (e) {
                        console.error('Failed to save image to DB, using external URL:', e);
                    }

                    return {
                        id: requestId || Math.random().toString(36),
                        url: finalUrl,
                        prompt: currentPrompt,
                        negativePrompt: currentNeg,
                        style: engine === 'imagen' ? imagenStyle : nanoModel, // Store "style" loosely as the config used
                        ratio: currentRatio,
                        timestamp: Date.now(),
                        engine: engine
                    } as GeneratedImage;
                }
                return null;

            } catch (err: any) {
                console.error(err);
                return null;
            }
        });

        try {
            const resultsRaw = await Promise.all(requests);
            const successful = resultsRaw.filter((r): r is GeneratedImage => r !== null);

            if (successful.length > 0) {
                await userService.incrementUsage(user.uid, limitKey);
                setResults(prev => [...successful, ...prev]);
                setStatus(GenerationStatus.COMPLETED);
            } else {
                throw new Error('Image generation failed. Please try again.');
            }

        } catch (err: any) {
            console.error(err);
            setStatus(GenerationStatus.FAILED);
            setErrorMsg('Image generation failed. Please try again.');
        }
    };

    const handleDelete = (id: string) => {
        setResults(prev => prev.filter(r => r.id !== id));
    };

    const handleReEdit = (img: GeneratedImage) => {
        setPrompt(img.prompt);
        setNegativePrompt(img.negativePrompt || '');
        setAspectRatio(img.ratio);
        setEngine(img.engine);

        if (img.engine === 'nano') {
            // If it was nano, img.style held the model name
            setNanoModel(img.style || 'nano-banana-pro');
        } else {
            setImagenStyle(img.style || 'photorealistic');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRetry = async (img: GeneratedImage) => {
        if (retryingIds.includes(img.id)) return;

        setRetryingIds(prev => [...prev, img.id]);
        try {
            // Use original engine for retry
            const currentEngine = img.engine;
            const endpoint = currentEngine === 'nano'
                ? `${BASE_URL}/api/image`
                : `${BASE_URL}/api/imagen`;

            const finalPrompt = img.negativePrompt ? `${img.prompt} --no ${img.negativePrompt}` : img.prompt;

            const payload: any = {
                prompt: finalPrompt,
                ratio: img.ratio
            };

            if (currentEngine === 'nano') {
                // If stored style is actually the model name
                const modelName = img.style || 'nano-banana';
                payload.model = modelName === 'nano-banana-pro' ? 'nano-banana' : modelName;
            } else {
                payload.style = img.style || 'photorealistic';
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!data.success && !data.ok && data.status !== 'processing') {
                throw new Error('Unable to start generation.');
            }

            const requestId = data.requestId;
            let finalUrl = null;

            if (data.status === 'done' || (data.image_url && !data.error)) {
                finalUrl = data.image_url;
            } else if (requestId) {
                const { pollStatus } = await import('../services/api');
                const finalResult = await pollStatus(endpoint, requestId, 8000);
                finalUrl = finalResult.image_url;
            }

            if (finalUrl) {
                // We won't re-save to DB for simple retry unless we want a new entry. 
                // Usually retry replaces the image in UI or adds new one. 
                // Let's treat it as a replacement for the specific card locally, but keeping same metadata mostly.
                // Or acts as a "fresh" generation in typical UI flow? 
                // The original code replaced the item in the list.

                const newImage: GeneratedImage = {
                    ...img,
                    id: requestId || Math.random().toString(36),
                    url: finalUrl,
                    timestamp: Date.now()
                };
                setResults(prev => prev.map(r => r.id === img.id ? newImage : r));
            }

        } catch (err) {
            console.error('Retry failed', err);
        } finally {
            setRetryingIds(prev => prev.filter(id => id !== img.id));
        }
    };

    const handleDownload = async (url: string, id: string) => {
        try {
            setDownloadProgress(prev => ({ ...prev, [id]: 10 }));
            const progressInterval = setInterval(() => {
                setDownloadProgress(prev => {
                    const current = prev[id] || 0;
                    if (current >= 90) return prev;
                    return { ...prev, [id]: current + 10 };
                });
            }, 150);

            // Use VITE_BASE_URL if proxy is relative, or keep as relative if same origin
            // usually /api/proxy implies same origin usage.
            const proxyUrl = `${BASE_URL}/api/proxy?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Network response was not ok');

            const blob = await response.blob();
            clearInterval(progressInterval);
            setDownloadProgress(prev => ({ ...prev, [id]: 100 }));

            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `dg-generated-${engine}-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

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

    return (
        <div className="space-y-8 pb-20">
            {/* Tool Header */}
            <div className="flex items-end justify-between border-b border-white/5 pb-6">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold uppercase tracking-widest">
                        <Activity className="w-3 h-3" />
                        AI Images
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                        {engine === 'nano' ? 'Nano Banana' : 'Google Imagen'}
                    </h1>
                    <p className="text-slate-400 max-w-lg font-light text-lg">
                        {engine === 'nano'
                            ? 'Ultra-fast image generation with Nano Banana models.'
                            : 'State of the art photorealism from Google Deep-Mind.'}
                    </p>
                </div>
                <div className="hidden md:block">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-colors duration-500 ${engine === 'nano' ? 'bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-violet-500/20' : 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-blue-500/20'}`}>
                        <ImageIcon className="w-8 h-8 text-white" />
                    </div>
                </div>
            </div>

            {/* Config & Input Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Input Area */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Engine Selector as Tabs */}
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
                        <button
                            onClick={() => setEngine('nano')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${engine === 'nano' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Nano Banana
                        </button>
                        <button
                            onClick={() => setEngine('imagen')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${engine === 'imagen' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Google Imagen
                        </button>
                    </div>

                    <div className={`glass-card rounded-3xl p-1.5 transition-all group ${engine === 'nano' ? 'hover:border-violet-500/30' : 'hover:border-blue-500/30'}`}>
                        <div className="relative bg-surface rounded-[1.2rem] overflow-hidden">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the image you want to create..."
                                className={`w-full bg-transparent border-none text-white placeholder-slate-600 focus:ring-0 p-6 min-h-[200px] resize-none text-lg leading-relaxed ${engine === 'nano' ? 'selection:bg-violet-500/30' : 'selection:bg-blue-500/30'}`}
                            />

                            {showNegative && (
                                <div className="px-6 pb-6 animate-in slide-in-from-top-2">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={negativePrompt}
                                            onChange={(e) => setNegativePrompt(e.target.value)}
                                            placeholder="Negative prompt (e.g. blurry, low quality)..."
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-red-200 placeholder-red-500/30 focus:border-red-500/50 transition-colors"
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-surface to-transparent pointer-events-none" />
                        </div>

                        <div className="px-6 py-4 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${engine === 'nano' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
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
                                className={`px-8 h-12 rounded-xl text-sm font-bold tracking-wide shadow-xl ${engine === 'nano' ? 'shadow-violet-500/20 bg-violet-600 hover:bg-violet-700' : 'shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-none'}`}
                            >
                                {engine === 'nano' ? 'GENERATE' : 'GENERATE'}
                                <Wand2 className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-card rounded-3xl p-6 h-full border-t border-white/10">
                        <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-6 ${engine === 'nano' ? 'text-violet-400' : 'text-blue-400'}`}>
                            <Settings className="w-4 h-4" />
                            Parameters
                        </div>

                        <div className="space-y-6">
                            {/* Nano Specific Params */}
                            {engine === 'nano' && (
                                <div className="space-y-3">
                                    <label className="text-xs text-slate-500 font-medium">Model</label>
                                    <div className="space-y-2">
                                        {['nano-banana-pro', 'nano-banana'].map((m) => (
                                            <button
                                                key={m}
                                                onClick={() => setNanoModel(m)}
                                                className={`w-full text-left px-4 py-3 text-sm rounded-xl border transition-all font-medium ${nanoModel === m
                                                    ? 'bg-violet-500/20 border-violet-500 text-white'
                                                    : 'bg-surface border-white/5 text-slate-400 hover:bg-white/5'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span>{m === 'nano-banana-pro' ? 'Nano Banana Pro' : 'Nano Banana'}</span>
                                                    {nanoModel === m && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Imagen Specific Params */}
                            {engine === 'imagen' && (
                                <div className="space-y-3">
                                    <label className="text-xs text-slate-500 font-medium">Model</label>
                                    <div className="space-y-2">
                                        {['Whisk', 'DeepMind', 'Gemini'].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setImagenStyle(s)}
                                                className={`w-full text-left px-4 py-3 text-sm rounded-xl border transition-all font-medium capitalize ${imagenStyle === s
                                                    ? 'bg-blue-500/20 border-blue-500 text-white'
                                                    : 'bg-surface border-white/5 text-slate-400 hover:bg-white/5'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span>{s.replace('-', ' ')}</span>
                                                    {imagenStyle === s && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <label className="text-xs text-slate-500 font-medium">Aspect Ratio</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['1:1', '16:9', '9:16'].map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setAspectRatio(r)}
                                            className={`px-2 py-3 text-sm rounded-xl border transition-all font-medium ${aspectRatio === r
                                                ? (engine === 'nano' ? 'bg-violet-500/20 border-violet-500 text-white' : 'bg-blue-500/20 border-blue-500 text-white')
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

            {/* Results */}
            {(status === GenerationStatus.PROCESSING || results.length > 0) && (
                <div className="animate-fade-up space-y-8">
                    {status === GenerationStatus.PROCESSING && (
                        <div className={`glass-card rounded-[2rem] p-8 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center min-h-[300px] border ${engine === 'nano' ? 'border-violet-500/20' : 'border-blue-500/20'}`}>
                            <div className="relative w-20 h-20 mb-6">
                                <div className="absolute inset-0 rounded-full border-2 border-white/5"></div>
                                <div className={`absolute inset-0 rounded-full border-2 border-t-transparent border-l-transparent animate-spin ${engine === 'nano' ? 'border-r-fuchsia-500 border-b-cyan-500' : 'border-r-cyan-500 border-b-indigo-500'}`}></div>
                                <div className={`absolute inset-4 rounded-full blur-xl animate-pulse ${engine === 'nano' ? 'bg-violet-500/20' : 'bg-blue-500/20'}`}></div>
                            </div>
                            <div className="text-center">
                                <p className="text-white font-bold tracking-widest text-sm animate-pulse">
                                    Generating with {engine === 'nano' ? 'Nano Banana' : 'Google Imagen'}
                                </p>
                                <p className="text-slate-500 text-xs mt-1">Please wait...</p>
                            </div>
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {results.map((img) => (
                                <div key={img.id} className="glass-card rounded-2xl overflow-hidden border border-white/10 group relative animate-in fade-in zoom-in-95">
                                    <div className="aspect-square relative bg-black/50">
                                        <img
                                            src={img.url}
                                            alt={img.prompt}
                                            className={`w-full h-full object-cover transition-all ${retryingIds.includes(img.id) ? 'blur-sm scale-105' : ''}`}
                                        />

                                        {/* Engine Badge */}
                                        <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/50 backdrop-blur text-[10px] font-bold uppercase text-white/80 border border-white/10">
                                            {img.engine === 'nano' ? 'Nano' : 'Imagen'}
                                        </div>

                                        {retryingIds.includes(img.id) && (
                                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 backdrop-blur-sm z-20">
                                                <div className="w-8 h-8 relative">
                                                    <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
                                                    <div className="absolute inset-0 rounded-full border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                                                </div>
                                            </div>
                                        )}

                                        {!retryingIds.includes(img.id) && (
                                            <div className="absolute top-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleDownload(img.url, img.id)}
                                                    className="p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-all hover:scale-105 border border-white/10"
                                                    disabled={!!downloadProgress[img.id]}
                                                >
                                                    {downloadProgress[img.id] ? (
                                                        <div className="relative w-4 h-4">
                                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 24 24">
                                                                <circle className="text-slate-600" strokeWidth="4" stroke="currentColor" fill="transparent" r="10" cx="12" cy="12" />
                                                                <circle className="text-white transition-all duration-200" strokeWidth="4" strokeDasharray={2 * Math.PI * 10} strokeDashoffset={2 * Math.PI * 10 - (downloadProgress[img.id] / 100) * 2 * Math.PI * 10} strokeLinecap="round" stroke="currentColor" fill="transparent" r="10" cx="12" cy="12" />
                                                            </svg>
                                                        </div>
                                                    ) : <Download className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(img.id)}
                                                    className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 backdrop-blur-md transition-all hover:scale-105 border border-red-500/20"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 border-t border-white/5 bg-surface/50">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleReEdit(img)}
                                                    disabled={retryingIds.includes(img.id)}
                                                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 transition-colors disabled:opacity-50"
                                                >
                                                    <Edit className="w-3 h-3" /> Re-Edit
                                                </button>
                                                <button
                                                    onClick={() => handleRetry(img)}
                                                    disabled={retryingIds.includes(img.id)}
                                                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 transition-colors disabled:opacity-50"
                                                >
                                                    <RefreshCw className={`w-3 h-3 ${retryingIds.includes(img.id) ? 'animate-spin' : ''}`} />
                                                    {retryingIds.includes(img.id) ? 'Retry' : 'Retry'}
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => onNavigateToVideo && onNavigateToVideo(img.url)}
                                                disabled={retryingIds.includes(img.id)}
                                                className="px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-xs font-bold text-violet-300 border border-violet-500/20 flex items-center gap-2 transition-colors disabled:opacity-50"
                                            >
                                                <Video className="w-3 h-3" /> Video
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <RecentGenerations userId={user.uid} type="IMAGE" />
        </div>
    );
};
