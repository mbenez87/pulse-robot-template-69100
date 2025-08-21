
import React from "react";

const ImageShowcaseSection = () => {
  return (
    <section className="w-full pt-0 pb-8 sm:pb-12 bg-white" id="showcase">
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12 animate-on-scroll">
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-gray-900 mb-3 sm:mb-4">
            See ARIA in Action
          </h2>
          <p className="text-base sm:text-lg text-gray-600">
            Our intuitive document management platform is designed to transform how teams 
            organize, search, and collaborate on their most important files.
          </p>
        </div>
        
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-elegant mx-auto max-w-4xl animate-on-scroll">
          <div className="w-full">
            <img 
              src="/lovable-uploads/7a406227-95fb-4c57-9bb3-1c0d71f7b365.png" 
              alt="ARIA document management platform interface showing organized documents and AI-powered search" 
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="bg-white p-4 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-display font-semibold mb-3 sm:mb-4">Intelligent Document Management</h3>
            <p className="text-gray-700 text-sm sm:text-base">
              Built with advanced AI and intuitive design, ARIA seamlessly integrates into your workflow, 
              from small teams to enterprise organizations, providing intelligent organization 
              and enhancing productivity across all document types.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImageShowcaseSection;
