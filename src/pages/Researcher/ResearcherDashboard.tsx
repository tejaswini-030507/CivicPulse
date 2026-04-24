import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { geminiService } from '../../services/geminiService';
import { Lightbulb, TrendingUp, AlertCircle, MessageSquare, Database, FileText, Upload } from 'lucide-react';
import MyDatasets from './MyDatasets';
import DataAnalyser from './DataAnalyser';
import Mascot from '../../components/Mascot';

export default function ResearcherDashboard({ initialTab }: { initialTab?: 'overview' | 'datasets' | 'data-analyser' }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'datasets' | 'data-analyser'>(initialTab || 'overview');
  
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [needs, setNeeds] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'needs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNeeds(data);
      
      if (data.length > 0) {
        const aiInsights = await geminiService.generateDashboardInsights(data);
        setInsights(aiInsights);
      }
      setLoading(false);
    }, (error) => {
      console.error("Researcher data error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data for Category Chart
  const categoryData = needs.reduce((acc: any[], need) => {
    const existing = acc.find(item => item.name === need.category);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ name: need.category, count: 1 });
    }
    return acc;
  }, []);

  // Data for Urgency Chart
  const urgencyData = needs.reduce((acc: any[], need) => {
    const existing = acc.find(item => item.name === need.urgency);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: need.urgency, value: 1 });
    }
    return acc;
  }, []);

  const COLORS = ['#E03E3E', '#F97316', '#FACC15', '#22C55E'];

  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;
    setChatLoading(true);
    try {
      const response = await geminiService.chatWithData(chatQuery, needs);
      setChatResponse(response);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Researcher Portal</h1>
            <p className="text-text-muted">Data-driven insights for social impact</p>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-primary'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('datasets')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'datasets' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-primary'}`}
            >
              My Datasets
            </button>
            <button 
              onClick={() => setActiveTab('data-analyser')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'data-analyser' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-primary'}`}
            >
              Data Analyser
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* AI Insights Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {insights.length > 0 ? (
                <>
                  <InsightCard 
                    title={insights[0].title} 
                    value={insights[0].value} 
                    description={insights[0].description} 
                    icon={<TrendingUp size={20} />}
                    color="text-primary"
                    bg="bg-primary/5"
                  />
                  <InsightCard 
                    title={insights[1].title} 
                    value={insights[1].value} 
                    description={insights[1].description} 
                    icon={<AlertCircle size={20} />}
                    color="text-[#1A6B5A]"
                    bg="bg-[#1A6B5A]/5"
                  />
                  <InsightCard 
                    title={insights[2].title} 
                    value={insights[2].value} 
                    description={insights[2].description} 
                    icon={<Database size={20} />}
                    color="text-[#0F4C35]"
                    bg="bg-[#0F4C35]/5"
                  />
                </>
              ) : (
                loading ? [1, 2, 3].map(i => (
                  <div key={i} className="bg-gray-100 h-32 rounded-2xl animate-pulse"></div>
                )) : (
                  <div className="col-span-3 text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <p className="text-text-muted">No data available to generate insights.</p>
                  </div>
                )
              )}
            </div>

            {/* Chat with Data Section */}
            <div className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <MessageSquare className="text-primary" size={20} />
                Chat with Dataset
              </h3>
              <form onSubmit={handleChat} className="flex gap-3 mb-4">
                <input 
                  type="text" 
                  placeholder="Ask a question about the humanitarian needs (e.g., 'Which city has the most critical needs?')"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                  value={chatQuery}
                  onChange={e => setChatQuery(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={chatLoading}
                  className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {chatLoading ? 'Analyzing...' : 'Ask AI'}
                </button>
              </form>
              {chatResponse && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-text-primary whitespace-pre-wrap">
                  <div className="font-bold text-primary mb-2 flex items-center gap-2">
                    <Database size={14} />
                    AI Analysis:
                  </div>
                  {chatResponse}
                </div>
              )}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Category Bar Chart */}
              <div className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="text-primary" size={20} />
                  Needs by Category
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                      <YAxis axisLine={false} tickLine={false} fontSize={12} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="count" fill="#1A6B5A" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Urgency Pie Chart */}
              <div className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold mb-6 flex items-center gap-2">
                  <AlertCircle className="text-accent" size={20} />
                  Urgency Distribution
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={urgencyData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {urgencyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'datasets' && <MyDatasets />}
        {activeTab === 'data-analyser' && <DataAnalyser />}
      </div>
    </Layout>
  );
}

function InsightCard({ title, value, description, icon, color, bg }: any) {
  return (
    <div className={`${bg} border border-gray-100 p-6 rounded-2xl hover:shadow-md transition-all group relative overflow-hidden`}>
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
        <Mascot size={100} />
      </div>
      <div className={`flex items-center gap-2 ${color} mb-3`}>
        {icon}
        <h4 className="font-bold text-xs uppercase tracking-widest">{title}</h4>
      </div>
      <p className="text-2xl font-black mb-1 text-text-primary">{value}</p>
      <p className="text-[10px] text-text-muted font-medium uppercase tracking-tight leading-tight">{description}</p>
    </div>
  );
}
