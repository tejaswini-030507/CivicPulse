import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { collection, onSnapshot, query, where, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Loader2, X, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
const markerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [25, 25],
  iconAnchor: [12, 25],
});

function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 12, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function VolunteerMap() {
  const { user } = useAuth();
  const [needs, setNeeds] = useState<any[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<[number, number] | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'needs'), where('status', '==', 'Open'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNeeds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Map data error:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        setSearchResult([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      } else {
        setNotification("Location not found.");
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error("Search error:", err);
      setNotification("Failed to search. Try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return '#E03E3E';
      case 'High': return '#F97316';
      case 'Moderate': return '#FACC15';
      case 'Low': return '#22C55E';
      default: return '#6B7280';
    }
  };

  const handleInterest = async (needId: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'expressions_of_interest'), {
        volunteerId: user.uid,
        needId,
        timestamp: new Date().toISOString(),
        status: 'Pending'
      });
      setNotification("Interest expressed! We'll notify the NGO.");
      setTimeout(() => setNotification(null), 5000);
    } catch (error) {
      setNotification("Failed to express interest.");
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Needs Map</h1>
            <p className="text-text-muted">Find humanitarian needs near you</p>
          </div>
          
          <form onSubmit={handleSearch} className="w-full md:w-96 relative">
             <input 
               type="text"
               placeholder="Search by city, state, or address..."
               className="w-full pl-10 pr-4 py-3 bg-surface border border-gray-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium text-sm"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
             {isSearching && <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" />}
          </form>
        </div>

        <div className="flex-1 rounded-[2rem] overflow-hidden border border-gray-200 shadow-xl relative isolate">
          {notification && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[2000] bg-primary text-white px-6 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top duration-300 font-bold border-2 border-white">
              {notification}
            </div>
          )}
          <MapContainer center={[20, 77]} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapController center={searchResult} />
            
            {searchResult && (
              <Marker position={searchResult} icon={markerIcon}>
                <Popup>
                  <div className="p-2">
                    <p className="font-bold text-sm">Search Result</p>
                    <button onClick={() => setSearchResult(null)} className="text-xs text-primary underline">Clear pin</button>
                  </div>
                </Popup>
              </Marker>
            )}

            {needs.map((need) => (
              need.location?.lat && need.location?.lng && (
                <CircleMarker
                  key={need.id}
                  center={[need.location.lat, need.location.lng]}
                  radius={12}
                  pathOptions={{
                    fillColor: getUrgencyColor(need.urgency),
                    color: 'white',
                    weight: 3,
                    fillOpacity: 0.9
                  }}
                >
                  <Popup>
                    <div className="p-4 min-w-[240px]">
                      <div className="flex justify-between items-start mb-2">
                         <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase", 
                           need.urgency === 'Critical' ? 'bg-severity-critical' : 'bg-primary'
                         )}>
                            {need.urgency}
                         </span>
                         <span className="text-[10px] text-text-muted font-bold uppercase">{need.category}</span>
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-text-primary leading-tight">{need.title}</h3>
                      <p className="text-xs text-text-muted mb-4 line-clamp-3">{need.description}</p>
                      <button 
                        onClick={() => handleInterest(need.id)}
                        className="w-full bg-[#1A6B5A] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#1A6B5A]/90 shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <MapPin size={14} />
                        Express Interest
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            ))}
          </MapContainer>
          
          {/* Legend */}
          <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm p-5 rounded-2xl shadow-2xl z-[1000] border border-gray-100 flex flex-col gap-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-gray-100 pb-2">Urgency Tiers</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <LegendItem color="#E03E3E" label="Critical" />
              <LegendItem color="#F97316" label="High" />
              <LegendItem color="#FACC15" label="Moderate" />
              <LegendItem color="#22C55E" label="Low" />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }}></div>
      <span className="text-[11px] font-bold text-text-muted">{label}</span>
    </div>
  );
}
