import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { collection, query, onSnapshot, where, addDoc, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Plus, 
  CheckCircle, 
  Clock, 
  Users, 
  AlertTriangle, 
  Send, 
  X, 
  Database,
  BarChart2,
  TrendingUp,
  PieChart as PieIcon,
  CheckCircle2,
  LayoutDashboard
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
  Cell
} from 'recharts';
import { geminiService } from '../../services/geminiService';
import { seedService } from '../../services/seedService';
import { cn } from '../../lib/utils';
import Mascot from '../../components/Mascot';

export default function NGODashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');
  const [needs, setNeeds] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    assigned: 0,
    fulfilled: 0,
    fulfillmentRate: 0,
    avgVolunteers: 0,
    mostActiveCategory: 'N/A'
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [newNeed, setNewNeed] = useState({
    title: '',
    category: 'Health',
    description: '',
    city: '',
    state: '',
    country: '',
    urgency: 'Moderate',
    volunteersNeeded: 1,
    skillsRequired: '',
    deadline: '',
    remote: false
  });
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'needs'), where('ngoId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNeeds(data);
      
      const fulfilledCount = data.filter((n: any) => n.status === 'Fulfilled').length;
      const totalNeeded = data.reduce((acc: number, n: any) => acc + (n.volunteersNeeded || 0), 0);
      const totalAssigned = data.reduce((acc: number, n: any) => acc + (n.volunteersAssigned?.length || 0), 0);
      
      // Calculate most active category
      const categories = data.map((n: any) => n.category);
      const categoryCounts = categories.reduce((acc: any, c: string) => {
        acc[c] = (acc[c] || 0) + 1;
        return acc;
      }, {});
      const mostActive = Object.entries(categoryCounts).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'N/A';

      setStats({
        total: data.length,
        open: data.filter((n: any) => n.status === 'Open').length,
        assigned: totalAssigned,
        fulfilled: fulfilledCount,
        fulfillmentRate: data.length > 0 ? Math.round((fulfilledCount / data.length) * 100) : 0,
        avgVolunteers: data.length > 0 ? parseFloat((totalAssigned / data.length).toFixed(1)) : 0,
        mostActiveCategory: mostActive
      });
    }, (error) => {
      console.error("NGO stats error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSeedData = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      await seedService.seedSampleData(user.uid);
      setWarning('Sample data seeded successfully!');
    } catch (error) {
      console.error("Seeding failed:", error);
      setWarning('Failed to seed data.');
    } finally {
      setSeeding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (warning && !warning.includes('Failed')) {
      await saveNeed();
      return;
    }

    try {
      const detection = await geminiService.detectDuplicates(newNeed, needs);
      if (detection.isDuplicate) {
        setWarning(`Warning: A similar need was detected. Reason: ${detection.reason}`);
        setLoading(false);
        return;
      }
      await saveNeed();
    } catch (error) {
      console.error("Error adding need:", error);
      setLoading(false);
    }
  };

  const saveNeed = async () => {
    if (!user) return;
    try {
      const lat = 15 + Math.random() * 15;
      const lng = 70 + Math.random() * 15;

      await addDoc(collection(db, 'needs'), {
        ...newNeed,
        location: {
          city: newNeed.city,
          state: newNeed.state,
          country: newNeed.country,
          lat,
          lng
        },
        skillsRequired: newNeed.skillsRequired.split(',').map(s => s.trim()),
        ngoId: user.uid,
        status: 'Open',
        createdAt: Timestamp.now(),
        volunteersAssigned: []
      });

      setIsModalOpen(false);
      setNewNeed({
        title: '',
        category: 'Health',
        description: '',
        city: '',
        state: '',
        country: '',
        urgency: 'Moderate',
        volunteersNeeded: 1,
        skillsRequired: '',
        deadline: '',
        remote: false
      });
      setWarning('');
    } catch (error: any) {
      setWarning(`Failed to save request: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getAnalyticsData = () => {
    // Need fulfillment over time (last 7 days/weeks)
    const needsByDate: any = {};
    needs.forEach(n => {
      const date = n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString() : new Date(n.createdAt).toLocaleDateString();
      needsByDate[date] = (needsByDate[date] || 0) + 1;
    });
    const lineData = Object.entries(needsByDate).map(([date, count]) => ({ date, count })).slice(-7);

    // Volunteers per need
    const barData = needs.slice(0, 8).map(n => ({
      name: n.title.length > 20 ? n.title.substring(0, 17) + '...' : n.title,
      volunteers: n.volunteersAssigned?.length || 0,
      needed: n.volunteersNeeded
    }));

    return { lineData, barData };
  };

  const { lineData, barData } = getAnalyticsData();

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">NGO Dashboard</h1>
            <p className="text-text-muted">Manage your humanitarian requests and track impact</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={handleSeedData}
              disabled={seeding}
              className="bg-accent/10 text-accent px-6 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-accent/20 transition-all disabled:opacity-50"
            >
              <Database size={20} />
              <span>{seeding ? 'Seeding...' : 'Seed Sample Data'}</span>
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#1A6B5A] text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#1A6B5A]/90 transition-all shadow-md active:scale-95"
            >
              <Plus size={20} />
              <span>Raise a Request</span>
            </button>
          </div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'overview' ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
            )}
          >
            <LayoutDashboard size={18} />
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'analytics' ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
            )}
          >
            <BarChart2 size={18} />
            Advanced Analytics
          </button>
        </div>

        {activeTab === 'overview' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Total Needs" 
                value={stats.total} 
                icon={<Database size={20} />} 
                color="text-[#1A6B5A]"
                bg="bg-[#1A6B5A]/5"
              />
              <StatCard 
                title="Open Needs" 
                value={stats.open} 
                icon={<AlertTriangle size={20} />} 
                color="text-[#F4A026]"
                bg="bg-[#F4A026]/5"
              />
              <StatCard 
                title="Volunteers" 
                value={stats.assigned} 
                icon={<Users size={20} />} 
                color="text-[#1A6B5A]"
                bg="bg-[#1A6B5A]/5"
              />
              <StatCard 
                title="Fulfilled" 
                value={stats.fulfilled} 
                icon={<CheckCircle2 size={20} />} 
                color="text-[#22C55E]"
                bg="bg-[#22C55E]/5"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-surface rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-lg font-bold mb-6">Recent Status Tracking</h3>
                  <div className="space-y-4">
                    {needs.slice(0, 5).map(need => (
                      <div key={need.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-12 rounded-full",
                            need.urgency === 'critical' ? "bg-severity-critical" : 
                            need.urgency === 'high' ? "bg-severity-high" : "bg-primary"
                          )} />
                          <div>
                            <p className="font-bold text-sm">{need.title}</p>
                            <p className="text-xs text-text-muted">{need.category} • {need.location?.city}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "text-xs font-bold uppercase tracking-wider",
                            need.status === 'fulfilled' ? "text-green-600" : "text-accent"
                          )}>
                            {need.status.replace('_', ' ')}
                          </p>
                          <p className="text-[10px] text-text-muted">{need.volunteersAssigned?.length || 0}/{need.volunteersNeeded} Volunteers</p>
                        </div>
                      </div>
                    ))}
                    {needs.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Mascot size={80} className="mb-4 opacity-50" />
                        <p className="text-text-muted italic">No needs raised yet. Click "Raise a Request" to start.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                 <div className="bg-[#0F4C35] text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Overall Impact</p>
                      <h4 className="text-4xl font-black mb-4">{stats.fulfilled}</h4>
                      <p className="text-sm text-white/80 leading-relaxed font-medium">Lives touched through fulfilled requests this month.</p>
                    </div>
                    <Users className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10" />
                 </div>
                 
                 <div className="bg-surface rounded-2xl border border-gray-100 p-6 shadow-sm">
                   <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">Pulse Suggestions</h3>
                   <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl flex gap-3">
                      <Mascot size={40} className="shrink-0" />
                      <div className="text-xs leading-relaxed">
                        <p className="font-bold text-primary mb-1">Optimize Your Reach</p>
                        <p className="text-text-muted">Most of your needs are in <span className="text-primary font-bold">{stats.mostActiveCategory}</span>. Consider reaching out to specialized volunteers for faster fulfillment.</p>
                      </div>
                   </div>
                 </div>
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-500">
            {/* Analytics Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-black">{stats.fulfillmentRate}%</p>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Fulfillment Rate</p>
                  </div>
               </div>
               <div className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-black">{stats.avgVolunteers}</p>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Avg Vol. per Need</p>
                  </div>
               </div>
               <div className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl">
                    <PieIcon size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-black">{stats.mostActiveCategory}</p>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Top Category</p>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-surface p-8 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-base font-bold mb-6">Volunteer Assignment per Need</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis dataKey="name" fontSize={10} tick={{fill: '#888'}} axisLine={false} tickLine={false} />
                      <YAxis fontSize={10} tick={{fill: '#888'}} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                        cursor={{fill: '#f8fafc'}}
                      />
                      <Bar dataKey="volunteers" name="Assigned" radius={[4, 4, 0, 0]} barSize={20}>
                        {barData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill="#1A6B5A" />
                        ))}
                      </Bar>
                      <Bar dataKey="needed" name="Needed" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-surface p-8 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-base font-bold mb-6">Needs Submitted (Timeline)</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis dataKey="date" fontSize={10} tick={{fill: '#888'}} axisLine={false} tickLine={false} />
                      <YAxis fontSize={10} tick={{fill: '#888'}} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#1A6B5A" 
                        strokeWidth={3} 
                        dot={{fill: '#1A6B5A', strokeWidth: 2, r: 4, stroke: '#fff'}}
                        activeDot={{r: 6}}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Raise Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-2xl rounded-[2rem] shadow-2xl p-8 overflow-y-auto max-h-[90vh] animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <Plus size={24} />
                </div>
                <h2 className="text-xl font-bold">Raise a Request</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-primary p-2 hover:bg-gray-100 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Emergency Oxygen Supply"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40 bg-gray-50/50"
                    value={newNeed.title}
                    onChange={e => setNewNeed({...newNeed, title: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Category</label>
                  <select 
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40 bg-gray-50/50"
                    value={newNeed.category}
                    onChange={e => setNewNeed({...newNeed, category: e.target.value})}
                  >
                    <option>Health</option>
                    <option>Education</option>
                    <option>Disaster Relief</option>
                    <option>Food Security</option>
                    <option>Shelter</option>
                    <option>Environment</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Description</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Describe the situation and what is specifically needed..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40 bg-gray-50/50 resize-none"
                  value={newNeed.description}
                  onChange={e => setNewNeed({...newNeed, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">City</label>
                  <input 
                    type="text" required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40 bg-gray-50/50"
                    value={newNeed.city}
                    onChange={e => setNewNeed({...newNeed, city: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">State</label>
                  <input 
                    type="text" required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40 bg-gray-50/50"
                    value={newNeed.state}
                    onChange={e => setNewNeed({...newNeed, state: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Country</label>
                  <input 
                    type="text" required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40 bg-gray-50/50"
                    value={newNeed.country}
                    onChange={e => setNewNeed({...newNeed, country: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Urgency</label>
                  <select 
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40 bg-gray-50/50"
                    value={newNeed.urgency}
                    onChange={e => setNewNeed({...newNeed, urgency: e.target.value})}
                  >
                    <option>Critical</option>
                    <option>High</option>
                    <option>Moderate</option>
                    <option>Low</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Volunteers Needed</label>
                  <input 
                    type="number" min="1"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40 bg-gray-50/50"
                    value={newNeed.volunteersNeeded}
                    onChange={e => setNewNeed({...newNeed, volunteersNeeded: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              {warning && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 text-amber-800 text-sm animate-in shake duration-300">
                  <AlertTriangle size={20} className="shrink-0" />
                  <p>{warning}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all font-bold text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-white px-10 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                  {loading ? 'Checking...' : (warning && !warning.includes('Failed') ? 'Submit Anyway' : 'Publish Need')}
                  {!loading && <Send size={18} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

function StatCard({ title, value, icon, color, bg }: { title: string, value: string | number, icon: React.ReactNode, color: string, bg?: string }) {
  return (
    <div className={cn("bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all", bg)}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-xl bg-white group-hover:bg-white/50 transition-colors shadow-sm">
          {icon}
        </div>
      </div>
      <p className={cn("text-3xl font-black mb-1", color)}>{value}</p>
      <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{title}</p>
      <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary/2 rounded-full group-hover:scale-150 transition-transform" />
    </div>
  );
}
