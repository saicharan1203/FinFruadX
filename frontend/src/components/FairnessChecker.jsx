import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import '../styles/dashboard.css';

export const FairnessChecker = ({ predictions }) => {
  const [fairnessMetrics, setFairnessMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);

  const calculateVariance = (values) => {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  };

  const calculateFairnessScore = useCallback((categoryData, amountData, locationData, alerts) => {
    let score = 100;

    // Penalize for high variance in fraud rates
    const categoryVariance = calculateVariance(categoryData.map(c => c.fraudRate));
    const amountVariance = calculateVariance(amountData.map(a => a.fraudRate));
    const locationVariance = calculateVariance(locationData.map(l => l.fraudRate));

    score -= Math.min(categoryVariance / 10, 30);
    score -= Math.min(amountVariance / 10, 20);
    score -= Math.min(locationVariance / 10, 20);

    // Penalize for alerts
    score -= alerts.filter(a => a.severity === 'high').length * 10;
    score -= alerts.filter(a => a.severity === 'medium').length * 5;

    return Math.max(0, Math.round(score));
  }, []);

  const analyzeFairness = useCallback((results) => {
    const metrics = {
      byCategory: {},
      byAmountRange: {},
      byLocation: {},
      byTimeOfDay: {}
    };

    const alerts = [];

    // Analyze by merchant category
    results.forEach(txn => {
      const category = txn.merchant_category || 'Unknown';
      if (!metrics.byCategory[category]) {
        metrics.byCategory[category] = { total: 0, fraud: 0, avgAmount: 0, sumAmount: 0 };
      }
      metrics.byCategory[category].total++;
      metrics.byCategory[category].sumAmount += parseFloat(txn.amount || 0);
      if (parseFloat(txn.fraud_probability || 0) > 0.5) {
        metrics.byCategory[category].fraud++;
      }
    });

    // Calculate fraud rates and check for bias
    const categoryData = Object.entries(metrics.byCategory).map(([name, data]) => {
      const fraudRate = (data.fraud / data.total) * 100;
      const avgAmount = data.sumAmount / data.total;
      return { name, total: data.total, fraudRate, avgAmount };
    }).sort((a, b) => b.fraudRate - a.fraudRate);

    // Check for category bias
    const avgFraudRate = categoryData.reduce((sum, c) => sum + c.fraudRate, 0) / categoryData.length;
    categoryData.forEach(cat => {
      if (cat.fraudRate > avgFraudRate * 2 && cat.total > 10) {
        alerts.push({
          type: 'warning',
          category: 'Merchant Category',
          message: `"${cat.name}" shows ${cat.fraudRate.toFixed(1)}% fraud rate (${(cat.fraudRate / avgFraudRate).toFixed(1)}x higher than average)`,
          severity: cat.fraudRate > avgFraudRate * 3 ? 'high' : 'medium'
        });
      }
    });

    // Analyze by amount range
    results.forEach(txn => {
      const amount = parseFloat(txn.amount || 0);
      let range;
      if (amount < 1000) range = '< ₹1,000';
      else if (amount < 5000) range = '₹1K - ₹5K';
      else if (amount < 10000) range = '₹5K - ₹10K';
      else if (amount < 25000) range = '₹10K - ₹25K';
      else range = '> ₹25,000';

      if (!metrics.byAmountRange[range]) {
        metrics.byAmountRange[range] = { total: 0, fraud: 0 };
      }
      metrics.byAmountRange[range].total++;
      if (parseFloat(txn.fraud_probability || 0) > 0.5) {
        metrics.byAmountRange[range].fraud++;
      }
    });

    const amountData = Object.entries(metrics.byAmountRange).map(([name, data]) => ({
      name,
      total: data.total,
      fraudRate: (data.fraud / data.total) * 100
    }));

    // Check for amount bias
    const lowAmountFraud = amountData.find(a => a.name === '< ₹1,000')?.fraudRate || 0;
    const highAmountFraud = amountData.find(a => a.name === '> ₹25,000')?.fraudRate || 0;
    if (lowAmountFraud > highAmountFraud * 1.5 && lowAmountFraud > 20) {
      alerts.push({
        type: 'warning',
        category: 'Amount Range',
        message: `Low-amount transactions flagged ${lowAmountFraud.toFixed(1)}% vs ${highAmountFraud.toFixed(1)}% for high-amount - possible bias against small transactions`,
        severity: 'medium'
      });
    }

    // Analyze by location
    results.forEach(txn => {
      const location = txn.location || 'Unknown';
      if (!metrics.byLocation[location]) {
        metrics.byLocation[location] = { total: 0, fraud: 0 };
      }
      metrics.byLocation[location].total++;
      if (parseFloat(txn.fraud_probability || 0) > 0.5) {
        metrics.byLocation[location].fraud++;
      }
    });

    const locationData = Object.entries(metrics.byLocation)
      .map(([name, data]) => ({
        name,
        total: data.total,
        fraudRate: (data.fraud / data.total) * 100
      }))
      .sort((a, b) => b.fraudRate - a.fraudRate)
      .slice(0, 8);

    // Check for location bias
    const avgLocationFraud = locationData.reduce((sum, l) => sum + l.fraudRate, 0) / locationData.length;
    locationData.forEach(loc => {
      if (loc.fraudRate > avgLocationFraud * 2.5 && loc.total > 5) {
        alerts.push({
          type: 'warning',
          category: 'Location',
          message: `Location "${loc.name}" flagged at ${loc.fraudRate.toFixed(1)}% rate - possible geographic bias`,
          severity: 'medium'
        });
      }
    });

    // Analyze by time of day
    results.forEach(txn => {
      if (txn.timestamp) {
        try {
          const hour = new Date(txn.timestamp).getHours();
          let period;
          if (hour >= 0 && hour < 6) period = 'Night (12AM-6AM)';
          else if (hour >= 6 && hour < 12) period = 'Morning (6AM-12PM)';
          else if (hour >= 12 && hour < 18) period = 'Afternoon (12PM-6PM)';
          else period = 'Evening (6PM-12AM)';

          if (!metrics.byTimeOfDay[period]) {
            metrics.byTimeOfDay[period] = { total: 0, fraud: 0 };
          }
          metrics.byTimeOfDay[period].total++;
          if (parseFloat(txn.fraud_probability || 0) > 0.5) {
            metrics.byTimeOfDay[period].fraud++;
          }
        } catch (e) {
          // Ignore timestamp errors
        }
      }
    });

    const timeData = Object.entries(metrics.byTimeOfDay).map(([name, data]) => ({
      name,
      total: data.total,
      fraudRate: (data.fraud / data.total) * 100
    }));

    // Overall fairness score (0-100, higher is better)
    const fairnessScore = calculateFairnessScore(categoryData, amountData, locationData, alerts);

    // Add positive feedback if no major issues
    if (alerts.length === 0) {
      alerts.push({
        type: 'success',
        category: 'Overall',
        message: 'No significant bias detected across merchant categories, amount ranges, or locations',
        severity: 'low'
      });
    }

    setFairnessMetrics({
      categoryData,
      amountData,
      locationData,
      timeData,
      fairnessScore,
      totalTransactions: results.length,
      totalFrauds: results.filter(r => parseFloat(r.fraud_probability || 0) > 0.5).length
    });
    setAlerts(alerts);
  }, [calculateFairnessScore]);

  useEffect(() => {
    if (predictions && predictions.results) {
      analyzeFairness(predictions.results);
    }
  }, [predictions, analyzeFairness]);

  if (!predictions || !fairnessMetrics) {
    return null;
  }

  const getFairnessLabel = (score) => {
    if (score >= 90) return { label: 'Excellent', color: '#2ed573' };
    if (score >= 75) return { label: 'Good', color: '#00b09b' };
    if (score >= 60) return { label: 'Fair', color: '#ffd93d' };
    if (score >= 40) return { label: 'Needs Attention', color: '#ffa502' };
    return { label: 'Biased', color: '#ff4757' };
  };

  const fairnessInfo = getFairnessLabel(fairnessMetrics.fairnessScore);

  return (
    <div className="fairness-container">
      <div className="section-header" style={{ marginBottom: 30 }}>
        <h2>⚖️ Fairness & Bias Analysis - Ethical AI</h2>
        <p style={{ fontSize: '0.95em', color: 'var(--gray)', marginTop: 10 }}>
          Analyzing model behavior across different groups to ensure fair fraud detection
        </p>
      </div>

      <div className="fairness-score-card">
        <div className="score-display">
          <div 
            className="score-circle" 
            style={{ 
              background: `conic-gradient(${fairnessInfo.color} ${fairnessMetrics.fairnessScore}%, #e0e0e0 0%)`
            }}
          >
            <div className="score-inner">
              <span className="score-value">{fairnessMetrics.fairnessScore}</span>
              <span className="score-max">/100</span>
            </div>
          </div>
          <div className="score-info">
            <h3 style={{ color: fairnessInfo.color }}>{fairnessInfo.label}</h3>
            <p>Fairness Score</p>
          </div>
        </div>
        <div className="fairness-summary">
          <div className="summary-item">
            <strong>{fairnessMetrics.totalTransactions}</strong>
            <span>Transactions Analyzed</span>
          </div>
          <div className="summary-item">
            <strong>{alerts.filter(a => a.severity === 'high').length}</strong>
            <span>High Severity Issues</span>
          </div>
          <div className="summary-item">
            <strong>{alerts.filter(a => a.severity === 'medium').length}</strong>
            <span>Medium Severity Issues</span>
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="bias-alerts">
          <h3 style={{ marginBottom: 15, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiAlertCircle /> Bias Detection Results
          </h3>
          {alerts.map((alert, idx) => (
            <div 
              key={idx} 
              className={`alert-item alert-${alert.type}`}
              style={{ 
                borderLeft: `4px solid ${
                  alert.severity === 'high' ? '#ff4757' : 
                  alert.severity === 'medium' ? '#ffa502' : '#2ed573'
                }`
              }}
            >
              <div className="alert-icon">
                {alert.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
              </div>
              <div className="alert-content">
                <strong>{alert.category}</strong>
                <p>{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="fairness-charts">
        <div className="chart-box">
          <h3>Fraud Rate by Merchant Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fairnessMetrics.categoryData.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis label={{ value: 'Fraud Rate (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="fraudRate" name="Fraud Rate (%)">
                {fairnessMetrics.categoryData.slice(0, 8).map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fraudRate > 50 ? '#ff4757' : entry.fraudRate > 30 ? '#ffa502' : '#2ed573'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h3>Fraud Rate by Amount Range</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fairnessMetrics.amountData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Fraud Rate (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="fraudRate" name="Fraud Rate (%)">
                {fairnessMetrics.amountData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fraudRate > 50 ? '#ff4757' : entry.fraudRate > 30 ? '#ffa502' : '#2ed573'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h3>Fraud Rate by Location</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fairnessMetrics.locationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Fraud Rate (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="fraudRate" name="Fraud Rate (%)">
                {fairnessMetrics.locationData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fraudRate > 50 ? '#ff4757' : entry.fraudRate > 30 ? '#ffa502' : '#2ed573'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h3>Fraud Rate by Time of Day</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fairnessMetrics.timeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Fraud Rate (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="fraudRate" name="Fraud Rate (%)">
                {fairnessMetrics.timeData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fraudRate > 50 ? '#ff4757' : entry.fraudRate > 30 ? '#ffa502' : '#2ed573'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="fairness-info-box">
        <FiInfo size={18} />
        <p>
          <strong>How to interpret:</strong> A fair model should show similar fraud rates across different groups. 
          Large disparities may indicate bias. Aim for a fairness score above 75 for production use.
        </p>
      </div>
    </div>
  );
};
