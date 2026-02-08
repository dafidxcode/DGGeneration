import React, { useState, useRef } from 'react';
import { GenerationStatus } from '../types';
import { Button } from './Button';
import { Settings, Sparkles, Download, Activity, Wand2, Video, Upload, Image as ImageIcon, X, RefreshCw, Smartphone, Monitor, Square, Trash2, Edit } from 'lucide-react';
import { userService } from '../services/firebase';
import { mediaService } from '../services/mediaService';
import { RecentGenerations } from './RecentGenerations';

type AspectRatio = '16:9' | '9:16';
type GenerationType = 'text-to-video' | 'image-to-video';
type VeoModel = 'veo-3.1-fast' | 'veo-3.1';

interface VideoGeneratorProps {
    initialImage?: string;
    user: any;
}

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({ initialImage, user }) => {
    const [generationType, setGenerationType] = useState<GenerationType>('text-to-video');
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [showNegative, setShowNegative] = useState(false);
    const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    // Parameters
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [model, setModel] = useState<VeoModel>('veo-3.1-fast');

    // Upload State
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (initialImage) {
            setUploadedUrl(initialImage);
            setGenerationType('image-to-video');
            // Reset status if coming fresh
            setStatus(GenerationStatus.IDLE);
            setResultUrl(null);
        }
    }, [initialImage]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadedFile(file);
        setIsUploading(true);
        setErrorMsg('');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', user.uid); // Send User ID for DB tracking

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.status === 'success' && data.data && data.data.url) {
                // Local URL is returned directly
                setUploadedUrl(data.data.url);
            } else {
                throw new Error('Failed to get upload URL from server');
            }
        } catch (err: any) {
            console.error('Upload failed:', err);
            setErrorMsg('Failed to upload image. Please try again.');
            setUploadedFile(null);
        } finally {
            setIsUploading(false);
        }
    };

    const clearFile = () => {
        setUploadedFile(null);
        setUploadedUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setErrorMsg('Please describe the video you want to generate.');
            return;
        }

        if (generationType === 'image-to-video' && !uploadedUrl) {
            setErrorMsg('Please upload an image first for Image-to-Video generation.');
            return;
        }

        // Check Access Limit using User ID
        const canGenerate = await userService.checkLimit(user.uid, 'video');
        if (!canGenerate) {
            setErrorMsg('Daily usage limit reached. Upgrade to Premium for more.');
            return;
        }

        setStatus(GenerationStatus.PROCESSING);
        setResultUrl(null);
        setErrorMsg('');

        try {
            // Combine prompt and negative prompt
            const finalPrompt = negativePrompt ? `${prompt} --no ${negativePrompt}` : prompt;



            // Safe URL handling with fallback
            // Connect to Local Proxy
            const endpoint = `/api/video`;

            // Step 1: Submit Request (POST JSON)
            const videoType = (generationType === 'image-to-video' && uploadedUrl) ? 'image-to-video' : 'text-to-video';
            const payload: any = {
                prompt: finalPrompt,
                model: model,
                ratio: aspectRatio,
                type: videoType
            };

            if (videoType === 'image-to-video' && uploadedUrl) {
                payload.imageUrls = uploadedUrl;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            // Check if response is OK
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`API Request Failed: ${response.status} ${response.statusText}`);
            }

            // Safe JSON parsing
            let data;
            try {
                const text = await response.text();
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error('Failed to parse API response:', text.substring(0, 200));
                    throw new Error('Invalid server response (not JSON)');
                }
            } catch (e: any) {
                throw new Error(e.message || 'Failed to read response');
            }

            // Handle success
            const isQueued = data.status === 'queued';
            const isProcessing = data.status === 'processing';
            const isSuccess = data.success || data.ok;

            if (!isSuccess && !isProcessing && !isQueued) {
                throw new Error(data.error || 'Unable to start video generation. Please try again.');
            }

            // Increment Usage
            await userService.incrementUsage(user.uid, 'video');

            // Handle Request ID
            const requestId = data.requestId || data.id || data.jobId;

            if (!requestId) {
                if (isQueued && data.position) {
                    // Queue handling without ID if necessary, but ideally we need an ID
                    throw new Error(`Request queued at position ${data.position} but no Tracking ID returned.`);
                }
                throw new Error('No Request ID returned from server');
            }

            const { pollStatus } = await import('../services/api');

            // Start Polling
            // Note: pollStatus in api.ts handles the loop. 
            // We pass the SAME endpoint because the API uses GET /api/video?requestId=... for polling too.
            const finalResult = await pollStatus(endpoint, requestId, 8000);

            if (finalResult.video_url || (finalResult.result && finalResult.result[0])) {
                const videoUrl = finalResult.video_url || finalResult.result[0];

                // Save to DB & Cache Locally FIRST
                try {
                    const savedMedia = await mediaService.saveAndCacheMedia(
                        user.uid,
                        'VIDEO',
                        videoUrl,
                        prompt,
                        {
                            video_url: videoUrl,
                            model: model,
                            ratio: aspectRatio
                        }
                    );
                    setResultUrl(savedMedia.url);
                    setStatus(GenerationStatus.COMPLETED);

                } catch (e) {
                    console.error('Failed to save to DB:', e);
                    setResultUrl(videoUrl);
                    setStatus(GenerationStatus.COMPLETED);
                }

            } else {
                throw new Error('Video URL missing in final response');
            }

        } catch (err: any) {
            console.error(err);
            setStatus(GenerationStatus.FAILED);
            setErrorMsg('Video generation failed. Please try again.');
        }
    };

    const handleRegenerate = () => {
        handleGenerate();
    };

    const handleEditPrompt = () => {
        setResultUrl(null);
        setStatus(GenerationStatus.IDLE);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = () => {
        setResultUrl(null);
        setStatus(GenerationStatus.IDLE);
    };

    const handleDownload = async (url: string) => {
        try {
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Network response was not ok');

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `dg-video-${Date.now()}.mp4`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.warn('Proxy download failed, trying direct:', error);
            window.open(url, '_blank');
        }
    };

    // Helper for Type Icon (if Lucide doesn't have Type)
    const TypeIcon = ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <line x1="9" x2="15" y1="15" y2="15" />
            <line x1="10" x2="14" y1="19" y2="19" />
            <path d="M7 8h10" />
            <path d="M12 8v7" />
        </svg>
    );

    return (
        <div className="space-y-8 pb-20">
            {/* Tool Header */}
            <div className="flex items-end justify-between border-b border-white/5 pb-6">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold uppercase tracking-widest">
                        <Activity className="w-3 h-3" />
                        AI Videos
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                        Google Veo 3.1
                    </h1>
                    <p className="text-slate-400 max-w-lg font-light text-lg">
                        Powerfull video generation with text or image to video capabilities.
                    </p>
                </div>
                <div className="hidden md:block">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-violet-500/20">
                        <Video className="w-8 h-8 text-white" />
                    </div>
                </div>
            </div>

            {/* Main Interface */}
            <div className="w-full max-w-4xl mx-auto space-y-6">

                {/* Mode Toggle - Centered */}
                <div className="flex justify-center mb-8">
                    <div className="grid grid-cols-2 p-1 bg-white/5 rounded-xl border border-white/10 w-full max-w-md shadow-inner bg-opacity-50 backdrop-blur-sm">
                        <button
                            onClick={() => setGenerationType('text-to-video')}
                            className={`px-4 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${generationType === 'text-to-video' ? 'bg-violet-600 text-white shadow-lg scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <TypeIcon className="w-4 h-4" />
                            Text to Video
                        </button>
                        <button
                            onClick={() => setGenerationType('image-to-video')}
                            className={`px-4 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${generationType === 'image-to-video' ? 'bg-violet-600 text-white shadow-lg scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <ImageIcon className="w-4 h-4" />
                            Image to Video
                        </button>
                    </div>
                </div>

                <div className="glass-card rounded-[2rem] p-8 border border-white/10 space-y-8 shadow-2xl shadow-black/20">

                    {/* Image URL Input (No Uploads) */}
                    {generationType === 'image-to-video' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase text-slate-400 ml-1">Reference Image</label>
                            </div>

                            {!uploadedUrl ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`relative group h-32 w-full rounded-2xl border-2 border-dashed border-white/10 bg-black/20 hover:bg-black/40 hover:border-violet-500/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                                        <Upload className="w-5 h-5 text-slate-400 group-hover:text-violet-400" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                                            {isUploading ? 'Uploading...' : 'Click to Upload Image'}
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-1">
                                            Or auto-filled from Image Generator
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/20 group h-48">
                                    <div className="absolute top-2 right-2 z-10">
                                        <button
                                            onClick={clearFile}
                                            className="p-1.5 rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors backdrop-blur-sm"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <img
                                        src={uploadedUrl}
                                        alt="Reference"
                                        className="w-full h-full object-contain"
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Prompt Input */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase text-slate-400 ml-1">Prompt Description <span className="text-red-400">*</span></label>
                        </div>
                        <div className="relative bg-black/20 rounded-2xl overflow-hidden border border-white/10 group-focus-within:border-violet-500/50 transition-colors">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={generationType === 'image-to-video'
                                    ? "Describe how you want to animate this image..."
                                    : "Describe the video you want to create..."}
                                className="w-full bg-transparent border-none text-white placeholder-slate-600 focus:ring-0 p-5 min-h-[140px] resize-none leading-relaxed text-base"
                            />

                            {showNegative && (
                                <div className="px-5 pb-5 animate-in slide-in-from-top-2">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={negativePrompt}
                                            onChange={(e) => setNegativePrompt(e.target.value)}
                                            placeholder="Negative prompt (e.g. blurry, low quality, static)..."
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-red-200 placeholder-red-500/30 focus:border-red-500/50 transition-colors focus:ring-0"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-red-500/50 uppercase">
                                            Negative
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                                Ready
                            </div>
                            <button
                                onClick={() => setShowNegative(!showNegative)}
                                className={`text-xs font-bold uppercase tracking-wider transition-colors ${showNegative ? 'text-red-400' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {showNegative ? '- Remove Negative' : '+ Negative Prompt'}
                            </button>
                        </div>
                    </div>

                    {/* Unified Settings Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* Aspect Ratio */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase text-slate-400 ml-1">Aspect Ratio</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: '16:9', icon: Monitor, label: 'Landscape' },
                                    { id: '9:16', icon: Smartphone, label: 'Portrait' },
                                    { id: '1:1', icon: Square, label: 'Square' }
                                ].map((ratio) => (
                                    <button
                                        key={ratio.id}
                                        onClick={() => setAspectRatio(ratio.id as AspectRatio)}
                                        className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all duration-300 gap-1.5 ${aspectRatio === ratio.id
                                            ? 'bg-violet-500/20 border-violet-500 text-white'
                                            : 'bg-black/20 border-white/5 text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
                                    >
                                        <ratio.icon className="w-4 h-4" />
                                        <span className="text-[10px] font-bold">{ratio.id}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Model Selector */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase text-slate-400 ml-1">Model Config</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setModel('veo-3.1-fast')}
                                    className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left ${model === 'veo-3.1-fast'
                                        ? 'bg-violet-500/20 border-violet-500 text-white'
                                        : 'bg-black/20 border-white/5 text-slate-500 hover:bg-white/5'}`}
                                >
                                    <span className="text-xs font-bold">Veo 3.1 Fast</span>
                                    <span className="text-[10px] opacity-70">Optimized speed</span>
                                </button>
                                <button
                                    onClick={() => setModel('veo-3.1')}
                                    className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left ${model === 'veo-3.1'
                                        ? 'bg-violet-500/20 border-violet-500 text-white'
                                        : 'bg-black/20 border-white/5 text-slate-500 hover:bg-white/5'}`}
                                >
                                    <span className="text-xs font-bold">Veo 3.1</span>
                                    <span className="text-[10px] opacity-70">High fidelity</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-end pt-4 border-t border-white/5">
                        <Button
                            onClick={handleGenerate}
                            isLoading={status === GenerationStatus.PROCESSING}
                            disabled={isUploading || (generationType === 'image-to-video' && !uploadedUrl)}
                            className="w-full md:w-auto px-10 h-14 rounded-xl text-sm font-bold tracking-widest shadow-2xl shadow-violet-500/20 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 bg-[length:200%_auto] hover:bg-[position:right_center] transition-all duration-500 border-none group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="flex items-center gap-3">
                                {status === GenerationStatus.PROCESSING ? 'RENDERING VIDEO...' : 'GENERATE VIDEO'}
                                <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            </span>
                        </Button>
                    </div>

                    {errorMsg && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-200 text-sm animate-in slide-in-from-bottom-2">
                            <Activity className="w-5 h-5 text-red-500" />
                            {errorMsg}
                        </div>
                    )}
                </div>
            </div>

            {/* Output Display */}
            {(status === GenerationStatus.PROCESSING || resultUrl) && (
                <div className="animate-fade-up">
                    <div className="glass-card rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl relative mt-8 group">

                        {/* Background Effects */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-violet-500/20 blur-[100px] -z-10" />

                        {/* Top Actions (Download/Delete) */}
                        {resultUrl && status !== GenerationStatus.PROCESSING && (
                            <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button
                                    onClick={() => handleDownload(resultUrl!)}
                                    className="p-3 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition-all hover:scale-105"
                                    title="Download Video"
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="p-3 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-200 backdrop-blur-md border border-red-500/20 transition-all hover:scale-105"
                                    title="Delete Result"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {/* Video Display Area */}
                        <div className="relative aspect-video bg-black/40 flex items-center justify-center">
                            {status === GenerationStatus.PROCESSING ? (
                                <div className="flex flex-col items-center gap-4 relative z-10">
                                    <div className="relative w-24 h-24">
                                        <div className="absolute inset-0 rounded-full border-4 border-white/5" />
                                        <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 border-r-fuchsia-500 border-b-transparent border-l-transparent animate-spin" />
                                        <div className="absolute inset-4 rounded-full bg-violet-500/20 blur-xl animate-pulse" />
                                    </div>
                                    <p className="text-white font-bold tracking-widest text-sm animate-pulse">
                                        GENERATING VIDEO
                                    </p>
                                    <p className="text-slate-500 text-xs">This may take a minute...</p>
                                </div>
                            ) : resultUrl ? (
                                <video
                                    src={resultUrl}
                                    controls
                                    autoPlay
                                    loop
                                    className="w-full h-full object-contain"
                                />
                            ) : null}

                            {/* Regenerating Overlay */}
                            {status === GenerationStatus.PROCESSING && resultUrl && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-4">
                                    <div className="relative w-16 h-16">
                                        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                                        <div className="absolute inset-0 rounded-full border-2 border-t-violet-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                                    </div>
                                    <span className="text-white font-bold tracking-widest text-sm">REGENERATING...</span>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions (Edit/Regenerate) */}
                        {resultUrl && (
                            <div className="p-6 border-t border-white/5 bg-surface/50">
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={handleEditPrompt}
                                        disabled={status === GenerationStatus.PROCESSING}
                                        className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold text-slate-300 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Edit className="w-4 h-4" /> Edit Prompt
                                    </button>

                                    <button
                                        onClick={handleRegenerate}
                                        disabled={status === GenerationStatus.PROCESSING}
                                        className="px-6 py-3 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-sm font-bold text-violet-300 border border-violet-500/20 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${status === GenerationStatus.PROCESSING ? 'animate-spin' : ''}`} />
                                        {status === GenerationStatus.PROCESSING ? 'Regenerating...' : 'Regenerate'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Recent Generations */}
            <RecentGenerations userId={user.uid} type="VIDEO" onSelect={(url) => setResultUrl(url)} />
        </div>
    );
};
