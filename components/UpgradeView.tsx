import React from 'react';
import { Button } from './Button';
import { Check, Sparkles, MessageCircle, Crown, Zap } from 'lucide-react';
import { adminService } from '../services/firebase';

export const UpgradeView: React.FC = () => {
    const handleOrder = () => {
        window.open('https://wa.me/6285784676769', '_blank');
    };

    const [pricing, setPricing] = React.useState({ price: 50000, promo: 0 });

    React.useEffect(() => {
        adminService.getGlobalSettings().then(settings => {
            setPricing({
                price: settings.packagePrice || 200000,
                promo: settings.promoPrice || 0
            });
        });
    }, []);

    const formatPrice = (p: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(p).replace('Rp', 'IDR'); // Keeping stylistic preference
    };

    return (
        <div className="space-y-8 pb-20 animate-fade-in">
            {/* Header */}
            <div className="text-center space-y-4 mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                    <Crown className="w-4 h-4" />
                    Premium Access
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                    Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Ultimate Power</span>
                </h1>
                <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
                    Remove limitations and unleash your full creative potential with our Premium Plan.
                    Experience faster speeds, higher limits, and priority support.
                </p>
            </div>

            {/* Pricing Card */}
            <div className="max-w-md mx-auto relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <div className="relative glass-card bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 overflow-hidden">

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Crown className="w-32 h-32 rotate-12" />
                    </div>

                    <div className="mb-8 relative z-10">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Premium Plan</p>
                        <div className="flex items-baseline gap-2 flex-wrap">
                            {pricing.promo > 0 ? (
                                <>
                                    <span className="text-5xl font-black text-white">{formatPrice(pricing.promo)}</span>
                                    <span className="text-xl text-slate-500 line-through decoration-red-500/50 decoration-2">{formatPrice(pricing.price)}</span>
                                </>
                            ) : (
                                <span className="text-5xl font-black text-white">{formatPrice(pricing.price)}</span>
                            )}
                            <span className="text-lg text-slate-500 font-medium">/ month</span>
                        </div>
                    </div>

                    <div className="space-y-5 mb-10 relative z-10">
                        {[
                            'Unlimited High-Quality Generations',
                            'Access to Veo 3.1, Suno Music & Imagen 3',
                            'Faster Processing (Priority Queue)',
                            'Commercial Usage Rights',
                            '24/7 Priority Support',
                            'Early Access to New Features'
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5 text-amber-400" />
                                </div>
                                <span className="text-slate-200 font-medium">{feature}</span>
                            </div>
                        ))}
                    </div>

                    <Button
                        onClick={handleOrder}
                        className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black tracking-wide text-lg rounded-2xl shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all"
                    >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        ORDER VIA WHATSAPP
                    </Button>

                    <p className="text-center text-xs text-slate-600 mt-6 md:mt-8 font-medium">
                        Instant activation after payment confirmation.
                    </p>
                </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <Zap className="w-8 h-8 text-amber-400 mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Lightning Fast</h3>
                    <p className="text-sm text-slate-400">Skip the queue with priority processing for video, music, and image generation.</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <Crown className="w-8 h-8 text-amber-400 mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Pro Quality</h3>
                    <p className="text-sm text-slate-400">Unlock maximum resolution and audio fidelity options for all your creations.</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <Sparkles className="w-8 h-8 text-amber-400 mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Commercial Rights</h3>
                    <p className="text-sm text-slate-400">Own your creations fully. Use them for commercial projects without restrictions.</p>
                </div>
            </div>
        </div>
    );
};
