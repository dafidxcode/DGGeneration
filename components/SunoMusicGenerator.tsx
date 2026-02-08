import React, { useState, useRef, useEffect } from 'react';
import { GenerationStatus } from '../types';
import { Button } from './Button';
import { Settings, Sparkles, Download, Activity, Wand2, Music, Play, Pause, Volume2, VolumeX, Type, Mic2, LayoutTemplate } from 'lucide-react';

import { userService } from '../services/firebase';

import { CustomAudioPlayer } from './CustomAudioPlayer';

interface SunoMusicGeneratorProps {
    user: any;
}

import { mediaService } from '../services/mediaService';
import { RecentGenerations } from './RecentGenerations';

export const SunoMusicGenerator: React.FC<SunoMusicGeneratorProps> = ({ user }) => {
    const [customMode, setCustomMode] = useState(false);
    const [instrumental, setInstrumental] = useState(false);
    const [prompt, setPrompt] = useState(''); // Serves as Lyrics in custom mode, Description in simple
    const [style, setStyle] = useState('');
    const [title, setTitle] = useState('');
    const [model, setModel] = useState('V5'); // Default model

    const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
    const [results, setResults] = useState<any[]>([]); // Changed to array for multi-track support
    const [errorMsg, setErrorMsg] = useState('');

    // Determine limits based on model and mode
    const getLimits = () => {
        const isAdvancedModel = ['V5', 'V4_5', 'V4_5PLUS'].includes(model);

        return {
            prompt: customMode
                ? (isAdvancedModel ? 5000 : 3000)
                : 400,
            style: isAdvancedModel ? 1000 : 200,
            title: 80
        };
    };

    const limits = getLimits();

    const handleGenerate = async () => {
        // Validation
        if (customMode) {
            if (instrumental) {
                if (!style.trim() || !title.trim()) {
                    setErrorMsg('Style and Title are required for Instrumental tracks.');
                    setStatus(GenerationStatus.FAILED);
                    return;
                }
            } else {
                if (!style.trim() || !prompt.trim() || !title.trim()) {
                    setErrorMsg('Style, Lyrics, and Title are required for vocal tracks.');
                    setStatus(GenerationStatus.FAILED);
                    return;
                }
            }
        } else {
            if (!prompt.trim()) {
                setErrorMsg('Please provide a description for your music.');
                setStatus(GenerationStatus.FAILED);
                return;
            }
        }

        // Check Access Limit
        const canGenerate = await userService.checkLimit(user.uid, 'music');
        if (!canGenerate) {
            setErrorMsg('Daily usage limit reached. Upgrade to Premium for more.');
            setStatus(GenerationStatus.FAILED);
            return;
        }

        setStatus(GenerationStatus.PROCESSING);
        setResults([]);
        setErrorMsg('');

        try {
            const payload: any = {
                customMode,
                model
            };

            if (customMode) {
                payload.instrumental = instrumental;
                payload.style = style;
                payload.title = title;
                // In custom mode, 'prompt' state acts as lyrics if not instrumental
                if (!instrumental) {
                    payload.prompt = prompt;
                }
            } else {
                // In simple mode, 'prompt' state acts as description
                payload.prompt = prompt;
            }



            // Use local proxy to hide backend API URL
            const endpoint = `/api/music`;

            // Step 1: Submit Request
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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


            if (!data.success && !data.ok && data.status !== 'processing') {
                throw new Error('Unable to start music generation. Please try again.');
            }

            // Increment Usage
            await userService.incrementUsage(user.uid, 'music');



            const requestId = data.requestId;
            if (!requestId) {
                // Fallback for immediate response if API changes
                const immediateTracks = data.records || data.data;
                if (immediateTracks && Array.isArray(immediateTracks) && immediateTracks.length > 0) {
                    setResults(immediateTracks);
                    setStatus(GenerationStatus.COMPLETED);
                    return;
                }
                throw new Error('No Request ID returned from server and no immediate results.');
            }



            // Step 2: Poll for Result
            const { pollStatus } = await import('../services/api');
            const finalResult = await pollStatus(endpoint, requestId, 8000);

            // Handle various response formats (data.records or data.data)
            const generatedTracks = finalResult.records || finalResult.data;





            if (generatedTracks && Array.isArray(generatedTracks) && generatedTracks.length > 0) {

                // Process and Save ALL tracks first
                const savedTracksPromises = generatedTracks.map(async (track: any) => {
                    try {
                        const savedMedia = await mediaService.saveAndCacheMedia(
                            user.uid,
                            'MUSIC',
                            track.audio_url,
                            track.prompt,
                            {
                                ...track, // Spread all properties: id, image_url, audio_url, duration, create_time, model, prompt, tags, title, etc.
                                thumbnail: track.image_url // Ensure thumbnail is explicit if needed, though ...track covers image_url
                            }
                        );
                        // Return track structure with updated LOCAL URL
                        return {
                            ...track,
                            audio_url: savedMedia.url, // Use local URL
                            id: savedMedia.id // Use DB ID if preferred, or keep track ID
                        };
                    } catch (e) {
                        console.error('Failed to save music to DB:', e);
                        return track; // Fallback to original
                    }
                });

                const processedTracks = await Promise.all(savedTracksPromises);

                setResults(processedTracks);
                setStatus(GenerationStatus.COMPLETED);

            } else {
                if (finalResult.ok && (!generatedTracks || generatedTracks.length === 0)) {
                    throw new Error('No tracks were returned by the generator. Please try again.');
                }
                throw new Error('Music generation incomplete. Please try again.');
            }

        } catch (err: any) {
            console.error(err);
            setStatus(GenerationStatus.FAILED);
            setErrorMsg('Music generation failed. Please try again.');
        }
    };

    // Helper for direct download via proxy
    const handleDownload = async (url: string, id: string) => {
        try {
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Network response was not ok');

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${id || `dg-generated-${Date.now()}`}.mp3`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.warn('Proxy download failed, trying direct:', error);
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
                        AI Musics
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                        Suno Music V5.0
                    </h1>
                    <p className="text-slate-400 max-w-lg font-light text-lg">
                        Generate full songs with lyrics using neural audio synthesis.
                    </p>
                </div>
                <div className="hidden md:block">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-violet-500/20">
                        <Music className="w-8 h-8 text-white" />
                    </div>
                </div>
            </div>

            {/* Main Interface */}
            <div className="w-full max-w-4xl mx-auto space-y-6">

                {/* Mode Toggle Tabs - Centered & 1:1 */}
                <div className="flex justify-center mb-8">
                    <div className="grid grid-cols-2 p-1 bg-white/5 rounded-xl border border-white/10 w-full max-w-md shadow-inner bg-opacity-50 backdrop-blur-sm">
                        <button
                            onClick={() => setCustomMode(false)}
                            className={`px-4 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all duration-300 ${!customMode ? 'bg-violet-600 text-white shadow-lg scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Simple Mode
                        </button>
                        <button
                            onClick={() => setCustomMode(true)}
                            className={`px-4 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all duration-300 ${customMode ? 'bg-violet-600 text-white shadow-lg scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Custom Mode
                        </button>
                    </div>
                </div>

                <div className="glass-card rounded-[2rem] p-8 border border-white/10 space-y-8 shadow-2xl shadow-black/20">

                    {/* Custom Mode Controls */}
                    {customMode && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                <h3 className="text-white font-bold flex items-center gap-2 text-lg">
                                    <Settings className="w-5 h-5 text-violet-400" />
                                    Track Configuration
                                </h3>
                                <div className="flex items-center gap-4 bg-black/20 px-4 py-2 rounded-full border border-white/5">
                                    <span className={`text-sm font-bold transition-colors ${instrumental ? 'text-violet-400' : 'text-slate-500'}`}>Instrumental</span>
                                    <button
                                        onClick={() => setInstrumental(!instrumental)}
                                        className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${instrumental ? 'bg-violet-500' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm ${instrumental ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Title Input */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-400 ml-1">Song Title <span className="text-red-400">*</span></label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value.slice(0, limits.title))}
                                            placeholder="Enter song title..."
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all outline-none placeholder-slate-600 group-hover:border-white/20"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">
                                            {title.length}/{limits.title}
                                        </div>
                                    </div>
                                </div>

                                {/* Style Input */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-400 ml-1">Style of Music <span className="text-red-400">*</span></label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={style}
                                            onChange={(e) => setStyle(e.target.value.slice(0, limits.style))}
                                            placeholder="e.g. 80s pop, synthwave, upbeat"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all outline-none placeholder-slate-600 group-hover:border-white/20"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">
                                            {style.length}/{limits.style}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Prompt / Lyrics Area */}
                    <div className="space-y-3">
                        <label className="flex items-center justify-between text-xs font-bold uppercase text-slate-400 ml-1">
                            <span className="flex items-center gap-2">
                                {customMode ? (instrumental ? 'Description (Optional)' : 'Lyrics') : 'Song Description'}
                                {!customMode && <Sparkles className="w-3 h-3 text-amber-400" />}
                                {!instrumental && <span className="text-red-400">*</span>}
                            </span>
                            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-500 font-mono border border-white/5">
                                {prompt.length}/{limits.prompt}
                            </span>
                        </label>

                        {customMode && instrumental ? (
                            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 border-dashed text-center flex flex-col items-center justify-center gap-3 text-slate-500 animate-in fade-in zoom-in-95">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                    <Music className="w-6 h-6 opacity-50" />
                                </div>
                                <p className="text-sm font-medium">Instrumental mode enabled</p>
                                <p className="text-xs opacity-60">Lyrics generation is skipped for this track</p>
                            </div>
                        ) : (
                            <div className="relative group">
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value.slice(0, limits.prompt))}
                                    placeholder={customMode
                                        ? "Enter your own lyrics here (verse, chorus, etc)..."
                                        : "Describe the song you want to create (e.g. 'A sad song about a lost astronaut in the style of David Bowie')..."}
                                    className="w-full bg-black/20 border border-white/10 rounded-2xl p-5 text-white placeholder-slate-600 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 min-h-[180px] resize-none leading-relaxed transition-all outline-none text-base group-hover:bg-black/30"
                                />
                                <div className="absolute bottom-4 right-4 pointer-events-none">
                                    <LayoutTemplate className="w-4 h-4 text-slate-600 opacity-20" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Model Selection - Moved Here */}
                    <div className="space-y-4 pt-6 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2 ml-1">
                                <Activity className="w-3 h-3 text-violet-400" />
                                AI Model Engine
                            </label>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                {model === 'V5' ? 'RECOMMENDED' : model === 'V4' ? 'HIGH QUALITY' : 'FAST'}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {['V3_5', 'V4', 'V5'].map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setModel(v)}
                                    className={`relative p-4 rounded-xl text-left border transition-all duration-300 group ${model === v
                                        ? 'bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border-violet-500 ring-1 ring-violet-500/50'
                                        : 'bg-black/20 border-white/10 text-slate-400 hover:bg-white/5 hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-sm font-bold ${model === v ? 'text-white' : 'text-slate-300'}`}>
                                            Suno {v.replace('_', '.')}
                                        </span>
                                        {model === v && (
                                            <div className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
                                        )}
                                    </div>
                                    <span className="text-[10px] leading-tight block opacity-70">
                                        {v === 'V5' ? 'Latest experimental model with extended context window.' : v === 'V4' ? 'High fidelity audio generation.' : 'Balanced speed and quality.'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-end pt-2">
                        <Button
                            onClick={handleGenerate}
                            isLoading={status === GenerationStatus.PROCESSING}
                            className="w-full md:w-auto px-10 h-14 rounded-xl text-sm font-bold tracking-widest shadow-2xl shadow-violet-500/20 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 bg-[length:200%_auto] hover:bg-[position:right_center] transition-all duration-500 border-none group"
                        >
                            <span className="flex items-center gap-3">
                                {status === GenerationStatus.PROCESSING ? 'SYNTHESIZING...' : (customMode ? 'GENERATE CUSTOM TRACK' : 'CREATE SONG')}
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
            {status !== GenerationStatus.IDLE && (
                <div className="animate-fade-up">
                    <div className="glass-card rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl relative mt-8">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-violet-500/20 blur-[100px] -z-10" />

                        {/* Header */}
                        <div className="h-16 border-b border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between px-8">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-2.5 h-2.5 rounded-full ${status === GenerationStatus.PROCESSING
                                        ? 'bg-amber-400 animate-pulse'
                                        : status === GenerationStatus.FAILED
                                            ? 'bg-red-500'
                                            : 'bg-emerald-400 shadow-[0_0_10px_#34d399]'
                                        }`}
                                />
                                <span className="text-sm font-bold tracking-wide text-white">
                                    {status === GenerationStatus.PROCESSING
                                        ? 'SYNTHESIZING AUDIO'
                                        : status === GenerationStatus.FAILED
                                            ? 'GENERATION FAILED'
                                            : `GENERATION COMPLETE (${results.length} Tracks)`}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="min-h-[300px] flex items-center justify-center p-8 bg-black/40 backdrop-blur-sm">
                            {status === GenerationStatus.PROCESSING && (
                                <div className="flex flex-col items-center gap-6">
                                    <div className="relative w-20 h-20">
                                        <div className="absolute inset-0 rounded-full border-2 border-white/5"></div>
                                        <div className="absolute inset-0 rounded-full border-2 border-t-violet-500 border-r-fuchsia-500 border-b-cyan-500 border-l-transparent animate-spin"></div>
                                        <div className="absolute inset-4 rounded-full bg-violet-500/20 blur-xl animate-pulse"></div>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-white font-bold tracking-widest text-sm animate-pulse">
                                            COMPOSING
                                        </p>
                                        <p className="text-slate-500 text-xs">Generating waveforms and mastering...</p>
                                    </div>
                                </div>
                            )}

                            {status === GenerationStatus.FAILED && (
                                <div className="text-center max-w-md p-8 rounded-2xl bg-red-500/5 border border-red-500/20">
                                    <p className="text-red-400 font-bold mb-2">ERROR ENCOUNTERED</p>
                                    <p className="text-sm text-slate-400">{errorMsg}</p>
                                </div>
                            )}

                            {status === GenerationStatus.COMPLETED && results.length > 0 && (
                                <div className="w-full max-w-5xl space-y-8">
                                    {results.map((track, index) => (
                                        <div key={track.id || index} className="animate-in zoom-in-95 duration-500 slide-in-from-bottom-4" style={{ animationDelay: `${index * 150}ms` }}>
                                            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">

                                                {/* Cover Art */}
                                                <div className="w-48 h-48 flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-violet-500/20 border border-white/10 group relative">
                                                    {track.image_url ? (
                                                        <img src={track.image_url} alt="Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-violet-900 to-black flex items-center justify-center">
                                                            <Music className="w-16 h-16 text-white/20" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Track Info & Player */}
                                                <div className="flex-1 w-full space-y-6">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{track.title || title || 'Untitled Track'}</h3>
                                                            <div className="flex flex-wrap gap-2">
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-slate-300 border border-white/5 uppercase tracking-wider">
                                                                    {track.model || model}
                                                                </span>
                                                                {track.tags && (
                                                                    <span className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-400 border border-white/5">
                                                                        {track.tags}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {track.audio_url && (
                                                            <button
                                                                onClick={() => handleDownload(track.audio_url, track.id)}
                                                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-lg shadow-violet-500/20"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                                Download
                                                            </button>
                                                        )}
                                                    </div>

                                                    <CustomAudioPlayer src={track.audio_url} />

                                                    {/* Lyrics Display */}
                                                    {track.metadata?.prompt && (
                                                        <div className="p-4 rounded-xl bg-black/20 border border-white/5 max-h-40 overflow-y-auto text-sm text-slate-400 leading-relaxed font-mono whitespace-pre-wrap scrollbar-thin scrollbar-thumb-white/10">
                                                            <p className="text-[10px] uppercase text-slate-500 font-bold mb-2">Lyrics / Prompt</p>
                                                            {track.metadata.prompt}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Generations */}
            <RecentGenerations userId={user.uid} type="MUSIC" />
        </div>
    );
};
