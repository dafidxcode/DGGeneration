import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { signInWithGoogle, logout, subscribeToAuthChanges } from './services/firebase';
import { Shield, Lock, Scan, CheckCircle2 } from 'lucide-react';
import { MOCK_USER } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authStage, setAuthStage] = useState<'idle' | 'authenticating' | 'verifying' | 'granted'>('idle');
  const [verificationStep, setVerificationStep] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      if (currentUser) {
        // If firebase auto-logs in, we skip the fancy animation sequence to be snappy
        setUser(currentUser);
        setAuthStage('granted');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setAuthStage('authenticating');
    try {
      const loggedInUser = await signInWithGoogle();

      // Start Verification Sequence
      setAuthStage('verifying');

      // Sequence 1: Identity Check
      setTimeout(() => setVerificationStep(1), 1000);

      // Sequence 2: Permission Check
      setTimeout(() => setVerificationStep(2), 2500);

      // Sequence 3: Access Granted
      setTimeout(async () => {
        setUser(loggedInUser);
        setAuthStage('granted');


      }, 4000);

    } catch (error) {
      console.error("Login failed", error);
      setAuthStage('idle');
      // In real app, show error toast
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAuthStage('idle');
    setVerificationStep(0);
  };

  if (authStage === 'verifying') {
    return (
      <div className="min-h-screen bg-[#030014] flex flex-col items-center justify-center relative overflow-hidden font-mono text-cyan-500">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        {/* Central Scanner */}
        <div className="relative w-80 h-80 flex items-center justify-center mb-12">
          {/* Rotating Rings */}
          <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
          <div className="absolute inset-4 border border-violet-500/30 rounded-full animate-[spin_5s_linear_infinite_reverse]"></div>
          <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin"></div>

          {/* Icon State */}
          <div className="relative z-10 bg-[#030014] p-6 rounded-full border border-cyan-500/50 shadow-[0_0_50px_rgba(34,211,238,0.2)]">
            {verificationStep === 0 && <Scan className="w-16 h-16 text-cyan-400 animate-pulse" />}
            {verificationStep === 1 && <Lock className="w-16 h-16 text-violet-400 animate-pulse" />}
            {verificationStep === 2 && <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-in zoom-in" />}
          </div>

          {/* Scanning Laser */}
          <div className="absolute inset-0 w-full h-1 bg-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-scan opacity-50"></div>
        </div>

        {/* Text Status */}
        <div className="space-y-4 text-center z-10 max-w-md px-6">
          <h2 className="text-3xl font-bold tracking-widest text-white uppercase mb-6 animate-pulse">
            {verificationStep === 0 && "Biometric Handshake"}
            {verificationStep === 1 && "Decrypting Credentials"}
            {verificationStep === 2 && "Access Authorized"}
          </h2>

          <div className="space-y-2 text-xs md:text-sm tracking-widest uppercase">
            <div className={`flex items-center gap-3 transition-all duration-500 ${verificationStep >= 0 ? 'text-cyan-400 opacity-100' : 'text-slate-700 opacity-50'}`}>
              <div className={`w-2 h-2 rounded-full ${verificationStep >= 0 ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-slate-800'}`}></div>
              <span>Resolving Identity Token...</span>
            </div>
            <div className={`flex items-center gap-3 transition-all duration-500 ${verificationStep >= 1 ? 'text-violet-400 opacity-100' : 'text-slate-700 opacity-50'}`}>
              <div className={`w-2 h-2 rounded-full ${verificationStep >= 1 ? 'bg-violet-400 shadow-[0_0_10px_#8b5cf6]' : 'bg-slate-800'}`}></div>
              <span>Verifying Neural Permissions...</span>
            </div>
            <div className={`flex items-center gap-3 transition-all duration-500 ${verificationStep >= 2 ? 'text-emerald-400 opacity-100' : 'text-slate-700 opacity-50'}`}>
              <div className={`w-2 h-2 rounded-full ${verificationStep >= 2 ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-slate-800'}`}></div>
              <span>Establishing Secure Tunnel...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated User -> Dashboard
  if (user && authStage === 'granted') {
    return <Dashboard onLogout={handleLogout} user={user} />;
  }

  // Default -> Landing Page
  return <LandingPage onLogin={handleLogin} isLoading={authStage === 'authenticating'} />;
};

export default App;