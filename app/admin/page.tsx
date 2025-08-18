
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
          setAdminUser(adminData);
          setIsAuthenticated(true);

          // Update last login
          await supabase
            .from('admin_users')
            .update({ 
              last_login: new Date().toISOString(),
              login_count: (adminData.login_count || 0) + 1
            })
            .eq('id', adminData.id);
        } else {
          setError('Keine Admin-Berechtigung für diese E-Mail-Adresse');
          await supabase.auth.signOut();
        }
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
      const { data: validatedUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .eq('is_active', true)
        .single();

      if (error || !validatedUser) {
        throw new Error('Benutzer-Validierung fehlgeschlagen');
      }

      setAdminUser(validatedUser);
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4 animate-pulse">
            <i className="ri-admin-line text-2xl text-white"></i>
          </div>
          <p className="text-lg font-medium text-gray-700">Lade Admin-Bereich...</p>
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
