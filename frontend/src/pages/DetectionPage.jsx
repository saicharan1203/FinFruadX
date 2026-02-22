import React, { useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { FraudNetworkGraph } from '../components/FraudNetworkGraph';
import { FraudStoryline } from '../components/FraudStoryline';
import { AnomalyDetector } from '../components/AnomalyDetector';
import { ResultsTable } from '../components/ResultsTable';
import { FraudRadar } from '../components/FraudRadar';
import { FraudHeatmapCalendar } from '../components/FraudHeatmapCalendar';
import { FraudRiskMeter } from '../components/FraudRiskMeter';
import { TransactionFilter } from '../components/TransactionFilter';
import { TopSuspiciousEntities } from '../components/TopSuspiciousEntities';
import { RiskBreakdownChart } from '../components/RiskBreakdownChart';
import { GeoLocationFraudMap } from '../components/GeoLocationFraudMap';
import { TransactionChainAnalysis } from '../components/TransactionChainAnalysis';
import { FiAlertTriangle, FiActivity, FiTrendingUp, FiShield } from 'react-icons/fi';

export const DetectionPage = ({ predictions }) => {
  const [filteredResults, setFilteredResults] = useState(null);

  // Calculate quick stats
  const quickStats = useMemo(() => {
    const results = predictions?.results || predictions?.predictions || [];
    if (!results || results.length === 0) {
      return { total: 0, fraud: 0, highRisk: 0, avgProb: 0 };
    }

    const fraudCases = results.filter(tx => (tx.fraud_probability || 0) > 0.5).length;
    const highRiskCases = results.filter(tx => (tx.fraud_probability || 0) > 0.7).length;
    const avgProb = results.reduce((sum, tx) => sum + (tx.fraud_probability || 0), 0) / results.length;

    return {
      total: results.length,
      fraud: fraudCases,
      highRisk: highRiskCases,
      avgProb: avgProb * 100
    };
  }, [predictions]);

  // Handle filter changes
  const handleFilterChange = (filtered) => {
    setFilteredResults(filtered);
  };

  // Get current display data (filtered or all)
  const displayPredictions = useMemo(() => {
    if (filteredResults) {
      return { ...predictions, results: filteredResults };
    }
    return predictions;
  }, [predictions, filteredResults]);

  if (!predictions) {
    return (
      <Box className="page-container">
        <Box className="empty-state-page">
          <Box className="empty-icon">🔍</Box>
          <h2>No Detection Data Available</h2>
          <p>Please upload data and run fraud detection from the Dashboard first.</p>
          <a href="/" className="btn-primary">Go to Dashboard</a>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="page-container detection-page">
      <Box className="page-header">
        <Box className="page-header-with-logo">
          <svg className="page-logo" viewBox="0 0 80 80" width="50" height="50">
            <defs>
              <linearGradient id="detectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#ff4757', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#ff6b81', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="35" fill="url(#detectionGradient)" opacity="0.2" />
            <circle cx="40" cy="40" r="25" fill="none" stroke="url(#detectionGradient)" strokeWidth="3" />
            <circle cx="40" cy="40" r="15" fill="none" stroke="url(#detectionGradient)" strokeWidth="3" />
            <circle cx="40" cy="40" r="5" fill="url(#detectionGradient)" />
            <path d="M 40 15 L 40 25" stroke="url(#detectionGradient)" strokeWidth="3" strokeLinecap="round" />
            <path d="M 65 40 L 55 40" stroke="url(#detectionGradient)" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <Box>
            <h1>🔍 Fraud Detection</h1>
            <p>Analyze detected fraud patterns and suspicious activities</p>
          </Box>
        </Box>
      </Box>

      {/* Quick Stats Panel */}
      <Box className="detection-quick-stats">
        <Box className="detection-stat">
          <Box className="stat-icon-wrap blue">
            <FiActivity />
          </Box>
          <Box className="stat-info">
            <span className="stat-value">{quickStats.total.toLocaleString()}</span>
            <span className="stat-label">Total Transactions</span>
          </Box>
        </Box>
        <Box className="detection-stat">
          <Box className="stat-icon-wrap orange">
            <FiAlertTriangle />
          </Box>
          <Box className="stat-info">
            <span className="stat-value">{quickStats.fraud}</span>
            <span className="stat-label">Fraud Detected</span>
          </Box>
        </Box>
        <Box className="detection-stat">
          <Box className="stat-icon-wrap red">
            <FiShield />
          </Box>
          <Box className="stat-info">
            <span className="stat-value">{quickStats.highRisk}</span>
            <span className="stat-label">High Risk Cases</span>
          </Box>
        </Box>
        <Box className="detection-stat">
          <Box className="stat-icon-wrap purple">
            <FiTrendingUp />
          </Box>
          <Box className="stat-info">
            <span className="stat-value">{quickStats.avgProb.toFixed(1)}%</span>
            <span className="stat-label">Avg. Risk Score</span>
          </Box>
        </Box>
      </Box>

      {/* Risk Meter and Radar Row */}
      <Box className="detection-visual-row">
        <FraudRiskMeter predictions={predictions} />
        <FraudRadar predictions={predictions?.results || predictions?.predictions || []} />
      </Box>

      {/* Risk Breakdown Charts */}
      <RiskBreakdownChart predictions={predictions} />

      {/* Top Suspicious Entities */}
      <TopSuspiciousEntities predictions={predictions} />

      {/* Fraud Activity Heatmap Calendar */}
      <FraudHeatmapCalendar predictions={predictions} />

      {/* Geolocation Fraud Map */}
      <GeoLocationFraudMap predictions={predictions} />

      {/* Transaction Chain Analysis */}
      <TransactionChainAnalysis predictions={predictions} />

      {/* Network Graph */}
      <FraudNetworkGraph predictions={predictions} />

      {/* Storyline */}
      <FraudStoryline predictions={predictions} />

      {/* Anomaly Detector */}
      <AnomalyDetector predictions={predictions} />

      {/* Transaction Filter */}
      <TransactionFilter predictions={predictions} onFilterChange={handleFilterChange} />

      {/* Results Table */}
      <ResultsTable predictions={displayPredictions} />
    </Box>
  );
};
