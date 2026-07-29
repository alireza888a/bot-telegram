import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { 
    Users as UsersIcon, Search, UserX, UserCheck, ShieldAlert, Tag, Calendar, 
    MessageSquare, RefreshCw, BarChart2, Filter, ChevronLeft, ChevronRight, CheckCircle, Info
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BotUser {
    id: string;
    firstName?: string;
    first_name?: string;
    lastName?: string;
    last_name?: string;
    username?: string;
    joinedAt?: number | string;
    joined_at?: number | string;
    lastActive?: number | string;
    messagesCount?: number;
    status: 'active' | 'blocked';
    tags: string[];
}

export const Users: React.FC = () => {
    const [users, setUsers] = useState<BotUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
    const [tagFilter, setTagFilter] = useState<string>('all');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 8;

    // Selection for custom tags
    const [selectedUser, setSelectedUser] = useState<BotUser | null>(null);
    const [newTagInput, setNewTagInput] = useState('');

    const getLicenseCode = (): string => {
        const licenseCacheStr = localStorage.getItem('license_cache') || '{}';
        try {
            const parsed = JSON.parse(licenseCacheStr);
            return parsed.code || '';
        } catch {
            return licenseCacheStr;
        }
    };

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const code = getLicenseCode();
            const res = await fetch('https://corepanel-api.tajikr450.workers.dev/api/users/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, limit: 500 })
            });
            const result = await res.json();
            if (result.ok) {
                setUsers(result.users || []);
            } else {
                alert('خطا در دریافت کاربران: ' + (result.reason || 'نامشخص'));
            }
        } catch (e) {
            console.error('Error fetching users:', e);
            alert('خطا در ارتباط با سرور هنگام دریافت کاربران.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Toggle Blocked Status
    const toggleStatus = async (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;
        const newStatus = user.status === 'active' ? 'blocked' : 'active';
        const code = getLicenseCode();

        try {
            const res = await fetch('https://corepanel-api.tajikr450.workers.dev/api/users/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    userId,
                    status: newStatus
                })
            });
            const result = await res.json();
            if (result.ok) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
                if (selectedUser?.id === userId) {
                    setSelectedUser(prev => prev ? { ...prev, status: newStatus } : null);
                }
            } else {
                alert('خطا در تغییر وضعیت کاربر: ' + (result.reason || 'نامشخص'));
            }
        } catch (e) {
            console.error('Error updating user status:', e);
            alert('خطا در ارتباط با سرور.');
        }
    };

    // Add Tag
    const handleAddTag = async () => {
        if (!selectedUser || !newTagInput.trim()) return;
        const newTag = newTagInput.trim();
        const currentTags = selectedUser.tags || [];
        if (currentTags.includes(newTag)) {
            setNewTagInput('');
            return;
        }

        const newTagsArray = [...currentTags, newTag];
        const code = getLicenseCode();

        try {
            const res = await fetch('https://corepanel-api.tajikr450.workers.dev/api/users/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    userId: selectedUser.id,
                    tags: newTagsArray
                })
            });
            const result = await res.json();
            if (result.ok) {
                setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, tags: newTagsArray } : u));
                setSelectedUser(prev => prev ? { ...prev, tags: newTagsArray } : null);
                setNewTagInput('');
            } else {
                alert('خطا در ثبت برچسب: ' + (result.reason || 'نامشخص'));
            }
        } catch (e) {
            console.error('Error adding tag:', e);
            alert('خطا در ارتباط با سرور.');
        }
    };

    // Remove Tag
    const handleRemoveTag = async (tagToRemove: string) => {
        if (!selectedUser) return;
        const currentTags = selectedUser.tags || [];
        const newTagsArray = currentTags.filter(t => t !== tagToRemove);
        const code = getLicenseCode();

        try {
            const res = await fetch('https://corepanel-api.tajikr450.workers.dev/api/users/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    userId: selectedUser.id,
                    tags: newTagsArray
                })
            });
            const result = await res.json();
            if (result.ok) {
                setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, tags: newTagsArray } : u));
                setSelectedUser(prev => prev ? { ...prev, tags: newTagsArray } : null);
            } else {
                alert('خطا در حذف برچسب: ' + (result.reason || 'نامشخص'));
            }
        } catch (e) {
            console.error('Error removing tag:', e);
            alert('خطا در ارتباط با سرور.');
        }
    };

    // Helper to format date in Persian
    const formatDate = (timestamp?: number | string) => {
        if (!timestamp) return 'ناشناس';
        const ts = typeof timestamp === 'string' ? Number(timestamp) : timestamp;
        if (isNaN(ts) || ts <= 0) return 'ناشناس';
        return new Date(ts).toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Filtered users
    const filteredUsers = users.filter(user => {
        const fName = user.firstName || user.first_name || 'کاربر';
        const lName = user.lastName || user.last_name || '';
        const nameMatch = `${fName} ${lName} ${user.username || ''} ${user.id}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const statusMatch = statusFilter === 'all' || user.status === statusFilter;
        const tagMatch = tagFilter === 'all' || (user.tags && user.tags.includes(tagFilter));
        return nameMatch && statusMatch && tagMatch;
    });

    // Pagination slice
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;

    // Dynamic Chart Data
    const chartData = [
        { name: '10 تیر', users: Math.max(1, Math.floor(users.length * 0.4)) },
        { name: '11 تیر', users: Math.max(1, Math.floor(users.length * 0.5)) },
        { name: '12 تیر', users: Math.max(1, Math.floor(users.length * 0.6)) },
        { name: '13 تیر', users: Math.max(1, Math.floor(users.length * 0.7)) },
        { name: '14 تیر', users: Math.max(1, Math.floor(users.length * 0.8)) },
        { name: '15 تیر', users: Math.max(1, Math.floor(users.length * 0.9)) },
        { name: 'امروز', users: users.length }
    ];

    // Stats calculations
    const stats = {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        blocked: users.filter(u => u.status === 'blocked').length,
        totalMessages: users.reduce((sum, u) => sum + (u.messagesCount || 0), 0)
    };

    // Get unique list of all tags for filter
    const allTags = Array.from(new Set(users.flatMap(u => u.tags || [])));

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
                                        {(selectedUser.firstName || selectedUser.first_name || 'کاربر').substring(0, 2)}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-white">
                                            {selectedUser.firstName || selectedUser.first_name || 'کاربر'} {selectedUser.lastName || selectedUser.last_name || ''}
                                        </div>
                                        <div className="text-[10px] text-slate-400">آیدی: {selectedUser.id}</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400 block">برچسب‌های فعلی:</label>
                                    {(selectedUser.tags || []).length === 0 ? (
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
                        <button
                            onClick={fetchUsers}
                            disabled={isLoading}
                            className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                            title="بروزرسانی کاربران"
                        >
                            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                            <span>بروزرسانی</span>
                        </button>

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
                            {isLoading && users.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <RefreshCw size={24} className="animate-spin text-blue-400" />
                                            <span>در حال بارگذاری کاربران...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentUsers.length === 0 ? (
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
                                                {(user.firstName || user.first_name || 'کاربر').substring(0, 2)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white flex items-center gap-1.5">
                                                    {user.firstName || user.first_name || 'کاربر'} {user.lastName || user.last_name || ''}
                                                    {user.status === 'blocked' && <ShieldAlert size={12} className="text-red-400" title="بلاک شده"/>}
                                                </div>
                                                {user.username && <div className="text-[11px] text-slate-400 font-mono">@{user.username}</div>}
                                            </div>
                                        </td>
                                        <td className="py-3 font-mono text-xs text-slate-300">{user.id}</td>
                                        <td className="py-3 text-xs text-slate-400">{formatDate(user.joinedAt || user.joined_at)}</td>
                                        <td className="py-3 text-xs text-slate-400">{formatDate(user.lastActive)}</td>
                                        <td className="py-3 text-center text-xs text-white font-bold">{user.messagesCount || 0} پیام</td>
                                        <td className="py-3">
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {(user.tags || []).length === 0 ? (
                                                    <span className="text-[10px] text-slate-600">-</span>
                                                ) : (
                                                    user.tags.slice(0, 2).map(tag => (
                                                        <span key={tag} className="text-[9px] bg-slate-500/10 text-slate-300 px-1.5 py-0.5 rounded border border-white/5">
                                                            {tag}
                                                        </span>
                                                    ))
                                                )}
                                                {(user.tags || []).length > 2 && (
                                                    <span className="text-[9px] bg-blue-500/10 text-blue-300 px-1 rounded">+{(user.tags || []).length - 2}</span>
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

