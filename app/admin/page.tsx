
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  interface AdminUser {
    id: string;
    email: string;
    is_active: boolean;
    last_login?: string;
    login_count?: number;
    name?: string;
    role?: string;
  }

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState('');

  // Using the centralized Supabase client from lib/supabase.ts

  useEffect(() => {
    checkAuthStatus();
    
    // Session Listener hinzufügen
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          handleLogout();
        } else if (event === 'SIGNED_IN' && session) {
          await checkAuthStatus();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setError('');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
        setError('Session-Fehler aufgetreten');
        setLoading(false);
        return;
      }

      if (session?.user) {
        // Prüfe ob User ein Admin ist
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', session.user.email)
          .eq('is_active', true)
          .single();

        if (adminError) {
          console.error('Admin check error:', adminError);
          setError('Admin-Berechtigung konnte nicht überprüft werden');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        if (adminData) {
          const typedAdminData = adminData as unknown as AdminUser;
          setAdminUser(typedAdminData);
          setIsAuthenticated(true);

          // Update last login
          await supabase
            .from('admin_users')
            .update({ 
              last_login: new Date().toISOString(),
              login_count: (typedAdminData.login_count || 0) + 1
            })
            .eq('id', typedAdminData.id);
        } else {
          setError('Keine Admin-Berechtigung für diese E-Mail-Adresse');
          await supabase.auth.signOut();
        }
      } else {
        // Keine Session vorhanden - zeige Login-Bildschirm
        console.log('Keine aktive Session gefunden - zeige Login');
        setIsAuthenticated(false);
        setAdminUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setError('Authentifizierungsfehler aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (user: AdminUser) => {
    try {
      // Nochmalige Validierung nach Login
      const { data: { session } } = await supabase.auth.getSession();
      const { data: validatedUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', session?.user?.email || '')
        .eq('is_active', true)
        .single();

      if (error || !validatedUser) {
        setError('Validierung fehlgeschlagen');
        return;
      }

      const typedValidatedUser = validatedUser as unknown as AdminUser;
      setAdminUser(typedValidatedUser);
      setIsAuthenticated(true);
      setError('');
    } catch (error) {
      console.error('Login validation error:', error);
      setError('Login-Validierung fehlgeschlagen');
      await handleLogout();
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setAdminUser(null);
      setError('');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header Skeleton */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Loading indicator */}
        <div className="fixed bottom-4 right-4">
          <div className="bg-[#C04020] text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            <span className="text-sm font-medium">Lade Admin-Bereich...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 flex items-center justify-center bg-red-500 rounded-full mx-auto mb-4">
            <i className="ri-error-warning-line text-2xl text-white"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Fehler aufgetreten</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError('');
              checkAuthStatus();
            }}
            className="bg-[#C04020] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#A03318] transition-colors cursor-pointer"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {!isAuthenticated ? (
        <AdminLogin onLogin={handleLogin} />
      ) : (
        <AdminDashboard adminUser={adminUser} onLogout={handleLogout} />
      )}
    </div>
  );
}
