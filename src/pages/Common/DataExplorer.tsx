import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, onSnapshot, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  Filter, 
  MapPin, 
  AlarmClock as Clock, 
  Users, 
  Heart,
  AlertCircle,
  ChevronRight,
  Download,
  MessageSquare,
  X,
  Database,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  PieChart as PieChartIcon,
  Search,
  BarChart2,
  Calendar,
  Layers,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { geminiService } from '../../services/geminiService';
import Mascot from '../../components/Mascot';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend,
  ScatterChart,
  Scatter
} from 'recharts';
import { toast } from 'sonner';

const DUMMY_NEEDS = [
  {
    id: 'demo_need_1',
    title: 'Clean Water Access for Coastal Villages',
    category: 'health',
    description: 'Post-cyclone water pipe damage has left 300 families dependent on contaminated ponds. Urgent need for filtration kits and temporary storage tanks.',
    urgency: 'critical',
    location: { city: 'Puri', country: 'India' },
    volunteersNeeded: 12,
    createdAt: new Date().toISOString(),
    isDemo: true,
    ngoName: 'HopeReach Foundation',
    mission: 'Providing clean water and sanitation to disaster-prone coastal areas.',
    impactSummary: 'Will prevent waterborne disease outbreak for 1,200 individuals.'
  },
  {
    id: 'demo_need_2',
    title: 'Mobile Education Unit for Urban Slums',
    category: 'education',
    description: 'Setting up 3 periodic learning centres for children who dropped out during the pandemic. Need volunteer teachers for weekend math and language sessions.',
    urgency: 'high',
    location: { city: 'Lagos', country: 'Nigeria' },
    volunteersNeeded: 25,
    createdAt: new Date().toISOString(),
    isDemo: true,
    ngoName: 'EduBridge Global',
    mission: 'Bridging the literacy gap through community-driven educational pods.',
    impactSummary: '80 children projected to re-enter formal schooling by end of year.'
  }
];

