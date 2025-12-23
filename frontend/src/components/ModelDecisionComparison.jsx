import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi';
import '../styles/dashboard.css';

export const ModelDecisionComparison = ({ predictions }) => {
  const [comparisons, setComparisons] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all'); // all, agree, disagree

  useEffect(() => {
    if (predictions && predictions.results) {
      analyzeDecisions(predictions.results);
    }
  }, [predictions]);

  const normalizeProbability = (value, fallback = 0) => {
    const num = parseFloat(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.min(1, Math.max(0, num));
  };

  const deriveAgreement = (rfVote, xgbVote, isoVote) => {
    const votes = [rfVote, xgbVote, isoVote];
    const normalizedVotes = votes.map(v => (v || '').toLowerCase());
    if (normalizedVotes.every(v => v === normalizedVotes[0])) {
      return 'unanimous';
    }
    const fraudVotes = normalizedVotes.filter(v => v === 'fraud').length;
    return fraudVotes === 0 || fraudVotes === 3 ? 'unanimous' : fraudVotes === 2 || fraudVotes === 1 ? 'majority' : 'split';
  };

  const analyzeDecisions = (results = []) => {
    if (!Array.isArray(results) || results.length === 0) {
      setComparisons([]);
      setStats(null);
      return;
    }

    const prioritized = [...results]
      .filter(Boolean)
      .sort((a, b) => normalizeProbability(b.ensemble_fraud_probability) - normalizeProbability(a.ensemble_fraud_probability));

    const sampledResults = prioritized.slice(0, 25);

    const comparisons = sampledResults.map((txn, idx) => {
      const amount = parseFloat(txn.amount || 0);
      const customerId = txn.customer_id || txn.customer || `#${idx + 1}`;
      const rfScore = normalizeProbability(txn.rf_fraud_probability);
      const xgbScore = normalizeProbability(txn.xgb_fraud_probability);
      const isoScore = normalizeProbability(txn.iso_fraud_probability);
      const rfPrediction = txn.rf_prediction || (rfScore > 0.5 ? 'Fraud' : 'Normal');
      const xgbPrediction = txn.xgb_prediction || (xgbScore > 0.5 ? 'Fraud' : 'Normal');
      const isoPrediction = txn.iso_prediction || (isoScore > 0.5 ? 'Fraud' : 'Normal');
      const finalDecision = txn.final_decision_label || (txn.is_fraud_predicted ? 'Fraud' : 'Normal');
      const agreement = (txn.agreement_state || deriveAgreement(rfPrediction, xgbPrediction, isoPrediction)).toLowerCase();
      const confidencePercent = normalizeProbability(txn.confidence_score, normalizeProbability(txn.ensemble_fraud_probability)) * 100;

      return {
        id: idx + 1,
        customerId,
        amount,
        category: txn.merchant_category || txn.category || 'Unknown',
        rf: { prediction: rfPrediction, score: (rfScore * 100).toFixed(1) },
        xgb: { prediction: xgbPrediction, score: (xgbScore * 100).toFixed(1) },
        iso: { prediction: isoPrediction, score: (isoScore * 100).toFixed(1) },
        final: finalDecision,
        riskLevel: txn.risk_level || 'Low',
        agreement,
        confidence: confidencePercent.toFixed(1)
      };
    });

    const totalPredictions = comparisons.length || 1;
    const unanimousCount = comparisons.filter(c => c.agreement === 'unanimous').length;
    const majorityCount = comparisons.filter(c => c.agreement === 'majority').length;
    const splitCount = comparisons.filter(c => c.agreement === 'split').length;
    const rfAccuracy = comparisons.filter(c => c.rf.prediction === c.final).length;
    const xgbAccuracy = comparisons.filter(c => c.xgb.prediction === c.final).length;
    const isoAccuracy = comparisons.filter(c => c.iso.prediction === c.final).length;

    setComparisons(comparisons);
    setStats({
      total: comparisons.length,
      unanimous: unanimousCount,
      majority: majorityCount,
      split: splitCount,
      rfAccuracy: ((rfAccuracy / totalPredictions) * 100).toFixed(1),
      xgbAccuracy: ((xgbAccuracy / totalPredictions) * 100).toFixed(1),
      isoAccuracy: ((isoAccuracy / totalPredictions) * 100).toFixed(1)
    });
  };

  if (!predictions || comparisons.length === 0) {
    return null;
  }

  const filteredComparisons = filter === 'all' ? comparisons :
    filter === 'agree' ? comparisons.filter(c => c.agreement === 'unanimous') :
    comparisons.filter(c => c.agreement !== 'unanimous');

  const renderModelDecision = (modelData, modelKey) => {
    if (!modelData) return null;
    const isFraud = modelData.prediction === 'Fraud';
    return (
      <div className={`model-score-pill ${isFraud ? 'fraud' : 'normal'} model-${modelKey}`}>
        <div className="model-icon">
          {isFraud ? <FiXCircle /> : <FiCheckCircle />}
        </div>
        <div className="model-score-meta">
          <span className="decision-label">{modelData.prediction}</span>
          <span className="decision-score">{modelData.score}%</span>
        </div>
      </div>
    );
  };

  const renderConfidenceMeter = (confidence) => {
    const confidenceValue = Math.min(100, Math.max(0, parseFloat(confidence || 0)));
    const confidenceColor = confidenceValue >= 75 ? '#2ed573' : confidenceValue >= 50 ? '#ffa502' : '#ff6b81';
    return (
      <div className="confidence-stack">
        <div className="confidence-meter">
          <div
            className="confidence-bar"
            style={{ width: `${confidenceValue}%`, background: confidenceColor }}
          ></div>
        </div>
        <span className="confidence-label">{confidenceValue}%</span>
      </div>
    );
  };

  return (
    <div className="decision-comparison-container">
      <div className="section-header" style={{ marginBottom: 30 }}>
        <h2>💬 Model Decision Comparison - Ensemble Explainability</h2>
        <p style={{ fontSize: '0.95em', color: 'var(--gray)', marginTop: 10 }}>
          See how each ML algorithm voted and how ensemble decision was reached
        </p>
      </div>

      {stats && (
        <div className="comparison-stats">
          <div className="stat-box-compact">
            <strong>{stats.total}</strong>
            <span>Predictions Analyzed</span>
          </div>
          <div className="stat-box-compact">
            <strong>{stats.unanimous}</strong>
            <span>Unanimous Decisions</span>
          </div>
          <div className="stat-box-compact">
            <strong>{stats.majority}</strong>
            <span>Majority Votes</span>
          </div>
          <div className="stat-box-compact">
            <strong>{stats.split}</strong>
            <span>Split Decisions</span>
          </div>
        </div>
      )}

      <div className="model-accuracy-cards">
        <div className="accuracy-card">
          <div className="accuracy-header" style={{ background: '#6a11cb' }}>
            <h4>🌲 Random Forest</h4>
          </div>
          <div className="accuracy-score">
            <span className="accuracy-value">{stats?.rfAccuracy}%</span>
            <span className="accuracy-label">Alignment with Ensemble</span>
          </div>
        </div>
        <div className="accuracy-card">
          <div className="accuracy-header" style={{ background: '#2575fc' }}>
            <h4>⚡ XGBoost</h4>
          </div>
          <div className="accuracy-score">
            <span className="accuracy-value">{stats?.xgbAccuracy}%</span>
            <span className="accuracy-label">Alignment with Ensemble</span>
          </div>
        </div>
        <div className="accuracy-card">
          <div className="accuracy-header" style={{ background: '#ff9a44' }}>
            <h4>🔍 Isolation Forest</h4>
          </div>
          <div className="accuracy-score">
            <span className="accuracy-value">{stats?.isoAccuracy}%</span>
            <span className="accuracy-label">Alignment with Ensemble</span>
          </div>
        </div>
      </div>

      <div className="filter-controls">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Predictions
        </button>
        <button 
          className={`filter-btn ${filter === 'agree' ? 'active' : ''}`}
          onClick={() => setFilter('agree')}
        >
          Unanimous Only
        </button>
        <button 
          className={`filter-btn ${filter === 'disagree' ? 'active' : ''}`}
          onClick={() => setFilter('disagree')}
        >
          Disagreements
        </button>
      </div>

      <div className="comparison-table-wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Category</th>
              <th>🌲 RF<br/><span style={{ fontSize: '0.7em', fontWeight: 'normal' }}>(Score)</span></th>
              <th>⚡ XGB<br/><span style={{ fontSize: '0.7em', fontWeight: 'normal' }}>(Score)</span></th>
              <th>🔍 ISO<br/><span style={{ fontSize: '0.7em', fontWeight: 'normal' }}>(Score)</span></th>
              <th>Final Decision</th>
              <th>Confidence</th>
              <th>Agreement</th>
            </tr>
          </thead>
          <tbody>
            {filteredComparisons.map((comp) => (
              <tr key={comp.id} className={`agreement-${comp.agreement}`}>
                <td>{comp.id}</td>
                <td>{comp.customerId}</td>
                <td>₹{comp.amount.toFixed(2)}</td>
                <td>{comp.category}</td>
                <td className="decision-cell">{renderModelDecision(comp.rf, 'rf')}</td>
                <td className="decision-cell">{renderModelDecision(comp.xgb, 'xgb')}</td>
                <td className="decision-cell">{renderModelDecision(comp.iso, 'iso')}</td>
                <td className={`final-decision ${comp.final === 'Fraud' ? 'fraud' : 'normal'}`}>
                  <strong>{comp.final}</strong>
                  <span className={`risk-badge risk-${(comp.riskLevel || 'low').toLowerCase()}`}>
                    {comp.riskLevel}
                  </span>
                </td>
                <td className="confidence-cell">{renderConfidenceMeter(comp.confidence)}</td>
                <td>
                  <div className={`agreement-badge agreement-${comp.agreement}`}>
                    {comp.agreement === 'unanimous' && <FiCheckCircle />}
                    {comp.agreement === 'split' && <FiAlertTriangle />}
                    {comp.agreement}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="comparison-insights">
        <h3>🎯 Ensemble Logic</h3>
        <div className="insight-boxes">
          <div className="insight-box">
            <h4>How It Works</h4>
            <p>
              Each model analyzes the transaction independently. Random Forest considers feature 
              combinations, XGBoost learns from gradients, and Isolation Forest detects anomalies. 
              The final decision combines all three predictions with weighted voting.
            </p>
          </div>
          <div className="insight-box">
            <h4>When Models Disagree</h4>
            <p>
              Split decisions often indicate edge cases that require manual review. High-value 
              transactions with unusual patterns might get flagged by Isolation Forest but pass 
              RF and XGBoost checks, suggesting legitimate but rare behavior.
            </p>
          </div>
          <div className="insight-box">
            <h4>Unanimous Confidence</h4>
            <p>
              When all three models agree, confidence is highest. These cases represent clear-cut 
              fraud patterns (all predict fraud) or obviously legitimate transactions (all predict normal).
              Focus investigation efforts on majority and split decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
