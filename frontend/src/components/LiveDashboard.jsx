import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { FiTrendingUp, FiTrendingDown, FiActivity, FiDollarSign, FiUsers, FiAlertTriangle } from 'react-icons/fi';

export const LiveDashboard = ({ predictions }) => {
  const [stats, setStats] = useState({
    totalTransactions: 0,
    fraudDetected: 0,
    totalAmount: 0,
    fraudAmount: 0,
    avgFraudProb: 0,
    highRiskCount: 0
  });

  const [recentAlerts, setRecentAlerts] = useState([]);

  useEffect(() => {
    if (!predictions || !Array.isArray(predictions)) return;

    const fraudPredictions = predictions.filter(p => (p.fraud_probability || 0) > 0.5);
    const highRisk = predictions.filter(p => (p.fraud_probability || 0) > 0.7);
    
    const totalAmt = predictions.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const fraudAmt = fraudPredictions.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const avgProb = predictions.reduce((sum, p) => sum + (p.fraud_probability || 0), 0) / predictions.length;

    setStats({
      totalTransactions: predictions.length,
      fraudDetected: fraudPredictions.length,
      totalAmount: totalAmt,
      fraudAmount: fraudAmt,
      avgFraudProb: avgProb * 100,
      highRiskCount: highRisk.length
    });

    // Get recent high-risk alerts
    const alerts = highRisk
      .slice(0, 5)
      .map((p, idx) => ({
        id: idx,
        amount: p.amount || 0,
        probability: (p.fraud_probability || 0) * 100,
        customer: p.customer_id || `C${idx}`,
        merchant: p.merchant_id || `M${idx}`,
        time: new Date().toLocaleTimeString()
      }));

    setRecentAlerts(alerts);
  }, [predictions]);

  const fraudRate = stats.totalTransactions > 0 
    ? ((stats.fraudDetected / stats.totalTransactions) * 100).toFixed(1) 
    : 0;

  if (!predictions || predictions.length === 0) {
    return null;
  }

  return (
    <Box className="live-dashboard-container">
      <Box className="section-header">
        <h2>📊 Live Dashboard Overview</h2>
        <p>Real-time statistics and insights</p>
      </Box>

      <Box className="stats-grid-live">
        {[{
          label: 'Total Transactions',
          value: stats.totalTransactions.toLocaleString(),
          tone: 'primary',
          icon: <FiActivity size={28} />,
          helper: 'Active'
        }, {
          label: 'Fraud Detected',
          value: stats.fraudDetected.toLocaleString(),
          tone: 'danger',
          icon: <FiAlertTriangle size={28} />,
          helper: `${fraudRate}% rate`
        }, {
          label: 'Total Volume',
          value: `₹${(stats.totalAmount / 1000).toFixed(1)}K`,
          tone: 'success',
          icon: <FiDollarSign size={28} />,
          helper: 'Processing'
        }, {
          label: 'High Risk Cases',
          value: stats.highRiskCount.toLocaleString(),
          tone: 'warning',
          icon: <FiUsers size={28} />,
          helper: 'Priority'
        }].map(card => (
          <Box key={card.label} className={`stat-card-live ${card.tone}`}>
            <Box className="stat-icon-wrapper">{card.icon}</Box>
            <Box className="stat-content-live">
              <p className="stat-label">{card.label}</p>
              <h3>{card.value}</h3>
              <Box className={`stat-trend ${card.tone}`}>
                {card.tone === 'warning' ? <FiTrendingDown size={16} /> : <FiTrendingUp size={16} />}
                <span>{card.helper}</span>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      <Box className="dashboard-metrics">
        <Box className="metric-card">
          <h3>Fraud Detection Rate</h3>
          <Box className="metric-bar-container">
            <Box 
              className="metric-bar fraud-rate" 
              style={{ width: `${fraudRate}%` }}
            >
              <span>{fraudRate}%</span>
            </Box>
          </Box>
        </Box>

        <Box className="metric-card">
          <h3>Average Fraud Probability</h3>
          <Box className="metric-bar-container">
            <Box 
              className="metric-bar avg-prob" 
              style={{ width: `${stats.avgFraudProb}%` }}
            >
              <span>{stats.avgFraudProb.toFixed(1)}%</span>
            </Box>
          </Box>
        </Box>

        <Box className="metric-card">
          <h3>Fraud Amount vs Total</h3>
          <Box className="metric-bar-container">
            <Box 
              className="metric-bar fraud-amount" 
              style={{ width: `${(stats.fraudAmount / stats.totalAmount * 100)}%` }}
            >
              <span>₹{(stats.fraudAmount / 1000).toFixed(1)}K</span>
            </Box>
          </Box>
        </Box>
      </Box>

      {recentAlerts.length > 0 && (
        <Box className="recent-alerts-section">
          <h3>🚨 Recent High-Risk Alerts</h3>
          <Box className="alerts-compact-list">
            {recentAlerts.map(alert => (
              <Box key={alert.id} className="alert-compact-item">
                <Box className="alert-compact-icon">⚠️</Box>
                <Box className="alert-compact-details">
                  <strong>₹{alert.amount.toFixed(2)}</strong>
                  <span>Customer: {alert.customer}</span>
                </Box>
                <Box className="alert-compact-prob">
                  <Box className="prob-badge">{alert.probability.toFixed(1)}%</Box>
                  <span className="alert-time">{alert.time}</span>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};
