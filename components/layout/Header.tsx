import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../../context/AuthContext';

export const Header: React.FC = () => {
  const appContext = useContext(AppContext);
  const { user: authUser, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  if (!appContext) {
    return null;
  }

  const { user, setUser, users, roles } = appContext;


  const handleSignOut = async () => {
    setLoggingOut(true);
    await signOut();
    setLoggingOut(false);
  };

  const authEmail = authUser?.email || '';
  const initials = authEmail ? authEmail.substring(0, 2).toUpperCase() : 'U';

  return (
    <header className="h-20 bg-white shadow-sm flex items-center justify-between px-6">
      <div className="flex items-center">
        {/* Placeholder for breadcrumbs or page title */}
      </div>
      <div className="flex items-center space-x-6">
        <NotificationBell />

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="font-semibold text-dark-gray leading-tight">{user.name}</p>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{authEmail}</p>
          </div>
          <img
            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
            alt={user.name}
            className="h-10 w-10 border border-slate-200 rounded-full object-cover"
          />
        </div>

        <div className="w-px h-8 bg-slate-200"></div>



        {/* Logout button */}
        <button
          onClick={handleSignOut}
          disabled={loggingOut}
          title="Cerrar Sesión"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            background: loggingOut ? '#f8fafc' : 'white',
            color: '#64748b',
            fontSize: '13px',
            fontWeight: '500',
            cursor: loggingOut ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: loggingOut ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loggingOut) {
              (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2';
              (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#fecaca';
            }
          }}
          onMouseLeave={(e) => {
            if (!loggingOut) {
              (e.currentTarget as HTMLButtonElement).style.background = 'white';
              (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0';
            }
          }}
        >
          {loggingOut ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          )}
          <span style={{ display: 'none' }} className="sm:inline">
            {loggingOut ? 'Saliendo...' : 'Salir'}
          </span>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </button>
      </div>
    </header>
  );
};