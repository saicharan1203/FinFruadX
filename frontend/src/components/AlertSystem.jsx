import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import axios from 'axios';

import { FiBell, FiX, FiAlertTriangle, FiCheckCircle, FiInfo, FiSettings, FiShield } from 'react-icons/fi';

const defaultRuleState = {
  thresholds: {
    critical_probability: 0.85,
    high_probability: 0.65,
    amount_limit: 2000
  },
  watchlist: {
    customers: '',
    merchants: ''
  },
  notes: ''
};

export const AlertSystem = ({ predictions }) => {
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isShaking, setIsShaking] = useState(false);
  const [rulesPanelOpen, setRulesPanelOpen] = useState(false);
  const [rules, setRules] = useState(null);
  const [ruleForm, setRuleForm] = useState(defaultRuleState);
  const [rulesSaving, setRulesSaving] = useState(false);
  const [ruleSaveStatus, setRuleSaveStatus] = useState(null);
  const shakeTimeoutRef = useRef(null);

  // Initialize notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Load existing alerts from localStorage
    const savedAlerts = localStorage.getItem('fraudAlerts');
    if (savedAlerts) {
      setAlerts(JSON.parse(savedAlerts));
    }
    fetchAlertRules();
  }, []);

  // Save alerts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('fraudAlerts', JSON.stringify(alerts));
  }, [alerts]);

  // Process new predictions and generate alerts
  useEffect(() => {
    if (!predictions?.results) return;

    const highRiskTransactions = predictions.results.filter(
      item => item.risk_level === 'Critical' || item.risk_level === 'High'
    );

    if (highRiskTransactions.length > 0) {
      const newAlerts = highRiskTransactions.slice(0, 5).map((transaction, index) => ({
        id: `${Date.now()}-${index}`,
        type: transaction.risk_level === 'Critical' ? 'critical' : 'warning',
        title: `${transaction.risk_level} Risk Transaction Detected`,
        message: `Transaction ID: ${transaction.customer_id} - Amount: $${parseFloat(transaction.amount).toFixed(2)}`,
        timestamp: new Date().toLocaleTimeString(),
        read: false
      }));

      setAlerts(prev => [...newAlerts, ...prev.slice(0, 15)]); // Keep only last 20 alerts

      setIsShaking(true);
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
      }
      shakeTimeoutRef.current = setTimeout(() => setIsShaking(false), 700);

      // Show browser notification if permission granted
      if (notificationPermission === 'granted' && newAlerts.length > 0) {
        const criticalAlert = newAlerts.find(alert => alert.type === 'critical');
        const title = criticalAlert ? 'Critical Fraud Alert!' : 'High Risk Transaction Detected';
        const message = criticalAlert ? criticalAlert.message : newAlerts[0].message;

        new Notification(title, {
          body: message,
          icon: '/favicon.ico'
        });
      }
    }

    if (Array.isArray(predictions.custom_alerts) && predictions.custom_alerts.length > 0) {
      const ruleAlerts = predictions.custom_alerts.slice(0, 5).map((alert, index) => ({
        id: `${Date.now()}-rule-${index}`,
        type: alert.risk_level === 'Critical' ? 'critical' : 'warning',
        title: `Rule Trigger: ${alert.type.replace('_', ' ')}`,
        message: alert.message,
        timestamp: new Date().toLocaleTimeString(),
        read: false
      }));
      setAlerts(prev => [...ruleAlerts, ...prev.slice(0, 15)]);
    }
  }, [predictions, notificationPermission]);

  useEffect(() => () => {
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
    }
  }, []);

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }
  };

  const markAsRead = (id) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === id ? { ...alert, read: true } : alert
    ));
  };

  const markAllAsRead = () => {
    setAlerts([]);
  };

  const clearAll = () => {
    setAlerts([]);
  };

  const unreadCount = alerts.filter(alert => !alert.read).length;

  const fetchAlertRules = async () => {
    try {
      const { data } = await axios.get('/api/alert-rules');
      setRules(data);
      setRuleForm({
        thresholds: {
          critical_probability: data.thresholds?.critical_probability ?? 0.85,
          high_probability: data.thresholds?.high_probability ?? 0.65,
          amount_limit: data.thresholds?.amount_limit ?? 2000
        },
        watchlist: {
          customers: (data.watchlist?.customers || []).join(', '),
          merchants: (data.watchlist?.merchants || []).join(', ')
        },
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('Failed to load alert rules', error);
    }
  };

  const handleRuleInput = (section, field, value) => {
    setRuleForm(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const saveRules = async () => {
    setRulesSaving(true);
    setRuleSaveStatus(null);
    try {
      const payload = {
        thresholds: {
          critical_probability: parseFloat(ruleForm.thresholds.critical_probability) || 0.85,
          high_probability: parseFloat(ruleForm.thresholds.high_probability) || 0.65,
          amount_limit: parseFloat(ruleForm.thresholds.amount_limit) || 0
        },
        watchlist: {
          customers: ruleForm.watchlist.customers
            .split(',')
            .map(v => v.trim())
            .filter(Boolean),
          merchants: ruleForm.watchlist.merchants
            .split(',')
            .map(v => v.trim())
            .filter(Boolean)
        },
        notes: ruleForm.notes
      };
      const { data } = await axios.post('/api/alert-rules', payload);
      setRules(data.rules);
      setRuleSaveStatus({ type: 'success', message: 'Rules updated successfully' });
    } catch (error) {
      setRuleSaveStatus({ type: 'error', message: error.response?.data?.error || 'Unable to save rules' });
    } finally {
      setRulesSaving(false);
    }
  };

  if (!isVisible) {
    return (
      <Box className="alert-hidden-toggle">
        <button onClick={() => setIsVisible(true)}>
          🔔 Show Alerts
        </button>
      </Box>
    );
  }

  return (
    <>
      <Box className="alert-system">

        <button
          className={`alert-button ${unreadCount > 0 ? 'has-unread' : ''} ${isShaking ? 'shake' : ''}`}
          onClick={() => setShowAlerts(!showAlerts)}
        >
          <FiBell size={20} />
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </button>

        {showAlerts && (
          <Box className={`alert-panel ${isShaking ? 'shake' : ''}`}>
            <Box className="alert-header">
              <h3><FiBell /> Fraud Alerts</h3>
              <Box className="alert-actions">

                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setRulesPanelOpen(!rulesPanelOpen)}
                >
                  <FiSettings /> Rules
                </button>
                {notificationPermission !== 'granted' && (
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={requestNotificationPermission}
                  >
                    Enable Notifications
                  </button>
                )}
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  Mark All Read
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={clearAll}
                  disabled={alerts.length === 0}
                >
                  Clear All
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setShowAlerts(false);
                    setIsVisible(false);
                  }}
                >
                  Hide Widget
                </button>
                <button
                  className="close-button"
                  onClick={() => setShowAlerts(false)}
                >
                  <FiX />
                </button>
              </Box>
            </Box>

            <Box className="alert-list">
              {alerts.length === 0 ? (
                <Box className="no-alerts">
                  <FiCheckCircle size={48} />
                  <p>No fraud alerts at this time</p>
                  <small>System monitoring transactions for suspicious activity</small>
                </Box>
              ) : (
                alerts.map(alert => (
                  <Box
                    key={alert.id}
                    className={`alert-item ${alert.type} ${alert.read ? 'read' : 'unread'}`}
                    onClick={() => markAsRead(alert.id)}
                  >
                    <Box className="alert-icon">
                      {alert.type === 'critical' ? (
                        <FiAlertTriangle className="critical-icon" />
                      ) : (
                        <FiInfo className="warning-icon" />
                      )}
                    </Box>
                    <Box className="alert-content">
                      <div className="alert-title">{alert.title}</div>
                      <div className="alert-message">{alert.message}</div>
                      <div className="alert-time">{alert.timestamp}</div>
                    </Box>
                    {!alert.read && (
                      <Box className="unread-indicator"></Box>
                    )}
                  </Box>
                ))
              )}
            </Box>
          </Box>
        )}

        {Array.isArray(predictions?.watchlist_hits) && predictions.watchlist_hits.length > 0 && (
          <Box className="alert-watchlist">
            <h4><FiShield /> Watchlist Hits</h4>
            <Box className="watchlist-grid">
              {predictions.watchlist_hits.slice(0, 4).map((hit, index) => (
                <Box key={`${hit.customer_id}-${index}`} className="watchlist-card">
                  <div className="watchlist-label">Customer</div>
                  <strong>{hit.customer_id || 'N/A'}</strong>
                  <div className="watchlist-meta">
                    <span>Merchant: {hit.merchant_id || 'N/A'}</span>
                    <span>Risk: {hit.risk_level}</span>
                  </div>
                  <div className="watchlist-amount">${parseFloat(hit.amount || 0).toFixed(2)}</div>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {rulesPanelOpen && (
        <Box className="alert-rules-panel">
          <Box className="rules-header">
            <h3><FiSettings /> Alert Rules</h3>
            <button className="close-button" onClick={() => setRulesPanelOpen(false)}>
              <FiX />
            </button>
          </Box>
          <Box className="rules-section">
            <label>Critical Probability Threshold</label>
            <input
              type="number"
              step="0.01"
              value={ruleForm.thresholds.critical_probability}
              onChange={(e) => handleRuleInput('thresholds', 'critical_probability', e.target.value)}
            />
          </Box>
          <Box className="rules-section">
            <label>High Probability Threshold</label>
            <input
              type="number"
              step="0.01"
              value={ruleForm.thresholds.high_probability}
              onChange={(e) => handleRuleInput('thresholds', 'high_probability', e.target.value)}
            />
          </Box>
          <Box className="rules-section">
            <label>Amount Limit (USD)</label>
            <input
              type="number"
              value={ruleForm.thresholds.amount_limit}
              onChange={(e) => handleRuleInput('thresholds', 'amount_limit', e.target.value)}
            />
          </Box>
          <Box className="rules-section">
            <label>Watchlist Customers (comma separated)</label>
            <textarea
              rows={2}
              value={ruleForm.watchlist.customers}
              onChange={(e) => handleRuleInput('watchlist', 'customers', e.target.value)}
            />
          </Box>
          <Box className="rules-section">
            <label>Watchlist Merchants (comma separated)</label>
            <textarea
              rows={2}
              value={ruleForm.watchlist.merchants}
              onChange={(e) => handleRuleInput('watchlist', 'merchants', e.target.value)}
            />
          </Box>
          <Box className="rules-section">
            <label>Notes</label>
            <textarea
              rows={3}
              value={ruleForm.notes}
              onChange={(e) => setRuleForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </Box>
          <button className="btn btn-primary" onClick={saveRules} disabled={rulesSaving}>
            {rulesSaving ? 'Saving...' : 'Save Rules'}
          </button>
          {ruleSaveStatus && (
            <Box className={`rule-status ${ruleSaveStatus.type}`}>
              {ruleSaveStatus.message}
            </Box>
          )}
          {rules && (
            <Box className="rules-summary">
              <p><strong>Current Critical Threshold:</strong> {rules.thresholds?.critical_probability ?? '--'}</p>
              <p><strong>High Threshold:</strong> {rules.thresholds?.high_probability ?? '--'}</p>
              <p><strong>Amount Limit:</strong> ${rules.thresholds?.amount_limit?.toLocaleString?.() || rules.thresholds?.amount_limit || 0}</p>
            </Box>
          )}
        </Box>
      )}
    </>
  );
};