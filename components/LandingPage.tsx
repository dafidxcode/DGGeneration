import React, { useEffect, useState } from 'react';
import { Button } from './Button';
import { APP_NAME } from '../constants';
import {
   Music, Video, Image as ImageIcon, Mic,
   Sparkles, Zap, ArrowRight,
   Shield, Play, Hexagon
} from 'lucide-react';

interface LandingPageProps {
   onLogin: () => void;
   isLoading?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, isLoading }) => {
   const [scrolled, setScrolled] = useState(false);

   useEffect(() => {
      const handleScroll = () => setScrolled(window.scrollY > 20);
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
   }, []);

   return (
      <div className="min-h-screen bg-background text-white selection:bg-primary-500/30 overflow-x-hidden relative">

         {/* Cinematic Background */}
         <div className="fixed inset-0 overflow-hidden pointer-events-none">
            {/* Deep Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-violet-900/20 rounded-full blur-[120px] mix-blend-screen animate-blob" />
            <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] bg-cyan-900/10 rounded-full blur-[120px] mix-blend-screen animate-blob" style={{ animationDelay: '2s' }} />
            <div className="absolute bottom-[-20%] left-[20%] w-[40vw] h-[40vw] bg-fuchsia-900/10 rounded-full blur-[100px] mix-blend-screen animate-blob" style={{ animationDelay: '4s' }} />

            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
         </div>

         {/* Navbar */}
         <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'glass-nav py-4' : 'bg-transparent py-8'}`}>
            <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center relative">
               <div className="flex items-center gap-3 cursor-pointer group mb-4" onClick={onLogin}>
                  <img src="/logo-full.png" alt={APP_NAME} className="h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
               </div>

               <div className="absolute right-6 top-0 h-full flex items-center">
                  <button
                     onClick={onLogin}
                     disabled={isLoading}
                     className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest bg-white text-black hover:bg-violet-50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     {isLoading ? 'Processing...' : 'Login / Signup'}
                  </button>
               </div>
            </div>
         </nav>

         {/* Hero Section */}
         <section className="relative pt-48 pb-32 px-6 z-10">
            <div className="max-w-6xl mx-auto text-center space-y-10">
               <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 backdrop-blur-md text-violet-300 text-xs font-bold tracking-widest uppercase animate-fade-up shadow-[0_0_15px_-3px_rgba(139,92,246,0.2)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  All in one AI generation
               </div>

               <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-white leading-[0.9] animate-fade-up" style={{ animationDelay: '0.1s' }}>
                  DESIGN <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white text-glow">THE</span><br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-300 to-violet-300">UNIMAGINABLE</span>
               </h1>

               <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light animate-fade-up" style={{ animationDelay: '0.2s' }}>
                  The unified creative singularity.
                  Compose symphonies with <strong className="text-violet-400 font-medium">Suno Music</strong>,
                  direct realities with <strong className="text-cyan-400 font-medium">Veo 3.1</strong>,
                  and visualize dreams with <strong className="text-fuchsia-400 font-medium">Nano Banana</strong>.
               </p>

               <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8 animate-fade-up" style={{ animationDelay: '0.3s' }}>
                  <Button
                     onClick={onLogin}
                     isLoading={isLoading}
                     className="h-14 px-10 text-sm tracking-widest uppercase rounded-full bg-white text-black hover:bg-violet-100 hover:text-violet-950 border-none"
                  >
                     Start Creating
                     <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
               </div>
            </div>
         </section>

         {/* Feature Showcase: Suno */}
         <section className="relative py-32 px-6 z-10 border-t border-white/5">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent opacity-50" />

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
               <div className="order-2 md:order-1 space-y-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-300 text-xs font-mono uppercase tracking-widest">
                     <Music className="w-3 h-3" />
                     <span>Generate musics</span>
                  </div>

                  <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
                     Suno <span className="text-violet-400">AI</span>
                  </h2>

                  <p className="text-xl text-slate-400 leading-relaxed font-light max-w-lg">
                     Produce studio-grade compositions characterized by intricate harmonic layers and hyper-realistic vocal depth. Powered by the advanced V5 Mirror engine, our technology preserves the high-fidelity nuance of every single rhythmic detail.
                  </p>

                  <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest text-slate-500">
                     <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                        High Fidelity
                     </span>
                     <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                        Stem Studio
                     </span>
                  </div>
               </div>

               {/* Visualizer Preview */}
               <div className="order-1 md:order-2 relative aspect-square md:aspect-video rounded-[2rem] bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center group">
                  <div className="absolute inset-0 bg-violet-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  {/* Abstract Frequency Waves */}
                  <div className="flex items-center justify-center gap-1 w-full h-full px-12 opacity-80">
                     {[...Array(24)].map((_, i) => (
                        <div
                           key={i}
                           className="flex-1 bg-violet-500 rounded-full"
                           style={{
                              height: `${20 + Math.random() * 60}%`,
                              opacity: 0.3 + Math.random() * 0.7,
                              animation: `pulse ${1 + Math.random()}s infinite ease-in-out`
                           }}
                        />
                     ))}
                  </div>
               </div>
            </div>
         </section>

         {/* Feature Showcase: Veo */}
         <section className="relative py-32 px-6 z-10 border-t border-white/5">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

               {/* Video Preview */}
               <div className="relative aspect-square md:aspect-video rounded-[2rem] bg-black/40 border border-white/10 overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/20 to-transparent" />
                  <div className="absolute flex items-center justify-center inset-0">
                     <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <Play className="w-8 h-8 fill-white text-white ml-1" />
                     </div>
                  </div>
               </div>

               <div className="space-y-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-300 text-xs font-mono uppercase tracking-widest">
                     <Video className="w-3 h-3" />
                     <span>Generate videos</span>
                  </div>

                  <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
                     Google Veo <span className="text-cyan-400">3.1</span>
                  </h2>

                  <p className="text-xl text-slate-400 leading-relaxed font-light max-w-lg">
                     Create stunning, movie-quality videos that flow perfectly. Direct your scenes with natural motion that looks and feels real.
                  </p>

                  <div className="inline-flex items-center gap-3 px-4 py-2 bg-cyan-950/30 rounded-lg border border-cyan-900/50 text-cyan-400 text-sm font-mono">
                     <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                     Fast generation
                  </div>
               </div>
            </div>
         </section>

         {/* Feature Showcase: Nano */}
         <section className="relative py-32 px-6 z-10 border-t border-white/5">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
               <div className="order-2 md:order-1 space-y-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-full text-fuchsia-300 text-xs font-mono uppercase tracking-widest">
                     <ImageIcon className="w-3 h-3" />
                     <span>Generate images</span>
                  </div>

                  <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
                     Nano <span className="text-fuchsia-400">Banana</span>
                  </h2>

                  <p className="text-xl text-slate-400 leading-relaxed font-light max-w-lg">
                     Sub-second latency image synthesis. Generate images instantly. Go from text to image in under a second. Powered by our fastest technology yet.
                  </p>
               </div>

               {/* Image Stack Preview */}
               <div className="order-1 md:order-2 relative aspect-square md:aspect-video rounded-[2rem] bg-black/40 border border-white/10 overflow-hidden p-8 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-bl from-fuchsia-900/10 to-transparent" />
                  <div className="grid grid-cols-2 gap-4 w-full h-full opacity-80 rotate-3 scale-110">
                     <div className="bg-fuchsia-500/20 rounded-2xl animate-pulse delay-75" />
                     <div className="bg-fuchsia-500/10 rounded-2xl animate-pulse delay-150" />
                     <div className="bg-fuchsia-500/10 rounded-2xl animate-pulse delay-300" />
                     <div className="bg-fuchsia-500/30 rounded-2xl animate-pulse delay-500" />
                  </div>
               </div>
            </div>
         </section>

         {/* Stats Bar */}
         <section className="border-t border-white/5 bg-black/50 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-12">
               <div>
                  <div className="text-4xl font-bold text-white mb-2 font-mono">0.4s</div>
                  <div className="text-xs uppercase tracking-widest text-slate-500">Generation Latency</div>
               </div>
               <div>
                  <div className="text-4xl font-bold text-white mb-2 font-mono">4K</div>
                  <div className="text-xs uppercase tracking-widest text-slate-500">Max Resolution</div>
               </div>
               <div>
                  <div className="text-4xl font-bold text-white mb-2 font-mono">1M+</div>
                  <div className="text-xs uppercase tracking-widest text-slate-500">Daily Creations</div>
               </div>
               <div>
                  <div className="text-4xl font-bold text-white mb-2 font-mono">99.9%</div>
                  <div className="text-xs uppercase tracking-widest text-slate-500">Uptime SLA</div>
               </div>
            </div>
         </section>

         {/* Footer */}
         <footer className="py-12 px-6 border-t border-white/5 bg-black/40 backdrop-blur-lg">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-2">
                  <img src="/logo-full.png" alt={APP_NAME} className="h-6 w-auto object-contain opacity-80" />
               </div>

               <p className="text-slate-600 text-xs tracking-wide">
                  © 2026 DC Generation. All rights reserved.
               </p>

               <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <button className="hover:text-white transition-colors">Term of use</button>
                  <button className="hover:text-white transition-colors">Privacy policy</button>
               </div>
            </div>
         </footer>
      </div>
   );
};