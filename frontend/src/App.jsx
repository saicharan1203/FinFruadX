import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider as AppThemeProvider, useTheme as useAppTheme } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { VideoScrollTransition } from './components/VideoScrollTransition';
import { DashboardPage } from './pages/DashboardPage';
import { DetectionPage } from './pages/DetectionPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { SettingsPage } from './pages/SettingsPage';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { ReportsPage } from './pages/ReportsPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { FraudPatternsPage } from './pages/FraudPatternsPage';
import { DataExplorerPage } from './pages/DataExplorerPage';
import { LoginPage } from './pages/LoginPage';
import { AlertSystem } from './components/AlertSystem';
import { AIAssistant } from './components/AIAssistant';
import { Box, CssBaseline } from '@mui/material';
import { createTheme, StyledEngineProvider, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import './styles/dashboard.css';
import './styles/smooth-scroll.css';

// ScrollToTop component - resets scroll position on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll window to top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Also reset scroll on document elements
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Scroll all possible content containers to top
    const scrollContainers = [
      '.main-content',
      '.page-transition',
      '.page-container',
      '.app-layout'
    ];

    scrollContainers.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.scrollTop = 0;
      }
    });
  }, [pathname]);

  return null;
};

const MuiThemeBridge = ({ children }) => {
  const { isDarkMode } = useAppTheme();
  const theme = useMemo(() => (
    createTheme({
      palette: {
        mode: isDarkMode ? 'dark' : 'light',
        primary: { main: '#6a11cb' },
        secondary: { main: '#2575fc' },
        background: {
          default: isDarkMode ? '#0f1419' : '#f5f7fb',
          paper: isDarkMode ? '#151a25' : '#ffffff'
        }
      },
      shape: { borderRadius: 14 },
      typography: {
        fontFamily: '"Segoe UI", "Inter", sans-serif'
      }
    })
  ), [isDarkMode]);

  return (
    <StyledEngineProvider injectFirst>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </StyledEngineProvider>
  );
};