const DEMO_DATASETS = [
  {
    id: 'demo_1',
    title: 'India Flood Relief Needs 2024',
    category: 'disaster',
    description: 'Aggregated field survey from 12 NGOs across flood-affected Maharashtra and Assam. Covers medical, shelter, food needs for 1,200 households.',
    region: 'Maharashtra, India',
    urgency: 'critical',
    recordCount: 1200,
    lastUpdated: 'March 2024',
    ngoName: 'HopeReach Foundation',
    tags: ['flood','medical','shelter','2024'],
    columns: ['District','HouseholdsAffected','MedicalNeeds','ShelterGap','FoodInsecurity','VolunteersDeployed'],
    sampleData: [
      { District: 'Ratnagiri', HouseholdsAffected: 340, MedicalNeeds: 112, ShelterGap: 198, FoodInsecurity: 280, VolunteersDeployed: 14 },
      { District: 'Raigad', HouseholdsAffected: 210, MedicalNeeds: 67, ShelterGap: 145, FoodInsecurity: 190, VolunteersDeployed: 9 },
      { District: 'Kolhapur', HouseholdsAffected: 180, MedicalNeeds: 44, ShelterGap: 110, FoodInsecurity: 155, VolunteersDeployed: 7 },
      { District: 'Sindhudurg', HouseholdsAffected: 290, MedicalNeeds: 89, ShelterGap: 176, FoodInsecurity: 240, VolunteersDeployed: 11 },
      { District: 'Thane', HouseholdsAffected: 180, MedicalNeeds: 52, ShelterGap: 99, FoodInsecurity: 130, VolunteersDeployed: 6 }
    ],
    basicChart: { type: 'bar', labels: ['Ratnagiri','Raigad','Kolhapur','Sindhudurg','Thane'], values: [340,210,180,290,180] }
  },
  {
    id: 'demo_2',
    title: 'East Africa Food Security Index Q1 2025',
    category: 'food',
    description: 'Monthly food security scores for 8 counties in Kenya and Tanzania. Compiled from WFP field reports and NGO submissions.',
    region: 'Nairobi, Kenya',
    urgency: 'high',
    recordCount: 960,
    lastUpdated: 'January 2025',
    ngoName: 'GlobalAid Network',
    tags: ['food security','Kenya','Tanzania','WFP'],
    columns: ['County','FoodSecurityScore','PopulationAffected','AidReceived','VolunteerCount'],
    sampleData: [
      { County: 'Kibera', FoodSecurityScore: 2.1, PopulationAffected: 18000, AidReceived: 4200, VolunteerCount: 23 },
      { County: 'Mathare', FoodSecurityScore: 2.4, PopulationAffected: 14000, AidReceived: 3800, VolunteerCount: 18 },
      { County: 'Mombasa', FoodSecurityScore: 3.8, PopulationAffected: 9000, AidReceived: 5100, VolunteerCount: 31 },
      { County: 'Kisumu', FoodSecurityScore: 3.1, PopulationAffected: 11000, AidReceived: 4600, VolunteerCount: 26 },
      { County: 'Nakuru', FoodSecurityScore: 4.2, PopulationAffected: 7500, AidReceived: 5800, VolunteerCount: 19 }
    ],
    basicChart: { type: 'line', labels: ['Kibera','Mathare','Mombasa','Kisumu','Nakuru'], values: [2.1,2.4,3.8,3.1,4.2] }
  },
  {
    id: 'demo_3',
    title: 'Tamil Nadu Literacy Gap Report 2023',
    category: 'education',
    description: 'District-level literacy data for 32 Tamil Nadu districts. Cross-referenced with dropout rates and volunteer tutor demand.',
    region: 'Chennai, Tamil Nadu',
    urgency: 'moderate',
    recordCount: 32,
    lastUpdated: 'December 2023',
    ngoName: 'EduBridge India',
    tags: ['literacy','Tamil Nadu','education','dropout'],
    columns: ['District','LiteracyRate','DropoutRate','TutorDemand','TutorSupply'],
    sampleData: [
      { District: 'Chennai', LiteracyRate: 90.2, DropoutRate: 4.1, TutorDemand: 120, TutorSupply: 98 },
      { District: 'Villupuram', LiteracyRate: 71.3, DropoutRate: 22.4, TutorDemand: 340, TutorSupply: 87 },
      { District: 'Ramanathapuram', LiteracyRate: 73.8, DropoutRate: 19.1, TutorDemand: 290, TutorSupply: 76 },
      { District: 'Krishnagiri', LiteracyRate: 76.4, DropoutRate: 16.8, TutorDemand: 210, TutorSupply: 91 },
      { District: 'Dharmapuri', LiteracyRate: 74.1, DropoutRate: 18.3, TutorDemand: 260, TutorSupply: 80 }
    ],
    basicChart: { type: 'bar', labels: ['Chennai','Villupuram','Ramanathapuram','Krishnagiri','Dharmapuri'], values: [90.2,71.3,73.8,76.4,74.1] }
  },
  {
    id: 'demo_4',
    title: 'Lagos Refugee Mental Health Survey 2024',
    category: 'health',
    description: 'Psychosocial assessment of 800 refugees across 4 camps in Lagos. Covers depression, anxiety, and PTSD indicators.',
    region: 'Lagos, Nigeria',
    urgency: 'high',
    recordCount: 800,
    lastUpdated: 'July 2024',
    ngoName: 'GlobalAid Network',
    tags: ['mental health','refugees','Lagos','psychosocial'],
    columns: ['Camp','DepressionRate','AnxietyRate','PTSDRate','CounsellorCount','SupportSessions'],
    sampleData: [
      { Camp: 'Camp Alpha', DepressionRate: 44, AnxietyRate: 51, PTSDRate: 38, CounsellorCount: 3, SupportSessions: 120 },
      { Camp: 'Camp Bravo', DepressionRate: 39, AnxietyRate: 47, PTSDRate: 31, CounsellorCount: 4, SupportSessions: 145 },
      { Camp: 'Camp Delta', DepressionRate: 52, AnxietyRate: 58, PTSDRate: 45, CounsellorCount: 2, SupportSessions: 90 },
      { Camp: 'Camp Echo', DepressionRate: 35, AnxietyRate: 42, PTSDRate: 28, CounsellorCount: 5, SupportSessions: 180 }
    ],
    basicChart: { type: 'bar', labels: ['Camp Alpha','Camp Bravo','Camp Delta','Camp Echo'], values: [44,39,52,35] }
  },
  {
    id: 'demo_5',
    title: 'Odisha Cyclone Shelter Damage Assessment',
    category: 'shelter',
    description: 'Post-cyclone structural survey of 500 homes in coastal Odisha. Assesses damage severity and reconstruction volunteer demand.',
    region: 'Bhubaneswar, Odisha',
    urgency: 'critical',
    recordCount: 500,
    lastUpdated: 'October 2024',
    ngoName: 'HopeReach Foundation',
    tags: ['cyclone','shelter','Odisha','reconstruction'],
    columns: ['Village','HomesDestroyed','HomesDamaged','FamiliesDisplaced','VolunteersNeeded','Reconstructed'],
    sampleData: [
      { Village: 'Puri', HomesDestroyed: 78, HomesDamaged: 134, FamiliesDisplaced: 212, VolunteersNeeded: 45, Reconstructed: 12 },
      { Village: 'Kendrapara', HomesDestroyed: 55, HomesDamaged: 98, FamiliesDisplaced: 153, VolunteersNeeded: 32, Reconstructed: 8 },
      { Village: 'Jagatsinghpur', HomesDestroyed: 91, HomesDamaged: 167, FamiliesDisplaced: 258, VolunteersNeeded: 54, Reconstructed: 19 },
      { Village: 'Balasore', HomesDestroyed: 43, HomesDamaged: 76, FamiliesDisplaced: 119, VolunteersNeeded: 28, Reconstructed: 15 }
    ],
    basicChart: { type: 'bar', labels: ['Puri','Kendrapara','Jagatsinghpur','Balasore'], values: [78,55,91,43] }
  },
  {
    id: 'demo_6',
    title: 'Tamil Nadu Coastal Mangrove Survey 2024',
    category: 'environment',
    description: 'Field survey of mangrove coverage, degradation levels, and restoration volunteer requirements across 6 coastal districts.',
    region: 'Cuddalore, Tamil Nadu',
    urgency: 'low',
    recordCount: 240,
    lastUpdated: 'February 2024',
    ngoName: 'EduBridge India',
    tags: ['environment','mangrove','Tamil Nadu','coastal'],
    columns: ['District','MangroveAreaHa','DegradationPercent','SaplingsPlanted','VolunteersInvolved'],
    sampleData: [
      { District: 'Cuddalore', MangroveAreaHa: 1240, DegradationPercent: 34, SaplingsPlanted: 8500, VolunteersInvolved: 67 },
      { District: 'Nagapattinam', MangroveAreaHa: 980, DegradationPercent: 41, SaplingsPlanted: 6200, VolunteersInvolved: 48 },
      { District: 'Ramanathapuram', MangroveAreaHa: 1560, DegradationPercent: 28, SaplingsPlanted: 11000, VolunteersInvolved: 89 },
      { District: 'Thanjavur', MangroveAreaHa: 720, DegradationPercent: 52, SaplingsPlanted: 4800, VolunteersInvolved: 34 }
    ],
    basicChart: { type: 'bar', labels: ['Cuddalore','Nagapattinam','Ramanathapuram','Thanjavur'], values: [1240,980,1560,720] }
  }
];

