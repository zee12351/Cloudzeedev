import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';

import Pricing from './pages/Pricing'; import LivePreview from './pages/LivePreview';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home session={session} />} />
      <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={session ? <Dashboard session={session} /> : <Navigate to="/auth" />} />
      <Route path="/workspace/:id" element={session ? <Workspace session={session} /> : <Navigate to="/auth" />} />
      <Route path="/pricing" element={<Pricing session={session} />} />
      <Route path="/live" element={<LivePreview />} />
    </Routes>
  );
}

export default App;
