import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard, 
  Search, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Bell,
  Heart,
  Globe,
  Database,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import Mascot from './Mascot';
import { geminiService } from '../services/geminiService';
import CivicPulseLogo from './CivicPulseLogo';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showChatLabel, setShowChatLabel] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowChatLabel(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { name: 'Data Explorer', path: '/explorer', icon: Search },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  if (profile?.roles?.includes('NGO')) {
    navItems.push({ name: 'NGO Dashboard', path: '/ngo', icon: LayoutDashboard });
    navItems.push({ name: 'My Volunteers', path: '/ngo/volunteers', icon: User });
  }
  
  if (profile?.roles?.includes('Volunteer')) {
    navItems.push({ name: 'Volunteer Dashboard', path: '/volunteer', icon: LayoutDashboard });
    navItems.push({ name: 'Explore Opportunities', path: '/volunteer/opportunities', icon: Search });
    navItems.push({ name: 'My Tasks', path: '/volunteer/tasks', icon: Heart });
    navItems.push({ name: 'Map', path: '/volunteer/map', icon: Globe });
  }
  
  if (profile?.roles?.includes('Researcher')) {
    navItems.push({ name: 'Researcher Dashboard', path: '/researcher', icon: LayoutDashboard });
    navItems.push({ name: 'My Datasets', path: '/researcher/datasets', icon: Database });
    navItems.push({ name: 'Data Analyzer', path: '/researcher/analyzer', icon: Sparkles });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar (Desktop) */}
      <aside 
        className="sidebar hidden md:flex flex-col w-64 bg-surface border-r border-gray-200 sticky top-0 h-screen"
        style={{
          width: '240px',
          height: '100vh',
          background: 'white',
          borderRight: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 100,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        <div style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start'
        }}>
          <Link to="/">
            <CivicPulseLogo variant="horizontal" height={36} />
          </Link>
        </div>
        
        <nav 
          className="sidebar-nav flex-1 px-4 py-2 space-y-2"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '8px 0',
            scrollbarWidth: 'thin',
            scrollbarColor: '#E2E8F0 transparent'
          }}
        >
          <style>{`
            .sidebar-nav::-webkit-scrollbar { width: 4px; }
            .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
            .sidebar-nav::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }
            .sidebar-nav::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
            
            @media (max-width: 768px) {
              .sidebar {
                transform: translateX(-100%);
                transition: transform 0.25s ease;
              }
              .sidebar.open {
                transform: translateX(0);
              }
            }
          `}</style>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                location.pathname === item.path 
                  ? "bg-primary text-white" 
                  : "text-text-muted hover:bg-primary/5 hover:text-primary"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <Link to="/profile" className="flex items-center gap-3 px-4 py-3 mb-4 hover:bg-primary/5 rounded-xl transition-all">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden">
              {profile?.photoBase64 || profile?.logoUrl || profile?.photoUrl ? (
                <img src={profile.photoBase64 || profile.logoUrl || profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile?.name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate flex items-center gap-1">
                {profile?.name}
                {profile?.verified && <span className="text-green-500 text-[10px]">✓</span>}
              </p>
              <p className="text-xs text-text-muted truncate capitalize">{profile?.role || profile?.roles?.[0]}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-critical hover:bg-critical/5 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-surface border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1 hover:bg-gray-100 rounded-lg">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <Link to="/">
          <CivicPulseLogo variant="horizontal" height={34} />
        </Link>
        <div className="w-8"></div> {/* Spacer for symmetry */}
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-[100]" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="bg-surface w-64 h-full p-6 flex flex-col gap-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100">
                {profile?.photoBase64 ? (
                  <img src={profile.photoBase64} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center text-white font-black">
                    {profile?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{profile?.name}</p>
                <p className="text-xs text-text-muted truncate capitalize">{profile?.role || profile?.roles?.[0]}</p>
              </div>
            </div>
            <nav className="space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                    location.pathname === item.path ? "bg-primary text-white" : "text-text-muted"
                  )}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>
            <button
              onClick={handleLogout}
              className="mt-auto flex items-center gap-3 w-full px-4 py-3 text-critical"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden md:ml-64">
        {children}
      </main>

      {/* Floating Chatbot Button & Label */}
      <div className="fixed bottom-8 right-8 z-[60] flex flex-col items-end gap-2 group">
        {(showChatLabel || true) && (
          <div className={cn(
            "bg-primary text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg transition-opacity duration-1000 whitespace-nowrap",
            !showChatLabel && "opacity-0 group-hover:opacity-100"
          )}>
            Ask CivicPulse AI
          </div>
        )}
        <div 
          onClick={() => setIsChatOpen(true)}
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 999,
            background: '#1A6B5A', borderRadius: '50%',
            width: '52px', height: '52px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(26,107,90,0.35)',
            cursor: 'pointer'
          }}
        >
          <CivicPulseLogo variant="icon" height={32} />
        </div>
      </div>

      {isChatOpen && (
        <ChatDrawer onClose={() => setIsChatOpen(false)} />
      )}
    </div>
  );
}

function ChatDrawer({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: "Hello! I'm Pulse, your CivicPulse AI guide. How can I help you today?" }
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

    try {
      const aiResponse = await geminiService.chatWithData(userMsg, []);
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[110] flex justify-end">
      <div className="bg-surface w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#1A6B5A] text-white">
          <div className="flex items-center gap-3">
            <CivicPulseLogo variant="icon" height={32} />
            <h3 className="font-bold">Pulse AI Assistant</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn(
              "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed",
              msg.role === 'user' 
                ? "bg-[#1A6B5A] text-white ml-auto rounded-tr-none" 
                : "bg-gray-100 text-text-primary rounded-tl-none border border-gray-200"
            )}>
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-text-muted text-sm px-2">
              <Loader2 size={16} className="animate-spin" />
              Pulse is thinking...
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex gap-2">
          <input
            type="text"
            placeholder="Ask Pulse something..."
            className="flex-1 bg-background border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            type="submit"
            disabled={loading}
            className="bg-[#1A6B5A] text-white p-3 rounded-xl hover:bg-[#1A6B5A]/90 transition-all disabled:opacity-50"
          >
            <ChevronRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
