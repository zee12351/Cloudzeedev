import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-top">
                    <div className="footer-brand">
                        <h2 className="footer-logo text-gradient">CloudzeeDev</h2>
                        <p className="footer-tagline">No-code app builder</p>
                    </div>

                    <div className="footer-links">
                        <div className="link-group">
                            <h3>Product</h3>
                            <Link to="/pricing">Pricing</Link>
                            <Link to="/">Solutions</Link>
                            <Link to="/">Changelog</Link>
                        </div>

                        <div className="link-group">
                            <h3>Community</h3>
                            <Link to="/">Expert Program</Link>
                            <a href="https://discord.com" target="_blank" rel="noopener noreferrer">Discord</a>
                            <a href="https://x.com" target="_blank" rel="noopener noreferrer">Twitter / X</a>
                        </div>

                        <div className="link-group">
                            <h3>Resources</h3>
                            <Link to="/">Learn</Link>
                            <Link to="/">Templates</Link>
                            <Link to="/">Blog</Link>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} CloudzeeDev Clone. Not affiliated with cloudzeedev.dev.</p>
                    <div className="legal-links">
                        <Link to="/">Privacy</Link>
                        <Link to="/">Terms</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
