import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/auth/Login';
import { OrganizerLayout } from './components/layout/OrganizerLayout';
import { Dashboard } from './pages/organizer/Dashboard';
import { ManageEvents } from './pages/organizer/ManageEvents';
import { CreateEvent } from './pages/organizer/CreateEvent';
import { EditEvent } from './pages/organizer/EditEvent';
import { EventDetails } from './pages/organizer/EventDetails';
import { EventRegistrations } from './pages/organizer/EventRegistrations';
import { OrganizerProfile } from './pages/organizer/OrganizerProfile';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-400">Loading EventHive...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Auth Route */}
        <Route path="/login" element={<Login />} />

        {/* Organizer Module Protected Routes */}
        <Route
          path="/organizer"
          element={
            <ProtectedRoute>
              <OrganizerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/organizer/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="events" element={<ManageEvents />} />
          <Route path="events/new" element={<CreateEvent />} />
          <Route path="events/:id" element={<EventDetails />} />
          <Route path="events/:id/edit" element={<EditEvent />} />
          <Route path="events/:id/registrations" element={<EventRegistrations />} />
          <Route path="profile" element={<OrganizerProfile />} />
        </Route>

        {/* Root Redirect to Organizer Portal */}
        <Route path="/" element={<Navigate to="/organizer/dashboard" replace />} />

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
              <h1 className="text-6xl font-black text-brand-400">404</h1>
              <p className="mt-2 text-lg font-bold">Page Not Found</p>
              <p className="mt-1 text-xs text-slate-400">The requested page does not exist.</p>
              <a
                href="/organizer/dashboard"
                className="mt-5 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-500"
              >
                Back to Dashboard
              </a>
            </div>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
