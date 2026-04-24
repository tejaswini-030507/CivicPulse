import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import Layout from '../../components/Layout';
import { toast } from 'sonner';

const DUMMY_NEEDS = [
  {
    id: 'dummy_need_1',
    title: 'Emergency Medical Volunteers — Kerala Flood Relief',
    category: 'health',
    description: 'Urgent need for trained medical volunteers in Wayanad and Idukki districts. Tasks include triage, wound care, and health monitoring.',
    location: { city: 'Wayanad', state: 'Kerala', country: 'India', lat: 11.6854, lng: 76.1320 },
    urgency: 'critical',
    volunteersNeeded: 25,
    volunteersCount: 1,
    skillsRequired: ['Medical', 'First Aid', 'CPR'],
    deadline: '2026-04-27',
    remote: false,
    status: 'open',
    ngoName: 'HopeReach Foundation',
    createdAt: '2026-04-18',
    aiInsights: 'Critical medical need. Immediate deployment required within 48 hours.',
    isDemo: true
  },
  {
    id: 'dummy_need_2',
    title: 'Online Tutors for Rural Children — Tamil Nadu',
    category: 'education',
    description: 'Volunteer online tutors needed for grades 6–10 across rural Tamil Nadu. Subjects: Maths, Science, English. 2 hours/week via Google Meet.',
    location: { city: 'Villupuram', state: 'Tamil Nadu', country: 'India', lat: 11.9401, lng: 79.4861 },
    urgency: 'moderate',
    volunteersNeeded: 20,
    volunteersCount: 2,
    skillsRequired: ['Teaching', 'Mentoring', 'English'],
    deadline: '2026-05-15',
    remote: true,
    status: 'open',
    ngoName: 'EduBridge India',
    createdAt: '2026-04-15',
    aiInsights: 'Remote education initiative with high long-term community impact.',
    isDemo: true
  },
  {
    id: 'dummy_need_3',
    title: 'Food Ration Distribution — Kibera Nairobi',
    category: 'food',
    description: 'Pack and distribute food rations to 600 families in Kibera. Physical 6-hour shifts. Food sourced from WFP partner warehouses.',
    location: { city: 'Nairobi', state: 'Nairobi County', country: 'Kenya', lat: -1.3132, lng: 36.7965 },
    urgency: 'high',
    volunteersNeeded: 30,
    volunteersCount: 1,
    skillsRequired: ['Logistics', 'Community Outreach'],
    deadline: '2026-04-30',
    remote: false,
    status: 'open',
    ngoName: 'GlobalAid Network',
    createdAt: '2026-04-14',
    aiInsights: 'High urgency food distribution. Significant volunteer shortfall.',
    isDemo: true
  },
  {
    id: 'dummy_need_4',
    title: 'Mental Health Counsellors — Lagos Refugee Camp',
    category: 'health',
    description: 'Provide psychosocial support to 400+ refugees at Camp Delta Lagos. In-person confidential sessions. Arabic or French preferred.',
    location: { city: 'Lagos', state: 'Lagos State', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
    urgency: 'high',
    volunteersNeeded: 8,
    volunteersCount: 1,
    skillsRequired: ['Counselling', 'Mental Health'],
    deadline: '2026-05-01',
    remote: false,
    status: 'open',
    ngoName: 'GlobalAid Network',
    createdAt: '2026-04-13',
    aiInsights: 'Mental health gap in refugee populations critically underserved.',
    isDemo: true
  },
  {
    id: 'dummy_need_5',
    title: 'Shelter Reconstruction — Post Cyclone Odisha',
    category: 'shelter',
    description: 'Construction and carpentry volunteers needed to rebuild homes in Puri and Jagatsinghpur districts after Cyclone Dana.',
    location: { city: 'Puri', state: 'Odisha', country: 'India', lat: 19.8135, lng: 85.8312 },
    urgency: 'critical',
    volunteersNeeded: 40,
    volunteersCount: 0,
    skillsRequired: ['Construction', 'Carpentry'],
    deadline: '2026-04-28',
    remote: false,
    status: 'open',
    ngoName: 'HopeReach Foundation',
    createdAt: '2026-04-16',
    aiInsights: 'Zero volunteers assigned to a critical shelter need.',
    isDemo: true
  },
  {
    id: 'dummy_need_6',
    title: 'IT Support — Digital Literacy Bangalore',
    category: 'education',
    description: 'Teach basic computer skills and internet safety to elderly and unemployed adults in Bangalore. Can be done remotely via Zoom.',
    location: { city: 'Bangalore', state: 'Karnataka', country: 'India', lat: 12.9716, lng: 77.5946 },
    urgency: 'moderate',
    volunteersNeeded: 15,
    volunteersCount: 1,
    skillsRequired: ['IT Support', 'Teaching'],
    deadline: '2026-05-20',
    remote: true,
    status: 'open',
    ngoName: 'EduBridge India',
    createdAt: '2026-04-12',
    aiInsights: 'Remote delivery expands volunteer pool significantly.',
    isDemo: true
  },
  {
    id: 'dummy_need_7',
    title: 'Legal Aid Volunteers — Migrant Workers Chennai',
    category: 'health',
    description: 'Lawyers and legal volunteers needed to assist migrant workers with documentation and wage dispute resolution in Chennai.',
    location: { city: 'Chennai', state: 'Tamil Nadu', country: 'India', lat: 13.0827, lng: 80.2707 },
    urgency: 'high',
    volunteersNeeded: 10,
    volunteersCount: 0,
    skillsRequired: ['Legal Aid', 'Community Outreach'],
    deadline: '2026-05-05',
    remote: false,
    status: 'open',
    ngoName: 'HopeReach Foundation',
    createdAt: '2026-04-17',
    aiInsights: 'Legal vulnerability among migrant workers is high.',
    isDemo: true
  },
  {
    id: 'dummy_need_8',
    title: 'Mangrove Restoration — Tamil Nadu Coast',
    category: 'environment',
    description: 'Field surveys and mangrove sapling planting along Cuddalore and Nagapattinam coastline. Basic training provided on site.',
    location: { city: 'Cuddalore', state: 'Tamil Nadu', country: 'India', lat: 11.7447, lng: 79.7689 },
    urgency: 'low',
    volunteersNeeded: 12,
    volunteersCount: 0,
    skillsRequired: ['Environmental Science', 'Field Survey'],
    deadline: '2026-06-01',
    remote: false,
    status: 'open',
    ngoName: 'EduBridge India',
    createdAt: '2026-04-10',
    aiInsights: 'Long-term ecological restoration. High sustainability value.',
    isDemo: true
  }
];

const urgencyColors: Record<string, any> = {
  critical: { bg: '#FEE2E2', text: '#DC2626', dot: '#E03E3E' },
  high: { bg: '#FEF3C7', text: '#D97706', dot: '#F97316' },
  moderate: { bg: '#FFF9C4', text: '#B45309', dot: '#FACC15' },
  low: { bg: '#D1FAE5', text: '#065F46', dot: '#22C55E' }
};

const categoryIcons: Record<string, string> = {
  health: '🏥', education: '📚', food: '🍱',
  shelter: '🏠', environment: '🌿', disaster: '🚨'
};

export default function ExploreOpportunities() {
  const [needs, setNeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNeed, setSelectedNeed] = useState<any>(null);
  const [interestLoading, setInterestLoading] = useState(false);
  
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [filterRemote, setFilterRemote] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'needs'),
      where('status', '==', 'open')
    );
    const unsub = onSnapshot(q,
      (snap) => {
        const real = snap.docs.map(d => ({ id: d.id, ...d.data(), isDemo: false }));
        setNeeds([...real, ...DUMMY_NEEDS]);
        setLoading(false);
      },
      (err) => {
        console.error('Needs fetch error:', err);
        setNeeds(DUMMY_NEEDS);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filtered = needs.filter(n => {
    const matchCategory = filterCategory === 'all' || n.category?.toLowerCase() === filterCategory;
    const matchUrgency = filterUrgency === 'all' || n.urgency?.toLowerCase() === filterUrgency;
    const matchRemote = filterRemote === 'all' || (filterRemote === 'remote' ? n.remote : !n.remote);
    const matchSearch = !searchQuery ||
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.ngoName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.location?.city?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchUrgency && matchRemote && matchSearch;
  });

  const handleShowInterest = async (need: any) => {
    if (!auth.currentUser) {
      toast.error('Please log in first');
      return;
    }

    if (need.isDemo) {
      toast.success('Interest noted! (Demo need — not saved to database)');
      setSelectedNeed(null);
      return;
    }

    setInterestLoading(true);

    try {
      // Check if already expressed interest
      const existing = query(
        collection(db, 'expressions_of_interest'),
        where('volunteerId', '==', auth.currentUser.uid),
        where('needId', '==', need.id)
      );
      const existingSnap = await getDocs(existing);

      if (!existingSnap.empty) {
        toast.error('You have already expressed interest in this opportunity');
        setInterestLoading(false);
        return;
      }

      // Save to Firestore
      await addDoc(collection(db, 'expressions_of_interest'), {
        volunteerId: auth.currentUser.uid,
        volunteerName: auth.currentUser.displayName || auth.currentUser.email || 'Volunteer',
        needId: need.id,
        needTitle: need.title || '',
        ngoId: need.ngoId || need.uploadedBy || '',
        ngoName: need.ngoName || '',
        timestamp: serverTimestamp(),
        status: 'pending',
        taskProgress: 'not_started'
      });

      toast.success('Interest submitted! The NGO will review your profile.');
      setSelectedNeed(null);

    } catch (err: any) {
      console.error('Show interest error:', err.code, err.message);
      toast.error('Failed to submit interest: ' + err.message);
    } finally {
      setInterestLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1C1C1E', marginBottom: '4px' }}>
          Explore Opportunities
        </h2>
        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '20px' }}>
          Find volunteering opportunities that match your skills
        </p>

        {/* Search bar */}
        <input
          type="text"
          placeholder="Search by title, NGO, location..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '11px 16px', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '14px', marginBottom: '14px', boxSizing: 'border-box' }}
        />

        {/* Filters row */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', background: 'white', cursor: 'pointer' }}>
            <option value="all">All Categories</option>
            <option value="health">Health</option>
            <option value="education">Education</option>
            <option value="food">Food Security</option>
            <option value="shelter">Shelter</option>
            <option value="environment">Environment</option>
            <option value="disaster">Disaster Relief</option>
          </select>
          <select value={filterUrgency} onChange={e => setFilterUrgency(e.target.value)}
            style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', background: 'white', cursor: 'pointer' }}>
            <option value="all">All Urgency</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="moderate">Moderate</option>
            <option value="low">Low</option>
          </select>
          <select value={filterRemote} onChange={e => setFilterRemote(e.target.value)}
            style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', background: 'white', cursor: 'pointer' }}>
            <option value="all">On-site & Remote</option>
            <option value="remote">Remote Only</option>
            <option value="onsite">On-site Only</option>
          </select>
          <span style={{ fontSize: '13px', color: '#6B7280', alignSelf: 'center' }}>
            {filtered.length} opportunities found
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
            <div style={{ width: '36px', height: '36px', border: '4px solid #E2E8F0', borderTop: '4px solid #1A6B5A', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p>Loading opportunities...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Cards grid */}
        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {filtered.map(need => {
              const urg = urgencyColors[need.urgency?.toLowerCase()] || urgencyColors.low;
              return (
                <div
                  key={need.id}
                  onClick={() => setSelectedNeed(need)}
                  style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', cursor: 'pointer', border: '1px solid #F0F0F0', transition: 'transform 0.15s, box-shadow 0.15s' }}
                  className="hover-card"
                >
                  <style>{`
                    .hover-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.12) !important; }
                  `}</style>
                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{categoryIcons[need.category?.toLowerCase()] || '📋'}</span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {need.isDemo && (
                        <span style={{ fontSize: '10px', fontWeight: '600', background: '#FEF3C7', color: '#D97706', padding: '2px 7px', borderRadius: '20px' }}>Demo</span>
                      )}
                      <span style={{ fontSize: '11px', fontWeight: '600', background: urg.bg, color: urg.text, padding: '3px 8px', borderRadius: '20px' }}>
                        {need.urgency?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1C1C1E', marginBottom: '6px', lineHeight: '1.3' }}>
                    {need.title}
                  </h3>

                  {/* NGO + Location */}
                  <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                    🏢 {need.ngoName}
                  </p>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '10px' }}>
                    📍 {need.location?.city}, {need.location?.country}
                  </p>

                  {/* Description */}
                  <p style={{ fontSize: '13px', color: '#374151', marginBottom: '12px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.4' }}>
                    {need.description}
                  </p>

                  {/* Skills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
                    {(need.skillsRequired || []).slice(0, 3).map((skill: string) => (
                      <span key={skill} style={{ fontSize: '11px', background: '#E8F5F0', color: '#1A6B5A', padding: '3px 8px', borderRadius: '20px' }}>
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F3F4F6', paddingTop: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>
                      👥 {need.volunteersCount || 0}/{need.volunteersNeeded} volunteers
                    </span>
                    <span style={{ fontSize: '11px', background: need.remote ? '#EDE9FE' : '#F3F4F6', color: need.remote ? '#7C3AED' : '#6B7280', padding: '3px 8px', borderRadius: '20px', fontWeight: '500' }}>
                      {need.remote ? '🌐 Remote' : '📍 On-site'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
            <p style={{ fontSize: '16px', fontWeight: '500' }}>No opportunities found</p>
            <p style={{ fontSize: '13px' }}>Try changing your filters</p>
          </div>
        )}

        {/* Detail modal */}
        {selectedNeed && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={() => setSelectedNeed(null)}
          >
            <div
              style={{ background: 'white', borderRadius: '20px', padding: '28px', maxWidth: '560px', width: '100%', maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1C1C1E', lineHeight: '1.3', flex: 1, marginRight: '12px' }}>
                  {selectedNeed.title}
                </h2>
                <button onClick={() => setSelectedNeed(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6B7280', flexShrink: 0 }}>✕</button>
              </div>

              {/* Urgency + category */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', background: urgencyColors[selectedNeed.urgency?.toLowerCase()]?.bg, color: urgencyColors[selectedNeed.urgency?.toLowerCase()]?.text, padding: '4px 10px', borderRadius: '20px' }}>
                  {selectedNeed.urgency?.toUpperCase()}
                </span>
                <span style={{ fontSize: '12px', background: '#E8F5F0', color: '#1A6B5A', padding: '4px 10px', borderRadius: '20px' }}>
                  {categoryIcons[selectedNeed.category?.toLowerCase()]} {selectedNeed.category}
                </span>
                <span style={{ fontSize: '12px', background: selectedNeed.remote ? '#EDE9FE' : '#F3F4F6', color: selectedNeed.remote ? '#7C3AED' : '#6B7280', padding: '4px 10px', borderRadius: '20px' }}>
                  {selectedNeed.remote ? '🌐 Remote' : '📍 On-site'}
                </span>
                {selectedNeed.isDemo && (
                  <span style={{ fontSize: '12px', background: '#FEF3C7', color: '#D97706', padding: '4px 10px', borderRadius: '20px' }}>Demo</span>
                )}
              </div>

              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>🏢 {selectedNeed.ngoName}</p>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '14px' }}>📍 {selectedNeed.location?.city}, {selectedNeed.location?.state}, {selectedNeed.location?.country}</p>

              <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', marginBottom: '16px' }}>{selectedNeed.description}</p>

              {/* Skills */}
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#1A6B5A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Skills Required</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                {(selectedNeed.skillsRequired || []).map((s: string) => (
                  <span key={s} style={{ fontSize: '12px', background: '#E8F5F0', color: '#1A6B5A', padding: '4px 10px', borderRadius: '20px' }}>{s}</span>
                ))}
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: '#F7F8FA', borderRadius: '10px', padding: '12px' }}>
                  <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>Volunteers</p>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: '#1C1C1E' }}>{selectedNeed.volunteersCount || 0} / {selectedNeed.volunteersNeeded}</p>
                </div>
                <div style={{ background: '#F7F8FA', borderRadius: '10px', padding: '12px' }}>
                  <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>Deadline</p>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#1C1C1E' }}>{selectedNeed.deadline || 'Open'}</p>
                </div>
              </div>

              {/* AI Insights */}
              {selectedNeed.aiInsights && (
                <div style={{ borderLeft: '3px solid #1A6B5A', background: '#F0FDF4', borderRadius: '0 10px 10px 0', padding: '12px 14px', marginBottom: '20px' }}>
                  <p style={{ fontSize: '11px', fontWeight: '600', color: '#1A6B5A', marginBottom: '4px' }}>✦ AI INSIGHTS</p>
                  <p style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>{selectedNeed.aiInsights}</p>
                </div>
              )}

              {/* Show Interest button */}
              <button
                onClick={() => handleShowInterest(selectedNeed)}
                disabled={interestLoading}
                style={{ width: '100%', background: interestLoading ? '#9CA3AF' : '#1A6B5A', color: 'white', padding: '14px', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: interestLoading ? 'not-allowed' : 'pointer' }}
              >
                {interestLoading ? 'Submitting...' : '✋ Show Interest'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
