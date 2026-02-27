import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import './Pricing.css';

export default function Pricing() {
    return (
        <div className="pricing-page">
            <Header />
            <main className="pricing-container animate-fade-in">
                <div className="pricing-header">
                    <h1 className="text-gradient font-bold">Simple, transparent pricing</h1>
                    <p className="text-neutral-400 mt-4 max-w-2xl mx-auto">
                        Get the power of AI app generation. Start for free, upgrade when you need more power and credits.
                    </p>
                </div>

                <div className="pricing-grid">
                    {/* Pro Tier */}
                    <div className="pricing-card glass">
                        <h2 className="tier-name">Pro</h2>
                        <p className="tier-desc">Designed for fast-moving teams building together in real time.</p>

                        <div className="price-container">
                            <span className="price-amount">$2.50</span>
                            <span className="price-period">per month</span>
                        </div>
                        <p className="tier-desc">shared across unlimited users</p>

                        <a href="https://cloudzeedev.lemonsqueezy.com/checkout/buy/pro-plan" target="_blank" rel="noopener noreferrer" className="btn btn-primary upgrade-btn w-full mt-6 text-center inline-block">Upgrade</a>
                        <div className="credit-select mt-4 text-center text-sm text-neutral-400">
                            20 credits / month
                        </div>

                        <div className="features-list mt-8">
                            <p className="font-bold text-sm mb-4">All features in Free, plus:</p>
                            <ul>
                                <li>✓ 20 monthly credits</li>
                                <li>✓ 5 daily credits (up to 150/month)</li>
                                <li>✓ Usage-based Cloud + AI</li>
                                <li>✓ Credit rollovers</li>
                                <li>✓ On-demand credit top-ups</li>
                                <li>✓ Unlimited cloudzeedev.app domains</li>
                                <li>✓ Custom domains</li>
                                <li>✓ Remove the CloudzeeDev badge</li>
                                <li>✓ User roles & permissions</li>
                            </ul>
                        </div>
                    </div>

                    {/* Business Tier */}
                    <div className="pricing-card glass popular">
                        <div className="popular-badge">Most Popular</div>
                        <h2 className="tier-name">Business</h2>
                        <p className="tier-desc">Advanced controls and power features for growing departments</p>

                        <div className="price-container">
                            <span className="price-amount">$25</span>
                            <span className="price-period">per month</span>
                        </div>
                        <p className="tier-desc">shared across unlimited users</p>

                        <a href="https://cloudzeedev.lemonsqueezy.com/checkout/buy/business-plan" target="_blank" rel="noopener noreferrer" className="btn btn-primary upgrade-btn w-full mt-6 text-center inline-block">Upgrade</a>
                        <div className="credit-select mt-4 text-center text-sm text-neutral-400">
                            100 credits / month
                        </div>

                        <div className="features-list mt-8">
                            <p className="font-bold text-sm mb-4">All features in Pro, plus:</p>
                            <ul>
                                <li>✓ 100 monthly credits</li>
                                <li>✓ Internal publish</li>
                                <li>✓ SSO</li>
                                <li>✓ Team workspace</li>
                                <li>✓ Personal projects</li>
                                <li>✓ Design templates</li>
                                <li>✓ Role-based access</li>
                                <li>✓ Security center</li>
                            </ul>
                        </div>
                    </div>

                    {/* Enterprise Tier */}
                    <div className="pricing-card glass">
                        <h2 className="tier-name">Enterprise</h2>
                        <p className="tier-desc">Built for large orgs needing flexibility, scale, and governance.</p>

                        <div className="price-container mt-6">
                            <span className="price-amount" style={{ fontSize: '2rem' }}>Custom</span>
                        </div>
                        <p className="tier-desc mt-6">Flexible plans</p>

                        <button className="btn btn-secondary upgrade-btn w-full mt-6">Book a demo</button>

                        <div className="features-list mt-8">
                            <p className="font-bold text-sm mb-4">All features in Business, plus:</p>
                            <ul>
                                <li>✓ Dedicated support</li>
                                <li>✓ Onboarding services</li>
                                <li>✓ Design systems</li>
                                <li>✓ SCIM</li>
                                <li>✓ Support for custom connectors</li>
                                <li>✓ Publishing controls</li>
                                <li>✓ Sharing controls</li>
                                <li>✓ Audit logs (coming soon!)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
