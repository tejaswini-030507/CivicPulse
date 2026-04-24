import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { 
  User, 
  MapPin, 
  Phone, 
  Globe, 
  BookOpen, 
  Linkedin, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  Save, 
  X,
  Building2,
  Award,
  Star,
  Camera,
  Calendar,
  ShieldCheck,
  TrendingUp,
  Mail,
  Zap,
  BarChart3,
  Briefcase
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast, Toaster } from 'sonner';

export default function ProfilePage() {
  const { profile, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  useEffect(() => {
    async function fetchStats() {
      if (!user || !profile) return;
      
      try {
        if (profile.role === 'NGO' || profile.roles?.includes('NGO')) {
          const needsRef = collection(db, 'needs');
          const q = query(needsRef, where('ngoId', '==', user.uid));
          const snap = await getDocs(q);
          const needsPosted = snap.size;
          const assignedVolunteers = snap.docs.reduce((acc, d) => acc + (d.data().assignedVolunteerIds?.length || 0), 0);
          const fulfilled = snap.docs.filter(d => d.data().status === 'completed').length;
          
          const certsRef = collection(db, 'certificates');
          const certsQ = query(certsRef, where('ngoId', '==', user.uid));
          const certsSnap = await getDocs(certsQ);
          
          setStats({
            'Needs Posted': needsPosted,
            'Volunteers Assigned': assignedVolunteers,
            'Needs Fulfilled': fulfilled,
            'Certificates Issued': certsSnap.size
          });
        }
        else if (profile.role === 'Volunteer' || profile.roles?.includes('Volunteer')) {
          const interestsRef = collection(db, 'expressions_of_interest');
          const intQ = query(interestsRef, where('volunteerId', '==', user.uid));
          const intSnap = await getDocs(intQ);
          
          setStats({
            'Tasks Completed': profile.tasksCompleted || 4,
            'Badges Earned': profile.badges?.length || 0,
            'Reputation Score': profile.reputationScore || 0,
            'Interests Submitted': intSnap.size
          });
        }
        else if (profile.role === 'Researcher' || profile.roles?.includes('Researcher')) {
          const dsRef = collection(db, 'datasets');
          const q = query(dsRef, where('uploaderId', '==', user.uid));
          const snap = await getDocs(q);
          
          setStats({
            'Datasets Uploaded': snap.size,
            'Analyses Run': profile.analysesRun || 12,
            'Public Datasets': snap.docs.filter(d => d.data().visibility === 'public').length,
            'Citations': profile.citations || 0
          });
        }
      } catch (err) {
        console.error("Stats fetch error:", err);
      }
    }
    fetchStats();
  }, [user, profile]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 200 * 1024) {
      toast.error("File size must be under 200KB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          photoBase64: base64
        });
        toast.success("Profile picture updated!");
      } catch (err) {
        toast.error("Failed to upload photo");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Prevent editing sensitive fields
      const { email, role, roles, uid, verified, createdAt, ...editableData } = formData;
      await updateDoc(doc(db, 'users', user.uid), editableData);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      toast.error("Failed to update profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = () => {
    if (profile?.verified) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200">
          <ShieldCheck size={14} />
          Verified Account
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200">
        <Clock size={14} />
        Pending Verification
      </div>
    );
  };

  const renderRoleSpecificFields = () => {
    switch (profile.role) {
      case 'NGO':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Focus Area</label>
                {isEditing ? (
                  <select 
                    className="w-full bg-gray-50 border-gray-200 border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none" 
                    value={formData.focusArea || ''} 
                    onChange={e => setFormData({...formData, focusArea: e.target.value})}
                  >
                    <option value="Health">Health</option>
                    <option value="Education">Education</option>
                    <option value="Disaster Relief">Disaster Relief</option>
                    <option value="Environment">Environment</option>
                  </select>
                ) : <p className="font-bold text-primary">{profile.focusArea || 'General Social Work'}</p>}
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Registration ID</label>
                {isEditing ? (
                  <input className="w-full bg-gray-50 border-gray-200 border rounded-xl px-4 py-2 text-sm" value={formData.regNumber || ''} onChange={e => setFormData({...formData, regNumber: e.target.value})} />
                ) : <p className="font-bold">{profile.regNumber}</p>}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Mission Statement</label>
              {isEditing ? (
                <textarea className="w-full bg-gray-50 border-gray-200 border rounded-xl px-4 py-2 text-sm h-32 resize-none" value={formData.mission || ''} onChange={e => setFormData({...formData, mission: e.target.value})} />
              ) : <p className="text-sm leading-relaxed text-text-primary italic">"{profile.mission || 'To empower communities through sustainable development and humanitarian aid.'}"</p>}
            </div>
          </>
        );
      case 'Volunteer':
        return (
          <>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Personal Bio</label>
                {isEditing ? (
                  <textarea className="w-full bg-gray-50 border-gray-200 border rounded-xl px-4 py-2 text-sm h-32 resize-none" value={formData.bio || ''} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Tell us about yourself..." />
                ) : <p className="text-sm leading-relaxed">{profile.bio || 'Dedicated volunteer looking to make a meaningful difference.'}</p>}
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-1">Key Skills</label>
                <div className="flex flex-wrap gap-2 mt-2">
                   {profile.skills?.length > 0 ? profile.skills.map((skill: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-[#1A6B5A]/10 text-[#1A6B5A] text-[10px] font-bold rounded-lg uppercase">
                      {skill}
                    </span>
                  )) : <p className="text-xs text-text-muted italic">No skills listed</p>}
                </div>
              </div>
            </div>
          </>
        );
      case 'Researcher':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Academic Institution</label>
                {isEditing ? (
                  <input className="w-full bg-gray-50 border-gray-200 border rounded-xl px-4 py-2 text-sm" value={formData.institution || ''} onChange={e => setFormData({...formData, institution: e.target.value})} />
                ) : <p className="font-bold text-[#F4A026]">{profile.institution || 'Unknown Institution'}</p>}
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Subject Matter Expertise</label>
                {isEditing ? (
                  <input className="w-full bg-gray-50 border-gray-200 border rounded-xl px-4 py-2 text-sm" value={formData.fieldOfResearch || ''} onChange={e => setFormData({...formData, fieldOfResearch: e.target.value})} />
                ) : <p className="font-bold">{profile.fieldOfResearch || 'Humanitarian Data Analysis'}</p>}
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  if (!profile) return null;

  return (
    <Layout>
      <Toaster position="top-right" richColors />
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        {/* Top Banner / Hero */}
        <div className="bg-[#1A6B5A] h-48 rounded-[2.5rem] relative overflow-hidden shadow-xl">
           <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="grid grid-cols-8 gap-4 p-8">
                 {[...Array(64)].map((_, i) => <div key={i} className="w-1 h-1 bg-white rounded-full" />)}
              </div>
           </div>
           <div className="absolute right-[-100px] top-[-100px] w-[300px] h-[300px] bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Profile Card Overlay */}
        <div className="relative -mt-24 px-4 md:px-12">
          <div className="bg-surface p-8 rounded-[2rem] border border-gray-100 shadow-xl flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              <div className="relative group">
                <div className="w-40 h-40 rounded-full bg-white p-2 shadow-2xl border-4 border-[#1A6B5A]/10 relative z-10 overflow-hidden">
                  {profile.photoBase64 || profile.logoUrl || profile.photoUrl ? (
                    <img src={profile.photoBase64 || profile.logoUrl || profile.photoUrl} alt="Logo" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full bg-[#1A6B5A]/5 rounded-full flex items-center justify-center text-[#1A6B5A] text-5xl font-black">
                      {profile.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <label className="absolute bottom-2 right-2 w-10 h-10 bg-[#1A6B5A] text-white rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg z-20 overflow-hidden">
                  <Camera size={20} />
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                </label>
              </div>

              <div className="text-center md:text-left mb-2">
                 <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                    <h1 className="text-3xl font-black text-[#1A6B5A] tracking-tight">{profile.name}</h1>
                    {renderStatusBadge()}
                 </div>
                 <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm text-text-muted">
                    <span className="flex items-center gap-1.5 font-bold text-[#F4A026]"><Briefcase size={14} /> {profile.role || profile.roles?.[0]}</span>
                    {profile.city && <span className="flex items-center gap-1.5"><MapPin size={14} /> {profile.city}, {profile.country}</span>}
                    <span className="flex items-center gap-1.5"><Calendar size={14} /> Member since {profile.createdAt?.toDate?.()?.getFullYear() || (typeof profile.createdAt === 'string' ? new Date(profile.createdAt).getFullYear() : '2024')}</span>
                 </div>
              </div>
            </div>

            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={loading}
              className={cn(
                "flex items-center gap-2 px-8 py-3.5 rounded-[1.25rem] font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95 mb-2",
                isEditing ? "bg-green-600 text-white hover:bg-green-700 shadow-green-200" : "bg-[#1A6B5A] text-white hover:opacity-90 shadow-primary/20"
              )}
            >
              {loading ? <Clock className="animate-spin" size={16} /> : isEditing ? <Save size={16} /> : <Edit3 size={16} />}
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Content Tabs/Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 md:px-12">
          {/* Left Column: Personal Info & Stats */}
          <div className="lg:col-span-4 space-y-8">
            {/* Stats Card */}
            {stats && (
              <div className="bg-surface p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 font-black text-6xl text-primary/5 pointer-events-none select-none">STATS</div>
                <h3 className="text-[10px] font-black text-[#F4A026] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                   <TrendingUp size={14} /> Activity Metrics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                   {Object.entries(stats).map(([label, value]) => (
                     <div key={label} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 hover:border-primary/20 transition-colors">
                        <p className="text-[20px] font-black text-primary mb-1">{value}</p>
                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">{label}</p>
                     </div>
                   ))}
                </div>
              </div>
            )}

            {/* Personal Details */}
            <div className="bg-surface p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <h3 className="text-[10px] font-black text-[#1A6B5A] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                   <Mail size={14} /> Contact Details
                </h3>
                <div className="space-y-5">
                   <div className="group">
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1">Official Email</label>
                      <p className="text-sm font-bold text-primary truncate">{profile.email}</p>
                   </div>
                   <div className="group">
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1">Phone Number</label>
                      {isEditing ? (
                        <input 
                          className="w-full bg-gray-50 border-gray-200 border rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" 
                          value={formData.phoneNumber || ''} 
                          onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
                        />
                      ) : <p className="text-sm font-bold">{profile.phoneNumber || 'Not provided'}</p>}
                   </div>
                   <div className="group">
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1">Location</label>
                      {isEditing ? (
                        <div className="flex gap-2">
                           <input className="bg-gray-50 border-gray-200 border rounded-xl px-2 py-1.5 text-xs w-1/2" placeholder="City" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} />
                           <input className="bg-gray-50 border-gray-200 border rounded-xl px-2 py-1.5 text-xs w-1/2" placeholder="Country" value={formData.country || ''} onChange={e => setFormData({...formData, country: e.target.value})} />
                        </div>
                      ) : <p className="text-sm font-bold">{profile.city || 'N/A'}, {profile.country || 'N/A'}</p>}
                   </div>
                </div>
            </div>
          </div>

          {/* Right Column: Identity Card */}
          <div className="lg:col-span-8 space-y-8">
             <div className="bg-surface p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden min-h-[400px]">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                   {(profile.role === 'NGO' || profile.roles?.includes('NGO')) ? <Building2 size={240} /> : (profile.role === 'Volunteer' || profile.roles?.includes('Volunteer')) ? <Zap size={240} /> : <BarChart3 size={240} />}
                </div>

                <h3 className="text-[10px] font-black text-[#1A6B5A] uppercase tracking-[0.5em] mb-12 flex items-center gap-3">
                   <div className="w-2 h-2 bg-[#F4A026] rounded-full shadow-[0_0_10px_#F4A026]" />
                   Professional Identity
                </h3>

                <div className="space-y-10 relative z-10">
                   {renderRoleSpecificFields()}
                </div>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
