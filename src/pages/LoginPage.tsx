import React, { useState, useEffect, useRef } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Loader2, 
  Camera, 
  CheckCircle2, 
  ChevronRight,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import CivicPulseLogo from '../components/CivicPulseLogo';
import Mascot from '../components/Mascot';
import { toast, Toaster } from 'sonner';

const SKILLS_OPTIONS = ["Medical", "First Aid", "CPR", "Teaching", "Mentoring", "Curriculum Design", "Logistics", "Supply Chain", "Construction", "Carpentry", "Counselling", "Mental Health", "Community Outreach", "Data Collection", "Field Survey", "Environmental Science", "Disaster Relief", "Legal Aid", "IT Support", "Language Translation", "Photography", "Social Media", "Fundraising", "Cooking", "Driving", "Others"];

const NGO_FOCUS_AREAS = ["Health", "Education", "Disaster Relief", "Food Security", "Shelter", "Environment", "Women Empowerment", "Child Welfare", "Elder Care", "Disability Support", "Refugee Aid", "Mental Health", "Livelihood", "Water & Sanitation", "Sustainability", "Animal Welfare", "Others"];

const RESEARCH_INTERESTS = ["Public Health", "Climate Change", "Food Security", "Education Policy", "Disaster Management", "Refugee Studies", "Mental Health", "Urban Development", "Water Resources", "Gender Studies", "Child Development", "Economic Development", "Social Justice", "Human Rights", "Others"];

