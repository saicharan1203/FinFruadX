import React from 'react';
import { Box } from '@mui/material';
import { UploadSection } from '../components/UploadSection';
import { Dashboard } from '../components/Dashboard';
import { AdvancedAnalytics } from '../components/AdvancedAnalytics';
import { PatternVisualization } from '../components/PatternVisualization';
import { LiveDashboard } from '../components/LiveDashboard';

export const DashboardPage = ({ fileInfo, predictions, setFileInfo, setPredictions }) => {
  return (
    <Box className="page-container">
      <Box className="page-header">
        <Box className="page-header-with-logo">
          <svg className="page-logo" viewBox="0 0 80 80" width="50" height="50">
            <defs>
              <linearGradient id="dashboardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#6a11cb', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#2575fc', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="35" fill="url(#dashboardGradient)" opacity="0.2" />
            <rect x="20" y="20" width="40" height="40" rx="4" fill="url(#dashboardGradient)" />
            <rect x="25" y="30" width="12" height="25" fill="white" opacity="0.9" />
            <rect x="40" y="25" width="12" height="30" fill="white" opacity="0.9" />
            <rect x="55" y="35" width="5" height="20" fill="white" opacity="0.9" />
          </svg>
          <Box>
            <h1>📊 Main Dashboard</h1>
            <p>Upload data and train your fraud detection model</p>
          </Box>
        </Box>
      </Box>

      {!fileInfo ? (
        <UploadSection
          onUploadSuccess={(data) => {
            if (data.success !== false) {
              setFileInfo(data);
            }
          }}
          onGenerateSample={(data) => {
            if (data.success !== false) {
              setFileInfo(data);
            }
          }}
        />
      ) : (
        <>
          <Dashboard fileInfo={fileInfo} onPredictionsComplete={setPredictions} />
          {predictions && (
            <>
              <LiveDashboard predictions={predictions} />
              <AdvancedAnalytics predictions={predictions} />
              <PatternVisualization predictions={predictions} />
            </>
          )}
        </>
      )}
    </Box>
  );
};
