import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { collection, query, onSnapshot, where, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { User, Check, X, Mail, Phone, MapPin, Award, MessageSquare, ShieldCheck, ChevronRight, BarChart3 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast, Toaster } from 'sonner';

const DUMMY_VOLUNTEERS = [
  {
    id: 'demo-1',
    volunteerId: 'v1',
    volunteer: {
      name: 'Sarah Chen',
      email: 'sarah.c@humanity.org',
      photoBase64: null,
      location: 'New York, USA',
      skills: ['Data Visualization', 'Python', 'Public Health'],
      reputationScore: 485,
      badges: ['Expert Analyst', 'Top Contributor', 'Verified'],
      role: 'Volunteer'
    },
    needTitle: 'Children Health Crisis - Data Mapping',
    status: 'Approved',
    progress: 75,
    isDemo: true
  },
  {
    id: 'demo-2',
    volunteerId: 'v2',
    volunteer: {
      name: 'Marcus Thorne',
      email: 'm.thorne@globalaid.net',
      photoBase64: null,
      location: 'London, UK',
      skills: ['GIS', 'Emergency Response', 'Strategy'],
      reputationScore: 320,
      badges: ['First Responder', 'Strategic Planner'],
      role: 'Volunteer'
    },
    needTitle: 'Flood Relief Coordination',
    status: 'Pending',
    progress: 0,
    isDemo: true
  },
  {
    id: 'demo-3',
    volunteerId: 'v3',
    volunteer: {
      name: 'Amara Okafor',
      email: 'amara.o@impact.io',
      photoBase64: null,
      location: 'Lagos, Nigeria',
      skills: ['Community Engagement', 'Translation', 'UI Design'],
      reputationScore: 215,
      badges: ['Bridge Builder'],
      role: 'Volunteer'
    },
    needTitle: 'Clean Water Initiative - Surveying',
    status: 'Approved',
    progress: 100,
    isDemo: true
  }
];

export default function NGOVolunteers() {
  const { user } = useAuth();
  const [interests, setInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // In a real app, we'd query expressions_of_interest where needId belongs to this NGO
    // For now, we'll fetch all and filter client-side or improve the schema
    const unsubscribe = onSnapshot(collection(db, 'expressions_of_interest'), async (snapshot) => {
      const data = [];
      for (const d of snapshot.docs) {
        const interest: any = { id: d.id, ...d.data(), isDemo: false };
        
        try {
          const needSnap = await getDoc(doc(db, 'needs', interest.needId));
          if (needSnap.exists() && needSnap.data().ngoId === user.uid) {
            const volunteerSnap = await getDoc(doc(db, 'users', interest.volunteerId));
            data.push({
              ...interest,
              needTitle: needSnap.data().title,
              volunteer: volunteerSnap.exists() ? volunteerSnap.data() : { name: 'Unknown' },
              progress: interest.status === 'Approved' ? (interest.progress || 20) : 0
            });
          }
        } catch (e) {
          console.error("Error fetching need/volunteer:", e);
        }
      }
      setInterests([...data, ...DUMMY_VOLUNTEERS]);
      setLoading(false);
    }, (error) => {
      console.error("NGO Volunteers error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleStatusUpdate = async (interestId: string, needId: string, volunteerId: string, status: 'Approved' | 'Rejected') => {
    try {
      await updateDoc(doc(db, 'expressions_of_interest', interestId), { status });
      
      if (status === 'Approved') {
        // Add volunteer to the need's assigned list
        await updateDoc(doc(db, 'needs', needId), {
          volunteersAssigned: arrayUnion(volunteerId)
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <Layout>
      <Toaster position="top-right" richColors />
      <div className="space-y-8 max-w-6xl mx-auto pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#1A6B5A] tracking-tight">My Volunteers</h1>
            <p className="text-text-muted font-medium">Manage human capital and volunteer performance</p>
          </div>
          <div className="flex -space-x-3 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-white bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                {String.fromCharCode(65 + i)}
              </div>
            ))}
            <div className="flex items-center justify-center h-10 w-10 rounded-full ring-2 ring-white bg-[#F4A026] text-white font-black text-[10px]">
              +{interests.length}
            </div>
          </div>
        </div>

        {/* Summary Stats Row */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Total Pool</p>
                <p className="text-2xl font-black text-[#1A6B5A]">{interests.length}</p>
            </div>
            <div className="bg-surface p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Active</p>
                <p className="text-2xl font-black text-green-600">{interests.filter(i => i.status === 'Approved').length}</p>
            </div>
            <div className="bg-surface p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Pending</p>
                <p className="text-2xl font-black text-amber-500">{interests.filter(i => i.status === 'Pending').length}</p>
            </div>
            <div className="bg-surface p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Impact Units</p>
                <p className="text-2xl font-black text-primary">420k</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 bg-surface rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary mb-4"></div>
            <p className="text-text-muted font-black uppercase tracking-widest text-xs">Syncing Volunteer Data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {interests.map((interest) => (
              <div 
                key={interest.id} 
                className={cn(
                  "bg-surface rounded-[2rem] border border-gray-100 shadow-sm p-8 flex flex-col xl:flex-row xl:items-center justify-between gap-8 group transition-all hover:shadow-xl hover:border-primary/20",
                  interest.isDemo && "opacity-90"
                )}
              >
                <div className="flex flex-col md:flex-row items-center gap-6 flex-1">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center text-primary text-3xl font-black border-4 border-white shadow-lg overflow-hidden group-hover:scale-105 transition-transform">
                      {interest.volunteer.photoBase64 || interest.volunteer.photoUrl ? (
                         <img src={interest.volunteer.photoBase64 || interest.volunteer.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                         interest.volunteer.name?.[0]?.toUpperCase()
                      )}
                    </div>
                    {interest.volunteer.badges?.includes('Verified') && (
                      <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1.5 rounded-full shadow-md border-2 border-white">
                        <ShieldCheck size={14} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-2 mb-2">
                       <h3 className="font-black text-xl text-primary">{interest.volunteer.name}</h3>
                       {interest.isDemo && (
                         <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black uppercase rounded-md tracking-widest">Demo</span>
                       )}
                    </div>
                    <p className="text-sm font-bold text-text-muted mb-4">
                      Assigned: <span className="text-primary">{interest.needTitle}</span>
                    </p>
                    
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <MapPin size={14} className="text-primary" />
                        {interest.volunteer.location}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <Award size={14} className="text-[#F4A026]" />
                        Repl: <span className="font-black text-primary">{interest.volunteer.reputationScore}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      {interest.volunteer.skills?.slice(0, 3).map((skill: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-gray-100 text-text-muted text-[10px] font-bold rounded-lg uppercase tracking-wider">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 xl:w-1/3">
                   {interest.status === 'Approved' && (
                     <div className="w-full space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-text-muted">
                           <span>Task Progress</span>
                           <span className="text-primary">{interest.progress || 0}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-[#1A6B5A] rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(26,107,90,0.3)]"
                             style={{ width: `${interest.progress || 0}%` }}
                           />
                        </div>
                     </div>
                   )}

                   <div className="flex items-center gap-3 w-full md:w-auto">
                      {interest.status === 'Pending' ? (
                        <div className="flex gap-2 w-full">
                           <button 
                             onClick={() => interest.isDemo ? toast.error("Demo volunteer cannot be approved") : handleStatusUpdate(interest.id, interest.needId, interest.volunteerId, 'Approved')}
                             className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#1A6B5A] text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 shadow-lg shadow-primary/20 transition-all"
                           >
                             <Check size={18} />
                             Approve
                           </button>
                           <button 
                             onClick={() => interest.isDemo ? toast.error("Demo volunteer cannot be rejected") : handleStatusUpdate(interest.id, interest.needId, interest.volunteerId, 'Rejected')}
                             className="p-3 bg-gray-100 text-text-muted rounded-2xl hover:bg-gray-200 transition-colors"
                           >
                             <X size={18} />
                           </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 w-full">
                           <div className={cn(
                             "flex-1 md:flex-none px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-center",
                             interest.status === 'Approved' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                           )}>
                             {interest.status}
                           </div>
                           {interest.status === 'Approved' && (
                             <button
                               onClick={() => interest.isDemo ? toast.success("Certificate issued! (Demo mode)") : toast.error("Verification pending for real user")}
                               className="px-6 py-3 bg-white border-2 border-primary text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center gap-2"
                             >
                               <Award size={16} />
                               Issue
                             </button>
                           )}
                        </div>
                      )}
                   </div>
                </div>
              </div>
            ))}

            {interests.length === 0 && (
              <div className="text-center py-24 bg-surface rounded-[2.5rem] border-2 border-dashed border-gray-100">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <User size={32} className="text-gray-300" />
                </div>
                <p className="text-text-muted font-black uppercase tracking-widest text-xs">No volunteer activity recorded yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
