
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import LottieAnimation from "./LottieAnimation";
import ariaDocumentsInterface from "@/assets/aria-documents-interface.png";

const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [lottieData, setLottieData] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile on mount and when window resizes
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetch('/loop-header.lottie')
      .then(response => response.json())
      .then(data => setLottieData(data))
      .catch(error => console.error("Error loading Lottie animation:", error));
  }, []);

  useEffect(() => {
    // Skip effect on mobile
    if (isMobile) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !imageRef.current) return;
      
      const {
        left,
        top,
        width,
        height
      } = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - left) / width - 0.5;
      const y = (e.clientY - top) / height - 0.5;

      imageRef.current.style.transform = `perspective(1000px) rotateY(${x * 2.5}deg) rotateX(${-y * 2.5}deg) scale3d(1.02, 1.02, 1.02)`;
    };
    
    const handleMouseLeave = () => {
      if (!imageRef.current) return;
      imageRef.current.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)`;
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);
    }
    
    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [isMobile]);
  
  useEffect(() => {
    // Skip parallax on mobile
    if (isMobile) return;
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const elements = document.querySelectorAll('.parallax');
      elements.forEach(el => {
        const element = el as HTMLElement;
        const speed = parseFloat(element.dataset.speed || '0.1');
        const yPos = -scrollY * speed;
        element.style.setProperty('--parallax-y', `${yPos}px`);
      });
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);
  
  return (
    <section 
      className="overflow-hidden relative bg-cover min-h-[100svh] min-h-screen flex items-center" 
      id="hero" 
      style={{
        backgroundImage: 'url("/Header-background.webp")',
        backgroundPosition: 'center 30%', 
        paddingTop: `max(env(safe-area-inset-top, 0px), ${isMobile ? '60px' : '80px'})`,
        paddingBottom: `max(env(safe-area-inset-bottom, 0px), ${isMobile ? '40px' : '60px'})`,
        paddingLeft: `max(env(safe-area-inset-left, 0px), ${isMobile ? '12px' : '20px'})`,
        paddingRight: `max(env(safe-area-inset-right, 0px), ${isMobile ? '12px' : '20px'})`
      }}
    >
      <div className="absolute -top-[10%] -right-[5%] w-1/2 h-[70%] bg-pulse-gradient opacity-20 blur-3xl rounded-full"></div>
      
      <div className="container px-4 sm:px-6 lg:px-8" ref={containerRef}>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-center">
          <div className="w-full lg:w-1/2">
            <div 
              className="pulse-chip mb-3 sm:mb-6 opacity-0 animate-fade-in" 
              style={{ animationDelay: "0.1s" }}
            >
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pulse-500 text-white mr-2">01</span>
              <span>AI-Powered</span>
            </div>
            
            <h1 
              className="section-title leading-tight opacity-0 animate-fade-in text-balance" 
              style={{ 
                animationDelay: "0.3s",
                fontSize: "clamp(1.75rem, 4vw, 3rem)"
              }}
            >
              Bring your documents to life.
            </h1>
            
            <p 
              className="section-subtitle mt-3 sm:mt-6 mb-4 sm:mb-8 leading-snug opacity-0 animate-fade-in text-gray-950 font-normal text-left max-w-prose"
              style={{
                animationDelay: "0.5s",
                fontSize: "clamp(1rem, 2.5vw, 1.125rem)"
              }}
            >
              A clean, Perplexity-style interface powered by Claude, GPT-5, Gemini, and Sonar—built to search, answer, and act on your files with citations and control.
            </p>
            
            <div 
              className="flex flex-col sm:flex-row gap-4 opacity-0 animate-fade-in" 
              style={{ animationDelay: "0.7s" }}
            >
              <a 
                href="/aria" 
                className="flex items-center justify-center group w-full sm:w-auto text-center" 
                style={{
                  backgroundColor: '#FE5C02',
                  borderRadius: '1440px',
                  boxSizing: 'border-box',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '14px',
                  lineHeight: '20px',
                  padding: '16px 24px',
                  border: '1px solid white',
                  minHeight: '44px'
                }}
              >
                Open ARIA
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a 
                href="/upload" 
                className="flex items-center justify-center group w-full sm:w-auto text-center border border-white/20 bg-white/10 backdrop-blur-sm text-gray-800 hover:bg-white/20 transition-all duration-200" 
                style={{
                  borderRadius: '1440px',
                  padding: '16px 24px',
                  fontSize: '14px',
                  lineHeight: '20px',
                  minHeight: '44px'
                }}
              >
                Upload documents
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>
          
          <div className="w-full lg:w-1/2 relative mt-6 lg:mt-0">
            {lottieData ? (
              <div className="relative z-10 animate-fade-in" style={{ animationDelay: "0.9s" }}>
                <LottieAnimation 
                  animationPath={lottieData} 
                  className="w-full h-auto max-w-lg mx-auto"
                  loop={true}
                  autoplay={true}
                />
              </div>
            ) : (
              <>
              <div className="absolute inset-0 bg-dark-900 rounded-2xl sm:rounded-3xl -z-10 shadow-xl"></div>
              <div className="relative transition-all duration-500 ease-out overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl">
                <img 
                  ref={imageRef} 
                  src="/lovable-uploads/2d9b9e9c-fa01-497d-af8c-c6475f6d94c6.png" 
                  alt="Advanced humanoid robot with AI capabilities" 
                  className="w-full h-auto object-cover transition-transform duration-500 ease-out" 
                  style={{ transformStyle: 'preserve-3d' }} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pulse-900/60 to-transparent"></div>
              </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="hidden lg:block absolute bottom-0 left-1/4 w-64 h-64 bg-pulse-100/30 rounded-full blur-3xl -z-10 parallax" data-speed="0.05"></div>
    </section>
  );
};

export default Hero;
