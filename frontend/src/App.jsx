import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
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
    <div className="app-layout">
      {/* VideoScrollTransition disabled for performance - was causing 120 particles to animate every frame */}
      {/* <VideoScrollTransition /> */}
      <Navigation isCollapsed={isNavCollapsed} setIsCollapsed={setIsNavCollapsed} />
      <main className={`main-content ${isNavCollapsed ? 'expanded' : ''}`}>
        <AlertSystem predictions={predictions} />
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div className="page-transition">
                  <DashboardPage
                    fileInfo={fileInfo}
                    predictions={predictions}
                    setFileInfo={setFileInfo}
                    setPredictions={setPredictions}
                  />
                </div>
              </ProtectedRoute>
            }
          />
          <Route path="/detection" element={<ProtectedRoute><div className="page-transition"><DetectionPage predictions={predictions} /></div></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><div className="page-transition"><AnalyticsPage predictions={predictions} /></div></ProtectedRoute>} />
          <Route path="/simulator" element={<ProtectedRoute><div className="page-transition"><SimulatorPage /></div></ProtectedRoute>} />
          <Route path="/monitoring" element={<ProtectedRoute><div className="page-transition"><MonitoringPage predictions={predictions} /></div></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><div className="page-transition"><ReportsPage predictions={predictions} /></div></ProtectedRoute>} />
          <Route path="/activity" element={<ProtectedRoute><div className="page-transition"><ActivityLogPage /></div></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><div className="page-transition"><SettingsPage /></div></ProtectedRoute>} />
          <Route path="/model-performance" element={<ProtectedRoute><div className="page-transition"><ModelPerformancePage predictions={predictions} /></div></ProtectedRoute>} />
          <Route path="/fraud-patterns" element={<ProtectedRoute><div className="page-transition"><FraudPatternsPage predictions={predictions} /></div></ProtectedRoute>} />
          <Route path="/data-explorer" element={<ProtectedRoute><div className="page-transition"><DataExplorerPage predictions={predictions} /></div></ProtectedRoute>} />
          <Route path="/login" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <AuthProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
