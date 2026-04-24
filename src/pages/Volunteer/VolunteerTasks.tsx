import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import Layout from '../../components/Layout';
import { toast } from 'sonner';

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'accepted': return { bg: '#D1FAE5', text: '#065F46' };
    case 'pending': return { bg: '#FEF3C7', text: '#D97706' };
    case 'rejected': return { bg: '#FEE2E2', text: '#DC2626' };
    case 'completed': return { bg: '#DBEAFE', text: '#1E40AF' };
    default: return { bg: '#F3F4F6', text: '#6B7280' };
  }
};

const getProgressIcon = (progress: string) => {
  switch (progress) {
    case 'not_started': return '⭕';
    case 'in_progress': return '⏳';
    case 'completed': return '✅';
    default: return '⚪';
  }
};

const DUMMY_TASKS = [
  {
    eoiId: 'dummy_task_1',
    volunteerId: 'demo',
    needId: 'dummy_need_1',
    needTitle: 'Emergency Medical Volunteers — Kerala Flood Relief',
    ngoName: 'HopeReach Foundation',
    timestamp: new Date('2026-04-18'),
    status: 'accepted',
    taskProgress: 'in_progress',
    isDemo: true,
    need: {
      id: 'dummy_need_1',
      title: 'Emergency Medical Volunteers — Kerala Flood Relief',
      ngoName: 'HopeReach Foundation',
      location: { city: 'Wayanad', state: 'Kerala', country: 'India' },
      skillsRequired: ['Medical', 'First Aid', 'CPR'],
      deadline: '2026-04-27',
      remote: false,
      urgency: 'critical',
      category: 'health'
    }
  },
  {
    eoiId: 'dummy_task_2',
    volunteerId: 'demo',
    needId: 'dummy_need_2',
    needTitle: 'Online Tutors for Rural Children — Tamil Nadu',
    ngoName: 'EduBridge India',
    timestamp: new Date('2026-04-15'),
    status: 'pending',
    taskProgress: 'not_started',
    isDemo: true,
    need: {
      id: 'dummy_need_2',
      title: 'Online Tutors for Rural Children — Tamil Nadu',
      ngoName: 'EduBridge India',
      location: { city: 'Villupuram', state: 'Tamil Nadu', country: 'India' },
      skillsRequired: ['Teaching', 'Mentoring', 'English'],
      deadline: '2026-05-15',
      remote: true,
      urgency: 'moderate',
      category: 'education'
    }
  },
  {
    eoiId: 'dummy_task_3',
    volunteerId: 'demo',
    needId: 'dummy_need_5',
    needTitle: 'Shelter Reconstruction — Post Cyclone Odisha',
    ngoName: 'HopeReach Foundation',
    timestamp: new Date('2026-04-16'),
    status: 'completed',
    taskProgress: 'done',
    isDemo: true,
    need: {
      id: 'dummy_need_5',
      title: 'Shelter Reconstruction — Post Cyclone Odisha',
      ngoName: 'HopeReach Foundation',
      location: { city: 'Puri', state: 'Odisha', country: 'India' },
      skillsRequired: ['Construction', 'Carpentry'],
      deadline: '2026-04-28',
      remote: false,
      urgency: 'critical',
      category: 'shelter'
    }
  },
  {
    eoiId: 'dummy_task_4',
    volunteerId: 'demo',
    needId: 'dummy_need_6',
    needTitle: 'IT Support — Digital Literacy Bangalore',
    ngoName: 'EduBridge India',
    timestamp: new Date('2026-04-12'),
    status: 'accepted',
    taskProgress: 'not_started',
    isDemo: true,
    need: {
      id: 'dummy_need_6',
      title: 'IT Support — Digital Literacy Bangalore',
      ngoName: 'EduBridge India',
      location: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
      skillsRequired: ['IT Support', 'Teaching'],
      deadline: '2026-05-20',
      remote: true,
      urgency: 'moderate',
      category: 'education'
    }
  }
];

