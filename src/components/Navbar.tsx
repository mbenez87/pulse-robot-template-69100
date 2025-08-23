
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, Home, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // AuthGate will handle redirect to login
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    // Prevent background scrolling when menu is open
    document.body.style.overflow = !isMenuOpen ? 'hidden' : '';
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Close mobile menu if open
    if (isMenuOpen) {
      setIsMenuOpen(false);
      document.body.style.overflow = '';
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-14 md:h-16 transition-all duration-300 pt-[env(safe-area-inset-top)]",
        isScrolled 
          ? "bg-white/80 backdrop-blur-md shadow-sm" 
          : "bg-transparent"
      )}
    >
      <div className="container flex items-center justify-between h-full px-4 md:px-6">
        <Link 
          to="/" 
          className="flex items-center space-x-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
          aria-label="Signal87 AI Home"
        >
          <img 
            src="/lovable-uploads/331fb3d1-7cea-4b50-8589-07aaaf379ef6.png" 
            alt="Signal87 AI" 
            width="128"
            height="32"
            className="h-8 w-auto md:h-9 dark:invert" 
            loading="eager"
            decoding="async"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            to="/" 
            className="nav-link flex items-center gap-2 min-h-[44px] px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
          <Link to="/aria" className="nav-link min-h-[44px] px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">ARIA</Link>
          <Link to="/platform" className="nav-link min-h-[44px] px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">Platform</Link>
          <Link to="/about" className="nav-link min-h-[44px] px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">About</Link>
          <Link to="/contact" className="nav-link min-h-[44px] px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">Contact</Link>
          {isAuthenticated && (
            <Link to="/dashboard" className="nav-link min-h-[44px] px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">Dashboard</Link>
          )}
          
          <div className="flex items-center gap-3 ml-6">
            {isAuthenticated ? (
              <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild className="button-primary">
                  <Link to="/platform">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </nav>

        {/* Mobile menu button - increased touch target */}
        <button 
          className="md:hidden text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md" 
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation - improved for better touch experience */}
      <div className={cn(
        "fixed inset-0 z-40 bg-white flex flex-col pt-16 px-6 md:hidden transition-all duration-300 ease-in-out pb-[calc(env(safe-area-inset-bottom)+12px)]",
        isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
      )}>
        <nav className="flex flex-col space-y-6 items-center mt-8">
          <Link 
            to="/" 
            className="text-xl font-medium min-h-[44px] px-6 w-full text-center rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" 
            onClick={() => {
              setIsMenuOpen(false);
              document.body.style.overflow = '';
            }}
          >
            <Home className="h-5 w-5" />
            Home
          </Link>
          <Link 
            to="/aria" 
            className="text-xl font-medium min-h-[44px] px-6 w-full text-center rounded-lg hover:bg-gray-100 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" 
            onClick={() => {
              setIsMenuOpen(false);
              document.body.style.overflow = '';
            }}
          >
            ARIA
          </Link>
          <Link 
            to="/platform" 
            className="text-xl font-medium min-h-[44px] px-6 w-full text-center rounded-lg hover:bg-gray-100 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" 
            onClick={() => {
              setIsMenuOpen(false);
              document.body.style.overflow = '';
            }}
          >
            Platform
          </Link>
          <Link 
            to="/about" 
            className="text-xl font-medium min-h-[44px] px-6 w-full text-center rounded-lg hover:bg-gray-100 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" 
            onClick={() => {
              setIsMenuOpen(false);
              document.body.style.overflow = '';
            }}
          >
            About
          </Link>
          <Link 
            to="/contact" 
            className="text-xl font-medium min-h-[44px] px-6 w-full text-center rounded-lg hover:bg-gray-100 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" 
            onClick={() => {
              setIsMenuOpen(false);
              document.body.style.overflow = '';
            }}
          >
            Contact
          </Link>
          
          {isAuthenticated && (
            <Link 
              to="/dashboard" 
              className="text-xl font-medium min-h-[44px] px-6 w-full text-center rounded-lg hover:bg-gray-100 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" 
              onClick={() => {
                setIsMenuOpen(false);
                document.body.style.overflow = '';
              }}
            >
              Dashboard
            </Link>
          )}
          
          <div className="flex flex-col gap-3 w-full mt-8">
            {isAuthenticated ? (
              <Button 
                variant="outline" 
                onClick={() => {
                  handleSignOut();
                  setIsMenuOpen(false);
                  document.body.style.overflow = '';
                }}
                className="w-full flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/auth" onClick={() => {
                    setIsMenuOpen(false);
                    document.body.style.overflow = '';
                  }}>
                    Sign In
                  </Link>
                </Button>
                <Button asChild className="button-primary w-full">
                  <Link to="/auth" onClick={() => {
                    setIsMenuOpen(false);
                    document.body.style.overflow = '';
                  }}>
                    Get Started
                  </Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
