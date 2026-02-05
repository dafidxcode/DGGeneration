import React, { useState } from 'react';
import { TOOLS, APP_NAME } from '../constants';
import { ToolId } from '../types';
import { VeoVideoGenerator } from './VeoVideoGenerator';
import { SunoMusicGenerator } from './SunoMusicGenerator';

import { UnifiedImageGenerator } from './UnifiedImageGenerator';
import { TextToSpeech } from './TextToSpeech';
import { AdminDashboard } from './AdminDashboard';
import { UpgradeView } from './UpgradeView';
import { userService } from '../services/firebase';
import { UserProfile } from '../types';
import {
   LogOut,
   Menu,
   Hexagon,
   Shield,
   Crown,
   ChevronUp
} from 'lucide-react';
import { RecentGenerations } from './RecentGenerations';

interface DashboardProps {
   onLogout: () => void;
   user: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, user }) => {
   const [activeTool, setActiveTool] = useState<string>('music');
   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
   const [isProfileOpen, setIsProfileOpen] = useState(false);
   const [navigationPayload, setNavigationPayload] = useState<{ image?: string }>({});
   const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

   const adminEmails = ['rohmadhadi360@gmail.com', 'kiyantodavin2@gmail.com'];
   const isAdmin = user && adminEmails.includes(user.email);
   // const isAdmin = user && user.email === 'rohmadhadi360@gmail.com';

   // Fetch user profile on mount to get the Tier
   React.useEffect(() => {
      const fetchProfile = async () => {
         if (user?.uid) {
            const profile = await userService.getUserProfile(user.uid);
            setUserProfile(profile);
         }
      };
      fetchProfile();
   }, [user]);

   const tierLabel = userProfile?.tier === 'PREMIUM' ? 'Pro License' : 'Free License';
   const isFree = userProfile?.tier === 'FREE';

   const handleNavigateToVideo = (imageUrl: string) => {
      setNavigationPayload({ image: imageUrl });
      setActiveTool('video');
   };

   const renderActiveGenerator = () => {
      switch (activeTool) {
         case 'video':
            return <VeoVideoGenerator user={user} initialImage={navigationPayload.image} />;
         case 'music':
            return <SunoMusicGenerator user={user} />;
         case 'image':
            return <UnifiedImageGenerator user={user} onNavigateToVideo={handleNavigateToVideo} />;
         case 'tts':
            return <TextToSpeech user={user} />;
         // case 'imagen': Removed in favor of Unified Generator
         case 'admin':
            return isAdmin ? <AdminDashboard /> : <SunoMusicGenerator user={user} />;
         case 'upgrade':
            return <UpgradeView />;
         case 'library':
            return (
               <div className="space-y-8 pb-20">
                  <div className="flex items-end justify-between border-b border-white/5 pb-6">
                     <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                           Your Library
                        </h1>
                        <p className="text-slate-400 max-w-lg font-light text-lg">
                           Access all your generated history in one place.
                        </p>
                     </div>
                  </div>
                  <RecentGenerations userId={user.uid} />
               </div>
            );
         default:
            return <SunoMusicGenerator user={user} />;
      }
   };

   return (
      <div className="flex h-screen bg-background overflow-hidden text-slate-200 font-sans relative">

         {/* ALIVE Background Effects */}
         <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-violet-900/10 rounded-full blur-[100px] animate-blob" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-cyan-900/10 rounded-full blur-[100px] animate-blob" style={{ animationDelay: '5s' }} />
            <div className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] bg-fuchsia-900/05 rounded-full blur-[80px] animate-blob" style={{ animationDelay: '2s' }} />
         </div>

         {/* Floating Glass Sidebar */}
         <aside className={`fixed inset-y-4 left-4 z-50 w-72 glass-card rounded-3xl border border-white/5 flex flex-col transform transition-transform duration-500 ease-out md:relative md:translate-x-0 md:inset-auto md:h-[calc(100vh-2rem)] md:my-4 md:ml-4 shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[110%]'}`}>
            <div className="h-24 flex items-center px-8">
               <img src="/logo-full.png" alt={APP_NAME} className="h-14 w-auto object-contain" />
            </div>

            <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
               <div className="px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Generative Tools</div>
               {TOOLS.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = activeTool === tool.id;
                  return (
                     <button
                        key={tool.id}
                        onClick={() => { setActiveTool(tool.id); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                           ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20'
                           : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                           }`}
                     >
                        {isActive && <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 opacity-100" />}
                        <Icon className={`w-5 h-5 mr-3 relative z-10 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                        <span className="font-medium relative z-10 tracking-wide">{tool.name}</span>
                        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse relative z-10" />}
                     </button>
                  );
               })}
            </nav>

            <div className="p-4 mt-auto relative">
               {isAdmin && (
                  <button
                     onClick={() => { setActiveTool('admin'); setIsSidebarOpen(false); }}
                     className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden mb-2 ${activeTool === 'admin'
                        ? 'bg-red-900/20 text-red-200 shadow-lg border border-red-500/30'
                        : 'text-slate-400 hover:bg-red-500/10 hover:text-red-300'
                        }`}
                  >
                     {activeTool === 'admin' && <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent" />}
                     <Shield className={`w-5 h-5 mr-3 relative z-10 ${activeTool === 'admin' ? 'text-red-400' : 'text-slate-500 group-hover:text-red-400'}`} />
                     <span className="font-medium relative z-10 tracking-wide">Admin Panel</span>
                  </button>
               )}

               <div className="h-px bg-white/10 my-4" />

               {/* Profile Dropdown Trigger */}
               <div className="relative">
                  <button
                     onClick={() => setIsProfileOpen(!isProfileOpen)}
                     className="w-full glass p-3 rounded-2xl flex items-center gap-3 border border-white/5 bg-white/5 hover:bg-white/10 transition-colors text-left"
                  >
                     {user.photoURL ? (
                        <img
                           src={user.photoURL}
                           alt="User"
                           className="w-10 h-10 rounded-xl object-cover ring-2 ring-violet-500/20"
                           referrerPolicy="no-referrer"
                           onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement?.querySelector('.fallback-avatar')?.classList.remove('hidden');
                           }}
                        />
                     ) : (
                        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center ring-2 ring-violet-500/20">
                           <span className="text-lg font-bold text-white uppercase">{user.displayName?.charAt(0) || 'U'}</span>
                        </div>
                     )}

                     <div className="fallback-avatar hidden w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center ring-2 ring-violet-500/20 absolute left-3 top-3 pointer-events-none">
                        <span className="text-lg font-bold text-white uppercase">{user.displayName?.charAt(0) || 'U'}</span>
                     </div>

                     <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{user.displayName || 'Anonymous'}</p>
                        <p className={`text-[10px] truncate uppercase tracking-wider ${userProfile?.tier === 'PREMIUM' ? 'text-amber-400' : 'text-violet-300'}`}>
                           {tierLabel}
                        </p>
                     </div>
                     <ChevronUp className={`w-4 h-4 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                     <div className="absolute bottom-full left-0 w-full mb-2 bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-2 fade-in z-50">
                        <div className="p-1">
                           <button
                              onClick={() => { setActiveTool('library'); setIsSidebarOpen(false); setIsProfileOpen(false); }}
                              className={`w-full flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors gap-3 ${activeTool === 'library' ? 'bg-violet-500/20 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                           >
                              <Menu className="w-4 h-4" />
                              My Library
                           </button>
                           <button
                              onClick={onLogout}
                              className="w-full flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 rounded-xl transition-colors gap-3"
                           >
                              <LogOut className="w-4 h-4" />
                              Disconnect
                           </button>
                        </div>
                     </div>
                  )}
               </div>
            </div>

         </aside>

         {/* Main Content */}
         <main className="flex-1 flex flex-col relative overflow-hidden h-screen">
            {/* Mobile Header */}
            < div className="h-20 md:hidden flex items-center justify-between px-6 z-40 bg-background/80 backdrop-blur-md sticky top-0 relative" >
               <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white">
                  <Menu className="w-6 h-6" />
               </button>
               <span className="font-bold text-white tracking-widest uppercase">{activeTool === 'upgrade' ? 'Upgrade Plan' : TOOLS.find(t => t.id === activeTool)?.name}</span>

               {/* Upgrade Icon in Top Right (Mobile) */}
               {
                  isFree && (
                     <button
                        onClick={() => setActiveTool('upgrade')}
                        className="p-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg animate-pulse"
                     >
                        <Crown className="w-5 h-5" />
                     </button>
                  )
               }
               {!isFree && <div className="w-8" />}
            </div >

            {/* Desktop Header Overlay (Absolute Top Right) */}
            {
               isFree && (
                  <div className="hidden md:block absolute top-6 right-8 z-50">
                     <button
                        onClick={() => setActiveTool('upgrade')}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition-transform animate-bounce-slow"
                     >
                        <Crown className="w-4 h-4" />
                        Upgrade Plan
                     </button>
                  </div>
               )
            }

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 scroll-smooth">
               <div className="max-w-5xl mx-auto">
                  {renderActiveGenerator()}
               </div>
            </div>
         </main >
      </div >
   );
};