import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { FiAlertTriangle, FiActivity, FiVolume2, FiVolumeX } from 'react-icons/fi';

export const RealTimeFraudMonitor = ({ predictions }) => {
  const [alerts, setAlerts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stats, setStats] = useState({
    critical: 0,
    high: 0,
    lastAlert: null,
    avgAmount: 0
  });

  useEffect(() => {
    if (!predictions || !Array.isArray(predictions)) return;

    const criticalAlerts = [];
    const highAlerts = [];
    let totalAmount = 0;

    predictions.forEach((pred, index) => {
      const fraudProb = pred.fraud_probability || 0;
      const amount = pred.amount || 0;
      
      if (fraudProb > 0.8) {
        criticalAlerts.push({
          id: `alert-${index}-${Date.now()}`,
          type: 'critical',
          probability: fraudProb,
          amount: amount,
          customer: pred.customer_id || `C${index + 1}`,
          merchant: pred.merchant_id || `M${index + 1}`,
          timestamp: new Date().toLocaleTimeString(),
          category: pred.merchant_category || 'Unknown'
        });
        totalAmount += amount;
      } else if (fraudProb > 0.6) {
        highAlerts.push({
          id: `alert-${index}-${Date.now()}`,
          type: 'high',
          probability: fraudProb,
          amount: amount,
          customer: pred.customer_id || `C${index + 1}`,
          merchant: pred.merchant_id || `M${index + 1}`,
          timestamp: new Date().toLocaleTimeString(),
          category: pred.merchant_category || 'Unknown'
        });
      }
    });

    const allAlerts = [...criticalAlerts, ...highAlerts].slice(0, 10);
    setAlerts(allAlerts);

    if (soundEnabled && criticalAlerts.length > 0) {
      playAlertSound();
    }

    setStats({
      critical: criticalAlerts.length,
      high: highAlerts.length,
      lastAlert: allAlerts[0] || null,
      avgAmount: criticalAlerts.length > 0 ? totalAmount / criticalAlerts.length : 0
    });
  }, [predictions, soundEnabled]);

  const playAlertSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  if (!predictions || alerts.length === 0) {
    return (
      <Box className="monitor-container">
        <Box className="section-header">
          <FiActivity size={28} style={{ color: 'var(--success)' }} />
          <h2>🚨 Real-Time Fraud Monitor</h2>
          <p>Live monitoring and instant alerts for suspicious activities</p>
        </Box>
        <Box className="no-alerts">
          <Box className="check-icon">✅</Box>
          <h3>All Clear</h3>
          <p>No critical fraud alerts detected. System is monitoring...</p>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="monitor-container">
      <Box className="section-header">
        <FiActivity size={28} style={{ color: 'var(--danger)' }} />
        <h2>🚨 Real-Time Fraud Monitor</h2>
        <p>Live monitoring with {alerts.length} active alerts</p>
      </Box>

      <Box className="monitor-controls">
        <button 
          className="sound-toggle"
          onClick={() => setSoundEnabled(!soundEnabled)}
        >
          {soundEnabled ? <FiVolume2 size={20} /> : <FiVolumeX size={20} />}
          {soundEnabled ? 'Sound On' : 'Sound Off'}
        </button>
      </Box>

      <Box className="alert-stats-grid">
        <Box className="alert-stat critical-stat">
          <Box className="stat-icon">🔴</Box>
          <Box className="stat-info">
            <strong>{stats.critical}</strong>
            <span>Critical Alerts</span>
          </Box>
        </Box>
        <Box className="alert-stat high-stat">
          <Box className="stat-icon">🟠</Box>
          <Box className="stat-info">
            <strong>{stats.high}</strong>
            <span>High Risk Alerts</span>
          </Box>
        </Box>
        <Box className="alert-stat amount-stat">
          <Box className="stat-icon">💰</Box>
          <Box className="stat-info">
            <strong>₹{stats.avgAmount.toFixed(2)}</strong>
            <span>Avg Critical Amount</span>
          </Box>
        </Box>
        {stats.lastAlert && (
          <Box className="alert-stat time-stat">
            <Box className="stat-icon">⏰</Box>
            <Box className="stat-info">
              <strong>{stats.lastAlert.timestamp}</strong>
              <span>Last Alert</span>
            </Box>
          </Box>
        )}
      </Box>

      <Box className="alerts-feed">
        <h3>📡 Live Alert Feed</h3>
        <Box className="alerts-list">
          {alerts.map((alert, index) => (
            <Box 
              key={alert.id} 
              className={`alert-item-live alert-${alert.type}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Box className="alert-indicator">
                <FiAlertTriangle size={24} />
              </Box>
              <Box className="alert-content-live">
                <Box className="alert-header-live">
                  <span className="alert-badge">{alert.type.toUpperCase()}</span>
                  <span className="alert-time">{alert.timestamp}</span>
                </Box>
                <Box className="alert-details-live">
                  <p><strong>Customer:</strong> {alert.customer}</p>
                  <p><strong>Merchant:</strong> {alert.merchant}</p>
                  <p><strong>Category:</strong> {alert.category}</p>
                  <p><strong>Amount:</strong> ₹{alert.amount.toFixed(2)}</p>
                  <p><strong>Fraud Probability:</strong> {(alert.probability * 100).toFixed(1)}%</p>
                </Box>
                <Box className="alert-actions">
                  <button className="btn-investigate">🔍 Investigate</button>
                  <button className="btn-block">⛔ Block</button>
                  <button className="btn-dismiss">✓ Dismiss</button>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
