import React, { useState } from 'react';
import axios from 'axios';
import API_URL from '../apiConfig';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { FiActivity, FiAlertTriangle, FiTrendingUp, FiDownload, FiWifi } from 'react-icons/fi';
import 'react-circular-progressbar/dist/styles.css';
import '../styles/dashboard.css';
import DownloadDialog from './DownloadDialog';
import { exportData } from '../utils/exportUtils';

export const Dashboard = ({ fileInfo, onPredictionsComplete }) => {
  const [fraudLabel, setFraudLabel] = useState('is_fraud');
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trainingStats, setTrainingStats] = useState(null);
  const [trainLoading, setTrainLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadDataType, setDownloadDataType] = useState(null);
  const [modelStatus, setModelStatus] = useState({
    state: 'offline',
    message: 'Awaiting your first training run',
    timestamp: null
  });

  const statusThemes = {
    online: {
      label: 'Online',
      tone: 'success',
      description: 'Latest model is ready for live predictions'
    },
    training: {
      label: 'Training',
      tone: 'warning',
      description: 'Model is currently learning from your data'
    },
    error: {
      label: 'Attention',
      tone: 'danger',
      description: 'We hit a snag while training the model'
    },
    offline: {
      label: 'Offline',
      tone: 'muted',
      description: 'Kick off a training run to activate the model'
    }
  };

  const getStatusMeta = () => statusThemes[modelStatus.state] || statusThemes.offline;

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'Not started yet';
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const trainModel = async () => {
    if (!fileInfo?.filepath) return;

    setTrainLoading(true);
    setModelStatus({
      state: 'training',
      message: 'Model is learning with your dataset in real-time...',
      timestamp: new Date().toISOString()
    });
    try {
      const response = await axios.post(`${API_URL}/api/train`, {
        filepath: fileInfo.filepath,
        fraud_column: fraudLabel
      });

      if (response.data.success) {
        setTrainingStats(response.data.stats);
        setModelStatus({
          state: 'online',
          message: 'Training completed successfully — model is live!',
          timestamp: new Date().toISOString()
        });
        alert('✅ Model trained successfully!');
      }
    } catch (error) {
      setModelStatus({
        state: 'error',
        message: error.response?.data?.error || error.message || 'Training failed',
        timestamp: new Date().toISOString()
      });
      alert(`❌ Training failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setTrainLoading(false);
    }
  };

  const loadModel = async () => {
    setModelLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/load-model`);
      if (response.data && response.data.success) {
        setModelLoaded(response.data);
        setModelStatus({
          state: 'online',
          message: 'Loaded a saved model version — ready to predict.',
          timestamp: new Date().toISOString()
        });
        alert('✅ Model loaded from disk');
      } else {
        setModelStatus({
          state: 'error',
          message: response.data?.error || 'Unable to load the saved model',
          timestamp: new Date().toISOString()
        });
        alert(`❌ Load failed: ${response.data?.error || 'Unknown error'}`);
      }
    } catch (error) {
      setModelStatus({
        state: 'error',
        message: error.response?.data?.error || error.message || 'Load failed',
        timestamp: new Date().toISOString()
      });
      alert(`❌ Load failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setModelLoading(false);
    }
  };

  const runPrediction = async () => {
    if (!fileInfo?.filepath) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/predict`, {
        filepath: fileInfo.filepath
      });

      if (response.data.success) {
        setPredictions(response.data);
        onPredictionsComplete(response.data);
      }
    } catch (error) {
      alert(`❌ Prediction failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for export
  const getExportData = () => {
    if (downloadDataType === 'predictions' && predictions) {
      // Export top transactions data
      const topTxns = predictions.insights?.top_transactions || [];
      return topTxns.map(txn => ({
        transaction_id: txn.transaction_id,
        customer_id: txn.customer_id,
        amount: txn.amount,
        fraud_probability: (txn.probability * 100).toFixed(2) + '%',
        risk_level: txn.risk_level || 'Unknown'
      }));
    } else if (downloadDataType === 'training' && trainingStats) {
      // Export training stats
      return [{
        samples_trained: trainingStats.samples_trained,
        fraud_ratio: (trainingStats.fraud_ratio * 100).toFixed(2) + '%',
        rf_score: (trainingStats.rf_score * 100).toFixed(2) + '%',
        xgb_score: (trainingStats.xgb_score * 100).toFixed(2) + '%'
      }];
    } else if (downloadDataType === 'customers' && predictions?.insights?.hot_customers) {
      return predictions.insights.hot_customers.map(c => ({
        customer_id: c.customer_id,
        high_risk_transactions: c.high_risk_count,
        avg_probability: (c.avg_probability * 100).toFixed(2) + '%',
        total_amount: '$' + (c.total_amount || 0).toLocaleString()
      }));
    }
    return [];
  };

  const handleDownload = async (format) => {
    const data = getExportData();
    const titles = {
      predictions: 'Fraud Detection Results',
      training: 'Model Training Statistics',
      customers: 'High Risk Customers Report'
    };
    await exportData(format, data, {
      filename: `finfraudx_${downloadDataType}`,
      title: titles[downloadDataType] || 'Data Export'
    });
  };

  const openDownloadDialog = (dataType) => {
    setDownloadDataType(dataType);
    setShowDownloadDialog(true);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1><span className="highlight-title">🎯 FinFraudX Dashboard</span></h1>
        <p><span className="highlight-label">AI-Powered Fraud Detection System</span></p>
        <div className="button-group" style={{ justifyContent: 'center', marginTop: 10 }}>
          <input
            value={fraudLabel}
            onChange={(e) => setFraudLabel(e.target.value)}
            placeholder="Fraud label column (default: is_fraud)"
            className="btn btn-sm"
            style={{ background: 'white', color: 'var(--dark)', minWidth: 260 }}
          />
        </div>
        <div className="status-banner">
          <div className={`status-pill status-${getStatusMeta().tone}`}>
            <span className="status-icon"><FiWifi /></span>
            <div>
              <p className="status-label">{getStatusMeta().label}</p>
              <p className="status-subtext">{modelStatus.message || getStatusMeta().description}</p>
            </div>
            <div className="status-timestamp">{formatTimestamp(modelStatus.timestamp)}</div>
          </div>
        </div>
        {fileInfo && (
          <div className="dataset-banner">
            <div className="dataset-pill">
              <span>Rows scanned</span>
              <strong>{fileInfo.rows ?? fileInfo.row_count ?? '--'}</strong>
            </div>
            <div className="dataset-pill">
              <span>Columns detected</span>
              <strong>{fileInfo.columns ? fileInfo.columns.length : fileInfo.column_count ?? '--'}</strong>
            </div>
            <div className="dataset-pill">
              <span>Fraud label preview</span>
              <strong>
                {(() => {
                  const preview = fileInfo.sample?.[0]?.[fraudLabel];
                  if (preview === undefined || preview === null) return 'n/a';
                  return String(preview);
                })()}
              </strong>
            </div>
          </div>
        )}
      </div>

      {!trainingStats && (
        <div className="action-card">
          <h2><span className="highlight-title">🚀 Model Training</span></h2>
          <p>Train the fraud detection model on your data</p>
          <div className="button-group" style={{ justifyContent: 'center' }}>
            <button
              onClick={trainModel}
              disabled={trainLoading || !fileInfo}
              className={`btn btn-primary btn-large ${trainLoading ? 'btn-loading' : ''}`}
            >
              {trainLoading ? '⏳ Training...' : <span className="highlight-action">🤖 Train Model</span>}
            </button>
            <button
              onClick={async () => {
                const name = prompt('Enter model version name to save:');
                if (!name) return;
                try {
                  const resp = await axios.post(`${API_URL}/api/save-model`, { name });
                  alert(resp.data?.message || 'Saved');
                } catch (e) {
                  alert(`❌ Save failed: ${e.response?.data?.error || e.message}`);
                }
              }}
              className={`btn btn-secondary btn-large`}
            >
              <span className="highlight-action">💾 Save Model Version</span>
            </button>
            <button
              onClick={loadModel}
              disabled={modelLoading}
              className={`btn btn-secondary btn-large ${modelLoading ? 'btn-loading' : ''}`}
            >
              {modelLoading ? '⏳ Loading...' : <span className="highlight-action">📦 Load Saved Model</span>}
            </button>
          </div>
        </div>
      )}

      {trainingStats && (
        <>
          <div className="metrics-grid">
            <MetricCard
              icon={<FiActivity />}
              label="Samples Trained"
              value={trainingStats.samples_trained}
              subtext={`Fraud Rate: ${(trainingStats.fraud_ratio * 100).toFixed(2)}%`}
            />
            <MetricCard
              icon={<FiTrendingUp />}
              label="Random Forest Score"
              value={`${(trainingStats.rf_score * 100).toFixed(2)}%`}
            />
            <MetricCard
              icon={<FiTrendingUp />}
              label="XGBoost Score"
              value={`${(trainingStats.xgb_score * 100).toFixed(2)}%`}
            />
          </div>

          {trainingStats.feature_importance && (
            <div className="action-card">
              <h2>🧠 Top Features</h2>
              <p>Most influential features in the ensemble</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0' }}>
                {Object.entries(trainingStats.feature_importance)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([name, score]) => (
                    <li key={name} style={{ margin: '8px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ minWidth: 160, fontWeight: 600 }}>{name}</span>
                        <div style={{ flex: 1, background: 'rgba(0,0,0,0.08)', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                          <div style={{ width: `${(score * 100).toFixed(1)}%`, height: 10, background: 'var(--primary)' }} />
                        </div>
                        <span style={{ minWidth: 60 }}>{(score * 100).toFixed(1)}%</span>
                      </div>
                    </li>
                  ))}
              </ul>
              <button onClick={() => { const data = JSON.stringify(trainingStats, null, 2); const blob = new Blob([data], { type: 'application/json' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'training_stats.json'; a.click(); window.URL.revokeObjectURL(url); }} className='btn btn-primary btn-sm' style={{ marginTop: 10 }}>
                <FiDownload /> Export Training Stats
              </button>
            </div>
          )}
        </>
      )}

      {(trainingStats || modelLoaded) && !predictions && (
        <div className="action-card">
          <h2>🔮 Run Predictions</h2>
          <p>Detect fraudulent transactions on new data</p>
          <button
            onClick={runPrediction}
            disabled={loading}
            className={`btn btn-primary btn-large ${loading ? 'btn-loading' : ''}`}
          >
            {loading ? '⏳ Processing...' : '🔍 Detect Fraud'}
          </button>
        </div>
      )}

      {predictions && (
        <>
          <PredictionResults predictions={predictions} />
          <InsightsPanel
            insights={predictions.insights}
            alertSummary={predictions.alert_summary}
            customAlerts={predictions.custom_alerts}
            watchlistHits={predictions.watchlist_hits}
          />

          {/* Download Actions */}
          <div className="action-card" style={{ marginTop: 20 }}>
            <h2>📥 Export Data</h2>
            <p>Download your fraud detection results in PDF or Excel format</p>
            <div className="button-group" style={{ justifyContent: 'center', marginTop: 15, gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => openDownloadDialog('predictions')}
                className="btn btn-primary"
              >
                <FiDownload /> Export Transactions
              </button>
              <button
                onClick={() => openDownloadDialog('customers')}
                className="btn btn-secondary"
              >
                <FiDownload /> Export High Risk Customers
              </button>
            </div>
          </div>
        </>
      )}

      {/* Download Dialog */}
      <DownloadDialog
        isOpen={showDownloadDialog}
        onClose={() => setShowDownloadDialog(false)}
        onDownload={handleDownload}
        title="Download Report"
        description="Select your preferred format to export the data."
      />
    </div>
  );
};

const MetricCard = ({ icon, label, value, subtext }) => (
  <div className="metric-card">
    <div className="metric-icon">{icon}</div>
    <h3>{label}</h3>
    <p className="metric-value">{value}</p>
    {subtext && <p className="metric-subtext">{subtext}</p>}
  </div>
);

const PredictionResults = ({ predictions }) => {
  const stats = predictions.statistics;

  return (
    <div className="results-container">
      <h2>📊 Prediction Results</h2>

      <div className="metrics-grid">
        <div className="metric-card metric-card-large">
          <FiAlertTriangle className="metric-icon warning" />
          <h3>Fraudulent Transactions</h3>
          <p className="metric-value">{stats.fraudulent_detected}</p>
          <p className="metric-subtext">{stats.fraud_percentage}% of total</p>
        </div>

        <div className="metric-card metric-card-large">
          <FiActivity className="metric-icon info" />
          <h3>Anomalies Detected</h3>
          <p className="metric-value">{stats.anomalies_detected}</p>
          <p className="metric-subtext">Unusual patterns</p>
        </div>

        <div className="metric-card metric-card-large">
          <div style={{ width: 100, height: 100, margin: '0 auto' }}>
            <CircularProgressbar
              value={Math.min(stats.avg_fraud_probability * 100, 100)}
              text={`${(stats.avg_fraud_probability * 100).toFixed(1)}%`}
              styles={buildStyles({
                rotation: 0,
                strokeLinecap: 'round',
                textSize: '12px',
                pathTransitionDuration: 0.5,
                pathColor: stats.avg_fraud_probability > 0.5 ? '#ff4757' : '#2ed573',
                textColor: '#333',
                trailColor: '#e0e0e0',
                backgroundColor: '#3da5c4',
              })}
            />
          </div>
          <h3>Avg. Risk Score</h3>
        </div>

        {stats.avg_confidence && (
          <div className="metric-card metric-card-large">
            <div style={{ width: 100, height: 100, margin: '0 auto' }}>
              <CircularProgressbar
                value={stats.avg_confidence}
                text={`${stats.avg_confidence.toFixed(1)}%`}
                styles={buildStyles({
                  rotation: 0,
                  strokeLinecap: 'round',
                  textSize: '12px',
                  pathTransitionDuration: 0.5,
                  pathColor: stats.avg_confidence > 70 ? '#2ed573' : '#ffa502',
                  textColor: '#333',
                  trailColor: '#e0e0e0',
                })}
              />
            </div>
            <h3>Avg. Confidence</h3>
          </div>
        )}
      </div>

      <div className="risk-distribution">
        <h3>📈 Risk Distribution</h3>
        <div className="risk-bars">
          {(() => {
            const riskLevels = Object.entries(stats.by_risk_level || {});
            const fallbackTotal = riskLevels.reduce((sum, [, value]) => sum + value, 0);
            const denominator = stats.total_transactions || fallbackTotal || 1;

            return riskLevels.map(([level, count]) => {
              const percent = (count / denominator) * 100;
              const normalized = level.toLowerCase();

              return (
                <div key={level} className={`risk-bar-card risk-${normalized}`}>
                  <div className="risk-bar-header">
                    <div>
                      <span className="risk-level-label">{level}</span>
                      <span className="risk-level-chip">{percent.toFixed(1)}%</span>
                    </div>
                    <span className="risk-level-count">{count.toLocaleString()} cases</span>
                  </div>
                  <div className="risk-bar-track">
                    <div
                      className="risk-bar-fill"
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    >
                      <span className="risk-bar-percent">{percent.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      <div className="category-stats">
        <h3>📂 Top Merchant Categories</h3>
        <ul>
          {Object.entries(stats.by_category || {}).map(([category, count]) => (
            <li key={category}>
              <span>{category}</span>
              <strong>{count} transactions</strong>
            </li>
          ))}
        </ul>
      </div>

      {stats.category_fraud_rates && Object.keys(stats.category_fraud_rates).length > 0 && (
        <div className="category-stats">
          <h3>⚠️ Fraud Rates by Category</h3>
          <ul>
            {Object.entries(stats.category_fraud_rates || {})
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([category, rate]) => (
                <li key={category}>
                  <span>{category}</span>
                  <strong>{rate.toFixed(2)}%</strong>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const InsightsPanel = ({ insights = {}, alertSummary = {}, customAlerts = [], watchlistHits = [] }) => {
  const {
    risk_pulse: riskPulse = {},
    top_transactions: topTransactions = [],
    hot_customers: hotCustomers = [],
    merchant_hotspots: merchantHotspots = []
  } = insights || {};

  const pulseCards = [
    {
      label: 'Avg Fraud Probability',
      value:
        riskPulse.avg_probability !== undefined
          ? `${(Number(riskPulse.avg_probability) * 100).toFixed(1)}%`
          : '—',
    },
    {
      label: 'High Risk Ratio',
      value:
        riskPulse.high_risk_ratio !== undefined
          ? `${Number(riskPulse.high_risk_ratio).toFixed(1)}%`
          : '—',
    },
    {
      label: 'Medium Risk Ratio',
      value:
        riskPulse.medium_risk_ratio !== undefined
          ? `${Number(riskPulse.medium_risk_ratio).toFixed(1)}%`
          : '—',
    },
    {
      label: 'Anomaly Rate',
      value:
        riskPulse.anomaly_rate !== undefined
          ? `${Number(riskPulse.anomaly_rate).toFixed(1)}%`
          : '—',
    }
  ];

  const recentAlerts = (customAlerts || []).slice(0, 4);

  return (
    <div className="insights-panel">
      <div className="insights-header">
        <div>
          <h2>🔎 Intelligence Highlights</h2>
          <p>Spot where fraud risk is spiking across entities and thresholds</p>
        </div>
        {alertSummary?.total_alerts !== undefined && (
          <div className="alert-chip">
            {alertSummary.total_alerts} Alerts • {alertSummary.watchlist_hits || 0} Watchlist hits
          </div>
        )}
      </div>

      <div className="insights-grid">
        {pulseCards.map((card) => (
          <div className="insight-card" key={card.label}>
            <span className="insight-label">{card.label}</span>
            <strong>{card.value}</strong>
          </div>
        ))}
      </div>

      <div className="insights-columns">
        <div className="insight-table">
          <div className="insight-table-header">
            <h3>🔥 Top Suspicious Transactions</h3>
            <span>{topTransactions.length} tracked</span>
          </div>
          {topTransactions.length === 0 ? (
            <p className="insight-empty">Run predictions to populate this list.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Fraud Probability</th>
                </tr>
              </thead>
              <tbody>
                {topTransactions.slice(0, 5).map((txn) => (
                  <tr key={txn.transaction_id}>
                    <td>{txn.transaction_id}</td>
                    <td>{txn.customer_id}</td>
                    <td>${Number(txn.amount || 0).toLocaleString()}</td>
                    <td>{(Number(txn.probability) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="insight-table">
          <div className="insight-table-header">
            <h3>👥 Hot Customers</h3>
            <span>{hotCustomers.length} flagged</span>
          </div>
          {hotCustomers.length === 0 ? (
            <p className="insight-empty">No customer clusters flagged yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>High Risk Txns</th>
                  <th>Avg Probability</th>
                  <th>Total Volume</th>
                </tr>
              </thead>
              <tbody>
                {hotCustomers.slice(0, 5).map((cust) => (
                  <tr key={cust.customer_id}>
                    <td>{cust.customer_id}</td>
                    <td>{cust.high_risk_count}</td>
                    <td>{(Number(cust.avg_probability) * 100).toFixed(1)}%</td>
                    <td>${Number(cust.total_amount || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="insights-columns">
        <div className="insight-table compact">
          <div className="insight-table-header">
            <h3>🏪 Merchant Hotspots</h3>
            <span>{merchantHotspots.length} monitored</span>
          </div>
          {merchantHotspots.length === 0 ? (
            <p className="insight-empty">No merchants breaching thresholds.</p>
          ) : (
            <ul className="insight-list">
              {merchantHotspots.slice(0, 5).map((merchant) => (
                <li key={merchant.merchant_id}>
                  <div>
                    <strong>{merchant.merchant_id}</strong>
                    <span>{merchant.transaction_count} txns</span>
                  </div>
                  <div>
                    <span>{(Number(merchant.avg_probability) * 100).toFixed(1)}% avg prob</span>
                    <span>${Number(merchant.total_amount || 0).toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="insight-table compact">
          <div className="insight-table-header">
            <h3>🚨 Latest Alerts</h3>
            <span>{recentAlerts.length} shown</span>
          </div>
          {recentAlerts.length === 0 ? (
            <p className="insight-empty">No threshold breaches recorded.</p>
          ) : (
            <ul className="insight-list">
              {recentAlerts.map((alert, index) => (
                <li key={`${alert.type}-${index}`}>
                  <div>
                    <strong>{alert.type.replace('_', ' ')}</strong>
                    <span>{alert.risk_level}</span>
                  </div>
                  <div>
                    <span>{alert.message}</span>
                    {alert.probability !== undefined && (
                      <span>{(Number(alert.probability) * 100).toFixed(1)}%</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {watchlistHits?.length > 0 && (
            <div className="watchlist-banner">
              <strong>{watchlistHits.length}</strong>
              <div>
                Watchlist entities triggered this run.
                <span>Last hit: {watchlistHits[0].customer_id || watchlistHits[0].merchant_id}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};