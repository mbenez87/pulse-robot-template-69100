import React, { useEffect, useRef } from "react";

const SecurityTrust = () => {
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

  const securityFeatures = [
    "Row-level security on every query; permissions enforced at retrieval time.",
    "No surprise exposure: downloads disabled in answer-only shares; personalized watermarks.",
    "Full accountability: every AI action is logged with model, inputs/outputs hash, and sources."
  ];
  
  return (
    <section className="py-12 sm:py-16 md:py-20 relative bg-gray-50" ref={sectionRef}>
      <div className="section-container">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="section-title mb-3 sm:mb-4 opacity-0 fade-in-element">
            Security & Trust
          </h2>
          <p className="section-subtitle mx-auto opacity-0 fade-in-element">
            Enterprise-grade security with complete transparency and control.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <ul className="space-y-6">
            {securityFeatures.map((feature, index) => (
              <li 
                key={index} 
                className="flex items-start gap-4 opacity-0 fade-in-element"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-pulse-500 flex items-center justify-center mt-1">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-700 text-lg">{feature}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default SecurityTrust;