import React from "react";
import { ArrowRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const MobileCTA = () => {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg pb-[calc(env(safe-area-inset-bottom)+12px)] px-4 pt-3"
    >
      <div className="flex gap-3 max-w-sm mx-auto">
        <a
          href="/aria"
          className="flex-1 flex items-center justify-center bg-primary text-primary-foreground rounded-full font-medium transition-all duration-200 hover:bg-primary/90 active:scale-95 min-h-[44px] px-5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Open ARIA search interface"
        >
          Open ARIA
          <ArrowRight className="ml-2 w-4 h-4" />
        </a>
        <a
          href="/dashboard"
          className="flex-1 flex items-center justify-center border border-input bg-background text-foreground rounded-full font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground active:scale-95 min-h-[44px] px-5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Go to Dashboard"
        >
          Dashboard
          <ArrowRight className="ml-2 w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default MobileCTA;