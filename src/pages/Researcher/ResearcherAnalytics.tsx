import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { TrendingUp, Activity, Map, Filter } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ResearcherAnalytics() {
  const [needs, setNeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'needs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNeeds(data);
      setLoading(false);
    }, (error) => {
      console.error("Analytics data error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data for Time Series (Needs created over time)
  const timeData = needs.reduce((acc: any[], need) => {
    const date = new Date(need.createdAt?.toDate ? need.createdAt.toDate() : need.createdAt).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ date, count: 1 });
    }
    return acc;
  }, []).reverse();

  // Data for Urgency vs Volunteers Needed (Scatter)
  const scatterData = needs.map(need => ({
    urgency: need.urgency === 'Critical' ? 4 : need.urgency === 'High' ? 3 : need.urgency === 'Moderate' ? 2 : 1,
    volunteers: need.volunteersNeeded,
    title: need.title
  }));

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Advanced Analytics</h1>
            <p className="text-text-muted">Deep dive into humanitarian trends and resource allocation</p>
          </div>
          <button className="flex items-center gap-2 bg-surface border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
            <Filter size={18} />
            <span>Filter Data</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Needs Over Time */}
          <div className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="text-primary" size={20} />
              Needs Creation Trend
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A6B5A" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1A6B5A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#1A6B5A" fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Urgency vs Volunteers Needed */}
          <div className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <Activity className="text-accent" size={20} />
              Urgency vs Resource Demand
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis type="number" dataKey="urgency" name="Urgency" unit="" ticks={[1, 2, 3, 4]} tickFormatter={(val) => ['Low', 'Mod', 'High', 'Crit'][val-1]} />
                  <YAxis type="number" dataKey="volunteers" name="Volunteers" unit=" ppl" />
                  <ZAxis type="number" range={[60, 400]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Needs" data={scatterData} fill="#F4A026" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Geographic Distribution Summary */}
        <div className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <Map className="text-primary" size={20} />
            Top Impact Regions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mock regional data based on needs */}
            <RegionCard name="Maharashtra" count={12} trend="+15%" />
            <RegionCard name="Karnataka" count={8} trend="+5%" />
            <RegionCard name="Tamil Nadu" count={5} trend="-2%" />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function RegionCard({ name, count, trend }: { name: string, count: number, trend: string }) {
  const isPositive = trend.startsWith('+');
  return (
    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
      <p className="text-sm text-text-muted font-medium mb-1">{name}</p>
      <div className="flex justify-between items-end">
        <p className="text-2xl font-bold">{count} Needs</p>
        <span className={cn("text-xs font-bold", isPositive ? "text-severity-low" : "text-severity-critical")}>
          {trend}
        </span>
      </div>
    </div>
  );
}
