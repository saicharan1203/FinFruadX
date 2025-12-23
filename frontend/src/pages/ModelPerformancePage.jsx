import React, { useState, useEffect } from 'react';
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
      <div className="page-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading model information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🤖 Model Performance</h1>
        <p>View and analyze fraud detection model performance metrics</p>
      </div>

      {modelInfo && (
        <div className="card">
          <h2><FiCpu /> Model Information</h2>
          <div className="model-info-grid">
            <div className="info-item">
              <label>Model Status:</label>
              <span className={modelInfo.trained ? 'status-active' : 'status-inactive'}>
                {modelInfo.trained ? 'Trained' : 'Not Trained'}
              </span>
            </div>
            <div className="info-item">
              <label>Model Type:</label>
              <span>{modelInfo.model_type || 'Ensemble (Random Forest + XGBoost + Isolation Forest)'}</span>
            </div>
            <div className="info-item">
              <label>Features:</label>
              <span>{modelInfo.num_features || 0} features</span>
            </div>
            {modelInfo.features && (
              <div className="info-item full-width">
                <label>Feature Names:</label>
                <div className="feature-tags">
                  {modelInfo.features.map((feature, index) => (
                    <span key={index} className="tag">{feature}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {predictions?.statistics && (
        <>
          <div className="card">
            <div className="card-header">
              <h2><FiBarChart2 /> Performance Metrics</h2>
              <button onClick={exportModelStats} className="btn btn-secondary btn-sm">
                <FiDownload /> Export Stats
              </button>
            </div>
            
            <div className="metrics-grid">
              <div className="metric-box">
                <h3>Total Transactions</h3>
                <p className="metric-value">{predictions.statistics.total_transactions.toLocaleString()}</p>
              </div>
              
              <div className="metric-box">
                <h3>Fraud Detection Rate</h3>
                <p className="metric-value">{predictions.statistics.fraud_percentage}%</p>
                <p className="metric-subtext">{predictions.statistics.fraudulent_detected} detected</p>
              </div>
              
              <div className="metric-box">
                <h3>Anomaly Detection</h3>
                <p className="metric-value">{predictions.statistics.anomalies_detected}</p>
                <p className="metric-subtext">Unusual patterns</p>
              </div>
              
              <div className="metric-box">
                <h3>Avg Confidence</h3>
                <p className="metric-value">{predictions.statistics.avg_confidence}%</p>
              </div>
            </div>
          </div>

          {predictions.statistics.feature_importance && (
            <div className="card">
              <h2>🧠 Feature Importance</h2>
              <p>Most influential features in fraud detection</p>
              
              <div className="feature-importance-chart">
                {Object.entries(predictions.statistics.feature_importance)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([feature, importance], index) => (
                    <div key={feature} className="feature-bar">
                      <div className="feature-info">
                        <span className="feature-rank">#{index + 1}</span>
                        <span className="feature-name">{feature}</span>
                      </div>
                      <div className="importance-bar">
                        <div 
                          className="importance-fill"
                          style={{ width: `${importance * 100}%` }}
                        ></div>
                      </div>
                      <span className="importance-value">{(importance * 100).toFixed(1)}%</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {predictions.statistics.by_risk_level && (
            <div className="card">
              <h2>📊 Risk Level Distribution</h2>
              <div className="risk-distribution-chart">
                {Object.entries(predictions.statistics.by_risk_level)
                  .map(([level, count]) => {
                    const percentage = (count / predictions.statistics.total_transactions) * 100;
                    return (
                      <div key={level} className="risk-level-bar">
                        <div className="risk-label">
                          <span className={`risk-badge risk-${level.toLowerCase()}`}>{level}</span>
                        </div>
                        <div className="risk-bar-container">
                          <div 
                            className={`risk-bar risk-${level.toLowerCase()}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="risk-stats">
                          <span className="risk-count">{count}</span>
                          <span className="risk-percent">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="training-health-card">
            <div className="training-health-header">
              <div className="training-health-title">
                <div className="training-avatar">🩺</div>
                <div>
                  <h2>Training Health Timeline</h2>
                  <p>Keep tabs on recency, drift, and model confidence.</p>
                </div>
              </div>
              <div className="training-health-controls">
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
              </div>
            </div>

            {historyLoading ? (
              <div className="loading-spinner small">
                <div className="spinner"></div>
                <p>Loading training history...</p>
              </div>
            ) : trainingHistory.length === 0 ? (
              <div className="empty-state-activity">
                <div className="empty-icon">🧪</div>
                <h3>No training runs logged yet</h3>
                <p>Train the model to start tracking drift and accuracy.</p>
              </div>
            ) : (
              <div className="training-timeline">
                {trainingHistory.slice(0, 6).map(run => {
                  const featurePills = run.feature_importance
                    ? Object.entries(run.feature_importance)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([feature]) => feature)
                    : [];
                  return (
                    <div className="timeline-entry" key={run.id}>
                      <div className="timeline-marker">
                        <FiClock />
                      </div>
                      <div className="timeline-body">
                        <div className="timeline-header">
                          <p>{new Date(run.timestamp).toLocaleString()}</p>
                          <span>{run.samples_trained?.toLocaleString?.() || run.samples_trained} samples</span>
                        </div>
                        <div className="timeline-metrics">
                          <div>
                            <label>Fraud ratio</label>
                            <strong>{(run.fraud_ratio * 100).toFixed(2)}%</strong>
                          </div>
                          <div>
                            <label>RF score</label>
                            <strong>{(run.rf_score * 100).toFixed(1)}%</strong>
                          </div>
                          <div>
                            <label>XGB score</label>
                            <strong>{(run.xgb_score * 100).toFixed(1)}%</strong>
                          </div>
                        </div>
                        {featurePills.length > 0 && (
                          <div className="timeline-features">
                            <span>Top features</span>
                            <div className="feature-pill-group">
                              {featurePills.map(feature => (
                                <span key={`${run.id}-${feature}`} className="feature-pill">{feature}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <div className="card">
        <h2><FiDatabase /> Model Versions</h2>
        <div className="model-versions-table">
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
            <div className={`version-status status-${versionStatus.state}`}>
              {versionStatus.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};