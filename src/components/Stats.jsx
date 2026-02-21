import React from 'react';
import './Stats.css';

export default function Stats() {
    const stats = [
        { value: '1M+', label: 'projects built on CloudzeeDev' },
        { value: '15k+', label: 'projects built per day on CloudzeeDev' },
        { value: '2M+', label: 'visits per day to CloudzeeDev-built applications' },
    ];

    return (
        <section className="stats-section">
            <div className="container text-center">
                <h2 className="stats-title">
                    CloudzeeDev <span className="text-gradient">in numbers</span>
                </h2>
                <p className="stats-subtitle">
                    Millions of builders are already turning ideas into reality
                </p>

                <div className="stats-grid">
                    {stats.map((stat, i) => (
                        <div key={i} className="stat-card glass animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                            <div className="stat-value">{stat.value}</div>
                            <div className="stat-label">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
