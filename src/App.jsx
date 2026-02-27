import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import Pricing from './pages/Pricing';
import LivePreview from './pages/LivePreview';
import { Toaster } from 'sonner';
import { useAuth } from './context/AuthContext';

function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/auth" />} />
        <Route path="/workspace/:id" element={session ? <Workspace /> : <Navigate to="/auth" />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/live" element={<LivePreview />} />
      </Routes>
      <Toaster position="bottom-right" theme="dark" richColors />
    </>
  );
}

export default App;
