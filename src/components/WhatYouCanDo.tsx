import React, { useEffect, useRef } from "react";

const WhatYouCanDo = () => {
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

  const capabilities = [
    "Ask across your corpus with page-level citations.",
    "Extract contract intelligence & track renewals/obligations.",
    "Redact sensitive content with per-viewer watermarks.",
    "Turn documents into structured records for analytics.",
    "Simulate governance; view privacy-respecting reviewer analytics."
  ];
  
  return (
    <section className="py-10 sm:py-12 md:py-20 px-4 sm:px-6 md:px-8 relative bg-white" ref={sectionRef}>
      <div className="section-container">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="section-title mb-3 sm:mb-4 opacity-0 fade-in-element">
            What you can do
          </h2>
          <p className="section-subtitle mx-auto opacity-0 fade-in-element max-w-prose text-balance">
            Powerful capabilities that transform how you work with documents.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <ul className="space-y-6">
            {capabilities.map((capability, index) => (
              <li 
                key={index} 
                className="flex items-start gap-4 opacity-0 fade-in-element"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-pulse-500 flex items-center justify-center mt-1">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-700 text-lg">{capability}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default WhatYouCanDo;