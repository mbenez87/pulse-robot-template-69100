
import React, { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import WhatYouCanDo from "@/components/WhatYouCanDo";
import HowItWorks from "@/components/HowItWorks";
import ARIASection from "@/components/ARIASection";
import SecurityTrust from "@/components/SecurityTrust";
import WhatMakesItUnique from "@/components/WhatMakesItUnique";
import Newsletter from "@/components/Newsletter";
import MadeByHumans from "@/components/MadeByHumans";
import Footer from "@/components/Footer";
import MobileCTA from "@/components/MobileCTA";

const Index = () => {
  // Initialize intersection observer to detect when elements enter viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    const elements = document.querySelectorAll(".animate-on-scroll");
    elements.forEach((el) => observer.observe(el));
    
    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  useEffect(() => {
    // This helps ensure smooth scrolling for the anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href')?.substring(1);
        if (!targetId) return;
        
        const targetElement = document.getElementById(targetId);
        if (!targetElement) return;
        
        // Increased offset to account for mobile nav
        const offset = window.innerWidth < 768 ? 100 : 80;
        
        window.scrollTo({
          top: targetElement.offsetTop - offset,
          behavior: 'smooth'
        });
      });
    });
  }, []);

  return (
    <div className="min-h-[100svh] min-h-screen">
      <Navbar />
      <main className="space-y-4 sm:space-y-8 pb-20 sm:pb-0">
        <Hero />
        <Features />
        <WhatYouCanDo />
        <HowItWorks />
        <ARIASection />
        <SecurityTrust />
        <WhatMakesItUnique />
        <Newsletter />
        <MadeByHumans />
      </main>
      <Footer />
      <MobileCTA />
    </div>
  );
};

export default Index;
