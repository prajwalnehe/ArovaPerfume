import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

export default function AuthSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const run = async () => {
      try {
        const data = await api.me();
        const user = data?.user || null;
        try { localStorage.setItem('auth_token', 'cookie'); } catch {}
        try { window.dispatchEvent(new Event('auth:updated')); } catch {}
        if (user?.isAdmin) {
          try { localStorage.setItem('auth_is_admin', 'true'); } catch {}
        } else {
          try { localStorage.removeItem('auth_is_admin'); } catch {}
        }
      } catch {}
      const redirectTo = '/';
      navigate(redirectTo, { replace: true, state: location.state });
    };
    run();
  }, [navigate, location.state]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-600 mx-auto mb-4"></div>
        <div className="text-gray-700">Signing you in…</div>
      </div>
    </div>
  );
}
