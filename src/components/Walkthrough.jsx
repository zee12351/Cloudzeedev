import React from 'react';
import './Walkthrough.css';

export default function Walkthrough() {
    const steps = [
        {
            number: '1',
            title: 'Start with an idea',
            description: 'Describe the app or website you want to create or drop in screenshots and docs.'
        },
        {
            number: '2',
            title: 'Watch it come to life',
            description: 'See your vision transform into a working prototype in real-time as AI builds it for you.'
        },
        {
            number: '3',
            title: 'Refine and ship',
            description: 'Iterate on your creation with simple feedback and deploy it to the world with one click.'
        }
    ];

    return (
        <section id="features" className="walkthrough-section">
            <div className="container">
                <h2 className="walkthrough-title text-center">Meet CloudzeeDev</h2>

                <div className="steps-container">
                    {steps.map((step, index) => (
                        <div key={index} className="step-card glass animate-fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
                            <div className="step-number text-gradient">{step.number}</div>
                            <h3 className="step-title">{step.title}</h3>
                            <p className="step-desc">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
