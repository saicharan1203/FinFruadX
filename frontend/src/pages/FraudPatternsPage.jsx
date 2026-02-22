import React from 'react';
import { Box } from '@mui/material';
import { FraudPatterns } from '../components/FraudPatterns';

export const FraudPatternsPage = ({ predictions }) => {
  return (
    <Box className="page-container">
      <Box className="page-header">
        <Box className="page-header-with-logo">
          <svg className="page-logo" viewBox="0 0 80 80" width="50" height="50">
            <defs>
              <linearGradient id="patternsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#74b9ff', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#a29bfe', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="35" fill="url(#patternsGradient)" opacity="0.2" />
            <path d="M 20 55 Q 35 25, 50 45 T 70 35" 
                  fill="none" stroke="url(#patternsGradient)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="25" cy="50" r="4" fill="url(#patternsGradient)" />
            <circle cx="40" cy="35" r="4" fill="url(#patternsGradient)" />
            <circle cx="55" cy="45" r="4" fill="url(#patternsGradient)" />
          </svg>
          <Box>
            <h1>📈 Fraud Patterns</h1>
            <p>Visualize temporal, category, and risk-level patterns in detected fraud</p>
          </Box>
        </Box>
      </Box>

      <FraudPatterns predictions={predictions} />
    </Box>
  );
};