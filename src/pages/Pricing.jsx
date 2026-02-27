import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import './Pricing.css';

export default function Pricing({ session }) {
    return (
        <div className="pricing-page">
            <Header session={session} />
            <main className="pricing-container animate-fade-in">
                <div className="pricing-header">
                    <h1 className="text-gradient font-bold">Simple, transparent pricing</h1>
                    <p className="text-neutral-400 mt-4 max-w-2xl mx-auto">
                        Get the power of AI app generation. Start for free, upgrade when you need more power and credits.
                    </p>
                </div>

                <div className="flex justify-center mt-12">
                    {/* Single Pro Tier */}
                    <div className="pricing-card glass popular" style={{ maxWidth: '420px', width: '100%' }}>
                        <div className="popular-badge">Special Offer</div>
                        <h2 className="tier-name">Pro</h2>
                        <p className="tier-desc">Designed for fast-moving teams building together in real time.</p>

                        <div className="price-container">
                            <span className="price-amount">₹199</span>
                            <span className="price-period">per month</span>
                        </div>
                        <p className="tier-desc">shared across unlimited users</p>

                        <a href="https://cloudzeedev.lemonsqueezy.com/checkout/buy/e10045de-f0a4-4d12-8207-81abb621eb7c" target="_blank" rel="noopener noreferrer" className="btn btn-primary upgrade-btn w-full mt-6 text-center inline-block">Upgrade</a>
                        <div className="credit-select mt-4 text-center text-sm text-neutral-400">
                            100 credits / month
                        </div>

                        <div className="features-list mt-8">
                            <p className="font-bold text-sm mb-4">Everything you need to build faster:</p>
                            <ul>
                                <li>✓ 100 monthly credits</li>
                                <li>✓ Usage-based Cloud + AI</li>
                                <li>✓ Credit rollovers & On-demand top-ups</li>
                                <li>✓ Unlimited cloudzeedev.app domains</li>
                                <li>✓ Custom domains</li>
                                <li>✓ Remove the CloudzeeDev badge</li>
                                <li>✓ User roles & permissions</li>
                                <li>✓ Internal publish & SSO</li>
                                <li>✓ Team workspace & Personal projects</li>
                                <li>✓ Design templates & Role-based access</li>
                                <li>✓ Security center & Dedicated support</li>
                                <li>✓ SCIM & Support for custom connectors</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
