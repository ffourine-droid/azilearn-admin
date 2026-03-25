/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Home, 
  TrendingUp, 
  Clock, 
  Database, 
  LogOut, 
  LayoutGrid, 
  User, 
  Plus, 
  FileText, 
  X,
  Music,
  Image as ImageIcon,
  Loader2,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar as CalendarIcon,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { format, subDays, startOfDay, isWithinInterval, parseISO, eachDayOfInterval } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- SUPABASE CONFIGURATION ---
// Lazy initialization to prevent crash when keys are missing
let supabaseClient: any = null;
const getSupabase = () => {
  if (supabaseClient) return supabaseClient;
  
  // Check both standard Vite prefix and process.env (for AI Studio compatibility)
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!url || !key || url === 'undefined' || key === 'undefined') return null;
  
  supabaseClient = createClient(url, key);
  return supabaseClient;
};

// --- TYPES ---
interface Experiment {
  id: string;
  title: string;
  subject: string;
  keywords: string;
  html_content: string;
  slides: any;
  audio_url: string;
  grade: string;
  category: string;
  created_at: string;
}

interface Payment {
  id: string;
  phone_number: string;
  plan: string;
  amount: number;
  status: string;
  transaction_code: string;
  created_at: string;
  rejection_reason?: string;
}

interface Profile {
  id: string;
  full_name: string;
  username: string;
  phone_number: string;
  created_at: string;
  last_active?: string;
  avatar_url?: string;
}

interface UserPresence {
  id: string;
  online_at: string;
}

