import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProtectedRoute from './components/ProtectedRoute';
import SidebarLayout from './components/SidebarLayout';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import CoursesManagement from './pages/CoursesManagement';
import AdminDashboard from './pages/AdminDashboard';
import Unauthorized from './pages/Unauthorized';
import VerifyEmail from './pages/VerifyEmail';
import Materials from './pages/Materials';
import Chat from './pages/Chat';
import './tailwind.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
  if (user.role === 'TEACHER') return <Navigate to="/teacher" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <Navigate to="/unauthorized" replace />;
};

// Redirects already-authenticated users away from public-only routes (e.g. /login)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return children;
  if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
  if (user.role === 'TEACHER') return <Navigate to="/teacher" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <Navigate to="/unauthorized" replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <SidebarLayout>
            <Routes>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/verify" element={<PublicRoute><VerifyEmail /></PublicRoute>} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              <Route 
                path="/student" 
                element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/teacher" 
                element={
                  <ProtectedRoute allowedRoles={['TEACHER']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/courses" 
                element={
                  <ProtectedRoute allowedRoles={['TEACHER']}>
                    <CoursesManagement />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/materials" 
                element={
                  <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER']}>
                    <Materials />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/chat" 
                element={
                  <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER']}>
                    <Chat />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="/" element={<HomeRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SidebarLayout>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
