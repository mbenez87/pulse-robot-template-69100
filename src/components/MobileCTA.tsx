import React from "react";
import { ArrowRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const MobileCTA = () => {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)",
        paddingLeft: "max(env(safe-area-inset-left, 0px), 16px)",
        paddingRight: "max(env(safe-area-inset-right, 0px), 16px)",
        paddingTop: "12px"
      }}
    >
      <div className="flex gap-3">
        <a
          href="/aria"
          className="flex-1 flex items-center justify-center bg-[#FE5C02] text-white rounded-full font-medium transition-all duration-200 hover:bg-[#E5520A] active:scale-95"
          style={{
            minHeight: "44px",
            padding: "12px 20px",
            fontSize: "14px",
            lineHeight: "20px"
          }}
          aria-label="Open ARIA search interface"
        >
          Open ARIA
          <ArrowRight className="ml-2 w-4 h-4" />
        </a>
        <a
          href="/upload"
          className="flex-1 flex items-center justify-center border border-gray-300 bg-white text-gray-800 rounded-full font-medium transition-all duration-200 hover:bg-gray-50 active:scale-95"
          style={{
            minHeight: "44px",
            padding: "12px 20px",
            fontSize: "14px",
            lineHeight: "20px"
          }}
          aria-label="Upload documents to Signal87"
        >
          Upload
          <ArrowRight className="ml-2 w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default MobileCTA;