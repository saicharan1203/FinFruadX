import React from 'react';
import { Box } from '@mui/material';
import { DataExplorer } from '../components/DataExplorer';

export const DataExplorerPage = ({ predictions }) => {
  return (
    <Box className="page-container">
      <Box className="page-header">
        <Box className="page-header-with-logo">
          <svg className="page-logo" viewBox="0 0 80 80" width="50" height="50">
            <defs>
              <linearGradient id="explorerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#00d2d3', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#54a0ff', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="35" fill="url(#explorerGradient)" opacity="0.2" />
            <rect x="20" y="25" width="30" height="30" rx="4" fill="none" stroke="url(#explorerGradient)" strokeWidth="3" />
            <circle cx="55" cy="50" r="8" fill="url(#explorerGradient)" />
            <line x1="48" y1="43" x2="60" y2="55" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <Box>
            <h1>🔎 Data Explorer</h1>
            <p>Search and filter transactions using rich table views</p>
          </Box>
        </Box>
      </Box>

      <DataExplorer predictions={predictions} />
    </Box>
  );
};