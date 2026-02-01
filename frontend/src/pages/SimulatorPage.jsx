import React from 'react';
import { Box } from '@mui/material';
import { TransactionSimulator } from '../components/TransactionSimulator';

export const SimulatorPage = () => {
  return (
    <Box className="page-container">
      <Box className="page-header">
        <Box className="page-header-with-logo">
          <svg className="page-logo" viewBox="0 0 80 80" width="50" height="50">
            <defs>
              <linearGradient id="simulatorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#2ed573', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#7bed9f', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="35" fill="url(#simulatorGradient)" opacity="0.2" />
            <polygon points="30,25 30,55 55,40" fill="url(#simulatorGradient)" />
            <circle cx="40" cy="40" r="28" fill="none" stroke="url(#simulatorGradient)" strokeWidth="3" />
          </svg>
          <Box>
            <h1>🎮 Transaction Simulator</h1>
            <p>Test different fraud scenarios and attack patterns</p>
          </Box>
        </Box>
      </Box>

      <TransactionSimulator />
      
      <Box className="info-cards-grid">
        <Box className="info-card">
          <Box className="card-icon">⚡</Box>
          <h3>Velocity Attack</h3>
          <p>Test rapid-fire transaction patterns that indicate card testing or automated fraud</p>
        </Box>
        <Box className="info-card">
          <Box className="card-icon">🌍</Box>
          <h3>Geographic Anomaly</h3>
          <p>Simulate impossible travel scenarios where transactions occur in distant locations within minutes</p>
        </Box>
        <Box className="info-card">
          <Box className="card-icon">🌙</Box>
          <h3>Time-based Patterns</h3>
          <p>Test unusual timing patterns like late-night luxury purchases that deviate from normal behavior</p>
        </Box>
        <Box className="info-card">
          <Box className="card-icon">💥</Box>
          <h3>Multi-Vector Attack</h3>
          <p>Combine multiple fraud indicators to simulate sophisticated attack patterns</p>
        </Box>
      </Box>
    </Box>
  );
};
