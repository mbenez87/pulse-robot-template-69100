import React, { useEffect, useRef } from "react";

const ARIASection = () => {
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

  const features = [
    "Perplexity-style centered bar with a Model dropdown (Claude, GPT-5, Gemini, Sonar).",
    "Citations-first answers you can trust; click to open the exact place in the source file.",
    "Answer-only mode for external guests—insights without file access."
  ];
  
  return (
    <section className="py-12 sm:py-16 md:py-20 relative bg-white" ref={sectionRef}>
      <div className="section-container">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="section-title mb-3 sm:mb-4 opacity-0 fade-in-element">
            ARIA (the search experience)
          </h2>
          <p className="section-subtitle mx-auto opacity-0 fade-in-element">
            A clean, powerful interface designed for intelligent document search.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <ul className="space-y-6">
            {features.map((feature, index) => (
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
                <p className="text-gray-700 text-lg">{feature}</p>
              </li>
            ))}
          </ul>
          
          <div className="text-center mt-12 opacity-0 fade-in-element" style={{ animationDelay: "0.4s" }}>
            <a 
              href="/aria" 
              className="inline-flex items-center justify-center px-8 py-3 bg-pulse-500 text-white rounded-full hover:bg-pulse-600 transition-colors font-medium"
            >
              Try ARIA Now
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ARIASection;