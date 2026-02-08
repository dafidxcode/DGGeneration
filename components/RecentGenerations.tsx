import React, { useEffect, useState } from 'react';
import { mediaService, SavedMedia } from '../services/mediaService';
import { Play, Download, Clock, Image as ImageIcon, Music, Video, Mic, Grid, List as ListIcon } from 'lucide-react';

interface RecentGenerationsProps {
    userId: string;
    type?: 'VIDEO' | 'MUSIC' | 'IMAGE' | 'TTS';
    onSelect?: (url: string) => void;
}

interface RecentGenerationsProps {
    userId: string;
    type?: 'VIDEO' | 'MUSIC' | 'IMAGE' | 'TTS';
    onSelect?: (url: string) => void;
}

export const RecentGenerations: React.FC<RecentGenerationsProps> = ({ userId, type, onSelect }) => {
    const [media, setMedia] = useState<SavedMedia[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'VIDEO' | 'MUSIC' | 'IMAGE' | 'TTS'>('ALL');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const fetchMedia = async () => {
        setIsLoading(true);
        try {
            // If type is fixed (e.g. inside a specific tool), filter by that type.
            // If type is undefined (e.g. Library), fetch all and let client filter.
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

    // Force filter to type if provided prop exists
    useEffect(() => {
        if (type) {
            setFilter(type);
        }
    }, [type]);

    const filteredMedia = media.filter(item => filter === 'ALL' || item.type === filter);

    if (isLoading) {
        return <div className="p-4 text-center text-xs text-slate-500 animate-pulse">Loading history...</div>;
    }

    // If type is specific (Tool usage), keep simple header. If Library (no type), show full controls
    const showControls = !type;

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
        <div className="space-y-6 animate-fade-up">

            {showControls ? (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    {/* Filter Tabs */}
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-fit overflow-x-auto no-scrollbar">
                        {[
                            { id: 'ALL', label: 'All', icon: Clock },
                            { id: 'MUSIC', label: 'Music', icon: Music },
                            { id: 'VIDEO', label: 'Video', icon: Video },
                            { id: 'IMAGE', label: 'Image', icon: ImageIcon },
                            { id: 'TTS', label: 'Voice', icon: Mic },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setFilter(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filter === tab.id
                                    ? 'bg-violet-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-2 px-1">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Recent Generations</h3>
                </div>
            )}

            {filteredMedia.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                    No matching items found in this category.
                </div>
            ) : (
                <div className={`${viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 gap-4' : 'space-y-3'}`}>
                    {filteredMedia.map((item) => (
                        <div
                            key={item.id}
                            className={`group relative bg-black/20 rounded-xl overflow-hidden border border-white/5 hover:border-violet-500/30 transition-all hover:scale-[1.01] cursor-pointer ${viewMode === 'list' ? 'flex h-24' : 'aspect-video'
                                }`}
                            onClick={() => onSelect && onSelect(item.url)}
                        >
                            {/* Media Preview Container */}
                            <div className={`${viewMode === 'list' ? 'w-32 h-full' : 'w-full h-full'} relative`}>
                                {item.type === 'VIDEO' ? (
                                    <video src={item.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" muted loop onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()} />
                                ) : item.type === 'MUSIC' ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20 relative group">
                                        {(item.metadata?.thumbnail || item.metadata?.image_url) ? (
                                            <img
                                                src={item.metadata.thumbnail || item.metadata.image_url}
                                                alt={item.prompt}
                                                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                                            />
                                        ) : (
                                            <Music className="w-8 h-8 text-violet-400 opacity-50 group-hover:opacity-100 transition-opacity relative z-10" />
                                        )}
                                    </div>
                                ) : item.type === 'TTS' ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-900/20 to-teal-900/20">
                                        <Mic className="w-8 h-8 text-emerald-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ) : (
                                    <img src={item.url} alt={item.metadata?.originalName || 'Generated Image'} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                )}

                                {/* Play Overlay */}
                                {(item.type === 'VIDEO' || item.type === 'MUSIC' || item.type === 'TTS') && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                                        <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                                            <Play className="w-3 h-3 text-white ml-0.5" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Info Area */}
                            {viewMode === 'grid' ? (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 pointer-events-none">
                                    <p className="text-[10px] text-white font-medium truncate">{item.prompt || 'Untitled'}</p>
                                    <div className="flex items-center justify-between mt-1 pointer-events-auto">
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
                            ) : (
                                <div className="flex-1 p-4 flex flex-col justify-center">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 rounded mb-1 inline-block">
                                                {item.type}
                                            </span>
                                            <h4 className="text-sm font-bold text-white line-clamp-1">{item.prompt || 'Untitled Generation'}</h4>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                mediaService.downloadMedia(item.url);
                                            }}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(item.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
