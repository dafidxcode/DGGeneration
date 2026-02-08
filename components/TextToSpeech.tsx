import React, { useState, useMemo } from 'react';
import { GenerationStatus } from '../types';
import { Button } from './Button';
import { Settings, Download, Activity, Wand2, Mic, Search, User, Volume2, Play, Pause } from 'lucide-react';
import { TTS_VOICES, Voice } from './data/voiceData';
import { userService } from '../services/firebase';
import { mediaService } from '../services/mediaService';
import { RecentGenerations } from './RecentGenerations';

import { CustomAudioPlayer } from './CustomAudioPlayer';

interface TextToSpeechProps {
    user: any;
}

export const TextToSpeech: React.FC<TextToSpeechProps> = ({ user }) => {
    const handleDownload = async (url: string) => {
        try {
            // Use local proxy to bypass CORS
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Network response was not ok');

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `dg-generated-tts-${Date.now()}.mp3`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.warn('Proxy download failed, trying direct:', error);
            window.open(url, '_blank');
        }
    };

    const [prompt, setPrompt] = useState('');
    const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    // TTS Parameters
    const [speed, setSpeed] = useState(1.0);
    const [pitch, setPitch] = useState(1.0);
    const [stability, setStability] = useState(0.5);

    // Default to Henry (Speechify)
    const [selectedVoice, setSelectedVoice] = useState<Voice>(TTS_VOICES[0]);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredVoices = useMemo(() => {
        const lowerQuery = searchQuery.toLowerCase();
        return TTS_VOICES.filter(v =>
            v.name.toLowerCase().includes(lowerQuery) ||
            v.lang.toLowerCase().includes(lowerQuery) ||
            v.countryName.toLowerCase().includes(lowerQuery)
        );
    }, [searchQuery]);

    const handleGenerate = async () => {
        setStatus(GenerationStatus.PROCESSING);
        setErrorMsg('');

        // Check Access Limit using User ID
        const canGenerate = await userService.checkLimit(user.uid, 'tts');
        if (!canGenerate) {
            setErrorMsg('Daily usage limit reached. Upgrade to Premium for more.');
            setStatus(GenerationStatus.FAILED);
            return;
        }

        try {
            if (!prompt.trim()) {
                setErrorMsg('Please enter text to convert.');
                setStatus(GenerationStatus.IDLE);
                return;
            }
            setResultUrl(null);

            const queryParams = new URLSearchParams({
                text: prompt,
                voice: selectedVoice.id,
                language: selectedVoice.lang,
                engine: selectedVoice.engine,
                speed: speed.toString(),
                pitch: pitch.toString(),
                stability: stability.toString()
            });

            // Use local proxy to hide backend API URL
            const endpoint = `/api/tts`;

            const response = await fetch(`${endpoint}?${queryParams.toString()}`);

            // Check if response is OK
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`API Request Failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success && data.url) {
                // Increment Usage
                await userService.incrementUsage(user.uid, 'tts');

                // Save to Media History
                await mediaService.saveAndCacheMedia(
                    user.uid,
                    'TTS',
                    data.url,
                    prompt,
                    {
                        voice: selectedVoice.name,
                        lang: selectedVoice.lang,
                        engine: selectedVoice.engine
                    }
                );

                setResultUrl(data.url);
                setStatus(GenerationStatus.COMPLETED);
            } else {
                throw new Error('Voice generation failed.');
            }

        } catch (err: any) {
            console.error(err);
            setStatus(GenerationStatus.FAILED);
            setErrorMsg('Voice generation failed. Please try again.');
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Tool Header */}
            <div className="flex items-end justify-between border-b border-white/5 pb-6">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold uppercase tracking-widest">
                        <Activity className="w-3 h-3" />
                        AI Voices
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                        Text & Speech
                    </h1>
                    <p className="text-slate-400 max-w-lg font-light text-lg">
                        Convert text to natural speech with Azure models.
                    </p>
                </div>
                <div className="hidden md:block">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-violet-500/20">
                        <Mic className="w-8 h-8 text-white" />
                    </div>
                </div>
            </div>

            {/* Control Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Input Area */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="glass-card rounded-3xl p-1.5 transition-all hover:border-violet-500/30 group">
                        <div className="relative bg-surface rounded-[1.2rem] overflow-hidden min-h-[300px]">

                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Enter the text ..."
                                className="w-full h-full bg-transparent border-none text-white placeholder-slate-600 focus:ring-0 p-6 min-h-[300px] resize-none text-lg leading-relaxed selection:bg-violet-500/30"
                            />

                            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-surface to-transparent pointer-events-none" />
                        </div>
                        <div className="px-6 py-4 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Ready
                            </div>
                            <Button
                                onClick={handleGenerate}
                                isLoading={status === GenerationStatus.PROCESSING}
                                className="px-8 h-12 rounded-xl text-sm font-bold tracking-wide shadow-xl shadow-violet-500/20"
                            >
                                GENERATE SPEECH
                                <Wand2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Output Display */}
                    {status !== GenerationStatus.IDLE && (
                        <div className="animate-fade-up">
                            <div className="glass-card rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl relative">
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
                                                ? 'PROCESSING'
                                                : status === GenerationStatus.FAILED
                                                    ? 'FAILED'
                                                    : 'COMPLETE'}
                                        </span>
                                    </div>
                                    {status === GenerationStatus.COMPLETED && (
                                        <button
                                            onClick={() => handleDownload(resultUrl!)}
                                            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-white transition-colors border border-white/10"
                                        >
                                            <Download className="w-3 h-3" />
                                            Download MP3
                                        </button>
                                    )}
                                </div>

                                {/* Canvas */}
                                <div className="min-h-[200px] flex items-center justify-center p-8 bg-black/40 backdrop-blur-sm">
                                    {status === GenerationStatus.PROCESSING && (
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="relative w-20 h-20">
                                                <div className="absolute inset-0 rounded-full border-2 border-white/5"></div>
                                                <div className="absolute inset-0 rounded-full border-2 border-t-violet-500 border-r-fuchsia-500 border-b-cyan-500 border-l-transparent animate-spin"></div>
                                                <div className="absolute inset-4 rounded-full bg-violet-500/20 blur-xl animate-pulse"></div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-white font-bold tracking-widest text-sm animate-pulse">
                                                    SYNTHESIZING
                                                </p>
                                                <p className="text-slate-500 text-xs mt-1">Processing neural networks...</p>
                                            </div>
                                        </div>
                                    )}

                                    {status === GenerationStatus.FAILED && (
                                        <div className="text-center max-w-md p-8 rounded-2xl bg-red-500/5 border border-red-500/20">
                                            <p className="text-red-400 font-bold mb-2">FAILED</p>
                                            <p className="text-sm text-slate-400">{errorMsg}</p>
                                        </div>
                                    )}

                                    {status === GenerationStatus.COMPLETED && resultUrl && (
                                        <div className="w-full flex items-center justify-center animate-in zoom-in-95 duration-500">
                                            <div className="w-full max-w-2xl">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="w-12 h-12 rounded-full bg-violet-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
                                                        <Volume2 className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-white font-bold text-lg">Voice Output</h3>
                                                        <p className="text-slate-400 text-xs uppercase tracking-wider">
                                                            {selectedVoice.name} • {selectedVoice.lang}
                                                        </p>
                                                    </div>
                                                </div>
                                                <CustomAudioPlayer src={resultUrl} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Settings Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-card rounded-3xl p-6 border-t border-white/10 flex flex-col h-[700px]">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                                <Settings className="w-4 h-4 text-violet-400" />
                                Model Selection
                            </div>
                        </div>

                        {/* Voice Search */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search voice, language..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                            />
                        </div>

                        {/* Voice Parameters */}
                        <div className="space-y-6 mb-6 p-4 rounded-xl bg-white/5 border border-white/5">
                            {/* Speed */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-slate-400">Speed</span>
                                    <span className="text-white">{speed}x</span>
                                </div>
                                <input
                                    type="range" min="0.25" max="2.0" step="0.25"
                                    value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500"
                                />
                            </div>
                            {/* Pitch */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-slate-400">Intonation (Pitch)</span>
                                    <span className="text-white">{pitch}</span>
                                </div>
                                <input
                                    type="range" min="0.5" max="2.0" step="0.1"
                                    value={pitch} onChange={(e) => setPitch(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500"
                                />
                            </div>
                            {/* Stability */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-slate-400">Stability</span>
                                    <span className="text-white">{Math.round(stability * 100)}%</span>
                                </div>
                                <input
                                    type="range" min="0" max="1" step="0.05"
                                    value={stability} onChange={(e) => setStability(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500"
                                />
                            </div>
                        </div>

                        {/* Voice List */}
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {filteredVoices.map((voice) => {
                                const countryCode = voice.lang.split('-')[1] || 'US';
                                return (
                                    <button
                                        key={voice.id + voice.engine}
                                        onClick={() => setSelectedVoice(voice)}
                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all ${selectedVoice.id === voice.id && selectedVoice.engine === voice.engine
                                            ? 'bg-violet-500/20 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                                            : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                                            }`}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-black/30 flex items-center justify-center text-lg shadow-inner overflow-hidden">
                                            <img
                                                src={`https://flagsapi.com/${countryCode}/flat/64.png`}
                                                alt={voice.countryName}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-sm font-bold truncate ${selectedVoice.id === voice.id ? 'text-white' : 'text-slate-300'
                                                    }`}>
                                                    {voice.name}
                                                </span>
                                                {selectedVoice.id === voice.id && (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                                <span className="uppercase tracking-wider">{voice.countryName}</span>
                                                <span className="w-0.5 h-0.5 rounded-full bg-slate-600" />
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {voice.gender}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <RecentGenerations userId={user.uid} type="TTS" onSelect={(url) => setResultUrl(url)} />
        </div>
    );
};
