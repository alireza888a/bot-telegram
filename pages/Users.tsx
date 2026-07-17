import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { 
    Users as UsersIcon, Search, UserX, UserCheck, ShieldAlert, Tag, Calendar, 
    MessageSquare, RefreshCw, BarChart2, Filter, ChevronLeft, ChevronRight, CheckCircle, Info
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BotUser {
    id: string;
    firstName: string;
    lastName?: string;
    username?: string;
    joinedAt: string;
    lastActive: string;
    messagesCount: number;
    status: 'active' | 'blocked';
    tags: string[];
}

export const Users: React.FC = () => {
    const [users, setUsers] = useState<BotUser[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
    const [tagFilter, setTagFilter] = useState<string>('all');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 8;

    // Selection for custom tags
    const [selectedUser, setSelectedUser] = useState<BotUser | null>(null);
    const [newTagInput, setNewTagInput] = useState('');

    // Load and seed users
    useEffect(() => {
        const stored = localStorage.getItem('bot_users');
        if (stored) {
            try {
                setUsers(JSON.parse(stored));
            } catch (e) {
                console.error(e);
            }
        } else {
            // Seed 10 realistic Telegram users
            const seededUsers: BotUser[] = [
                { id: '184920401', firstName: 'علی', lastName: 'کریمی', username: 'ali_karimi', joinedAt: '2026-07-01', lastActive: '2026-07-17', messagesCount: 42, status: 'active', tags: ['مشتری VIP', 'تهران'] },
                { id: '94820184', firstName: 'سارا', lastName: 'احمدی', username: 'sara_ahmadi7', joinedAt: '2026-07-05', lastActive: '2026-07-16', messagesCount: 18, status: 'active', tags: ['همکار'] },
                { id: '284019482', firstName: 'Reza', lastName: 'Mousavi', username: 'reza_mou', joinedAt: '2026-07-08', lastActive: '2026-07-17', messagesCount: 124, status: 'active', tags: ['مشتری VIP'] },
                { id: '58102948', firstName: 'مریم', lastName: 'حسینی', username: 'maryam_h', joinedAt: '2026-07-10', lastActive: '2026-07-15', messagesCount: 7, status: 'active', tags: [] },
                { id: '49201948', firstName: 'امیر', lastName: 'رضایی', username: 'amir_rez', joinedAt: '2026-07-12', lastActive: '2026-07-12', messagesCount: 3, status: 'active', tags: [] },
                { id: '10948201', firstName: 'کیان', lastName: 'مهرابی', username: 'kian_mehr', joinedAt: '2026-07-13', lastActive: '2026-07-17', messagesCount: 89, status: 'active', tags: ['پشتیبانی'] },
                { id: '30491829', firstName: 'فاطمه', lastName: 'تقوی', username: 'fateme_tg', joinedAt: '2026-07-14', lastActive: '2026-07-14', messagesCount: 1, status: 'active', tags: [] },
                { id: '40291849', firstName: 'علیرضا', lastName: 'محمدی', username: 'alireza_m', joinedAt: '2026-07-15', lastActive: '2026-07-17', messagesCount: 15, status: 'active', tags: [] },
                { id: '77291048', firstName: 'Spam_Bot_99', username: 'spambot99_ad', joinedAt: '2026-07-16', lastActive: '2026-07-16', messagesCount: 33, status: 'blocked', tags: ['اسپمر'] },
                { id: '66192048', firstName: 'مهدی', lastName: 'صادقی', username: 'mahdi_sad', joinedAt: '2026-07-17', lastActive: '2026-07-17', messagesCount: 12, status: 'active', tags: [] }
            ];
            localStorage.setItem('bot_users', JSON.stringify(seededUsers));
            setUsers(seededUsers);
        }
    }, []);

    const saveUsers = (updatedUsers: BotUser[]) => {
        setUsers(updatedUsers);
        localStorage.setItem('bot_users', JSON.stringify(updatedUsers));
    };

    // Toggle Blocked Status
    const toggleStatus = (userId: string) => {
        const updated = users.map(u => {
            if (u.id === userId) {
                return {
                    ...u,
                    status: u.status === 'active' ? 'blocked' as const : 'active' as const
                };
            }
            return u;
        });
        saveUsers(updated);
    };

    // Add Tag
    const handleAddTag = () => {
        if (!selectedUser || !newTagInput.trim()) return;
        const updated = users.map(u => {
            if (u.id === selectedUser.id) {
                const tags = u.tags.includes(newTagInput.trim()) 
                    ? u.tags 
                    : [...u.tags, newTagInput.trim()];
                return { ...u, tags };
            }
            return u;
        });
        saveUsers(updated);
        setSelectedUser(prev => prev ? { ...prev, tags: prev.tags.includes(newTagInput.trim()) ? prev.tags : [...prev.tags, newTagInput.trim()] } : null);
        setNewTagInput('');
    };

    // Remove Tag
    const handleRemoveTag = (tagToRemove: string) => {
        if (!selectedUser) return;
        const updated = users.map(u => {
            if (u.id === selectedUser.id) {
                return {
                    ...u,
                    tags: u.tags.filter(t => t !== tagToRemove)
                };
            }
            return u;
        });
        saveUsers(updated);
        setSelectedUser(prev => prev ? { ...prev, tags: prev.tags.filter(t => t !== tagToRemove) } : null);
    };

    // Filtered users
    const filteredUsers = users.filter(user => {
        const nameMatch = `${user.firstName} ${user.lastName || ''} ${user.username || ''} ${user.id}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const statusMatch = statusFilter === 'all' || user.status === statusFilter;
        const tagMatch = tagFilter === 'all' || user.tags.includes(tagFilter);
        return nameMatch && statusMatch && tagMatch;
    });

    // Pagination slice
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    // Dynamic Chart Data (Simulating registration stats based on seed join dates)
    const chartData = [
        { name: '10 تیر', users: 4 },
        { name: '11 تیر', users: 5 },
        { name: '12 تیر', users: 5 },
        { name: '13 تیر', users: 6 },
        { name: '14 تیر', users: 7 },
        { name: '15 تیر', users: 8 },
        { name: '16 تیر', users: 9 },
        { name: 'امروز', users: users.length }
    ];

    // Stats calculations
    const stats = {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        blocked: users.filter(u => u.status === 'blocked').length,
        totalMessages: users.reduce((sum, u) => sum + u.messagesCount, 0)
    };

    // Get unique list of all tags for filter
    const allTags = Array.from(new Set(users.flatMap(u => u.tags)));

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <GlassCard className="p-5 flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-bold text-white">{stats.total}</div>
                        <div className="text-xs text-slate-400 mt-1">کل کاربران ربات</div>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                        <UsersIcon size={24} />
                    </div>
                </GlassCard>

                <GlassCard className="p-5 flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-bold text-green-400">{stats.active}</div>
                        <div className="text-xs text-slate-400 mt-1">کاربران فعال</div>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-2xl text-green-400">
                        <CheckCircle size={24} />
                    </div>
                </GlassCard>

                <GlassCard className="p-5 flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-bold text-red-400">{stats.blocked}</div>
                        <div className="text-xs text-slate-400 mt-1">بلاک یا مسدود شده</div>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-2xl text-red-400">
                        <UserX size={24} />
                    </div>
                </GlassCard>

                <GlassCard className="p-5 flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-bold text-purple-400">{stats.totalMessages}</div>
                        <div className="text-xs text-slate-400 mt-1">تعداد تعاملات پیام</div>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
                        <MessageSquare size={24} />
                    </div>
                </GlassCard>
            </div>

            {/* Chart & Tag Manager row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <GlassCard className="lg:col-span-2" title="روند رشد اعضا و کاربران ربات">
                    <div className="h-[250px] w-full dir-ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Quick User Tag Manager */}
                <GlassCard title="مدیریت برچسب‌های کاربر" className="flex flex-col justify-between">
                    {selectedUser ? (
                        <div className="space-y-4 h-full flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-3 bg-white/5 p-2 rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                                        {selectedUser.firstName.substring(0, 2)}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-white">{selectedUser.firstName} {selectedUser.lastName || ''}</div>
                                        <div className="text-[10px] text-slate-400">آیدی: {selectedUser.id}</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400 block">برچسب‌های فعلی:</label>
                                    {selectedUser.tags.length === 0 ? (
                                        <div className="text-xs text-slate-500 italic">بدون برچسب</div>
                                    ) : (
                                        <div className="flex flex-wrap gap-1">
                                            {selectedUser.tags.map(tag => (
                                                <span key={tag} className="inline-flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full">
                                                    {tag}
                                                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-400 text-slate-500">×</button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <label className="text-xs text-slate-400 block mb-1">افزودن برچسب جدید:</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={newTagInput}
                                        onChange={e => setNewTagInput(e.target.value)}
                                        placeholder="مثلا: خریدار پارچه"
                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                                    />
                                    <button 
                                        onClick={handleAddTag}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                                    >
                                        <Tag size={12}/> ثبت
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
                            <Info size={32} className="opacity-20 mb-2"/>
                            <p className="text-xs">یک کاربر را از جدول پایین انتخاب کنید تا بتوانید برچسب‌ها و تگ‌های او را مدیریت کنید.</p>
                        </div>
                    )}
                </GlassCard>
            </div>

            {/* Users Table Card */}
            <GlassCard 
                title="جدول تفکیکی کاربران ربات"
                action={
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute right-2.5 top-2.5 text-slate-500" size={14} />
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                placeholder="جستجوی نام یا آیدی..."
                                className="bg-black/20 border border-white/10 rounded-lg pr-8 pl-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 w-48"
                            />
                        </div>
                        
                        {/* Status Filter */}
                        <select 
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
                            className="bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-300 outline-none"
                        >
                            <option value="all">همه وضعیت‌ها</option>
                            <option value="active">فعال</option>
                            <option value="blocked">مسدود</option>
                        </select>

                        {/* Tag Filter */}
                        <select 
                            value={tagFilter}
                            onChange={e => { setTagFilter(e.target.value); setCurrentPage(1); }}
                            className="bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-300 outline-none"
                        >
                            <option value="all">همه برچسب‌ها</option>
                            {allTags.map(tag => (
                                <option key={tag} value={tag}>{tag}</option>
                            ))}
                        </select>
                    </div>
                }
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 text-slate-400 text-xs">
                                <th className="pb-3 pt-1">کاربر تلگرام</th>
                                <th className="pb-3 pt-1">شناسه عددی (UID)</th>
                                <th className="pb-3 pt-1">تاریخ عضویت</th>
                                <th className="pb-3 pt-1">آخرین فعالیت</th>
                                <th className="pb-3 pt-1 text-center">تعاملات</th>
                                <th className="pb-3 pt-1">برچسب‌ها</th>
                                <th className="pb-3 pt-1 text-center">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {currentUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">کاربری با شرایط فیلتر شما یافت نشد.</td>
                                </tr>
                            ) : (
                                currentUsers.map(user => (
                                    <tr 
                                        key={user.id} 
                                        onClick={() => setSelectedUser(user)}
                                        className={`hover:bg-white/5 transition-colors cursor-pointer ${selectedUser?.id === user.id ? 'bg-blue-500/5' : ''}`}
                                    >
                                        <td className="py-3 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
                                                {user.firstName.substring(0, 2)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white flex items-center gap-1.5">
                                                    {user.firstName} {user.lastName || ''}
                                                    {user.status === 'blocked' && <ShieldAlert size={12} className="text-red-400" title="بلاک شده"/>}
                                                </div>
                                                {user.username && <div className="text-[11px] text-slate-400 font-mono">@{user.username}</div>}
                                            </div>
                                        </td>
                                        <td className="py-3 font-mono text-xs text-slate-300">{user.id}</td>
                                        <td className="py-3 text-xs text-slate-400">{user.joinedAt}</td>
                                        <td className="py-3 text-xs text-slate-400">{user.lastActive}</td>
                                        <td className="py-3 text-center text-xs text-white font-bold">{user.messagesCount} پیام</td>
                                        <td className="py-3">
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {user.tags.length === 0 ? (
                                                    <span className="text-[10px] text-slate-600">-</span>
                                                ) : (
                                                    user.tags.slice(0, 2).map(tag => (
                                                        <span key={tag} className="text-[9px] bg-slate-500/10 text-slate-300 px-1.5 py-0.5 rounded border border-white/5">
                                                            {tag}
                                                        </span>
                                                    ))
                                                )}
                                                {user.tags.length > 2 && (
                                                    <span className="text-[9px] bg-blue-500/10 text-blue-300 px-1 rounded">+{user.tags.length - 2}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 text-center">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); toggleStatus(user.id); }}
                                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                                    user.status === 'active' 
                                                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20' 
                                                        : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20'
                                                }`}
                                            >
                                                {user.status === 'active' ? 'مسدود سازی' : 'رفع مسدودیت'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                        <span className="text-xs text-slate-400">نمایش {indexOfFirstUser + 1} تا {Math.min(indexOfLastUser, filteredUsers.length)} از {filteredUsers.length} کاربر</span>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/5"
                            >
                                <ChevronRight size={14}/>
                            </button>
                            <span className="text-xs font-mono px-3 text-white">صفحه {currentPage} از {totalPages}</span>
                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/5"
                            >
                                <ChevronLeft size={14}/>
                            </button>
                        </div>
                    </div>
                )}
            </GlassCard>
        </div>
    );
};
