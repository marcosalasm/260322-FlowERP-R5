import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const LoginPage: React.FC = () => {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { error } = await signIn(email, password);
            if (error) {
                if (error.message.includes('Invalid login credentials')) {
                    setError('Correo o contraseña incorrectos. Por favor verifica tus datos.');
                } else if (error.message.includes('Email not confirmed')) {
                    setError('Tu correo no ha sido confirmado. Revisa tu bandeja de entrada.');
                } else {
                    setError(error.message);
                }
            }
        } catch (err) {
            setError('Ocurrió un error inesperado. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Animated background orbs */}
            <div style={{
                position: 'absolute',
                width: '600px',
                height: '600px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
                top: '-200px',
                left: '-150px',
                animation: 'float 8s ease-in-out infinite',
            }} />
            <div style={{
                position: 'absolute',
                width: '500px',
                height: '500px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
                bottom: '-150px',
                right: '-100px',
                animation: 'float 10s ease-in-out infinite reverse',
            }} />

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(2deg); }
          66% { transform: translateY(10px) rotate(-1deg); }
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .login-card {
          animation: fadeInUp 0.6s ease-out;
        }

        .login-input {
          width: 100%;
          padding: 13px 16px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          color: #f1f5f9;
          font-size: 15px;
          font-family: 'Inter', sans-serif;
          transition: all 0.25s ease;
          outline: none;
          box-sizing: border-box;
        }

        .login-input::placeholder {
          color: rgba(148,163,184,0.7);
        }

        .login-input:focus {
          border-color: rgba(59,130,246,0.7);
          background: rgba(255,255,255,0.1);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
        }

        .login-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #06b6d4 100%);
          background-size: 200% auto;
          color: white;
          letter-spacing: 0.3px;
        }

        .login-btn:hover:not(:disabled) {
          background-position: right center;
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(59,130,246,0.4);
        }

        .login-btn:active:not(:disabled) {
          transform: translateY(0px);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .toggle-password {
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(148,163,184,0.8);
          padding: 0;
          transition: color 0.2s;
        }

        .toggle-password:hover {
          color: #94a3b8;
        }

        .error-box {
          animation: fadeInUp 0.3s ease-out;
        }

        .logo-icon {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

            {/* Login card */}
            <div className="login-card" style={{
                width: '420px',
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px',
                padding: '44px 40px',
                boxShadow: '0 32px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                position: 'relative',
                zIndex: 10,
            }}>
                {/* Logo & Title */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <div className="logo-icon" style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        boxShadow: '0 8px 24px rgba(59,130,246,0.4)',
                    }}>
                        {/* Flower/ERP Icon */}
                        <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                            <circle cx="17" cy="17" r="4" fill="white" opacity="0.9" />
                            <ellipse cx="17" cy="8" rx="3.5" ry="5.5" fill="white" opacity="0.75" />
                            <ellipse cx="17" cy="26" rx="3.5" ry="5.5" fill="white" opacity="0.75" />
                            <ellipse cx="8" cy="17" rx="5.5" ry="3.5" fill="white" opacity="0.75" />
                            <ellipse cx="26" cy="17" rx="5.5" ry="3.5" fill="white" opacity="0.75" />
                            <ellipse cx="10.5" cy="10.5" rx="3" ry="5" fill="white" opacity="0.5" transform="rotate(45 10.5 10.5)" />
                            <ellipse cx="23.5" cy="23.5" rx="3" ry="5" fill="white" opacity="0.5" transform="rotate(45 23.5 23.5)" />
                            <ellipse cx="23.5" cy="10.5" rx="3" ry="5" fill="white" opacity="0.5" transform="rotate(-45 23.5 10.5)" />
                            <ellipse cx="10.5" cy="23.5" rx="3" ry="5" fill="white" opacity="0.5" transform="rotate(-45 10.5 23.5)" />
                        </svg>
                    </div>
                    <h1 style={{
                        margin: '0 0 6px',
                        fontSize: '26px',
                        fontWeight: '700',
                        color: '#f1f5f9',
                        letterSpacing: '-0.5px',
                    }}>
                        FlowERP
                    </h1>
                    <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: 'rgba(148,163,184,0.8)',
                        fontWeight: '400',
                    }}>
                        Sistema de Gestión Empresarial
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Email */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: 'rgba(203,213,225,0.9)',
                            marginBottom: '7px',
                            letterSpacing: '0.2px',
                        }}>
                            Correo Electrónico
                        </label>
                        <input
                            className="login-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nombre@empresa.com"
                            required
                            autoComplete="email"
                            autoFocus
                        />
                    </div>

                    {/* Password */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: 'rgba(203,213,225,0.9)',
                            marginBottom: '7px',
                            letterSpacing: '0.2px',
                        }}>
                            Contraseña
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="login-input"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                                style={{ paddingRight: '44px' }}
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '14px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                }}
                            >
                                {showPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="error-box" style={{
                            backgroundColor: 'rgba(239,68,68,0.12)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: '10px',
                            padding: '12px 14px',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <p style={{ margin: 0, fontSize: '13px', color: '#fca5a5', lineHeight: '1.4' }}>{error}</p>
                        </div>
                    )}

                    {/* Submit button */}
                    <button
                        type="submit"
                        className="login-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                </svg>
                                Iniciando sesión...
                            </span>
                        ) : (
                            'Iniciar Sesión'
                        )}
                    </button>

                    <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
                </form>

                {/* Footer */}
                <p style={{
                    textAlign: 'center',
                    marginTop: '28px',
                    marginBottom: 0,
                    fontSize: '12px',
                    color: 'rgba(100,116,139,0.8)',
                }}>
                    © 2026 FlowERP · Acceso restringido al personal autorizado
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