const COUNTRY_CODES = [
  { code: '+91', name: 'India' },
  { code: '+1', name: 'USA/Canada' },
  { code: '+44', name: 'UK' },
  { code: '+234', name: 'Nigeria' },
  { code: '+254', name: 'Kenya' },
  { code: '+61', name: 'Australia' },
];

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'NGO' | 'Volunteer' | 'Researcher'>('Volunteer');

  // Common Profile Fields
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [phoneCode, setPhoneCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');

  // Role Specific Fields
  const [volunteerFields, setVolunteerFields] = useState({
    dob: '',
    gender: 'Prefer not to say',
    skills: [] as string[],
    availability: 'Flexible',
    remote: false,
    languages: '',
    bio: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });

  const [ngoFields, setNgoFields] = useState({
    orgName: '',
    orgType: 'NGO',
    regNumber: '',
    countryOfOperation: '',
    yearEstablished: '',
    websiteUrl: '',
    mission: '',
    focusAreas: [] as string[],
    activeVolunteers: '0',
    instagram: '',
    linkedin: '',
    twitter: '',
    contactPersonName: '',
    contactPersonEmail: '',
    contactPersonPhone: ''
  });

  const [researcherFields, setResearcherFields] = useState({
    institution: '',
    department: '',
    fieldOfResearch: '',
    interests: [] as string[],
    qualification: "Bachelor's",
    experienceYears: '0',
    linkedinUrl: '',
    orcidId: '',
    projectTitle: '',
    purpose: 'Academic Research'
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024) {
        toast.error("Photo must be less than 200KB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTag = (tag: string, category: 'skills' | 'focus' | 'interests') => {
    if (category === 'skills') {
      setVolunteerFields(prev => ({
        ...prev,
        skills: prev.skills.includes(tag) 
          ? prev.skills.filter(s => s !== tag) 
          : [...prev.skills, tag]
      }));
    } else if (category === 'focus') {
      setNgoFields(prev => ({
        ...prev,
        focusAreas: prev.focusAreas.includes(tag) 
          ? prev.focusAreas.filter(s => s !== tag) 
          : [...prev.focusAreas, tag]
      }));
    } else if (category === 'interests') {
      setResearcherFields(prev => ({
        ...prev,
        interests: prev.interests.includes(tag) 
          ? prev.interests.filter(s => s !== tag) 
          : [...prev.interests, tag]
      }));
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isRegistering) {
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (!phoneNumber || !country || !city) {
        setError("Please complete all common profile fields");
        return;
      }
    }

    setLoading(true);
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Build profile object
        let profileData: any = {
          phoneNumber: `${phoneCode}${phoneNumber}`,
          country,
          city,
          profilePhoto
        };

        if (selectedRole === 'Volunteer') {
          profileData = { ...profileData, ...volunteerFields };
        } else if (selectedRole === 'NGO') {
          profileData = { ...profileData, ...ngoFields };
        } else if (selectedRole === 'Researcher') {
          profileData = { ...profileData, ...researcherFields };
        }

        const userData = {
          uid: firebaseUser.uid,
          name,
          email,
          role: selectedRole,
          roles: [selectedRole],
          verified: false,
          createdAt: serverTimestamp(),
          profile: profileData
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
        await updateProfile(firebaseUser, { displayName: name });
        
        // Send verification email
        await sendEmailVerification(firebaseUser);
        setVerificationSent(true);
        toast.success("Account created! Verification email sent.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/explorer');
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let errorMessage = err.message;
      
      if (err.code === 'auth/network-request-failed') {
        errorMessage = "Network request failed. This often happens if the domain is not added to 'Authorized Domains' in your Firebase Console (Authentication > Settings).";
      } else if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = "Login window was closed before completion.";
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = "Email/Password or Google provider is not enabled in Firebase Authentication settings.";
      }
      
      setError(errorMessage);
      toast.error(errorMessage, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setName(user.displayName || '');
        setEmail(user.email || '');
        setIsRegistering(true);
        toast.info("Complete your profile to finish registration");
        return;
      }
      navigate('/explorer');
    } catch (err: any) {
      console.error("Google Auth error:", err);
      let errorMessage = err.message;
      
      if (err.code === 'auth/network-request-failed') {
        errorMessage = "Network request failed. Ensure this domain and the shared app domain are added to 'Authorized Domains' in Firebase console.";
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = "Login popup was blocked by your browser. Please allow popups for this site.";
      }
      
      setError(errorMessage);
      toast.error(errorMessage, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-[#E8EEF4] flex items-center justify-center p-6">
        <div className="w-full max-w-[480px] bg-white rounded-[28px] shadow-2xl p-10 text-center animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-[#1A3A2A] mb-4">Registration Successful!</h2>
          <p className="text-[#6B7280] mb-8 leading-relaxed">
            Account created! A verification email has been sent to <span className="font-bold text-[#1A3A2A]">{email}</span>. 
            Your profile will be marked as verified once reviewed.
          </p>
          <button 
            onClick={() => {
              setVerificationSent(false);
              setIsRegistering(false);
            }}
            className="w-full h-[52px] bg-[#1A6B5A] text-white rounded-[14px] font-bold text-[16px] hover:bg-[#134d41] transition-all"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8EEF4] flex items-center justify-center p-4">
      <Toaster position="top-right" richColors />
      
      <div className={cn(
        "bg-white rounded-[28px] shadow-2xl flex flex-col p-8 transition-all duration-500 animate-in fade-in zoom-in w-full",
        isRegistering ? "max-w-[800px] h-[90vh]" : "max-w-[400px]"
      )}>
        <div className="flex flex-col items-center mb-6">
          <CivicPulseLogo variant="stacked" height={isRegistering ? 48 : 56} />
        </div>

        <div className={cn("overflow-y-auto pr-2 custom-scrollbar flex-1")}>
          <form onSubmit={handleAuth} className="space-y-6">
            {isRegistering && (
              <div className=" animate-in fade-in slide-in-from-top-4 duration-300">
                <SectionHeader>Account Information</SectionHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Full Name" 
                    icon={<User size={18} />} 
                    placeholder="e.g. John Doe"
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                  />
                  <Input 
                    label="Email Address" 
                    icon={<Mail size={18} />} 
                    type="email"
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Input 
                    label="Password" 
                    icon={<Lock size={18} />} 
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    isPassword
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                  />
                  <Input 
                    label="Confirm Password" 
                    icon={<Lock size={18} />} 
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <SectionHeader>Contact & Location</SectionHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider ml-1">Phone Number</label>
                    <div className="flex gap-2">
                      <select 
                        className="w-[100px] h-[46px] bg-white border-[1.5px] border-[#E2E8F0] rounded-[10px] px-3 font-semibold text-[14px] outline-none focus:border-[#1A6B5A] focus:ring-4 focus:ring-[#1A6B5A]/10"
                        value={phoneCode}
                        onChange={e => setPhoneCode(e.target.value)}
                      >
                        {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.name})</option>)}
                      </select>
                      <input 
                        type="tel"
                        className="flex-1 h-[46px] px-[14px] border-[1.5px] border-[#E2E8F0] rounded-[10px] text-[14px] outline-none focus:border-[#1A6B5A] focus:ring-4 focus:ring-[#1A6B5A]/10"
                        placeholder="Phone Number"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Input label="Country" value={country} onChange={e => setCountry(e.target.value)} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Input label="City" value={city} onChange={e => setCity(e.target.value)} required />
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider ml-1">Profile Photo (Optional)</label>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#E2E8F0] flex items-center justify-center overflow-hidden bg-gray-50">
                        {profilePhoto ? <img src={profilePhoto} className="w-full h-full object-cover" /> : <Camera size={20} className="text-gray-300" />}
                      </div>
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[12px] font-bold text-[#1A6B5A] hover:underline"
                      >
                        Choose Photo
                      </button>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </div>
                  </div>
                </div>

                <SectionHeader>Role Selection</SectionHeader>
                <div className="flex gap-2 p-1 bg-gray-100 rounded-[14px]">
                  {(['Volunteer', 'NGO', 'Researcher'] as const).map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={cn(
                        "flex-1 py-3 text-[13px] font-bold rounded-[11px] transition-all duration-300",
                        selectedRole === role ? "bg-white text-[#1A6B5A] shadow-md" : "text-[#6B7280] hover:text-[#1A3A2A]"
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>

                {/* Role Specific Fields */}
                {selectedRole === 'Volunteer' && (
                  <div className="space-y-6 mt-6 animate-in slide-in-from-left-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Date of Birth" type="date" value={volunteerFields.dob} onChange={e => setVolunteerFields({...volunteerFields, dob: e.target.value})} required />
                      <div className="space-y-2">
                        <label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider ml-1">Gender</label>
                        <select 
                          className="w-full h-[46px] bg-white border-[1.5px] border-[#E2E8F0] rounded-[10px] px-[14px] text-[14px] outline-none focus:border-[#1A6B5A] focus:ring-4 focus:ring-[#1A6B5A]/10"
                          value={volunteerFields.gender}
                          onChange={e => setVolunteerFields({...volunteerFields, gender: e.target.value})}
                        >
                          <option>Prefer not to say</option>
                          <option>Male</option>
                          <option>Female</option>
                          <option>Non-binary</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-[#1A6B5A] uppercase tracking-wider ml-1">Skills</label>
                      <div className="flex flex-wrap gap-2">
                        {SKILLS_OPTIONS.map(s => (
                          <div 
                            key={s} 
                            onClick={() => toggleTag(s, 'skills')}
                            className={cn(
                              "px-3.5 py-1.5 rounded-full text-[12px] font-medium cursor-pointer transition-all active:scale-95",
                              volunteerFields.skills.includes(s) ? "bg-[#1A6B5A] text-white" : "bg-[#F3F4F6] text-[#374151] hover:bg-gray-200"
                            )}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                        <label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider ml-1">Availability</label>
                        <select 
                          className="w-full h-[46px] bg-white border-[1.5px] border-[#E2E8F0] rounded-[10px] px-[14px] text-[14px] outline-none focus:border-[#1A6B5A] focus:ring-4 focus:ring-[#1A6B5A]/10"
                          value={volunteerFields.availability}
                          onChange={e => setVolunteerFields({...volunteerFields, availability: e.target.value})}
                        >
                          <option>Flexible</option>
                          <option>Weekdays</option>
                          <option>Weekends</option>
                          <option>Both</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-3 pt-8">
                        <input 
                          type="checkbox" 
                          id="remote" 
                          className="w-4 h-4 accent-[#1A6B5A]" 
                          checked={volunteerFields.remote} 
                          onChange={e => setVolunteerFields({...volunteerFields, remote: e.target.checked})} 
                        />
                        <label htmlFor="remote" className="text-[14px] font-semibold text-[#1A3A2A]">Open to Remote Opportunities</label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Input label="Languages Spoken" placeholder="e.g. English, Swahili" value={volunteerFields.languages} onChange={e => setVolunteerFields({...volunteerFields, languages: e.target.value})} />
                      <div className="space-y-2">
                        <label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider ml-1">Brief Bio (Max 300 chars)</label>
                        <textarea 
                          maxLength={300}
                          className="w-full px-[14px] py-[11px] border-[1.5px] border-[#E2E8F0] rounded-[10px] text-[14px] outline-none focus:border-[#1A6B5A] focus:ring-4 focus:ring-[#1A6B5A]/10 min-h-[100px] resize-none"
                          placeholder="Tell us about yourself..."
                          value={volunteerFields.bio}
                          onChange={e => setVolunteerFields({...volunteerFields, bio: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Emergency Contact Name" value={volunteerFields.emergencyContactName} onChange={e => setVolunteerFields({...volunteerFields, emergencyContactName: e.target.value})} />
                      <Input label="Emergency Contact Phone" value={volunteerFields.emergencyContactPhone} onChange={e => setVolunteerFields({...volunteerFields, emergencyContactPhone: e.target.value})} />
                    </div>
                  </div>
                )}

                {selectedRole === 'NGO' && (
                  <div className="space-y-6 mt-6 animate-in slide-in-from-left-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Organisation Name" required value={ngoFields.orgName} onChange={e => setNgoFields({...ngoFields, orgName: e.target.value})} />
                      <div className="space-y-2">
                        <label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider ml-1">Organisation Type</label>
                        <select 
                          className="w-full h-[46px] bg-white border-[1.5px] border-[#E2E8F0] rounded-[10px] px-[14px] text-[14px] outline-none focus:border-[#1A6B5A] focus:ring-4 focus:ring-[#1A6B5A]/10"
                          value={ngoFields.orgType}
                          onChange={e => setNgoFields({...ngoFields, orgType: e.target.value})}
                        >
                          <option>NGO</option>
                          <option>Trust</option>
                          <option>Foundation</option>
                          <option>Charity</option>
                          <option>Community Group</option>
                          <option>Social Enterprise</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Registration Number" required value={ngoFields.regNumber} onChange={e => setNgoFields({...ngoFields, regNumber: e.target.value})} />
                      <Input label="Country of Operation" required value={ngoFields.countryOfOperation} onChange={e => setNgoFields({...ngoFields, countryOfOperation: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Year Established" type="number" required value={ngoFields.yearEstablished} onChange={e => setNgoFields({...ngoFields, yearEstablished: e.target.value})} />
                      <Input label="Website URL" type="url" value={ngoFields.websiteUrl} onChange={e => setNgoFields({...ngoFields, websiteUrl: e.target.value})} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider ml-1">Mission Statement (Max 400 chars)</label>
                      <textarea 
                        maxLength={400} required
                        className="w-full px-[14px] py-[11px] border-[1.5px] border-[#E2E8F0] rounded-[10px] text-[14px] outline-none focus:border-[#1A6B5A] focus:ring-4 focus:ring-[#1A6B5A]/10 min-h-[100px] resize-none"
                        value={ngoFields.mission}
                        onChange={e => setNgoFields({...ngoFields, mission: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-[#1A6B5A] uppercase tracking-wider ml-1">Areas of Focus</label>
                      <div className="flex flex-wrap gap-2">
                        {NGO_FOCUS_AREAS.map(s => (
                          <div 
                            key={s} 
                            onClick={() => toggleTag(s, 'focus')}
                            className={cn(
                              "px-3.5 py-1.5 rounded-full text-[12px] font-medium cursor-pointer transition-all active:scale-95",
                              ngoFields.focusAreas.includes(s) ? "bg-[#1A6B5A] text-white" : "bg-[#F3F4F6] text-[#374151] hover:bg-gray-200"
                            )}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <Input label="Active Volunteers" type="number" value={ngoFields.activeVolunteers} onChange={e => setNgoFields({...ngoFields, activeVolunteers: e.target.value})} />
                       <Input label="Contact Person Name" required value={ngoFields.contactPersonName} onChange={e => setNgoFields({...ngoFields, contactPersonName: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <Input label="Contact Person Email" type="email" required value={ngoFields.contactPersonEmail} onChange={e => setNgoFields({...ngoFields, contactPersonEmail: e.target.value})} />
                       <Input label="Contact Person Phone" required value={ngoFields.contactPersonPhone} onChange={e => setNgoFields({...ngoFields, contactPersonPhone: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <Input label="Instagram" value={ngoFields.instagram} onChange={e => setNgoFields({...ngoFields, instagram: e.target.value})} />
                       <Input label="LinkedIn" value={ngoFields.linkedin} onChange={e => setNgoFields({...ngoFields, linkedin: e.target.value})} />
                       <Input label="Twitter/X" value={ngoFields.twitter} onChange={e => setNgoFields({...ngoFields, twitter: e.target.value})} />
                    </div>
                  </div>
                )}

                {selectedRole === 'Researcher' && (
                  <div className="space-y-6 mt-6 animate-in slide-in-from-left-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Institution / University" required value={researcherFields.institution} onChange={e => setResearcherFields({...researcherFields, institution: e.target.value})} />
                      <Input label="Department" value={researcherFields.department} onChange={e => setResearcherFields({...researcherFields, department: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Field of Research" required value={researcherFields.fieldOfResearch} onChange={e => setResearcherFields({...researcherFields, fieldOfResearch: e.target.value})} />
                      <div className="space-y-2">
                        <label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider ml-1">Highest Qualification</label>
                        <select 
                          className="w-full h-[46px] bg-white border-[1.5px] border-[#E2E8F0] rounded-[10px] px-[14px] text-[14px] outline-none focus:border-[#1A6B5A] focus:ring-4 focus:ring-[#1A6B5A]/10"
                          value={researcherFields.qualification}
                          onChange={e => setResearcherFields({...researcherFields, qualification: e.target.value})}
                        >
                          <option>Bachelor's</option>
                          <option>Master's</option>
                          <option>PhD</option>
                          <option>Post-Doc</option>
                          <option>Professor</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-[#1A6B5A] uppercase tracking-wider ml-1">Research Interests</label>
                      <div className="flex flex-wrap gap-2">
                        {RESEARCH_INTERESTS.map(s => (
                          <div 
                            key={s} 
                            onClick={() => toggleTag(s, 'interests')}
                            className={cn(
                              "px-3.5 py-1.5 rounded-full text-[12px] font-medium cursor-pointer transition-all active:scale-95",
                              researcherFields.interests.includes(s) ? "bg-[#1A6B5A] text-white" : "bg-[#F3F4F6] text-[#374151] hover:bg-gray-200"
                            )}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <Input label="Years of Experience" type="number" value={researcherFields.experienceYears} onChange={e => setResearcherFields({...researcherFields, experienceYears: e.target.value})} />
                       <Input label="LinkedIn URL" type="url" value={researcherFields.linkedinUrl} onChange={e => setResearcherFields({...researcherFields, linkedinUrl: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <Input label="ORCID ID" value={researcherFields.orcidId} onChange={e => setResearcherFields({...researcherFields, orcidId: e.target.value})} />
                       <div className="space-y-2">
                        <label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider ml-1">Purpose of Using</label>
                        <select 
                          className="w-full h-[46px] bg-white border-[1.5px] border-[#E2E8F0] rounded-[10px] px-[14px] text-[14px] outline-none focus:border-[#1A6B5A] focus:ring-4 focus:ring-[#1A6B5A]/10"
                          value={researcherFields.purpose}
                          onChange={e => setResearcherFields({...researcherFields, purpose: e.target.value})}
                        >
                          <option>Academic Research</option>
                          <option>Policy Development</option>
                          <option>Data Analysis</option>
                          <option>Grant Writing</option>
                          <option>Volunteer Coordination</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider ml-1">Current Research Project</label>
                      <textarea 
                        className="w-full px-[14px] py-[11px] border-[1.5px] border-[#E2E8F0] rounded-[10px] text-[14px] outline-none focus:border-[#1A6B5A] focus:ring-4 focus:ring-[#1A6B5A]/10 min-h-[80px] resize-none"
                        value={researcherFields.projectTitle}
                        onChange={e => setResearcherFields({...researcherFields, projectTitle: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isRegistering && (
              <div className="space-y-6">
                <Input 
                  label="Email Address" 
                  icon={<Mail size={18} />} 
                  type="email"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                />
                <Input 
                  label="Password" 
                  icon={<Lock size={18} />} 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  isPassword
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-xl text-[12px] font-bold flex gap-2 items-center">
                <Info size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] bg-[#1A6B5A] text-white rounded-[14px] font-bold text-[16px] hover:bg-[#134d41] transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? 'Create Account' : 'Sign In')}
              {!loading && <ChevronRight size={20} />}
            </button>
          </form>
        </div>

        <div className="mt-8">
          <div className="relative flex items-center justify-center mb-8">
            <div className="w-full border-t border-[#E5E7EB]"></div>
            <span className="absolute bg-white px-4 text-[11px] font-bold text-[#9CA3AF] uppercase">OR</span>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-[48px] bg-white border-[1.5px] border-[#E2E8F0] text-[#1A3A2A] rounded-[14px] flex items-center justify-center gap-3 font-bold text-[15px] hover:bg-gray-50 transition-all active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Continue with Google</span>
            </button>
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="w-full text-center text-[14px] font-bold text-[#1A6B5A] hover:underline"
            >
              {isRegistering ? 'Already have an account? Sign In' : 'New to CivicPulse? Create Account'}
            </button>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center opacity-30 shrink-0">
          <Mascot size={28} />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[13px] font-bold text-[#1A6B5A] uppercase tracking-[0.06em] mt-8 mb-4 pb-2 border-b border-[#E8F5F0]">
      {children}
    </h3>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  isPassword?: boolean;
  showPassword?: boolean;
  setShowPassword?: (show: boolean) => void;
  // Explicitly add these to help the compiler if needed
  type?: string;
  placeholder?: string;
  value?: any;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

function Input({ label, icon, isPassword, showPassword, setShowPassword, ...props }: InputProps) {
  return (
    <div className="space-y-2">
      <label className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider ml-1">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={cn(
            "w-full h-[46px] bg-white border-[1.5px] border-[#E2E8F0] rounded-[10px] text-[14px] outline-none focus:border-[#1A6B5A] focus:ring-4 focus:ring-[#1A6B5A]/10 transition-all placeholder:text-gray-300",
            icon ? "pl-11" : "px-[14px]",
            isPassword ? "pr-12" : ""
          )}
        />
        {isPassword && setShowPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#1A6B5A]"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
