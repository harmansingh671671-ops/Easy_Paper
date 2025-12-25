import React, { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, SignUp, useUser, useAuth } from '@clerk/clerk-react';
import { PaperProvider } from './contexts/PaperContext';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import Onboarding from './pages/Onboarding';
import LoadingSpinner from './components/LoadingSpinner';
import api from './services/api';

// Profile Context to store user role and category
const ProfileContext = createContext(null);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  return context;
};

function ProfileProvider({ children }) {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth(); // Get the token here
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // Fetch user profile from backend
    const fetchProfile = async () => {
      try {
        // The interceptor in api.js will automatically add the token
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
  }, [user, isLoaded, getToken]); // Add getToken to dependency array

  return (
    <ProfileContext.Provider value={{ profile, loading, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

// Protected Route Component using Clerk
function ProtectedRoute({ children }) {
  const { isLoaded } = useUser();

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  return (
    <SignedIn>
      {children}
    </SignedIn>
  );
}

// Route that requires profile (onboarding completed)
function ProfileRequiredRoute({ children }) {
  const { profile, loading } = useProfile();
  const { isLoaded } = useUser();

  if (!isLoaded || loading) {
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

  if (profile.role === 'student') {
    return <StudentDashboard />;
  } else if (profile.role === 'teacher') {
    return <TeacherDashboard />;
  }

  return <Navigate to="/onboarding" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes - Clerk handles sign in/up */}
      <Route
        path="/sign-in/*"
        element={
          <div className="min-h-screen flex items-center justify-center">
            <SignedOut>
              <SignIn routing="path" path="/sign-in" />
            </SignedOut>
          </div>
        }
      />
      <Route
        path="/sign-up/*"
        element={
          <div className="min-h-screen flex items-center justify-center">
            <SignedOut>
              <SignUp routing="path" path="/sign-up" />
            </SignedOut>
          </div>
        }
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
          <>
            <SignedIn>
              <Navigate to="/dashboard" replace />
            </SignedIn>
            <SignedOut>
              <Navigate to="/sign-in" replace />
            </SignedOut>
          </>
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