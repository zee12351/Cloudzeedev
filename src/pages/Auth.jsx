import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import './Auth.css';

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });

    const location = useLocation();
    const navigate = useNavigate();
    const initialPrompt = location.state?.initialPrompt;

    // Parse referral code from URL if it exists
    const searchParams = new URLSearchParams(location.search);
    const referralId = searchParams.get('ref');

    const handleGoogleAuth = async () => {
        setLoading(true);
        setMessage({ text: '', type: '' });
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
        } catch (error) {
            setMessage({ text: error.message || error.error_description, type: 'error' });
            setLoading(false);
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                // If there's an initial prompt, route directly to workspace instead of dashboard
                if (initialPrompt) {
                    navigate('/workspace/new', { state: { initialPrompt } });
                }
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            referee: referralId || null
                        }
                    }
                });
                if (error) throw error;
                setMessage({ text: 'Check your email for the login link!', type: 'success' });
            }
        } catch (error) {
            setMessage({ text: error.message || error.error_description, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container glass animate-fade-in">
                <h2 className="auth-title">
                    {isLogin ? 'Welcome back' : 'Create your account'}
                </h2>

                <p className="auth-subtitle">
                    {isLogin ? 'Log in to continue building' : 'Get started for free'}
                </p>

                {message.text && (
                    <div className={`auth-message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <button
                    type="button"
                    className="btn btn-secondary auth-submit auth-google"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                    Continue with Google
                </button>

                <div className="auth-divider">
                    <span>OR</span>
                </div>

                <form className="auth-form" onSubmit={handleAuth}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            required
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Your email address"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            required
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Your password"
                        />
                    </div>

                    <button className="btn btn-primary auth-submit" disabled={loading}>
                        {loading ? 'Loading...' : isLogin ? 'Log in' : 'Sign up'}
                    </button>
                </form>

                <div className="auth-toggle">
                    <span>{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
                    <button
                        type="button"
                        className="toggle-btn text-gradient"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? 'Sign up' : 'Log in'}
                    </button>
                </div>
            </div>
        </div>
    );
}
