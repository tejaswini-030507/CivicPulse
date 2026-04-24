import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import NGODashboard from './pages/NGO/NGODashboard';
import NGOVolunteers from './pages/NGO/NGOVolunteers';
import VolunteerDashboard from './pages/Volunteer/VolunteerDashboard';
import VolunteerMap from './pages/Volunteer/VolunteerMap';
import VolunteerTasks from './pages/Volunteer/VolunteerTasks';
import ExploreOpportunities from './pages/Volunteer/ExploreOpportunities';
import ResearcherDashboard from './pages/Researcher/ResearcherDashboard';
import ResearcherAnalytics from './pages/Researcher/ResearcherAnalytics';
import DataExplorer from './pages/Common/DataExplorer';
import ProfilePage from './pages/Common/ProfilePage';
import DevTools from './components/DevTools';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, profile, loading, isAuthReady } = useAuth();

  if (!isAuthReady || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && profile && !profile.roles.some(r => allowedRoles.includes(r))) {
    // Redirect to their first available dashboard if they try to access another role's portal
    if (profile.roles.includes('NGO')) return <Navigate to="/ngo" />;
    if (profile.roles.includes('Volunteer')) return <Navigate to="/volunteer" />;
    if (profile.roles.includes('Researcher')) return <Navigate to="/researcher" />;
    return <Navigate to="/explorer" />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/ngo" element={
            <ProtectedRoute allowedRoles={['NGO', 'admin']}>
              <NGODashboard />
            </ProtectedRoute>
          } />

          <Route path="/ngo/volunteers" element={
            <ProtectedRoute allowedRoles={['NGO', 'admin']}>
              <NGOVolunteers />
            </ProtectedRoute>
          } />
          
          <Route path="/volunteer/map" element={
            <ProtectedRoute allowedRoles={['Volunteer', 'admin']}>
              <VolunteerMap />
            </ProtectedRoute>
          } />

          <Route path="/volunteer/tasks" element={
            <ProtectedRoute allowedRoles={['Volunteer', 'admin']}>
              <VolunteerTasks />
            </ProtectedRoute>
          } />

          <Route path="/volunteer/opportunities" element={
            <ProtectedRoute allowedRoles={['Volunteer', 'admin']}>
              <ExploreOpportunities />
            </ProtectedRoute>
          } />
          
          <Route path="/volunteer" element={
            <ProtectedRoute allowedRoles={['Volunteer', 'admin']}>
              <VolunteerDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/researcher" element={
            <ProtectedRoute allowedRoles={['Researcher', 'admin']}>
              <ResearcherDashboard />
            </ProtectedRoute>
          } />

          <Route path="/researcher/datasets" element={
            <ProtectedRoute allowedRoles={['Researcher', 'admin']}>
              <ResearcherDashboard initialTab="datasets" />
            </ProtectedRoute>
          } />

          <Route path="/researcher/analyzer" element={
            <ProtectedRoute allowedRoles={['Researcher', 'admin']}>
              <ResearcherDashboard initialTab="data-analyser" />
            </ProtectedRoute>
          } />

          <Route path="/researcher/analytics" element={
            <ProtectedRoute allowedRoles={['Researcher', 'admin']}>
              <ResearcherAnalytics />
            </ProtectedRoute>
          } />
          
          <Route path="/explorer" element={
            <ProtectedRoute>
              <DataExplorer />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
        <DevTools />
      </Router>
    </AuthProvider>
  );
}