export default function MyTasks() {
  const [expressions, setExpressions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState<any>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'expressions_of_interest'),
      where('volunteerId', '==', auth.currentUser.uid)
    );

    const unsub = onSnapshot(q, async (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const tasksWithDetails = await Promise.all(docs.map(async (exp: any) => {
          const needRef = doc(db, 'needs', exp.needId);
          const needSnap = await getDoc(needRef);
          return {
            ...exp,
            need: needSnap.exists() ? needSnap.data() : null
          };
        }));
        const realTasks = tasksWithDetails.filter(t => t.need !== null);
        setExpressions([...realTasks, ...DUMMY_TASKS]);
        setLoading(false);
    }, (err) => {
      console.error('Fetch tasks error:', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleUpdateProgress = async (expressionId: string, newProgress: string) => {
    try {
      await updateDoc(doc(db, 'expressions_of_interest', expressionId), {
        taskProgress: newProgress,
        status: newProgress === 'completed' ? 'completed' : 'accepted'
      });
      toast.success('Progress updated!');
    } catch (err: any) {
      toast.error('Update failed: ' + err.message);
    }
  };

  const filtered = expressions.filter(e => {
    if (filter === 'all') return true;
    return e.status?.toLowerCase() === filter;
  });

  return (
    <Layout>
      <div style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1C1C1E', marginBottom: '4px' }}>
          My Tasks
        </h2>
        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '20px' }}>
          Track your submittals, active tasks, and completion history
        </p>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {['all', 'pending', 'accepted', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                background: filter === f ? '#1A6B5A' : '#F3F4F6',
                color: filter === f ? 'white' : '#6B7280',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'capitalize'
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #E2E8F0', borderTop: '3px solid #1A6B5A', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p>Gathering your tasks...</p>
          </div>
        )}

        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            {filtered.map(exp => {
              const statusCol = getStatusColor(exp.status);
              return (
                <div
                  key={exp.id}
                  style={{ background: 'white', borderRadius: '16px', border: '1px solid #F0F0F0', padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: '1', minWidth: '280px' }}>
                    <div style={{ width: '44px', height: '44px', background: '#F8FAFC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                      {getProgressIcon(exp.taskProgress)}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1C1C1E', marginBottom: '2px' }}>
                        {exp.need?.title}
                        {exp.isDemo && (
                          <span style={{ fontSize: '10px', fontWeight: '600', background: '#FEF3C7', color: '#D97706', padding: '2px 7px', borderRadius: '20px', marginLeft: '6px' }}>
                            Demo
                          </span>
                        )}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#6B7280' }}>
                        Applied on {exp.timestamp?.toDate ? exp.timestamp.toDate().toLocaleDateString() : new Date(exp.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', background: statusCol.bg, color: statusCol.text, padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
                      {exp.status}
                    </span>

                    {exp.status?.toLowerCase() === 'accepted' && (
                      <select
                        value={exp.taskProgress || 'not_started'}
                        onChange={(e) => handleUpdateProgress(exp.id, e.target.value)}
                        style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '8px', border: '1.5px solid #E2E8F0', background: 'white', fontWeight: '500' }}
                      >
                        <option value="not_started">Status: Not Started</option>
                        <option value="in_progress">Status: In Progress</option>
                        <option value="completed">Finish Task</option>
                      </select>
                    )}

                    <button
                      onClick={() => setSelectedTask(exp)}
                      style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', color: '#1A6B5A', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280', border: '2px dashed #F0F0F0', borderRadius: '24px' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>No tasks found in this category</p>
            <p style={{ fontSize: '12px' }}>Check other filters or explore new opportunities</p>
          </div>
        )}

        {/* Task details modal */}
        {selectedTask && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={() => setSelectedTask(null)}
          >
            <div
              style={{ background: 'white', borderRadius: '20px', padding: '24px', maxWidth: '480px', width: '100%', position: 'relative' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{selectedTask.need?.title}</h3>
                <button onClick={() => setSelectedTask(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6B7280' }}>✕</button>
              </div>

              <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5', marginBottom: '16px' }}>
                {selectedTask.need?.description}
              </p>

              <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>Current Status</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: getStatusColor(selectedTask.status).text }}>
                    {selectedTask.status?.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>Location</span>
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>
                    {selectedTask.need?.location?.city}, {selectedTask.need?.location?.country}
                  </span>
                </div>
              </div>

              {selectedTask.status?.toLowerCase() === 'accepted' && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: '#1A6B5A', textTransform: 'uppercase', marginBottom: '8px' }}>Action REQUIRED</p>
                  <p style={{ fontSize: '13px', color: '#374151', marginBottom: '8px' }}>Update your progress to keep the NGO informed:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      onClick={() => handleUpdateProgress(selectedTask.id, 'in_progress')}
                      style={{ padding: '10px', borderRadius: '10px', border: '1px solid #1A6B5A', color: '#1A6B5A', background: 'white', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Mark In Progress
                    </button>
                    <button
                       onClick={() => handleUpdateProgress(selectedTask.id, 'completed')}
                       style={{ padding: '10px', borderRadius: '10px', border: 'none', color: 'white', background: '#1A6B5A', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Finish Task
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => setSelectedTask(null)}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: '#F3F4F6', color: '#4B5563', fontWeight: '600', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
