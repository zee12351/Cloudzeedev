import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import Walkthrough from '../components/Walkthrough';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

export default function Home({ session }) {
    return (
        <>
            <Header session={session} />
            <main>
                <Hero session={session} />
                <Stats />
                <Walkthrough />
                <CTA session={session} />
            </main>
            <Footer />
        </>
    );
}