// 120fps Scroll Performance Hook - pauses animations during scroll
const useScrollPerformance = () => {
  useEffect(() => {
    let scrollTimeout;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        // Use requestAnimationFrame for 120fps sync
        requestAnimationFrame(() => {
          document.body.classList.add('is-scrolling');
          ticking = false;
        });
        ticking = true;
      }

      // Clear previous timeout
      clearTimeout(scrollTimeout);

      // Remove class after scroll ends (debounced)
      scrollTimeout = setTimeout(() => {
        document.body.classList.remove('is-scrolling');
      }, 100);
    };

    // Prevent scroll propagation from sidebar to main content
    const preventScrollPropagation = (e) => {
      const sidebar = e.target.closest('.main-navigation');
      if (sidebar) {
        // Check if sidebar is at scroll boundary
        const { scrollTop, scrollHeight, clientHeight } = sidebar;
        const isAtTop = scrollTop === 0;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight;

        // Prevent scroll from propagating to main content
        if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
          e.preventDefault();
        }
      }
    };

    // Use passive listener for maximum scroll performance on main content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Prevent scroll propagation from sidebar
    const sidebar = document.querySelector('.main-navigation');
    if (sidebar) {
      sidebar.addEventListener('wheel', preventScrollPropagation, { passive: false });
    }

    return () => {
      if (mainContent) {
        mainContent.removeEventListener('scroll', handleScroll);
      }
      if (sidebar) {
        sidebar.removeEventListener('wheel', preventScrollPropagation);
      }
      clearTimeout(scrollTimeout);
    };
  }, []);
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#667eea'
      }}>
        Loading...
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function AppContent() {
  const { isAuthenticated, login } = useAuth();
  const [fileInfo, setFileInfo] = useState(null);
  const [predictions, setPredictions] = useState(null);
  // Start with sidebar collapsed on mobile devices
  const [isNavCollapsed, setIsNavCollapsed] = useState(() => {
    return window.innerWidth <= 480;
  });

  // Enable 120fps scroll optimizations
  useScrollPerformance();

  // Get current location for route change detection
  const location = useLocation();

  // Handle window resize to auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 480) {
        setIsNavCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (window.innerWidth <= 480) {
      setIsNavCollapsed(true);
    }
  }, [location.pathname]);

  // Handle click outside sidebar to close it (mobile only)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only handle on mobile
      if (window.innerWidth > 480) return;

      // If sidebar is collapsed, don't do anything
      if (isNavCollapsed) return;

      const sidebar = document.querySelector('.main-navigation');
      const toggleButton = document.querySelector('.nav-collapse-toggle');

      // Check if click is outside sidebar and not on toggle button
      if (sidebar && !sidebar.contains(event.target) &&
        toggleButton && !toggleButton.contains(event.target)) {
        setIsNavCollapsed(true);
      }
    };

    // Add listener with a small delay to prevent immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
      document.addEventListener('touchstart', handleClickOutside, true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [isNavCollapsed]);

  useEffect(() => {
    document.body.classList.remove('dark-theme');
  }, []);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLoginSuccess={login} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <Box className="app-layout">
      {/* VideoScrollTransition disabled for performance - was causing 120 particles to animate every frame */}
      {/* <VideoScrollTransition /> */}
      <Navigation isCollapsed={isNavCollapsed} setIsCollapsed={setIsNavCollapsed} />
      <Box component="main" className={`main-content ${isNavCollapsed ? 'expanded' : ''}`}>
        <AlertSystem predictions={predictions} />
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Box className="page-transition">
                  <DashboardPage
                    fileInfo={fileInfo}
                    predictions={predictions}
                    setFileInfo={setFileInfo}
                    setPredictions={setPredictions}
                  />
                </Box>
              </ProtectedRoute>
            }
          />
          <Route path="/detection" element={<ProtectedRoute><Box className="page-transition"><DetectionPage predictions={predictions} /></Box></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Box className="page-transition"><AnalyticsPage predictions={predictions} /></Box></ProtectedRoute>} />
          <Route path="/simulator" element={<ProtectedRoute><Box className="page-transition"><SimulatorPage /></Box></ProtectedRoute>} />
          <Route path="/monitoring" element={<ProtectedRoute><Box className="page-transition"><MonitoringPage predictions={predictions} /></Box></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Box className="page-transition"><ReportsPage predictions={predictions} /></Box></ProtectedRoute>} />
          <Route path="/activity" element={<ProtectedRoute><Box className="page-transition"><ActivityLogPage /></Box></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Box className="page-transition"><SettingsPage /></Box></ProtectedRoute>} />
          <Route path="/model-performance" element={<ProtectedRoute><Box className="page-transition"><ModelPerformancePage predictions={predictions} /></Box></ProtectedRoute>} />
          <Route path="/fraud-patterns" element={<ProtectedRoute><Box className="page-transition"><FraudPatternsPage predictions={predictions} /></Box></ProtectedRoute>} />
          <Route path="/data-explorer" element={<ProtectedRoute><Box className="page-transition"><DataExplorerPage predictions={predictions} /></Box></ProtectedRoute>} />
          <Route path="/login" element={<Navigate to="/" />} />
        </Routes>
      </Box>
      {/* AI Assistant rendered outside main-content to avoid transform breaking position:fixed */}
      <AIAssistant predictions={predictions} fileInfo={fileInfo} />
    </Box>
  );
}

function App() {
  return (
    <AppThemeProvider>
      <MuiThemeBridge>
        <Router>
          <ScrollToTop />
          <AuthProvider>
            <NotificationProvider>
              <AppContent />
            </NotificationProvider>
          </AuthProvider>
        </Router>
      </MuiThemeBridge>
    </AppThemeProvider>
  );
}

export default App;
