import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

export default function Header() {
    const [scrolled, setScrolled] = useState(false);

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
                    <Link to="/features" className="nav-link">Features</Link>
                    <Link to="/community" className="nav-link">Community</Link>
                    <Link to="/pricing" className="nav-link">Pricing</Link>
                </nav>

                <div className="header-actions">
                    <Link to="/auth" className="login-link">Log in</Link>
                    <Link to="/auth" className="btn btn-primary">
                        Get started
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </Link>
                </div>
            </div>
        </header>
    );
}
