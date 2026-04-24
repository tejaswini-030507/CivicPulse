import React, { useState } from 'react';
import { Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { seedDatabase, checkIfSeeded } from '../utils/seedData';

export default function DevTools() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'already'>('idle');

  const handleSeed = async () => {
    setLoading(true);
    setStatus('idle');
    try {
      const isSeeded = await checkIfSeeded(db);
      if (isSeeded) {
        setStatus('already');
      } else {
        await seedDatabase(db);
        setStatus('success');
      }
    } catch (error) {
      console.error("Seed error:", error);
      setStatus('error');
    } finally {
      setLoading(false);
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  if (import.meta.env.VITE_DEMO_MODE !== 'true') return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999]">
      <button
        onClick={handleSeed}
        disabled={loading}
        className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-800 transition-all text-sm font-bold"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : status === 'success' ? (
          <CheckCircle size={16} className="text-green-400" />
        ) : status === 'already' ? (
          <Database size={16} className="text-blue-400" />
        ) : status === 'error' ? (
          <AlertCircle size={16} className="text-red-400" />
        ) : (
          <Database size={16} />
        )}
        {status === 'success' ? 'Demo Data Loaded!' : status === 'already' ? 'Already Seeded' : status === 'error' ? 'Seed Failed' : 'Seed Demo Data'}
      </button>
    </div>
  );
}
