import React, { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { PaperProvider } from './contexts/PaperContext';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import Onboarding from './pages/Onboarding';
import LoadingSpinner from './components/LoadingSpinner';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import api from './services/api';

// Profile Context to store user role and category
const ProfileContext = createContext(null);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  return context;
};

function ProfileProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // Fetch user profile from backend
    const fetchProfile = async () => {
      try {
        const response = await api.get('/profile/me');
        setProfile(response.data);
      } catch (error) {
        // Profile doesn't exist yet - user needs onboarding
        if (error.response?.status === 404) {
          setProfile(null);
        } else {
          console.error('Failed to fetch profile:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading]);

  return (
    <ProfileContext.Provider value={{ profile, loading, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

// Protected Route Component using Supabase Auth
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
}

// Route that requires profile (onboarding completed)
function ProfileRequiredRoute({ children }) {
  const { profile, loading } = useProfile();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!profile) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

// Role-based Dashboard Route
function DashboardRoute() {
  const { profile, loading } = useProfile();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!profile) {
    return <Navigate to="/onboarding" replace />;
  }

  // Ensure profile is complete (has category)
  if (!profile.category) {
    return <Navigate to="/onboarding" replace />;
  }

  if (profile.role === 'student') {
    return <StudentDashboard />;
  } else if (profile.role === 'teacher') {
    return <TeacherDashboard />;
  }

  return <Navigate to="/onboarding" replace />;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/sign-in"
        element={!user ? <SignIn /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/sign-up"
        element={!user ? <SignUp /> : <Navigate to="/dashboard" replace />}
      />

      {/* Onboarding - requires sign in but not profile */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      {/* Dashboard - requires sign in AND profile */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ProfileRequiredRoute>
              <DashboardRoute />
            </ProfileRequiredRoute>
          </ProtectedRoute>
        }
      />

      {/* Root redirect */}
      <Route
        path="/"
        element={
          user ? <Navigate to="/dashboard" replace /> : <Navigate to="/sign-in" replace />
        }
      />
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

function App() {
  return (
    <ProfileProvider>
      <PaperProvider>
        <AppRoutes />
      </PaperProvider>
    </ProfileProvider>
  );
}

export default App;