import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiActivity, FiShield, FiBarChart2, FiSettings, FiZap, FiList, FiSearch, FiCpu, FiMenu, FiX, FiLogOut, FiMoon, FiSun } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';


export const Navigation = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [userProfile, setUserProfile] = useState(null);
  const [isMobileNav, setIsMobileNav] = useState(false);

  useEffect(() => {
    // Load user profile from localStorage
    const loadProfile = () => {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      }
    };

    // Initial load
    loadProfile();

    // Listen for storage changes (from Settings page)
    const handleStorageChange = (e) => {
      if (e.key === 'userProfile' || e.type === 'storage') {
        loadProfile();
      }
    };

    // Listen for custom event (for same-tab updates)
    const handleProfileUpdate = () => {
      loadProfile();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  const navItems = [
    {
      path: '/',
      icon: <FiHome />,
      label: 'Dashboard',
      color: '#6a11cb',
      symbol: '📊',
      gradient: 'linear-gradient(135deg, rgba(106,17,203,0.85), rgba(37,117,252,0.75))'
    },
    {
      path: '/detection',
      icon: <FiShield />,
      label: 'Detection',
      color: '#ff4757',
      symbol: '🛡️',
      gradient: 'linear-gradient(135deg, rgba(255,71,87,0.85), rgba(255,159,67,0.65))'
    },
    {
      path: '/analytics',
      icon: <FiBarChart2 />,
      label: 'Analytics',
      color: '#ffa502',
      symbol: '📈',
      gradient: 'linear-gradient(135deg, rgba(255,165,2,0.8), rgba(255,215,95,0.7))'
    },
    {
      path: '/fraud-patterns',
      icon: <FiActivity />,
      label: 'Fraud Patterns',
      color: '#2575fc',
      symbol: '🔬',
      gradient: 'linear-gradient(135deg, rgba(37,117,252,0.85), rgba(0,210,211,0.65))'
    },
    {
      path: '/data-explorer',
      icon: <FiSearch />,
      label: 'Data Explorer',
      color: '#00d2d3',
      symbol: '🧭',
      gradient: 'linear-gradient(135deg, rgba(0,210,211,0.85), rgba(10,178,197,0.6))'
    },
    {
      path: '/model-performance',
      icon: <FiCpu />,
      label: 'Model Performance',
      color: '#a29bfe',
      symbol: '🤖',
      gradient: 'linear-gradient(135deg, rgba(162,155,254,0.85), rgba(108,92,231,0.6))'
    },
    {
      path: '/simulator',
      icon: <FiZap />,
      label: 'Simulator',
      color: '#2ed573',
      symbol: '⚡',
      gradient: 'linear-gradient(135deg, rgba(46,213,115,0.85), rgba(0,210,122,0.6))'
    },
    {
      path: '/monitoring',
      icon: <FiActivity />,
      label: 'Monitoring',
      color: '#1dd1a1',
      symbol: '📡',
      gradient: 'linear-gradient(135deg, rgba(29,209,161,0.85), rgba(0,150,199,0.6))'
    },
    {
      path: '/reports',
      icon: <FiList />,
      label: 'Reports',
      color: '#00d2d3',
      symbol: '📄',
      gradient: 'linear-gradient(135deg, rgba(0,210,211,0.85), rgba(0,153,255,0.6))'
    },
    {
      path: '/activity',
      icon: <FiList />,
      label: 'Activity Log',
      color: '#ff6b81',
      symbol: '📝',
      gradient: 'linear-gradient(135deg, rgba(255,107,129,0.85), rgba(255,159,243,0.6))'
    },
    {
      path: '/settings',
      icon: <FiSettings />,
      label: 'Settings',
      color: '#fd79a8',
      symbol: '⚙️',
      gradient: 'linear-gradient(135deg, rgba(253,121,168,0.85), rgba(255,204,204,0.6))'
    }
  ];

  const toggleNavigation = () => {
    setIsCollapsed((prev) => !prev);
  };

  useEffect(() => {
    const checkIfMobile = () => {
      if (typeof window === 'undefined') return false;
      return window.innerWidth <= 768;
    };

    const handleResize = () => {
      setIsMobileNav(checkIfMobile());
    };

    setIsMobileNav(checkIfMobile());
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (isMobileNav) {
      document.body.classList.toggle('nav-open', !isCollapsed);
    } else {
      document.body.classList.remove('nav-open');
    }

    return () => {
      document.body.classList.remove('nav-open');
    };
  }, [isMobileNav, isCollapsed]);

  return (
    <>
      {isMobileNav && (
        <>
          <button
            type="button"
            className={`mobile-nav-trigger ${!isCollapsed ? 'active' : ''}`}
            onClick={toggleNavigation}
            aria-label={isCollapsed ? 'Open navigation menu' : 'Close navigation menu'}
          >
            {isCollapsed ? <FiMenu size={20} /> : <FiX size={20} />}
          </button>
          {!isCollapsed && (
            <div
              className="mobile-nav-overlay"
              onClick={() => setIsCollapsed(true)}
              onTouchStart={() => setIsCollapsed(true)}
              role="presentation"
            />
          )}
        </>
      )}
      <Box component="nav" className={`main-navigation ${isCollapsed ? 'collapsed' : ''}`}>
        <Box className="nav-brand">
          {/* Only show this toggle button on desktop/tablet, not on mobile */}
          {!isMobileNav && (
            <button
              type="button"
              className="nav-collapse-toggle"
              onClick={toggleNavigation}
              title={isCollapsed ? 'Show menu' : 'Hide menu'}
            >
              {isCollapsed ? <FiMenu size={20} /> : <FiX size={20} />}
            </button>
          )}
          <Box className="brand-logo">
            <svg viewBox="0 0 120 120" className="logo-svg">
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#6a11cb', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: '#2575fc', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#00d4ff', stopOpacity: 1 }} />
                </linearGradient>
                <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.3 }} />
                  <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="shadow">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
                </filter>
              </defs>

              {/* Outer ring with glow */}
              <circle cx="60" cy="60" r="55" fill="none" stroke="url(#logoGradient)" strokeWidth="3" opacity="0.4" />

              {/* Main shield background */}
              <path d="M 60 10 L 95 30 L 95 65 Q 95 95 60 110 Q 25 95 25 65 L 25 30 Z"
                fill="url(#logoGradient)"
                filter="url(#shadow)" />

              {/* Shield shine effect */}
              <path d="M 60 10 L 95 30 L 95 65 Q 95 95 60 110 Q 25 95 25 65 L 25 30 Z"
                fill="url(#shieldGradient)"
                opacity="0.6" />

              {/* Inner decorative elements */}
              <circle cx="60" cy="55" r="28" fill="rgba(255,255,255,0.15)" />

              {/* Security lock icon */}
              <rect x="52" y="52" width="16" height="18" rx="2"
                fill="white" opacity="0.95" />
              <path d="M 55 52 L 55 48 Q 55 44 60 44 Q 65 44 65 48 L 65 52"
                stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.95" />
              <circle cx="60" cy="61" r="2.5" fill="#6a11cb" />
              <line x1="60" y1="63.5" x2="60" y2="67" stroke="#6a11cb" strokeWidth="1.5" strokeLinecap="round" />

              {/* Orbiting dots for tech feel */}
              <circle cx="35" cy="50" r="3" fill="#00d4ff" filter="url(#glow)" opacity="0.8" />
              <circle cx="85" cy="50" r="3" fill="#00d4ff" filter="url(#glow)" opacity="0.8" />
              <circle cx="60" cy="25" r="3" fill="#ffffff" filter="url(#glow)" opacity="0.9" />

              {/* Bottom text with modern font */}
              <text x="60" y="100" fontSize="10" fontWeight="bold" fill="white" textAnchor="middle"
                fontFamily="'Segoe UI', Arial, sans-serif" letterSpacing="2">
                FINFRAUDX
              </text>
              <line x1="35" y1="103" x2="85" y2="103" stroke="white" strokeWidth="1" opacity="0.5" />
            </svg>
          </Box>
          {!isCollapsed && (
            <Box className="brand-text">
              <h2>🛡️ FinFraudX</h2>
              <p>AI Fraud Detection</p>
            </Box>
          )}
        </Box>

        <Box className="nav-items">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item glass ${location.pathname === item.path ? 'active' : ''}`}
              style={{
                '--item-color': item.color,
                '--item-gradient': item.gradient,
                borderLeftColor: location.pathname === item.path ? item.color : 'transparent'
              }}
              title={item.label}
              onClick={() => {
                if (isMobileNav) {
                  setIsCollapsed(true);
                }
              }}
            >
              <span className="nav-liquid" aria-hidden="true">
                <span className="nav-liquid-overlay"></span>
                <span className="nav-liquid-core">{item.symbol}</span>
              </span>
              <span className="nav-icon">{item.icon}</span>
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </Box>

        <Box className="nav-footer">
          <Box className="user-info">
            <Box className="user-avatar">
              {userProfile?.avatar ? (
                <img src={userProfile.avatar} alt="Profile" className="avatar-img" />
              ) : (
                '👤'
              )}
            </Box>
            {!isCollapsed && (
              <Box className="user-details">
                <strong>{userProfile?.name || user?.full_name || user?.username || 'Admin User'}</strong>
                <span>{userProfile?.role || 'Security Analyst'}</span>
              </Box>
            )}
          </Box>
          <Box className="nav-footer-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <div className={`toggle-switch ${isDarkMode ? 'dark' : 'light'}`}>
                <div className="toggle-slider">
                  {isDarkMode ? <FiMoon size={14} /> : <FiSun size={14} />}
                </div>
              </div>
            </button>
            <button
              className="logout-button"
              onClick={logout}
              title="Logout"
            >
              <FiLogOut />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </Box>
        </Box>
      </Box>
    </>
  );
};
