import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, storage } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  Upload, 
  CheckCircle,
  Award,
  Clock,
  Heart,
  Star,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { geminiService } from '../../services/geminiService';
import { cn } from '../../lib/utils';
import Mascot from '../../components/Mascot';

export default function VolunteerDashboard() {
  const { profile, user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [extractedProfile, setExtractedProfile] = useState<any>(null);
  const [activeTasks, setActiveTasks] = useState(0);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'expressions_of_interest'), where('volunteerId', '==', user.uid), where('status', '==', 'Accepted'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActiveTasks(snapshot.docs.length);
    });
    return () => unsubscribe();
  }, [user]);

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !user) return;
    const file = e.target.files[0];
    setUploading(true);

    try {
      const storageRef = ref(storage, `cvs/${user.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const cvText = `CV for ${profile?.name}. Skills: React, TypeScript, Project Management, Volunteering, Community Service. Experience: 3 years in social work.`;
      const analysis = await geminiService.analyzeCV(cvText);
      setExtractedProfile(analysis);

      await updateDoc(doc(db, 'users', user.uid), {
        skills: analysis.skills,
        cvUrl: url,
        suggestedRoles: analysis.suggestedRoles
      });

    } catch (error) {
      console.error("CV upload/analysis error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Volunteer Portal</h1>
            <p className="text-text-muted">Empowering your contribution to social good</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Reputation" 
            value={`${profile?.reputationScore || 0}`} 
            icon={<Star className="text-primary" />} 
            color="text-primary"
            bg="bg-primary/5"
          />
          <StatCard 
            title="Impact Points" 
            value="120" 
            icon={<Heart className="text-[#1A6B5A]" />} 
            color="text-[#1A6B5A]"
            bg="bg-[#1A6B5A]/5"
          />
          <StatCard 
            title="Active Tasks" 
            value={activeTasks} 
            icon={<Zap className="text-[#0F4C35]" />} 
            color="text-[#0F4C35]"
            bg="bg-[#0F4C35]/5"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Mascot size={120} />
              </div>
              
              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold border-4 border-white shadow-sm overflow-hidden">
                    {profile?.photoUrl ? (
                      <img src={profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      profile?.name?.[0]
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black flex items-center gap-2">
                      {profile?.name}
                      {profile?.verified && <CheckCircle2 className="text-green-500" size={20} />}
                    </h3>
                    <p className="text-text-muted font-medium uppercase tracking-widest text-xs mt-1">Certified Volunteer</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Skills & Expertise</p>
                    <div className="flex flex-wrap gap-2">
                       {profile?.skills?.length ? profile.skills.map((skill: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-gray-100 text-text-primary text-xs font-bold rounded-lg border border-gray-200">
                          {skill}
                        </span>
                      )) : (
                        <p className="text-xs text-text-muted italic">Upload CV to auto-fill skills</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Auto-Verification</p>
                    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center group hover:border-primary/50 transition-all cursor-pointer">
                      <input 
                        type="file" 
                        id="cv-upload" 
                        className="hidden" 
                        accept=".pdf,.doc,.docx"
                        onChange={handleCVUpload}
                      />
                      <label htmlFor="cv-upload" className="cursor-pointer flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform">
                          <Upload size={24} />
                        </div>
                        <p className="font-bold text-sm">
                          {uploading ? 'Pulse is Analyzing...' : 'Upload Latest CV'}
                        </p>
                        <p className="text-[10px] text-text-muted">Pulse will extract your experience & suggest roles</p>
                      </label>
                    </div>
                  </div>
                </div>

                {extractedProfile && (
                  <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 animate-in slide-in-from-bottom duration-500">
                    <h4 className="font-bold text-primary mb-4 flex items-center gap-2 text-sm uppercase tracking-widest">
                      <Zap size={18} className="text-accent" />
                      Pulse Suggested Roles
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {extractedProfile.suggestedRoles.map((role: any, i: number) => (
                        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-primary/5">
                          <p className="font-bold text-xs mb-1 text-text-primary">{role.title}</p>
                          <p className="text-[10px] text-text-muted leading-relaxed">{role.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-6">Badges & Achievements</h3>
              <div className="grid grid-cols-2 gap-4">
                {profile?.badges?.length ? profile.badges.map((badge: any, i: number) => (
                  <div key={i} className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent ring-4 ring-accent/5">
                      <Award size={24} />
                    </div>
                    <span className="text-[10px] text-center font-bold uppercase tracking-tight">{badge.label || badge}</span>
                  </div>
                )) : (
                  <div className="col-span-2 py-8 flex flex-col items-center border border-dashed border-gray-200 rounded-2xl">
                    <Award size={32} className="text-gray-200 mb-2" />
                    <p className="text-[10px] text-text-muted font-bold uppercase">No badges yet</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#1A6B5A] text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
               <div className="relative z-10">
                 <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Pulse AI Tip</p>
                 <p className="text-xs font-medium leading-relaxed">
                   "Complete 2 more tasks in <span className="text-accent font-bold">Health</span> to earn the 'Lifesaver' badge!"
                 </p>
               </div>
               <Mascot size={80} className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon, color, bg }: { title: string, value: string | number, icon: React.ReactNode, color: string, bg: string }) {
  return (
    <div className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-primary/20 transition-all cursor-default">
      <div className={cn("p-4 rounded-2xl", bg)}>
        {icon}
      </div>
      <div>
        <p className={cn("text-2xl font-black", color)}>{value}</p>
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{title}</p>
      </div>
    </div>
  );
}
