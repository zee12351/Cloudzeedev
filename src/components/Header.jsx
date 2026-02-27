import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import './Header.css';

export default function Header({ session }) {
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const handleNavClick = (e, targetId) => {
        if (location.pathname !== '/') {
            e.preventDefault();
            navigate('/' + targetId);
        } else {
            // If already on homepage, just scroll smoothly
            e.preventDefault();
            const element = document.getElementById(targetId.substring(1));
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`header ${scrolled ? 'scrolled glass' : ''}`}>
            <div className="container header-container">
                <Link to="/" className="logo cursor-pointer text-gradient">
                    <span className="font-bold">CloudzeeDev</span>
                </Link>

                <nav className="desktop-nav">
                    <a href="#features" onClick={(e) => handleNavClick(e, '#features')} className="nav-link">Features</a>
                    <a href="#community" onClick={(e) => handleNavClick(e, '#community')} className="nav-link">Community</a>
                    <Link to="/pricing" className="nav-link">Pricing</Link>
                </nav>

                <div className="header-actions">
                    {session ? (
                        <>
                            <span className="user-email text-sm text-gray-500 mr-4 hidden md:inline-block">
                                {session.user.email}
                            </span>
                            <button onClick={handleSignOut} className="btn text-sm px-4 py-2 border border-gray-200 rounded-full hover:bg-gray-50 text-gray-700 bg-white">
                                Sign out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/auth" className="login-link">Log in</Link>
                            <Link to="/auth" className="btn btn-primary">
                                Get started
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
