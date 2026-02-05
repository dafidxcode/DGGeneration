import React, { useEffect, useState } from 'react';
import { adminService } from '../services/firebase';
import { UserProfile, GlobalSettings } from '../types';
import { Button } from './Button';
import { Settings, Users, Save, RefreshCw, LayoutDashboard } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [settings, setSettings] = useState<GlobalSettings>({ freeLimit: 5, premiumLimit: 100 });
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');

    // Search & Bulk Actions State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [isAllSelected, setIsAllSelected] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [u, s] = await Promise.all([
                adminService.getAllUsers(),
                adminService.getGlobalSettings()
            ]);
            setUsers(u);
            if (s) setSettings(s);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleTierChange = async (uid: string, newTier: 'FREE' | 'PREMIUM') => {
        await adminService.updateUserTier(uid, newTier);
        setUsers(prev => prev.map(u => u.uid === uid ? { ...u, tier: newTier } : u));
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsAllSelected(e.target.checked);
        if (e.target.checked) {
            setSelectedUsers(new Set(filteredUsers.map(u => u.uid)));
        } else {
            setSelectedUsers(new Set());
        }
    };

    const handleSelectUser = (uid: string) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(uid)) {
            newSelected.delete(uid);
        } else {
            newSelected.add(uid);
        }
        setSelectedUsers(newSelected);
        setIsAllSelected(newSelected.size === filteredUsers.length);
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedUsers.size} users? This cannot be undone.`)) return;

        setLoading(true);
        try {
            await Promise.all(Array.from(selectedUsers).map(uid => adminService.deleteUser(uid)));
            setMsg(`Successfully deleted ${selectedUsers.size} users.`);
            setSelectedUsers(new Set());
            setIsAllSelected(false);
            fetchData();
        } catch (err) {
            console.error(err);
            setMsg('Failed to delete users.');
        } finally {
            setLoading(false);
            setTimeout(() => setMsg(''), 3000);
        }
    };

    const calculateActiveDuration = (createdAt: number) => {
        if (!createdAt) return 'Unknown';
        const diff = Date.now() - createdAt;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h`;
        return `${Math.floor(diff / (1000 * 60))}m`;
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSettingsSave = async () => {
        await adminService.updateGlobalSettings(settings);
        setMsg('Settings saved!');
        setTimeout(() => setMsg(''), 3000);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full text-violet-400">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading Admin Panel...
        </div>
    );

    return (
        <div className="space-y-8 pb-20 p-6 animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                    <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                    <p className="text-slate-400">Manage users, tiers, and system limits.</p>
                </div>
            </div>

            {/* Global Settings */}
            <div className="glass-card p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-violet-400" /> Global Configuration
                </h2>

                {/* Pricing Configuration */}
                <div className="mb-8 border-b border-white/5 pb-8">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Pricing Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 block">Normal Package Price (IDR)</label>
                            <input
                                type="number"
                                value={settings.packagePrice || 0}
                                onChange={(e) => setSettings({ ...settings, packagePrice: parseInt(e.target.value) })}
                                className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white w-full focus:border-violet-500/50 transition-colors"
                                placeholder="200000"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 block">Promo Price (IDR) - Optional</label>
                            <input
                                type="number"
                                value={settings.promoPrice || 0}
                                onChange={(e) => setSettings({ ...settings, promoPrice: parseInt(e.target.value) })}
                                className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white w-full focus:border-violet-500/50 transition-colors"
                                placeholder="50000"
                            />
                            <p className="text-xs text-slate-500">Set 0 to disable promo display on update page.</p>
                        </div>
                    </div>
                </div>

                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Generation Limits</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400 block">Free Tier Limit (0-5 per day)</label>
                        <select
                            value={settings.freeLimit}
                            onChange={(e) => setSettings({ ...settings, freeLimit: parseInt(e.target.value) })}
                            className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white w-full focus:border-violet-500/50 transition-colors"
                        >
                            {[0, 1, 2, 3, 4, 5].map(limit => (
                                <option key={limit} value={limit} className="bg-slate-900">{limit} per day</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400 block">Premium Tier Limit (Max 100)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={settings.premiumLimit}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (val >= 0 && val <= 100) {
                                    setSettings({ ...settings, premiumLimit: val });
                                }
                            }}
                            className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white w-full focus:border-violet-500/50 transition-colors"
                        />
                    </div>
                    <Button onClick={handleSettingsSave} className="h-[50px] bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-600/20">
                        <Save className="w-4 h-4 mr-2" /> Save Configuration
                    </Button>
                </div>
                {msg && <p className="text-emerald-400 mt-4 text-sm font-bold flex items-center gap-2"><div className="w-2 h-2 bg-emerald-400 rounded-full" /> {msg}</p>}
            </div>

            {/* Users List */}
            <div className="glass-card p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-cyan-400" /> User Management
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search users by name or email..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="bg-white/5 border border-white/10 rounded-lg pl-4 pr-10 py-2 text-sm text-white focus:outline-none focus:border-violet-500 w-64 transition-all"
                            />
                        </div>
                        {selectedUsers.size > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-colors flex items-center gap-2"
                            >
                                <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-xs">{selectedUsers.size}</span>
                                Delete Selected
                            </button>
                        )}
                        <button onClick={fetchData} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-white/5">
                                <th className="p-4 w-4">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                        className="rounded border-slate-700 bg-slate-800 text-violet-500 focus:ring-offset-0 focus:ring-1 focus:ring-violet-500"
                                    />
                                </th>
                                <th className="p-4 font-medium">User Profile</th>
                                <th className="p-4 font-medium">Active For</th>
                                <th className="p-4 font-medium">Current Tier</th>
                                <th className="p-4 font-medium">Usage Stats (V/M/I/T/G)</th>
                                <th className="p-4 font-medium">Last Login</th>
                            </tr>
                        </thead>
                        <tbody className="text-white divide-y divide-white/5">
                            {filteredUsers.map(u => (
                                <tr key={u.uid} className={`hover:bg-white/5 transition-colors ${selectedUsers.has(u.uid) ? 'bg-violet-500/10' : ''}`}>
                                    <td className="p-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.has(u.uid)}
                                            onChange={() => handleSelectUser(u.uid)}
                                            className="rounded border-slate-700 bg-slate-800 text-violet-500 focus:ring-offset-0 focus:ring-1 focus:ring-violet-500"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            {u.photoURL ? (
                                                <img
                                                    src={u.photoURL}
                                                    className="w-10 h-10 rounded-full bg-slate-800 object-cover"
                                                    referrerPolicy="no-referrer"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                            ) : null}
                                            <div className={`w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 text-xs ${u.photoURL ? 'hidden' : ''}`}>
                                                {u.displayName ? u.displayName.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">{u.displayName || 'Anonymous'}</div>
                                                <div className="text-xs text-slate-500">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs font-mono text-cyan-400">
                                        {calculateActiveDuration(u.createdAt)}
                                    </td>
                                    <td className="p-4">
                                        <select
                                            value={u.tier}
                                            onChange={(e) => handleTierChange(u.uid, e.target.value as any)}
                                            className={`bg-black/20 border rounded-lg px-3 py-1.5 text-xs font-bold tracking-wide cursor-pointer transition-colors outline-none appearance-none ${u.tier === 'PREMIUM'
                                                ? 'text-amber-400 border-amber-500/30 hover:border-amber-500/50'
                                                : 'text-slate-400 border-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            <option value="FREE" className="bg-slate-900 text-slate-400">Free ({settings.freeLimit || 0}/day)</option>
                                            <option value="PREMIUM" className="bg-slate-900 text-amber-400">Pro ({settings.premiumLimit || 0}/day)</option>
                                        </select>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-mono text-xs text-slate-300 bg-white/5 rounded px-2 py-1 inline-block">
                                            {u.usage?.video || 0} <span className="text-slate-600">|</span> {u.usage?.music || 0} <span className="text-slate-600">|</span> {u.usage?.image || 0} <span className="text-slate-600">|</span> {u.usage?.tts || 0} <span className="text-slate-600">|</span> {u.usage?.imagen || 0}
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs text-slate-500">
                                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                        No users found matching "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