export default function DataExplorer() {
  const { profile } = useAuth(); // Need to import useAuth
  const [activeView, setActiveView] = useState<'needs' | 'datasets'>(
    (profile?.roles?.includes('Researcher') || profile?.roles?.includes('Volunteer')) ? 'datasets' : 'needs'
  );
  const [needs, setNeeds] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: 'All',
    urgency: 'All',
    status: 'Open'
  });
  const [selectedNeed, setSelectedNeed] = useState<any>(null);
  const [selectedDataset, setSelectedDataset] = useState<any>(null);
  const [analysisLevel, setAnalysisLevel] = useState<'basic' | 'deep'>('basic');
  const [deepAnalysis, setDeepAnalysis] = useState<any>(null);
  const [analyzingDeeply, setAnalyzingDeeply] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    if (activeView === 'needs') {
      let q = query(collection(db, 'needs'), orderBy('createdAt', 'desc'));

      if (filters.category !== 'All') {
        q = query(q, where('category', '==', filters.category.toLowerCase()));
      }
      if (filters.urgency !== 'All') {
        q = query(q, where('urgency', '==', filters.urgency.toLowerCase()));
      }
      if (filters.status !== 'All') {
        q = query(q, where('status', '==', filters.status.toLowerCase().replace(' ', '_')));
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filter dummy needs based on selected filters
        const filteredDummies = DUMMY_NEEDS.filter(need => {
          if (filters.category !== 'All' && need.category !== filters.category.toLowerCase()) return false;
          if (filters.urgency !== 'All' && need.urgency !== filters.urgency.toLowerCase()) return false;
          return true;
        });

        setNeeds([...filteredDummies, ...data]);
        setLoading(false);
      }, (error) => {
        console.error("Firestore error:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      const q = query(collection(db, 'datasets'), where('visibility', '==', 'public'), orderBy('uploadedAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isDemo: false }));
        setDatasets([...DEMO_DATASETS, ...data]);
        setLoading(false);
      }, (error) => {
        console.error("Firestore datasets error:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [filters, activeView]);

  const handleNeedClick = async (need: any) => {
    setSelectedNeed(need);
    setAiInsights('Generating AI insights...');
    const insights = await geminiService.getNeedInsights(need);
    setAiInsights(insights);
  };

  const handleDeepAnalysis = async (dataset: any) => {
    setAnalysisLevel('deep');
    setAnalyzingDeeply(true);
    try {
      const result = await geminiService.analyzeDeeply({
        title: dataset.title,
        description: dataset.description,
        columns: dataset.columns || [],
        sampleData: dataset.sampleData || []
      });
      setDeepAnalysis(result);
    } catch (err: any) {
      toast.error("Deep analysis failed: " + err.message);
      setAnalysisLevel('basic');
    } finally {
      setAnalyzingDeeply(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'critical': return 'bg-severity-critical text-white';
      case 'high': return 'bg-severity-high text-white';
      case 'moderate': return 'bg-severity-moderate text-text-primary';
      case 'low': return 'bg-severity-low text-white';
      default: return 'bg-gray-200';
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'moderate': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const renderBasicChart = (chart: any) => {
    if (!chart) return null;
    const data = chart.labels.map((l: string, i: number) => ({ name: l, value: chart.values[i] }));
    
    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === 'bar' ? (
            <BarChart data={data}>
              <XAxis dataKey="name" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Bar dataKey="value" fill="#1A6B5A" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <XAxis dataKey="name" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#1A6B5A" strokeWidth={2} dot={{ fill: '#F4A026', stroke: '#F4A026' }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  const filteredItems = (activeView === 'needs' ? needs : datasets).filter(item => {
    const matchSearch = !searchQuery ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ngoName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location?.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.skillsRequired || []).some((s: any) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.tags || []).some((t: any) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchSearch;
  });

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Data Explorer</h1>
            <p className="text-text-muted">Explore humanitarian needs and datasets across regions</p>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(!profile?.roles?.includes('Researcher') && !profile?.roles?.includes('Volunteer')) && (
              <button 
                onClick={() => setActiveView('needs')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeView === 'needs' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-primary'}`}
              >
                Needs
              </button>
            )}
            <button 
              onClick={() => setActiveView('datasets')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeView === 'datasets' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-primary'}`}
            >
              Datasets
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', marginBottom: '14px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: '#9CA3AF', pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            placeholder="Search by title, NGO, location, category, skills..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '13px 16px 13px 44px',
              border: '1.5px solid #E2E8F0',
              borderRadius: '12px',
              fontSize: '14px',
              background: 'white',
              boxSizing: 'border-box',
              outline: 'none',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
            }}
            onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#1A6B5A'}
            onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#E2E8F0'}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '16px' }}
            >✕</button>
          )}
        </div>

        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
          {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} found
          {searchQuery && <span> for "<strong>{searchQuery}</strong>"</span>}
        </p>

        {activeView === 'needs' ? (
          <>
            {/* Filters */}
            <div className="bg-surface p-4 rounded-xl border border-gray-200 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-text-muted" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <select 
                className="bg-background border border-gray-200 rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
              >
                <option value="All">All Categories</option>
                <option value="Health">Health</option>
                <option value="Education">Education</option>
                <option value="Disaster Relief">Disaster Relief</option>
                <option value="Food Security">Food Security</option>
                <option value="Shelter">Shelter</option>
                <option value="Environment">Environment</option>
              </select>

              <select 
                className="bg-background border border-gray-200 rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                value={filters.urgency}
                onChange={(e) => setFilters({...filters, urgency: e.target.value})}
              >
                <option value="All">All Urgency</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
                <option value="Low">Low</option>
              </select>

              <select 
                className="bg-background border border-gray-200 rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="All">All Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Fulfilled">Fulfilled</option>
              </select>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((need) => (
                  <div 
                    key={need.id} 
                    className="bg-surface rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
                    onClick={() => handleNeedClick(need)}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-2">
                          <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", getUrgencyColor(need.urgency))}>
                            {need.urgency}
                          </span>
                          {need.isDemo && (
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              Demo
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Clock size={14} />
                          {need.isDemo ? 'Featured' : (need.createdAt?.toDate ? need.createdAt.toDate().toLocaleDateString() : new Date(need.createdAt).toLocaleDateString())}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{need.title}</h3>
                      <p className="text-sm text-text-muted line-clamp-2 mb-4">{need.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-text-primary">
                          <MapPin size={16} className="text-primary" />
                          <span>{need.location?.city}, {need.location?.country}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-text-primary">
                          <Users size={16} className="text-accent" />
                          <span>{need.volunteersNeeded} Volunteers needed</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">{need.category}</span>
                      <ChevronRight size={18} className="text-text-muted group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
                {filteredItems.length === 0 && (
                  <div className="col-span-full py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 flex flex-col items-center">
                    <div className="mb-6 opacity-20">
                      <Mascot size={100} />
                    </div>
                    <p className="text-text-muted font-bold uppercase tracking-widest text-xs">No needs found matching filters</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((ds) => (
              <div 
                key={ds.id} 
                className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
                onClick={() => {
                  setSelectedDataset(ds);
                  setAnalysisLevel('basic');
                  setDeepAnalysis(null);
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-primary/5 rounded-xl text-primary">
                    <Database size={24} />
                  </div>
                  <span className={cn(
                    "px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider",
                    ds.isDemo ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                  )}>
                    {ds.isDemo ? "Demo" : "Portal"}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">{ds.title}</h3>
                <p className="text-xs text-text-muted mb-4 line-clamp-2">{ds.description}</p>
                <div className="flex items-center gap-2 text-xs text-text-muted mb-4">
                  <FileText size={14} />
                  <span>
                    {ds.isDemo ? `${ds.recordCount} Records • ${ds.ngoName}` : `${ds.fileType?.toUpperCase()} • Uploaded by ${ds.uploaderName}`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {ds.tags?.slice(0, 3).map((tag: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-100 text-text-muted text-[10px] font-bold rounded-md uppercase tracking-wider">
                      #{tag}
                    </span>
                  ))}
                </div>
                <button className={cn(
                  "w-full py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all",
                  ds.isDemo ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-primary text-white hover:bg-primary/90"
                )}>
                  {ds.isDemo ? <BarChart2 size={16} /> : <Search size={16} />}
                  {ds.isDemo ? "Analyse Dataset" : "View & Analyse"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dataset Analysis Modal */}
      {selectedDataset && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex justify-end">
          <div className="bg-surface w-full max-w-3xl h-full overflow-y-auto p-8 shadow-2xl animate-in slide-in-from-right duration-500">
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-100">
               <div>
                  <div className="flex items-center gap-2 mb-1">
                    {analysisLevel === 'deep' && (
                      <button 
                        onClick={() => {
                          setAnalysisLevel('basic');
                          setDeepAnalysis(null);
                        }}
                        className="p-1 hover:bg-gray-100 rounded-lg text-primary"
                      >
                        <X size={20} className="rotate-90" />
                      </button>
                    )}
                    <h2 className="text-2xl font-black">{selectedDataset.title}</h2>
                  </div>
                  <p className="text-text-muted text-sm">
                    {analysisLevel === 'deep' ? 'Deep AI Insights Analysis' : 'Basic Data Characteristics'}
                  </p>
               </div>
               <button onClick={() => setSelectedDataset(null)} className="p-2 hover:bg-gray-100 rounded-full">
                 <X size={24} />
               </button>
            </div>

            {analysisLevel === 'basic' ? (
              <div className="space-y-8">
                 {/* Basic Info Cards */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Records</p>
                      <p className="font-bold">{selectedDataset.recordCount}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Region</p>
                      <p className="font-bold truncate" title={selectedDataset.region || 'Global'}>{selectedDataset.region || 'Global'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Last Updated</p>
                      <p className="font-bold">{selectedDataset.lastUpdated}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Source</p>
                      <p className="font-bold truncate" title={selectedDataset.ngoName}>{selectedDataset.ngoName}</p>
                    </div>
                 </div>

                 <div className={cn("p-4 rounded-xl flex items-center justify-between", getUrgencyBadge(selectedDataset.urgency))}>
                    <div className="flex items-center gap-2">
                      <AlertCircle size={18} />
                      <span className="text-sm font-bold uppercase tracking-widest">Urgency: {selectedDataset.urgency}</span>
                    </div>
                 </div>

                 <div>
                    <h4 className="text-sm font-bold mb-3">Description</h4>
                    <p className="text-text-primary leading-relaxed text-sm">{selectedDataset.description}</p>
                 </div>

                 <div>
                    <h4 className="text-sm font-bold mb-3">Columns & Parameters</h4>
                    <div className="flex flex-wrap gap-2">
                       {selectedDataset.columns?.map((col: string, i: number) => (
                         <span key={i} className="px-3 py-1 bg-primary/5 text-primary text-[11px] font-bold rounded-lg border border-primary/10">
                           {col}
                         </span>
                       ))}
                    </div>
                 </div>

                 <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                       <h4 className="text-sm font-bold flex items-center gap-2">
                         <BarChart2 size={18} className="text-primary" />
                         Basic Visualisation
                       </h4>
                    </div>
                    {selectedDataset.basicChart ? (
                       renderBasicChart(selectedDataset.basicChart)
                    ) : selectedDataset.chartData ? (
                       <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={selectedDataset.chartData.labels.map((l:any, i:any) => ({ name: l, val: selectedDataset.chartData.values[i]}))}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} />
                               <XAxis dataKey="name" fontSize={10} />
                               <YAxis fontSize={10} />
                               <Tooltip />
                               <Bar dataKey="val" fill="#1A6B5A" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                       </div>
                    ) : (
                      <div className="h-40 flex items-center justify-center bg-gray-50 rounded-2xl">
                        <p className="text-xs text-text-muted">No basic chart available for this dataset</p>
                      </div>
                    )}
                 </div>

                 <div className="flex flex-wrap gap-2">
                    {selectedDataset.tags?.map((tag: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-gray-100 text-text-muted text-[10px] font-bold rounded-full uppercase">
                        #{tag}
                      </span>
                    ))}
                 </div>

                 <button 
                  onClick={() => handleDeepAnalysis(selectedDataset)}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99]"
                 >
                   <Search size={20} />
                   Deep Analysis with Gemini AI
                 </button>
              </div>
            ) : (
              <div className="space-y-8 pb-12">
                 {analyzingDeeply ? (
                   <div className="py-20 flex flex-col items-center justify-center text-center">
                      <div className="relative mb-8">
                        <Loader2 className="animate-spin text-primary" size={64} />
                         <div className="absolute inset-0 flex items-center justify-center">
                           <Mascot size={32} />
                         </div>
                      </div>
                      <h3 className="text-xl font-bold mb-2">Pulse AI is Thinking...</h3>
                      <p className="text-text-muted max-w-xs">Generating deep humanitarian insights and resource gap analysis.</p>
                   </div>
                 ) : deepAnalysis ? (
                   <div className="animate-in fade-in duration-700 space-y-8">
                      {/* Executive Summary */}
                      <div className="bg-[#1A6B5A]/5 p-6 rounded-3xl border-l-4 border-primary">
                         <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                           <FileText size={18} />
                           Executive Summary
                         </h4>
                         <p className="text-text-primary text-sm leading-relaxed italic">
                           "{deepAnalysis.executiveSummary}"
                         </p>
                      </div>

                      {/* Critical Insights Grid */}
                      <div>
                        <h4 className="text-sm font-bold mb-4 uppercase tracking-widest text-text-muted">Critical Insights</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {deepAnalysis.criticalInsights.map((insight: string, i: number) => (
                             <div key={i} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                  {i + 1}
                                </div>
                                <p className="text-xs font-semibold leading-relaxed">{insight}</p>
                             </div>
                           ))}
                        </div>
                      </div>

                      {/* Vulnerability Analysis */}
                      <div className="bg-amber-50 p-6 rounded-3xl border-l-4 border-amber-500">
                         <h4 className="text-sm font-bold text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                           <AlertTriangle size={18} />
                           Vulnerability Assessment
                         </h4>
                         <p className="text-amber-900 text-sm leading-relaxed">
                           {deepAnalysis.vulnerabilityAnalysis}
                         </p>
                      </div>

                      {/* Resource Gaps */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-sm font-bold mb-4 uppercase tracking-widest text-text-muted">Identified Gaps</h4>
                          <div className="space-y-3">
                            {deepAnalysis.resourceGaps.map((gap: string, i: number) => (
                              <div key={i} className="flex items-center gap-3 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                                <X size={16} className="shrink-0" />
                                <span className="font-bold">{gap}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold mb-4 uppercase tracking-widest text-text-muted">Impact Estimate</h4>
                          <div className="bg-primary/5 p-5 rounded-3xl border border-primary/10">
                             <p className="text-xs text-primary/80 leading-relaxed font-medium">
                               {deepAnalysis.volunteerImpactEstimate}
                             </p>
                          </div>
                        </div>
                      </div>

                      {/* AI Recommendations Table */}
                      <div>
                        <h4 className="text-sm font-bold mb-4 uppercase tracking-widest text-text-muted">Recommended Actions</h4>
                        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                           <table className="w-full text-left text-sm">
                             <thead className="bg-gray-50 border-b border-gray-100">
                               <tr>
                                 <th className="px-4 py-3 font-bold text-[10px] uppercase text-text-muted">Action</th>
                                 <th className="px-4 py-3 font-bold text-[10px] uppercase text-text-muted">Priority</th>
                                 <th className="px-4 py-3 font-bold text-[10px] uppercase text-text-muted">Timeframe</th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-50">
                               {deepAnalysis.recommendedActions.map((rec: any, i: number) => (
                                 <tr key={i} className="hover:bg-gray-50/50">
                                   <td className="px-4 py-4 font-semibold text-xs">{rec.action}</td>
                                   <td className="px-4 py-4">
                                      <span className={cn(
                                        "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                                        rec.priority === 'High' ? 'bg-red-100 text-red-600' : 
                                        rec.priority === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                                      )}>
                                        {rec.priority}
                                      </span>
                                   </td>
                                   <td className="px-4 py-4 text-xs text-text-muted">{rec.timeframe}</td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                        </div>
                      </div>

                      {/* Predicted Trend */}
                      <div className="bg-amber-50/50 p-6 rounded-3xl border-l-4 border-amber-400">
                         <h4 className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-2">AI Projected Trend</h4>
                         <p className="text-sm text-amber-900/80 italic leading-relaxed">
                           {deepAnalysis.predictedTrend}
                         </p>
                      </div>

                      {/* Deep Chart */}
                      {deepAnalysis.deepChartData && (
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative isolate overflow-hidden">
                           <div className="absolute top-0 right-0 p-8 opacity-5">
                             <Mascot size={120} />
                           </div>
                           <h4 className="text-sm font-bold mb-6 flex items-center gap-2">
                             <PieChartIcon size={18} className="text-primary" />
                             Correlated Data View
                           </h4>
                           <div className="h-64 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                {deepAnalysis.deepChartData.chartType === 'pie' ? (
                                  <PieChart>
                                    <Pie 
                                      data={deepAnalysis.deepChartData.labels.map((l:string, i:number) => ({ name: l, value: deepAnalysis.deepChartData.values[i] }))}
                                      dataKey="value"
                                      cx="50%" cy="50%"
                                      outerRadius={80}
                                      label={({ name }) => name}
                                    >
                                       {['#1A6B5A','#F4A026','#185FA5','#6e40c9','#a12d2d'].map((c, i) => <Cell key={i} fill={c} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                  </PieChart>
                                ) : (
                                  <BarChart data={deepAnalysis.deepChartData.labels.map((l:string, i:number) => ({ name: l, value: deepAnalysis.deepChartData.values[i] }))}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={10} />
                                    <YAxis fontSize={10} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#1A6B5A" radius={[4, 4, 0, 0]} />
                                  </BarChart>
                                )}
                              </ResponsiveContainer>
                           </div>
                        </div>
                      )}

                      {/* Confidence Score */}
                      <div className="space-y-2">
                         <div className="flex justify-between items-center text-[10px] font-black uppercase text-text-muted">
                            <span>Analysis Precision</span>
                            <span className="text-primary">AI Confidence: {deepAnalysis.confidenceScore}%</span>
                         </div>
                         <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200 p-0.5">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-1000" 
                              style={{ width: `${deepAnalysis.confidenceScore}%` }} 
                            />
                         </div>
                      </div>
                   </div>
                 ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedNeed && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex justify-end">
          <div className="bg-surface w-full max-w-2xl h-full overflow-y-auto p-8 shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold">{selectedNeed.title}</h2>
                {selectedNeed.isDemo && (
                  <span className="w-fit mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
                    Demo Resource
                  </span>
                )}
              </div>
              <button onClick={() => setSelectedNeed(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8">
              <div className="flex flex-wrap gap-4">
                <span className={cn("px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider", getUrgencyColor(selectedNeed.urgency))}>
                  {selectedNeed.urgency}
                </span>
                <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                  {selectedNeed.category}
                </span>
                <span className="px-4 py-1.5 rounded-full bg-gray-100 text-text-muted text-xs font-bold uppercase tracking-wider">
                  {selectedNeed.status || 'Active'}
                </span>
              </div>

              {(selectedNeed.isDemo || selectedNeed.ngoName) && (
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 border-l-4 border-l-primary">
                  <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Lead Organisation</h4>
                  <p className="font-bold text-[#1A3A2A]">{selectedNeed.ngoName}</p>
                  {selectedNeed.isDemo && (
                    <p className="text-sm mt-2 text-text-muted italic leading-relaxed">
                      "{selectedNeed.mission}"
                    </p>
                  )}
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Description</h4>
                <p className="text-text-primary leading-relaxed">{selectedNeed.description}</p>
                {selectedNeed.isDemo && (
                   <p className="mt-4 p-4 bg-green-50 rounded-xl text-xs text-green-700 font-medium">
                     <span className="font-bold">Estimated Impact:</span> {selectedNeed.impactSummary}
                   </p>
                )}
              </div>

              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle size={20} className="text-primary" />
                  <h4 className="font-bold text-primary">AI-Derived Insights</h4>
                </div>
                <p className="text-sm text-text-primary italic leading-relaxed">
                  {aiInsights}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-text-muted uppercase font-bold mb-1">Location</p>
                  <p className="font-semibold">{selectedNeed.location?.city}, {selectedNeed.location?.state}, {selectedNeed.location?.country}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-text-muted uppercase font-bold mb-1">Volunteers Needed</p>
                  <p className="font-semibold">{selectedNeed.volunteersNeeded}</p>
                </div>
              </div>

              {profile?.roles?.includes('Volunteer') && (
                <button 
                  onClick={() => toast.success("Interest logged! You will be contacted once the NGO validates your skills.")}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Heart size={20} />
                  Show Interest as Volunteer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Chatbot Button */}
      <button 
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50"
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Drawer */}
      {isChatOpen && (
        <ChatDrawer onClose={() => setIsChatOpen(false)} dataContext={needs} />
      )}
    </Layout>
  );
}

function ChatDrawer({ onClose, dataContext }: { onClose: () => void, dataContext: any[] }) {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: "Hello! I'm your CivicPulse assistant. How can I help you analyze this humanitarian data today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const aiResponse = await geminiService.chatWithData(userMsg, dataContext);
    setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex justify-end">
      <div className="bg-surface w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-primary text-white">
          <div className="flex items-center gap-2">
            <MessageSquare size={20} />
            <h3 className="font-bold">AI Assistant</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn(
              "max-w-[85%] p-3 rounded-2xl text-sm",
              msg.role === 'user' 
                ? "bg-primary text-white ml-auto rounded-tr-none" 
                : "bg-gray-100 text-text-primary rounded-tl-none"
            )}>
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className="bg-gray-100 text-text-primary p-3 rounded-2xl rounded-tl-none text-sm w-fit animate-pulse">
              Thinking...
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex gap-2">
          <input
            type="text"
            placeholder="Ask about the data..."
            className="flex-1 bg-background border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            type="submit"
            className="bg-primary text-white p-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
