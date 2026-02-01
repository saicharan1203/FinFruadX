import React from 'react';
import { Box } from '@mui/material';
import { RealTimeFraudMonitor } from '../components/RealTimeFraudMonitor';
import { FraudRadar } from '../components/FraudRadar';
import { CaseBuilder } from '../components/CaseBuilder';

export const MonitoringPage = ({ predictions }) => {
  if (!predictions) {
    return (
      <Box className="page-container">
        <Box className="empty-state-page">
          <Box className="empty-icon">📡</Box>
          <h2>No Monitoring Data Available</h2>
          <p>Please upload data and run fraud detection from the Dashboard first.</p>
          <a href="/" className="btn-primary">Go to Dashboard</a>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="page-container">
      <Box className="page-header">
        <Box className="page-header-with-logo">
          <svg className="page-logo" viewBox="0 0 80 80" width="50" height="50">
            <defs>
              <linearGradient id="monitoringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#2575fc', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#00d4ff', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="35" fill="url(#monitoringGradient)" opacity="0.2" />
            <path d="M 15 40 Q 25 30, 35 40 T 55 40 T 75 40" 
                  fill="none" stroke="url(#monitoringGradient)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="25" cy="35" r="3" fill="url(#monitoringGradient)" />
            <circle cx="45" cy="40" r="3" fill="url(#monitoringGradient)" />
            <circle cx="65" cy="35" r="3" fill="url(#monitoringGradient)" />
            <line x1="15" y1="60" x2="75" y2="60" stroke="url(#monitoringGradient)" strokeWidth="2" />
          </svg>
          <Box>
            <h1>📡 Real-Time Monitoring</h1>
            <p>Live fraud detection alerts and radar visualization</p>
          </Box>
        </Box>
      </Box>

      <RealTimeFraudMonitor predictions={predictions} />
      <FraudRadar predictions={predictions} />

      <CaseBuilder predictions={predictions} />
      
      <Box className="monitoring-tips">
        <h3>💡 Monitoring Best Practices</h3>
        <Box className="tips-grid">
          <Box className="tip-item">
            <Box className="tip-number">1</Box>
            <Box>
              <strong>Enable Sound Alerts</strong>
              <p>Turn on audio notifications for critical fraud detection in real-time</p>
            </Box>
          </Box>
          <Box className="tip-item">
            <Box className="tip-number">2</Box>
            <Box>
              <strong>Watch the Radar</strong>
              <p>Red blips indicate high-risk transactions that require immediate attention</p>
            </Box>
          </Box>
          <Box className="tip-item">
            <Box className="tip-number">3</Box>
            <Box>
              <strong>Act on Alerts</strong>
              <p>Use investigate, block, or dismiss actions to manage detected fraud</p>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