const AnalyticsView = ({ 
  experiments, 
  payments, 
  profiles 
}: { 
  experiments: Experiment[], 
  payments: Payment[], 
  profiles: Profile[] 
}) => {
  // 1. Revenue Over Time (Last 7 Days)
  const revenueData = useMemo(() => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    return last7Days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayRevenue = payments
        .filter(p => p.status === 'approved' && p.created_at.startsWith(dateStr))
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      return {
        date: format(day, 'MMM dd'),
        revenue: dayRevenue
      };
    });
  }, [payments]);

  // 2. User Growth (Last 7 Days)
  const userGrowthData = useMemo(() => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    return last7Days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayUsers = profiles.filter(p => p.created_at.startsWith(dateStr)).length;
      
      return {
        date: format(day, 'MMM dd'),
        users: dayUsers
      };
    });
  }, [profiles]);

  // 3. Subject Distribution
  const subjectData = useMemo(() => {
    const subjects: Record<string, number> = {};
    experiments.forEach(e => {
      subjects[e.subject] = (subjects[e.subject] || 0) + 1;
    });

    return Object.entries(subjects).map(([name, value]) => ({ name, value }));
  }, [experiments]);

  // 4. Payment Status Breakdown
  const paymentStatusData = useMemo(() => {
    const statuses: Record<string, number> = {};
    payments.forEach(p => {
      statuses[p.status] = (statuses[p.status] || 0) + 1;
    });

    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }, [payments]);

  const COLORS = ['#F97316', '#8B5CF6', '#10B981', '#EF4444', '#3B82F6', '#F59E0B'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
      {/* Revenue Trend */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-50 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-xl">
              <TrendingUp size={20} className="text-[#F97316]" />
            </div>
            <h3 className="font-black text-[#1A1A1A]">Revenue Trend (7 Days)</h3>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F5F5" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#888888' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#888888' }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 800, color: '#1A1A1A' }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#F97316" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Growth */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-50 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-xl">
              <Users size={20} className="text-purple-500" />
            </div>
            <h3 className="font-black text-[#1A1A1A]">User Growth (7 Days)</h3>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F5F5" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#888888' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#888888' }}
              />
              <Tooltip 
                cursor={{ fill: '#F97316', opacity: 0.05 }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 800, color: '#1A1A1A' }}
              />
              <Bar dataKey="users" fill="#8B5CF6" radius={[6, 6, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Distribution */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-50 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <LayoutGrid size={20} className="text-blue-500" />
            </div>
            <h3 className="font-black text-[#1A1A1A]">Materials by Subject</h3>
          </div>
        </div>
        <div className="h-[300px] w-full flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subjectData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subjectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-1/2 flex flex-col gap-2">
            {subjectData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs font-bold text-[#1A1A1A]">{entry.name}</span>
                </div>
                <span className="text-xs font-black text-[#888888]">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Status */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-50 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <CheckCircle2 size={20} className="text-emerald-500" />
            </div>
            <h3 className="font-black text-[#1A1A1A]">Payment Status Breakdown</h3>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={paymentStatusData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F5F5F5" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#1A1A1A' }}
                width={80}
              />
              <Tooltip 
                cursor={{ fill: '#F97316', opacity: 0.05 }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={30}>
                {paymentStatusData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      entry.name === 'approved' ? '#10B981' : 
                      entry.name === 'rejected' ? '#EF4444' : 
                      '#F97316'
                    } 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const Badge = ({ children, variant = 'general' }: { children: React.ReactNode, variant?: 'general' | 'category' }) => {
  if (variant === 'category') {
    return (
      <span className="px-3 py-1 bg-[#F97316]/10 text-[#F97316] text-xs font-bold rounded-full uppercase tracking-wider">
        {children}
      </span>
    );
  }
  return (
    <span className="px-3 py-1 bg-[#F5F5F5] text-[#888888] text-xs font-bold rounded-full uppercase tracking-wider">
      {children}
    </span>
  );
};

const StatCard = ({ label, value, icon: Icon, iconColor }: { label: string, value: string, icon: any, iconColor: string }) => (
  <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-4 flex-1 min-w-[180px]">
    <div className={cn("p-2 rounded-xl", iconColor)}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-[10px] text-[#888888] font-bold uppercase tracking-widest">{label}</p>
      <p className="text-lg font-bold text-[#1A1A1A]">{value}</p>
    </div>
  </div>
);

const TabButton = ({ label, icon: Icon, active, onClick }: { label: string, icon: any, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-200 font-bold text-sm",
      active ? "bg-[#F97316] text-white shadow-lg shadow-[#F97316]/20" : "text-[#888888] hover:bg-gray-100"
    )}
  >
    <Icon size={18} />
    {label}
  </button>
);

const InputField = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('Content');
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [totalExperiments, setTotalExperiments] = useState(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, UserPresence>>({});
  const [userSearch, setUserSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    grade: 'Grade 6',
    category: 'Notes',
    keywords: '',
    html_content: '',
    audio_url: ''
  });

  const fetchExperiments = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
      setError(`Supabase keys are missing. URL: ${url ? 'Set' : 'Missing'}, Key: ${key ? 'Set' : 'Missing'}. Please add them to your Vercel Environment Variables.`);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      // Optimize: Select only columns needed for the list view to reduce payload size
      // Also get the total count for the dashboard stats
      const { data, error, count } = await supabase
        .from('experiments')
        .select('id, title, subject, grade, category, created_at, keywords', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setExperiments(data || []);
      if (count !== null) setTotalExperiments(count);
    } catch (err: any) {
      console.error('Error fetching experiments:', err);
      setError(`Fetch failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPayments = async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      setIsLoading(true);
      // Optimize: Select only necessary columns and limit to 100
      const { data, error, count } = await supabase
        .from('payments')
        .select('id, phone_number, plan, amount, status, created_at, rejection_reason, transaction_code', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setPayments(data || []);
      if (count !== null) setTotalPayments(count);
    } catch (err: any) {
      console.error('Error fetching payments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfiles = async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      setIsLoading(true);
      // Fetch all users as requested
      const { data, error, count } = await supabase
        .from('profiles')
        .select('id, full_name, username, phone_number, created_at, last_active', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
      if (count !== null) setTotalProfiles(count);
    } catch (err: any) {
      console.error('Error fetching profiles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Optimize: Fetch all data in parallel to reduce total loading time
    const loadAllData = async () => {
      await Promise.all([
        fetchExperiments(),
        fetchPayments(),
        fetchProfiles()
      ]);
    };
    
    loadAllData();

    const supabase = getSupabase();
    if (supabase) {
      // Real-time subscription for experiments
      const experimentChannel = supabase
        .channel('public:experiments')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'experiments' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setExperiments(prev => [payload.new as Experiment, ...prev]);
            setTotalExperiments(prev => prev + 1);
          } else if (payload.eventType === 'UPDATE') {
            setExperiments(prev => prev.map(e => e.id === payload.new.id ? { ...e, ...payload.new } : e));
          } else if (payload.eventType === 'DELETE') {
            setExperiments(prev => prev.filter(e => e.id !== payload.old.id));
            setTotalExperiments(prev => Math.max(0, prev - 1));
          }
        })
        .subscribe();

      // Real-time subscription for payments
      const paymentChannel = supabase
        .channel('public:payments')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setPayments(prev => [payload.new as Payment, ...prev]);
            setTotalPayments(prev => prev + 1);
          } else if (payload.eventType === 'UPDATE') {
            setPayments(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p));
          } else if (payload.eventType === 'DELETE') {
            setPayments(prev => prev.filter(p => p.id !== payload.old.id));
            setTotalPayments(prev => Math.max(0, prev - 1));
          }
        })
        .subscribe();

      // Real-time subscription for profiles
      const profileChannel = supabase
        .channel('public:profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setProfiles(prev => [payload.new as Profile, ...prev]);
            setTotalProfiles(prev => prev + 1);
          } else if (payload.eventType === 'UPDATE') {
            setProfiles(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p));
          } else if (payload.eventType === 'DELETE') {
            setProfiles(prev => prev.filter(p => p.id !== payload.old.id));
            setTotalProfiles(prev => Math.max(0, prev - 1));
          }
        })
        .subscribe();

      // Presence tracking
      const presenceChannel = supabase.channel('online-users');
      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const newState = presenceChannel.presenceState();
          const online: Record<string, UserPresence> = {};
          Object.values(newState).forEach((presences: any) => {
            presences.forEach((p: any) => {
              if (p.id) online[p.id] = p;
            });
          });
          setOnlineUsers(online);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(experimentChannel);
        supabase.removeChannel(paymentChannel);
        supabase.removeChannel(profileChannel);
        supabase.removeChannel(presenceChannel);
      };
    }
  }, []);

  const handleSaveExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) {
      alert("Supabase client not initialized. Check your keys.");
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('experiments')
        .insert([
          { 
            ...formData,
            slides: [] // Placeholder for slides JSON
          }
        ]);

      if (error) throw error;
      
      setIsModalOpen(false);
      setFormData({
        title: '',
        subject: '',
        grade: 'Grade 6',
        category: 'Notes',
        keywords: '',
        html_content: '',
        audio_url: ''
      });
      fetchExperiments();
    } catch (err: any) {
      console.error('Error saving experiment:', err);
      alert('Failed to save: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const todayRevenue = payments
    .filter(p => {
      const today = new Date().toISOString().split('T')[0];
      return p.created_at.startsWith(today) && p.status === 'approved';
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalRevenue = payments
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingPayments = payments.filter(p => p.status === 'pending').length;

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    p.phone_number?.includes(userSearch) ||
    p.username?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const getUserSubscription = (phoneNumber: string) => {
    const userPayments = payments.filter(p => p.phone_number === phoneNumber && p.status === 'approved');
    if (userPayments.length === 0) return 'None';
    // Sort by date to get the latest
    const latest = [...userPayments].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    return latest.plan;
  };

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* --- HEADER --- */}
      <header className="bg-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-gray-50 transition-colors">
            <Home size={24} className="text-[#1A1A1A]" />
          </button>
          <div>
            <p className="text-[10px] text-[#888888] font-bold uppercase tracking-widest">Admin Dashboard</p>
            <h1 className="text-xl font-black text-[#1A1A1A]">Management Console</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <StatCard 
            label="Materials" 
            value={totalExperiments.toString()} 
            icon={LayoutGrid} 
            iconColor="bg-blue-50 text-blue-500" 
          />
          <StatCard 
            label="Revenue Today" 
            value={`KES ${todayRevenue}`} 
            icon={TrendingUp} 
            iconColor="bg-orange-50 text-[#F97316]" 
          />
          <StatCard 
            label="Total Revenue" 
            value={`KES ${totalRevenue}`} 
            icon={TrendingUp} 
            iconColor="bg-purple-50 text-purple-500" 
          />
          <StatCard 
            label="Pending" 
            value={pendingPayments.toString()} 
            icon={Clock} 
            iconColor="bg-orange-50 text-[#F97316]" 
          />
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                fetchExperiments();
                fetchPayments();
                fetchProfiles();
              }}
              className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
              title="Refresh Data"
            >
              <Database size={20} className="text-[#1A1A1A]" />
            </button>
            <button className="p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
              <LogOut size={20} className="text-red-500" />
            </button>
          </div>
        </div>
      </header>

      {/* --- TABS --- */}
      <nav className="flex items-center gap-2">
        <TabButton 
          label="Payments" 
          icon={LayoutGrid} 
          active={activeTab === 'Payments'} 
          onClick={() => setActiveTab('Payments')} 
        />
        <TabButton 
          label="Content" 
          icon={Database} 
          active={activeTab === 'Content'} 
          onClick={() => setActiveTab('Content')} 
        />
        <TabButton 
          label="Users" 
          icon={User} 
          active={activeTab === 'Users'} 
          onClick={() => setActiveTab('Users')} 
        />
        <TabButton 
          label="Analytics" 
          icon={BarChart3} 
          active={activeTab === 'Analytics'} 
          onClick={() => setActiveTab('Analytics')} 
        />
      </nav>

      {/* --- CONTENT TAB --- */}
      {activeTab === 'Content' && (
        <main className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-[#1A1A1A]">Experiments & Lessons</h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#F97316] text-white rounded-full font-bold shadow-lg shadow-[#F97316]/20 hover:scale-105 transition-transform"
            >
              <Plus size={20} />
              Add New Experiment
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex flex-col gap-4">
              <div className="flex items-center gap-3 text-red-600">
                <Database size={24} />
                <h3 className="font-black uppercase tracking-widest text-sm">Connection Error</h3>
              </div>
              <p className="text-red-600 font-medium">{error}</p>
              <div className="flex flex-wrap gap-4 mt-2">
                <button 
                  onClick={() => {
                    fetchExperiments();
                    fetchPayments();
                    fetchProfiles();
                  }}
                  className="px-6 py-2 bg-red-600 text-white rounded-full font-bold text-sm hover:bg-red-700 transition-colors"
                >
                  Retry Connection
                </button>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-red-100 text-[10px] font-bold text-red-400 uppercase tracking-widest">
                  Status: {getSupabase() ? 'Client Initialized' : 'Client Failed'}
                </div>
              </div>
              <div className="mt-4 p-4 bg-white/50 rounded-xl border border-red-100/50">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">Troubleshooting Steps:</p>
                <ul className="text-xs text-red-500 space-y-1 list-disc list-inside">
                  <li>Check if <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> are set in your environment.</li>
                  <li>Ensure the <code>experiments</code> table exists in your Supabase project.</li>
                  <li>Verify that Row Level Security (RLS) policies allow SELECT operations.</li>
                  <li>Check your browser console for more detailed network errors.</li>
                </ul>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-[#F97316]" size={40} />
              <p className="text-[#888888] font-bold uppercase tracking-widest text-xs">Loading Experiments...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {experiments.map((exp) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={exp.id} 
                  className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-50 flex flex-col gap-4 hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-[#F97316] group-hover:scale-110 transition-transform">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#1A1A1A] group-hover:text-[#F97316] transition-colors">{exp.title}</h3>
                    <p className="text-xs text-[#888888] font-medium mt-1 line-clamp-1">{exp.keywords || 'No keywords'}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-auto pt-2">
                    <Badge>GENERAL</Badge>
                    <Badge variant="category">{exp.subject || 'KCSE'}</Badge>
                  </div>
                </motion.div>
              ))}
              
              {experiments.length === 0 && !error && (
                <div className="col-span-full py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-gray-100">
                  <p className="text-[#888888] font-bold">No experiments found. Start by adding one!</p>
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* --- PAYMENTS TAB --- */}
      {activeTab === 'Payments' && (
        <main className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-[#1A1A1A]">Payment Transactions</h2>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-[#888888] uppercase tracking-widest">Total Transactions: {payments.length}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-[#F97316]" size={40} />
              <p className="text-[#888888] font-bold uppercase tracking-widest text-xs">Loading Payments...</p>
            </div>
          ) : (
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="p-6 text-[10px] font-bold text-[#888888] uppercase tracking-widest">Date</th>
                      <th className="p-6 text-[10px] font-bold text-[#888888] uppercase tracking-widest">Phone Number</th>
                      <th className="p-6 text-[10px] font-bold text-[#888888] uppercase tracking-widest">Plan</th>
                      <th className="p-6 text-[10px] font-bold text-[#888888] uppercase tracking-widest">Amount</th>
                      <th className="p-6 text-[10px] font-bold text-[#888888] uppercase tracking-widest">Transaction Code</th>
                      <th className="p-6 text-[10px] font-bold text-[#888888] uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="p-6 text-sm font-medium text-[#888888]">
                          {new Date(payment.created_at).toLocaleString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>
                        <td className="p-6 text-sm font-bold text-[#1A1A1A]">
                          {payment.phone_number}
                        </td>
                        <td className="p-6 text-sm font-medium text-[#888888]">
                          <span className="capitalize">{payment.plan}</span>
                        </td>
                        <td className="p-6 text-sm font-black text-[#F97316]">
                          KES {payment.amount}
                        </td>
                        <td className="p-6 text-sm font-mono text-[#888888]">
                          {payment.transaction_code || 'N/A'}
                        </td>
                        <td className="p-6">
                          <div className="flex flex-col gap-1">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest w-fit",
                              payment.status === 'approved' ? "bg-emerald-50 text-emerald-600" : 
                              payment.status === 'rejected' ? "bg-red-50 text-red-600" :
                              "bg-orange-50 text-orange-600"
                            )}>
                              {payment.status}
                            </span>
                            {payment.rejection_reason && (
                              <p className="text-[10px] text-red-400 italic max-w-[150px] truncate" title={payment.rejection_reason}>
                                {payment.rejection_reason}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {payments.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-20 text-center text-[#888888] font-bold">
                          No payment transactions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      )}

      {/* --- USERS TAB --- */}
      {activeTab === 'Users' && (
        <main className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-[#1A1A1A]">User Tracking</h2>
              <p className="text-xs font-bold text-[#888888] uppercase tracking-widest mt-1">Monitor user activity and subscriptions</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#888888]" />
                <input 
                  type="text"
                  placeholder="Search by name or phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-11 pr-6 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-2 ring-orange-100 transition-all text-sm font-medium w-full md:w-64"
                />
              </div>
              <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-xs font-bold text-[#1A1A1A]">{Object.keys(onlineUsers).length} Online</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-[#F97316]" size={40} />
              <p className="text-[#888888] font-bold uppercase tracking-widest text-xs">Loading Users...</p>
            </div>
          ) : (
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="p-6 text-[10px] font-bold text-[#888888] uppercase tracking-widest">User</th>
                      <th className="p-6 text-[10px] font-bold text-[#888888] uppercase tracking-widest">Contact</th>
                      <th className="p-6 text-[10px] font-bold text-[#888888] uppercase tracking-widest">Subscription</th>
                      <th className="p-6 text-[10px] font-bold text-[#888888] uppercase tracking-widest">Activity</th>
                      <th className="p-6 text-[10px] font-bold text-[#888888] uppercase tracking-widest">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.map((profile) => {
                      const isOnline = !!onlineUsers[profile.id];
                      const subscription = getUserSubscription(profile.phone_number);
                      
                      return (
                        <tr key={profile.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-[#1A1A1A] font-black text-xs">
                                  {profile.full_name?.charAt(0) || 'U'}
                                </div>
                                {isOnline && (
                                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-black text-[#1A1A1A]">{profile.full_name || 'Anonymous'}</p>
                                <p className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">@{profile.username || 'user'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <p className="text-sm font-bold text-[#1A1A1A]">{profile.phone_number || 'N/A'}</p>
                          </td>
                          <td className="p-6">
                            <span className={cn(
                              "px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest",
                              subscription === 'None' ? "bg-gray-100 text-gray-500" : "bg-purple-50 text-purple-600"
                            )}>
                              {subscription}
                            </span>
                          </td>
                          <td className="p-6">
                            <div className="flex flex-col gap-1">
                              <p className="text-xs font-bold text-[#1A1A1A]">
                                {isOnline ? 'Active Now' : profile.last_active ? format(new Date(profile.last_active), 'MMM dd, HH:mm') : 'Unknown'}
                              </p>
                              {!isOnline && profile.last_active && (
                                <p className="text-[10px] text-[#888888] font-medium italic">Last seen</p>
                              )}
                            </div>
                          </td>
                          <td className="p-6 text-sm font-medium text-[#888888]">
                            {new Date(profile.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredProfiles.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-20 text-center text-[#888888] font-bold">
                          {userSearch ? `No users found matching "${userSearch}"` : "No user profiles found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      )}

      {/* --- MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-2xl font-black text-[#1A1A1A]">New Experiment</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} className="text-[#888888]" />
                </button>
              </div>

              <form onSubmit={handleSaveExperiment} className="p-8 overflow-y-auto flex flex-col gap-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <InputField label="Title">
                    <input 
                      required
                      type="text" 
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      placeholder="Enter experiment title"
                      className="bg-[#F5F5F5] p-4 rounded-2xl outline-none focus:ring-2 ring-orange-100 transition-all font-medium"
                    />
                  </InputField>
                  <InputField label="Subject">
                    <input 
                      required
                      type="text" 
                      value={formData.subject}
                      onChange={e => setFormData({...formData, subject: e.target.value})}
                      placeholder="e.g. Biology"
                      className="bg-[#F5F5F5] p-4 rounded-2xl outline-none focus:ring-2 ring-orange-100 transition-all font-medium"
                    />
                  </InputField>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  <InputField label="Grade / Form">
                    <select 
                      value={formData.grade}
                      onChange={e => setFormData({...formData, grade: e.target.value})}
                      className="bg-[#F5F5F5] p-4 rounded-2xl outline-none focus:ring-2 ring-orange-100 transition-all font-medium appearance-none cursor-pointer"
                    >
                      <option>Grade 6</option>
                      <option>Grade 7</option>
                      <option>Grade 8</option>
                      <option>Grade 9</option>
                    </select>
                  </InputField>
                  <InputField label="Category">
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="bg-[#F5F5F5] p-4 rounded-2xl outline-none focus:ring-2 ring-orange-100 transition-all font-medium appearance-none cursor-pointer"
                    >
                      <option>Notes</option>
                      <option>Slides</option>
                      <option>Quiz</option>
                      <option>Revision</option>
                    </select>
                  </InputField>
                </div>

                <InputField label="Keywords">
                  <input 
                    type="text" 
                    value={formData.keywords}
                    onChange={e => setFormData({...formData, keywords: e.target.value})}
                    placeholder="Comma separated keywords"
                    className="bg-[#F5F5F5] p-4 rounded-2xl outline-none focus:ring-2 ring-orange-100 transition-all font-medium"
                  />
                </InputField>

                <InputField label="HTML Content (Optional if using slides)">
                  <textarea 
                    rows={4}
                    value={formData.html_content}
                    onChange={e => setFormData({...formData, html_content: e.target.value})}
                    placeholder="Enter HTML or text content..."
                    className="bg-[#F5F5F5] p-4 rounded-2xl outline-none focus:ring-2 ring-orange-100 transition-all font-medium resize-none"
                  />
                </InputField>

                <div className="flex flex-col md:flex-row gap-6">
                  <InputField label="Instagram-Style Slides">
                    <div className="bg-[#F5F5F5] border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <Plus size={20} className="text-[#F97316]" />
                      </div>
                      <p className="text-xs font-bold text-[#888888] uppercase tracking-widest">Add Slide</p>
                    </div>
                  </InputField>
                  <InputField label="Audio Background">
                    <div className="bg-[#F5F5F5] border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <Music size={20} className="text-[#F97316]" />
                      </div>
                      <p className="text-xs font-bold text-[#888888] uppercase tracking-widest">Upload Audio</p>
                    </div>
                  </InputField>
                </div>

                <div className="flex items-center justify-between gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="text-[#888888] font-bold hover:text-[#1A1A1A] transition-colors px-4"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-[#F97316] text-white py-4 rounded-full font-bold shadow-lg shadow-[#F97316]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Save Experiment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* --- ANALYTICS TAB --- */}
      {activeTab === 'Analytics' && (
        <main className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-[#1A1A1A]">Real-time Analytics</h2>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm">
              <CalendarIcon size={14} className="text-[#888888]" />
              <p className="text-xs font-bold text-[#888888] uppercase tracking-widest">Last 7 Days</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-[#F97316]" size={40} />
              <p className="text-[#888888] font-bold uppercase tracking-widest text-xs">Processing Analytics...</p>
            </div>
          ) : (
            <AnalyticsView 
              experiments={experiments} 
              payments={payments} 
              profiles={profiles} 
            />
          )}
        </main>
      )}
    </div>
  );
}
