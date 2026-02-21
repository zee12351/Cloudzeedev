import React from 'react';
import './CTA.css';

export default function CTA() {
    return (
        <section className="cta-section">
            <div className="container cta-container glass animate-fade-in">
                <h2 className="cta-title">Ready to build?</h2>
                <p className="cta-subtitle">Turn your ideas into reality with Loveable's AI.</p>
                <button className="btn btn-primary btn-large">Get started for free</button>
            </div>
        </section>
    );
}
