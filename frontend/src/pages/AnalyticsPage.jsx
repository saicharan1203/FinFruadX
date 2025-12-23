import React, { useEffect, useRef, useState } from 'react';
import { FairnessChecker } from '../components/FairnessChecker';
import { ModelDecisionComparison } from '../components/ModelDecisionComparison';
import { FraudTimeline } from '../components/FraudTimeline';
import { RiskScoreCalculator } from '../components/RiskScoreCalculator';
import { AdvancedAnalytics } from '../components/AdvancedAnalytics';
import { TrendForecasting } from '../components/TrendForecasting';

export const AnalyticsPage = ({ predictions }) => {
  const decisionSectionRef = useRef(null);
  const [decisionHeight, setDecisionHeight] = useState(null);
  const hasPredictions = Boolean(predictions);
  const results = predictions?.results || [];
  const totalTransactions = results.length;
  const highRiskCount = results.filter(txn => (txn.risk_level || '').toLowerCase() === 'high' || (txn.risk_level || '').toLowerCase() === 'critical').length;
  const avgFraudProbability = totalTransactions
    ? (results.reduce((sum, txn) => sum + (parseFloat(txn.ensemble_fraud_probability ?? txn.fraud_probability ?? 0) || 0), 0) / totalTransactions) * 100
    : 0;
  const approvalRate = totalTransactions ? Math.max(0, 100 - Math.round((highRiskCount / totalTransactions) * 100)) : 100;
  const uniqueMerchants = results.length ? new Set(results.map(txn => txn.merchant_id || txn.merchant || txn.merchant_category || txn.customer_id)).size : 0;

  const summaryCards = [
    {
      label: 'Total Transactions',
      value: totalTransactions.toLocaleString(),
      sub: 'Processed in this analytics run'
    },
    {
      label: 'High Risk Cases',
      value: highRiskCount.toLocaleString(),
      sub: 'Critical & high alerts'
    },
    {
      label: 'Avg Fraud Probability',
      value: `${avgFraudProbability.toFixed(1)}%`,
      sub: 'Across ensemble model'
    },
    {
      label: 'Approval Confidence',
      value: `${approvalRate}%`,
      sub: 'Transactions in safe zone'
    },
    {
      label: 'Network Coverage',
      value: uniqueMerchants.toLocaleString(),
      sub: 'Unique customers / merchants'
    }
  ];

  useEffect(() => {
    if (!hasPredictions) {
      setDecisionHeight(null);
      return;
    }

    const updateTimelineHeight = () => {
      if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
        setDecisionHeight(null);
        return;
      }

      if (decisionSectionRef.current) {
        setDecisionHeight(decisionSectionRef.current.offsetHeight);
      }
    };

    updateTimelineHeight();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateTimelineHeight);
    }

    let resizeObserver;
    if (typeof window !== 'undefined' && 'ResizeObserver' in window && decisionSectionRef.current) {
      resizeObserver = new ResizeObserver(updateTimelineHeight);
      resizeObserver.observe(decisionSectionRef.current);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateTimelineHeight);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [hasPredictions, results]);

  if (!hasPredictions) {
    return (
      <div className="page-container">
        <div className="empty-state-page">
          <div className="empty-icon">📊</div>
          <h2>No Analytics Data Available</h2>
          <p>Please upload data and run fraud detection from the Dashboard first.</p>
          <a href="/" className="btn-primary">Go to Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container analytics-page">
      <div className="page-header">
        <div className="page-header-with-logo">
          <svg className="page-logo" viewBox="0 0 80 80" width="50" height="50">
            <defs>
              <linearGradient id="analyticsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#ffa502', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#ffd93d', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="35" fill="url(#analyticsGradient)" opacity="0.2" />
            <path d="M 15 55 L 25 45 L 35 50 L 45 35 L 55 40 L 65 25"
              fill="none" stroke="url(#analyticsGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="25" cy="45" r="4" fill="url(#analyticsGradient)" />
            <circle cx="35" cy="50" r="4" fill="url(#analyticsGradient)" />
            <circle cx="45" cy="35" r="4" fill="url(#analyticsGradient)" />
            <circle cx="55" cy="40" r="4" fill="url(#analyticsGradient)" />
            <circle cx="65" cy="25" r="4" fill="url(#analyticsGradient)" />
          </svg>
          <div>
            <h1>📊 Advanced Analytics</h1>
            <p>Deep dive into model performance and risk analysis</p>
          </div>
        </div>
      </div>

      {totalTransactions > 0 && (
        <div className="analytics-glance">
          {summaryCards.map(card => (
            <div key={card.label} className="glance-card">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small>{card.sub}</small>
            </div>
          ))}
        </div>
      )}

      <RiskScoreCalculator predictions={predictions} />
      <AdvancedAnalytics predictions={predictions} />

      <div className="analytics-columns">
        <div className="analytics-column analytics-column--wide">
          <div ref={decisionSectionRef} className="analytics-panel analytics-panel--decisions">
            <ModelDecisionComparison predictions={predictions} />
          </div>
        </div>
        <div className="analytics-column analytics-column--timeline">
          <div
            className="analytics-panel analytics-panel--timeline"
            style={decisionHeight ? { maxHeight: `${decisionHeight}px` } : undefined}
          >
            <FraudTimeline predictions={results} />
          </div>
        </div>
      </div>

      <FairnessChecker predictions={predictions} />

      {/* Trend Forecasting */}
      <TrendForecasting predictions={predictions} />
    </div>
  );
};
