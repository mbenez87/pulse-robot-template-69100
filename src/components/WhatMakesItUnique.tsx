import React, { useEffect, useRef } from "react";

const WhatMakesItUnique = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elements = entry.target.querySelectorAll(".fade-in-element");
            elements.forEach((el, index) => {
              setTimeout(() => {
                el.classList.add("animate-fade-in");
              }, index * 100);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);
  
  return (
    <section className="py-10 sm:py-12 md:py-20 px-4 sm:px-6 md:px-8 relative bg-white" ref={sectionRef}>
      <div className="section-container">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="section-title mb-3 sm:mb-4 opacity-0 fade-in-element">
            What makes it unique
          </h2>
        </div>
        
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-700 leading-relaxed opacity-0 fade-in-element max-w-prose mx-auto text-balance" style={{ fontSize: "clamp(1.125rem, 2.5vw, 1.25rem)" }}>
            A quasi-LLM layer: context graph + semantic cache + policy-aware retrieval that always cites its work.
          </p>
        </div>
      </div>
    </section>
  );
};

export default WhatMakesItUnique;