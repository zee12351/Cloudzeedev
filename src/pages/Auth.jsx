import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import './Auth.css';

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
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
