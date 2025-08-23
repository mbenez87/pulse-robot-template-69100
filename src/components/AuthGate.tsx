import { ReactNode, useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { SessionSkeleton } from './SessionSkeleton';

// Route configuration
const LOGIN_ROUTE = '/auth';  // Using existing auth route
const HOME_ROUTE = '/dashboard';
const PUBLIC_ROUTES = [LOGIN_ROUTE, '/', '/about', '/contact', '/platform', '/aria', '/privacy', '/terms'];

interface AuthGateProps {
  children: ReactNode;
}

export const AuthGate = ({ children }: AuthGateProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const hasRedirected = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('AuthGate: Error getting initial session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('AuthGate: Auth state change:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Only redirect after session is determined and prevent duplicate redirects
    if (loading) return;

    const currentPath = location.pathname;
    const isPublicRoute = PUBLIC_ROUTES.includes(currentPath);
    const hasSession = !!session;

    let shouldRedirect = false;
    let redirectTo = '';

    // Redirect logic (ONLY HERE)
    if (!hasSession && !isPublicRoute) {
      // No session and on protected route → go to login
      shouldRedirect = true;
      redirectTo = LOGIN_ROUTE;
    } else if (hasSession && currentPath === LOGIN_ROUTE) {
      // Has session and on login page → go to dashboard
      shouldRedirect = true;
      redirectTo = HOME_ROUTE;
    }

    if (shouldRedirect) {
      if (hasRedirected.current) {
        console.warn('AuthGate: Attempted double redirect prevented!', { from: currentPath, to: redirectTo });
        return;
      }
      
      hasRedirected.current = true;
      console.log(`AuthGate: Redirecting from ${currentPath} to ${redirectTo}`);
      navigate(redirectTo, { replace: true });
      
      // Reset redirect flag after navigation
      setTimeout(() => {
        hasRedirected.current = false;
      }, 100);
    }
  }, [loading, session, location.pathname, navigate]);

  // Show skeleton while loading
  if (loading) {
    return <SessionSkeleton />;
  }

  // Render children
  return <>{children}</>;
};