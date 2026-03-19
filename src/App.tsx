/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
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
  
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  
  if (!url || !key) return null;
  
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
}

// --- COMPONENTS ---

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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
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
      setError("Supabase keys are missing. Please add SUPABASE_URL and SUPABASE_ANON_KEY to your secrets.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('experiments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExperiments(data || []);
    } catch (err: any) {
      console.error('Error fetching experiments:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPayments = async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      // Don't set global error here to avoid blocking experiments if payments fail
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfiles = async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err: any) {
      console.error('Error fetching profiles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
    fetchPayments();
    fetchProfiles();

    const supabase = getSupabase();
    if (supabase) {
      // Real-time subscription for new payments
      const paymentChannel = supabase
        .channel('public:payments')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'payments' 
        }, (payload) => {
          setPayments(prev => [payload.new as Payment, ...prev]);
        })
        .subscribe();

      // Real-time subscription for new profiles
      const profileChannel = supabase
        .channel('public:profiles')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'profiles' 
        }, (payload) => {
          setProfiles(prev => [payload.new as Profile, ...prev]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(paymentChannel);
        supabase.removeChannel(profileChannel);
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
            label="Revenue Today" 
            value="KES 10" 
            icon={TrendingUp} 
            iconColor="bg-orange-50 text-[#F97316]" 
          />
          <StatCard 
            label="Total Revenue" 
            value="KES 50" 
            icon={TrendingUp} 
            iconColor="bg-purple-50 text-purple-500" 
          />
          <StatCard 
            label="Pending" 
            value="0" 
            icon={Clock} 
            iconColor="bg-orange-50 text-[#F97316]" 
          />
          
          <div className="flex items-center gap-2">
            <button className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-gray-50 transition-colors">
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
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-600 font-medium">
              {error}
              <p className="text-sm mt-1">Make sure you have created the 'experiments' table in Supabase.</p>
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
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-[#1A1A1A]">User Profiles</h2>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-[#888888] uppercase tracking-widest">Total Users: {profiles.length}</p>
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
                      <th className="p-6 text-[10px] font-bold text-[#888888] uppercase tracking-widest">Joined Date</th>
                      <th className="p-6 text-[10px] font-bold text-[#888888] uppercase tracking-widest">Full Name</th>
                      <th className="p-6 text-[10px] font-bold text-[#888888] uppercase tracking-widest">Username</th>
                      <th className="p-6 text-[10px] font-bold text-[#888888] uppercase tracking-widest">Phone Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((profile) => (
                      <tr key={profile.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="p-6 text-sm font-medium text-[#888888]">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-6 text-sm font-bold text-[#1A1A1A]">
                          {profile.full_name || 'N/A'}
                        </td>
                        <td className="p-6 text-sm font-medium text-[#888888]">
                          {profile.username || 'N/A'}
                        </td>
                        <td className="p-6 text-sm font-bold text-[#F97316]">
                          {profile.phone_number || 'N/A'}
                        </td>
                      </tr>
                    ))}
                    {profiles.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-20 text-center text-[#888888] font-bold">
                          No user profiles found.
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
    </div>
  );
}
