import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import axios from 'axios';
import { FiBarChart2, FiCpu, FiDatabase, FiDownload, FiRefreshCcw, FiClock } from 'react-icons/fi';

export const ModelPerformancePage = ({ predictions }) => {
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelVersions, setModelVersions] = useState([]);
  const [activeVersion, setActiveVersion] = useState(null);
  const [versionStatus, setVersionStatus] = useState(null);
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchModelInfo();
    fetchModelVersions();
    fetchTrainingHistory();
  }, []);

  const fetchModelInfo = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/model-info');
      setModelInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch model info:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModelVersions = async () => {
    try {
      setModelVersions([
        { id: 1, name: 'v1.0', date: '2024-01-15', accuracy: 92.5, notes: 'Initial ensemble release' },
        { id: 2, name: 'v1.1', date: '2024-02-20', accuracy: 94.2, notes: 'Improved categorical encoding' },
        { id: 3, name: 'v2.0', date: '2024-03-10', accuracy: 95.8, notes: 'Isolation Forest tuning' }
      ]);
    } catch (error) {
      console.error('Failed to fetch model versions:', error);
    }
  };

  const fetchTrainingHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await axios.get('/api/training-history');
      setTrainingHistory(response.data?.history || []);
    } catch (error) {
      console.error('Failed to load training history', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const getModelFreshness = () => {
    if (!trainingHistory.length) return null;
    const latest = trainingHistory[0];
    const ageMs = Date.now() - new Date(latest.timestamp).getTime();
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    if (ageDays <= 7) return { label: `${ageDays}d old`, status: 'fresh' };
    if (ageDays <= 30) return { label: `${ageDays}d old`, status: 'stale' };
    return { label: `${ageDays}d old`, status: 'outdated' };
  };

  const handleLoadVersion = async (version) => {
    setVersionStatus({ state: 'loading', message: `Loading ${version.name}...` });
    setActiveVersion(version.name);
    try {
      const response = await axios.post('/api/load-model', { name: version.name });
      if (response.data?.success) {
        setVersionStatus({ state: 'success', message: `${version.name} activated successfully.` });
        fetchModelInfo();
      } else {
        setVersionStatus({ state: 'error', message: response.data?.error || 'Unable to load model version.' });
      }
    } catch (error) {
      setVersionStatus({ state: 'error', message: error.response?.data?.error || error.message || 'Load failed' });
    }
  };

  const exportModelStats = () => {
    if (!predictions?.statistics) return;
    
    const data = JSON.stringify(predictions.statistics, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'model_performance_stats.json';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box className="page-container">
        <Box className="loading-spinner">
          <Box className="spinner"></Box>
          <p>Loading model information...</p>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="page-container">
      <Box className="page-header">
        <h1>🤖 Model Performance</h1>
        <p>View and analyze fraud detection model performance metrics</p>
      </Box>

      {modelInfo && (
        <Box className="card">
          <h2><FiCpu /> Model Information</h2>
          <Box className="model-info-grid">
            <Box className="info-item">
              <label>Model Status:</label>
              <span className={modelInfo.trained ? 'status-active' : 'status-inactive'}>
                {modelInfo.trained ? 'Trained' : 'Not Trained'}
              </span>
            </Box>
            <Box className="info-item">
              <label>Model Type:</label>
              <span>{modelInfo.model_type || 'Ensemble (Random Forest + XGBoost + Isolation Forest)'}</span>
            </Box>
            <Box className="info-item">
              <label>Features:</label>
              <span>{modelInfo.num_features || 0} features</span>
            </Box>
            {modelInfo.features && (
              <Box className="info-item full-width">
                <label>Feature Names:</label>
                <Box className="feature-tags">
                  {modelInfo.features.map((feature, index) => (
                    <span key={index} className="tag">{feature}</span>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {predictions?.statistics && (
        <>
          <Box className="card">
            <Box className="card-header">
              <h2><FiBarChart2 /> Performance Metrics</h2>
              <button onClick={exportModelStats} className="btn btn-secondary btn-sm">
                <FiDownload /> Export Stats
              </button>
            </Box>
            
            <Box className="metrics-grid">
              <Box className="metric-box">
                <h3>Total Transactions</h3>
                <p className="metric-value">{predictions.statistics.total_transactions.toLocaleString()}</p>
              </Box>
              
              <Box className="metric-box">
                <h3>Fraud Detection Rate</h3>
                <p className="metric-value">{predictions.statistics.fraud_percentage}%</p>
                <p className="metric-subtext">{predictions.statistics.fraudulent_detected} detected</p>
              </Box>
              
              <Box className="metric-box">
                <h3>Anomaly Detection</h3>
                <p className="metric-value">{predictions.statistics.anomalies_detected}</p>
                <p className="metric-subtext">Unusual patterns</p>
              </Box>
              
              <Box className="metric-box">
                <h3>Avg Confidence</h3>
                <p className="metric-value">{predictions.statistics.avg_confidence}%</p>
              </Box>
            </Box>
          </Box>

          {predictions.statistics.feature_importance && (
            <Box className="card">
              <h2>🧠 Feature Importance</h2>
              <p>Most influential features in fraud detection</p>
              
              <Box className="feature-importance-chart">
                {Object.entries(predictions.statistics.feature_importance)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([feature, importance], index) => (
                    <Box key={feature} className="feature-bar">
                      <Box className="feature-info">
                        <span className="feature-rank">#{index + 1}</span>
                        <span className="feature-name">{feature}</span>
                      </Box>
                      <Box className="importance-bar">
                        <Box 
                          className="importance-fill"
                          style={{ width: `${importance * 100}%` }}
                        ></Box>
                      </Box>
                      <span className="importance-value">{(importance * 100).toFixed(1)}%</span>
                    </Box>
                  ))}
              </Box>
            </Box>
          )}

          {predictions.statistics.by_risk_level && (
            <Box className="card">
              <h2>📊 Risk Level Distribution</h2>
              <Box className="risk-distribution-chart">
                {Object.entries(predictions.statistics.by_risk_level)
                  .map(([level, count]) => {
                    const percentage = (count / predictions.statistics.total_transactions) * 100;
                    return (
                      <Box key={level} className="risk-level-bar">
                        <Box className="risk-label">
                          <span className={`risk-badge risk-${level.toLowerCase()}`}>{level}</span>
                        </Box>
                        <Box className="risk-bar-container">
                          <Box 
                            className={`risk-bar risk-${level.toLowerCase()}`}
                            style={{ width: `${percentage}%` }}
                          ></Box>
                        </Box>
                        <Box className="risk-stats">
                          <span className="risk-count">{count}</span>
                          <span className="risk-percent">{percentage.toFixed(1)}%</span>
                        </Box>
                      </Box>
                    );
                  })}
              </Box>
            </Box>
          )}

          <Box className="training-health-card">
            <Box className="training-health-header">
              <Box className="training-health-title">
                <Box className="training-avatar">🩺</Box>
                <Box>
                  <h2>Training Health Timeline</h2>
                  <p>Keep tabs on recency, drift, and model confidence.</p>
                </Box>
              </Box>
              <Box className="training-health-controls">
                <button
                  className={`pill-button ${historyLoading ? 'pill-disabled' : ''}`}
                  onClick={fetchTrainingHistory}
                  disabled={historyLoading}
                >
                  <FiRefreshCcw /> {historyLoading ? 'Refreshing…' : 'Refresh'}
                </button>
                {(() => {
                  const freshness = getModelFreshness();
                  if (!freshness) return null;
                  const labelMap = {
                    fresh: 'New',
                    stale: 'Aging',
                    outdated: 'Old'
                  };
                  return (
                    <span className={`pill-badge badge-${freshness.status}`}>
                      {labelMap[freshness.status] || freshness.status}
                      <small>{freshness.label}</small>
                    </span>
                  );
                })()}
              </Box>
            </Box>

            {historyLoading ? (
              <Box className="loading-spinner small">
                <Box className="spinner"></Box>
                <p>Loading training history...</p>
              </Box>
            ) : trainingHistory.length === 0 ? (
              <Box className="empty-state-activity">
                <Box className="empty-icon">🧪</Box>
                <h3>No training runs logged yet</h3>
                <p>Train the model to start tracking drift and accuracy.</p>
              </Box>
            ) : (
              <Box className="training-timeline">
                {trainingHistory.slice(0, 6).map(run => {
                  const featurePills = run.feature_importance
                    ? Object.entries(run.feature_importance)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([feature]) => feature)
                    : [];
                  return (
                    <Box className="timeline-entry" key={run.id}>
                      <Box className="timeline-marker">
                        <FiClock />
                      </Box>
                      <Box className="timeline-body">
                        <Box className="timeline-header">
                          <p>{new Date(run.timestamp).toLocaleString()}</p>
                          <span>{run.samples_trained?.toLocaleString?.() || run.samples_trained} samples</span>
                        </Box>
                        <Box className="timeline-metrics">
                          <Box>
                            <label>Fraud ratio</label>
                            <strong>{(run.fraud_ratio * 100).toFixed(2)}%</strong>
                          </Box>
                          <Box>
                            <label>RF score</label>
                            <strong>{(run.rf_score * 100).toFixed(1)}%</strong>
                          </Box>
                          <Box>
                            <label>XGB score</label>
                            <strong>{(run.xgb_score * 100).toFixed(1)}%</strong>
                          </Box>
                        </Box>
                        {featurePills.length > 0 && (
                          <Box className="timeline-features">
                            <span>Top features</span>
                            <Box className="feature-pill-group">
                              {featurePills.map(feature => (
                                <span key={`${run.id}-${feature}`} className="feature-pill">{feature}</span>
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </>
      )}

      <Box className="card">
        <h2><FiDatabase /> Model Versions</h2>
        <Box className="model-versions-table">
          <table>
            <thead>
              <tr>
                <th>Version</th>
                <th>Date</th>
                <th>Accuracy</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {modelVersions.map(version => (
                <tr key={version.id}>
                  <td>{version.name}</td>
                  <td>{version.date}</td>
                  <td>{version.accuracy}%</td>
                  <td>
                    <button
                      className={`btn btn-sm ${activeVersion === version.name ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleLoadVersion(version)}
                    >
                      {activeVersion === version.name && versionStatus?.state === 'loading' ? 'Loading...' : 'Load'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {versionStatus && (
            <Box className={`version-status status-${versionStatus.state}`}>
              {versionStatus.message}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};