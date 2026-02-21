import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import Walkthrough from '../components/Walkthrough';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

export default function Home() {
    return (
        <>
            <Header />
            <main>
                <Hero />
                <Stats />
                <Walkthrough />
                <CTA />
            </main>
            <Footer />
        </>
    );
}
