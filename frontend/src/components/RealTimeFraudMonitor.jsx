import React, { useState, useEffect } from 'react';
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
      <div className="monitor-container">
        <div className="section-header">
          <FiActivity size={28} style={{ color: 'var(--success)' }} />
          <h2>🚨 Real-Time Fraud Monitor</h2>
          <p>Live monitoring and instant alerts for suspicious activities</p>
        </div>
        <div className="no-alerts">
          <div className="check-icon">✅</div>
          <h3>All Clear</h3>
          <p>No critical fraud alerts detected. System is monitoring...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="monitor-container">
      <div className="section-header">
        <FiActivity size={28} style={{ color: 'var(--danger)' }} />
        <h2>🚨 Real-Time Fraud Monitor</h2>
        <p>Live monitoring with {alerts.length} active alerts</p>
      </div>

      <div className="monitor-controls">
        <button 
          className="sound-toggle"
          onClick={() => setSoundEnabled(!soundEnabled)}
        >
          {soundEnabled ? <FiVolume2 size={20} /> : <FiVolumeX size={20} />}
          {soundEnabled ? 'Sound On' : 'Sound Off'}
        </button>
      </div>

      <div className="alert-stats-grid">
        <div className="alert-stat critical-stat">
          <div className="stat-icon">🔴</div>
          <div className="stat-info">
            <strong>{stats.critical}</strong>
            <span>Critical Alerts</span>
          </div>
        </div>
        <div className="alert-stat high-stat">
          <div className="stat-icon">🟠</div>
          <div className="stat-info">
            <strong>{stats.high}</strong>
            <span>High Risk Alerts</span>
          </div>
        </div>
        <div className="alert-stat amount-stat">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <strong>₹{stats.avgAmount.toFixed(2)}</strong>
            <span>Avg Critical Amount</span>
          </div>
        </div>
        {stats.lastAlert && (
          <div className="alert-stat time-stat">
            <div className="stat-icon">⏰</div>
            <div className="stat-info">
              <strong>{stats.lastAlert.timestamp}</strong>
              <span>Last Alert</span>
            </div>
          </div>
        )}
      </div>

      <div className="alerts-feed">
        <h3>📡 Live Alert Feed</h3>
        <div className="alerts-list">
          {alerts.map((alert, index) => (
            <div 
              key={alert.id} 
              className={`alert-item-live alert-${alert.type}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="alert-indicator">
                <FiAlertTriangle size={24} />
              </div>
              <div className="alert-content-live">
                <div className="alert-header-live">
                  <span className="alert-badge">{alert.type.toUpperCase()}</span>
                  <span className="alert-time">{alert.timestamp}</span>
                </div>
                <div className="alert-details-live">
                  <p><strong>Customer:</strong> {alert.customer}</p>
                  <p><strong>Merchant:</strong> {alert.merchant}</p>
                  <p><strong>Category:</strong> {alert.category}</p>
                  <p><strong>Amount:</strong> ₹{alert.amount.toFixed(2)}</p>
                  <p><strong>Fraud Probability:</strong> {(alert.probability * 100).toFixed(1)}%</p>
                </div>
                <div className="alert-actions">
                  <button className="btn-investigate">🔍 Investigate</button>
                  <button className="btn-block">⛔ Block</button>
                  <button className="btn-dismiss">✓ Dismiss</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
