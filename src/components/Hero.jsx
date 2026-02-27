import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Hero.css';

export default function Hero() {
    const { session } = useAuth();
    const [prompt, setPrompt] = useState('');
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setPrompt(prev => prev + `[Attached: ${file.name}] `);
        }
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();

        if (!prompt.trim()) return;

        // Optionally, we could pass the prompt to the next page via state
        // For now, redirect users to either create a project or login
        if (session) {
            navigate('/workspace/new', { state: { initialPrompt: prompt } });
        } else {
            navigate('/auth', { state: { initialPrompt: prompt } });
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <section className="hero">
            <div className="hero-background">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
            </div>

            <div className="container hero-content animate-fade-in">
                <h1 className="hero-title">
                    Build apps & websites <br />
                    with AI, <span className="text-gradient">Fast</span>
                </h1>
                <p className="hero-subtitle">
                    Your superhuman full stack engineer. Chat with AI to build web apps. Sync with GitHub. One-click deploy.
                </p>

                <div className="prompt-container glass">
                    <div className="prompt-header">
                        <span className="prompt-prefix">Ask CloudzeeDev to build</span>
                        <span className="prompt-typing">your saas startup_</span>
                    </div>

                    <form className="prompt-form" onSubmit={handleSubmit}>
                        <textarea
                            className="prompt-input"
                            placeholder="What do you want to build?"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows="3"
                        ></textarea>
                        <div className="prompt-actions">
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                            <button type="button" className="btn btn-secondary attach-btn" onClick={() => fileInputRef.current?.click()}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                Attach
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary submit-btn"
                                disabled={!prompt.trim()}
                            >
                                Start building
                            </button>
                        </div>
                    </form>
                </div>

                <div className="trusted-by">
                    <p>Teams from top companies build with CloudzeeDev</p>
                    <div className="logos">
                        {/* Using text for demo, imagine SVG logos here */}
                        <span>Netflix</span>
                        <span>Meta</span>
                        <span>Vercel</span>
                        <span>Spotify</span>
                        <span>Shopify</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
