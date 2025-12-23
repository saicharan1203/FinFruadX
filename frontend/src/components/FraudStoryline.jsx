import React, { useState, useEffect, useCallback } from 'react';
import { FiBookOpen, FiAlertTriangle, FiClock, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import '../styles/dashboard.css';

export const FraudStoryline = ({ predictions }) => {
  const [stories, setStories] = useState([]);

  const generateStories = useCallback((results) => {
    // Get high-risk transactions
    const fraudulent = results.filter(r => 
      (r.risk_level || '').toLowerCase() === 'critical' || 
      (r.risk_level || '').toLowerCase() === 'high'
    ).slice(0, 10);

    const generatedStories = fraudulent.map((txn, idx) => {
      const story = createStoryline(txn, results);
      return { id: idx, transaction: txn, narrative: story.narrative, mitigations: story.mitigations };
    });

    setStories(generatedStories);
  }, []);

  useEffect(() => {
    if (predictions && predictions.results) {
      generateStories(predictions.results);
    }
  }, [predictions, generateStories]);

  const createStoryline = (txn, allResults) => {
    const parts = [];
    const mitigations = [];
    const customerId = txn.customer_id;
    const amount = parseFloat(txn.amount || 0);
    const riskLevel = (txn.risk_level || 'medium').toLowerCase();
    const confidence = parseFloat(txn.fraud_probability || 0);
    const category = txn.merchant_category || 'unknown';

    // Customer behavior analysis
    const customerTxns = allResults.filter(r => r.customer_id === customerId);
    const avgAmount = customerTxns.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0) / customerTxns.length;
    const maxAmount = Math.max(...customerTxns.map(r => parseFloat(r.amount || 0)));

    // Opening statement
    parts.push(`🔍 Customer ${customerId} triggered a ${riskLevel} alert with ${(confidence * 100).toFixed(0)}% fraud confidence.`);

    // Amount analysis
    if (amount > avgAmount * 3) {
      const times = (amount / avgAmount).toFixed(1);
      parts.push(`💰 The transaction amount of ₹${amount.toFixed(2)} is ${times}x higher than their average spend of ₹${avgAmount.toFixed(2)}.`);
      mitigations.push('Enable dynamic limits and require step-up authentication when customers spike far above their normal spend.');
    } else if (amount === maxAmount && amount > avgAmount * 1.5) {
      parts.push(`💸 This ₹${amount.toFixed(2)} purchase is the highest amount this customer has ever spent.`);
      mitigations.push('Set alerts on record-breaking spend and confirm via trusted channels before honoring the payment.');
    }

    // Velocity check
    if (customerTxns.length > 5) {
      const timeSpan = customerTxns.length;
      if (timeSpan < 10) {
        parts.push(`⚡ Suspicious velocity detected: ${timeSpan} transactions in rapid succession.`);
        mitigations.push('Throttle transaction velocity by enforcing cooling-off windows or CAPTCHAs when rapid swipes occur.');
      }
    }

    // Category analysis
    const categoryCounts = {};
    customerTxns.forEach(r => {
      const cat = r.merchant_category || 'unknown';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    const mainCategory = Object.keys(categoryCounts).reduce((a, b) => 
      categoryCounts[a] > categoryCounts[b] ? a : b
    );

    if (category !== mainCategory && categoryCounts[category] === 1) {
      parts.push(`🏪 First-time purchase in "${category}" category, while customer usually shops in "${mainCategory}".`);
      mitigations.push('Flag first-time merchant categories for additional monitoring or one-time passcode verification.');
    }

    // Risk behavior patterns
    if (amount > 10000) {
      parts.push(`🚨 High-value transaction alert: Amounts above ₹10,000 carry elevated fraud risk.`);
      mitigations.push('Route high-value transactions through an approval queue before settlement.');
    }

    if (confidence > 0.8) {
      parts.push(`🎯 Pattern matching confirms this transaction closely resembles known fraud signatures.`);
      mitigations.push('Apply adaptive machine-learning policies and block lookalike signatures automatically.');
    } else if (confidence > 0.5) {
      parts.push(`⚠️ Multiple anomaly indicators present, suggesting potential fraudulent activity.`);
      mitigations.push('Escalate to manual review and require secondary document verification.');
    }

    // Time-based patterns
    if (txn.timestamp) {
      try {
        const hour = new Date(txn.timestamp).getHours();
        if (hour >= 0 && hour < 5) {
          parts.push(`🌙 Transaction occurred during unusual hours (${hour}:00 AM), a common fraud indicator.`);
          mitigations.push('Restrict late-night approvals or require biometric confirmation overnight.');
        }
      } catch (e) {
        // Ignore timestamp parsing errors
      }
    }

    // Location if available
    if (txn.location) {
      const locationTxns = customerTxns.filter(r => r.location === txn.location);
      if (locationTxns.length === 1) {
        parts.push(`📍 First transaction from location "${txn.location}", deviating from customer's normal pattern.`);
        mitigations.push('Leverage geo-velocity checks and decline when impossible travel patterns appear.');
      }
    }

    // Conclusion
    if (riskLevel === 'critical') {
      parts.push(`⛔ RECOMMENDATION: Immediate review required. Block transaction and contact customer for verification.`);
      mitigations.push('Freeze the card temporarily and run full KYC/OTP verification before reactivating.');
    } else if (riskLevel === 'high') {
      parts.push(`⚠️ RECOMMENDATION: Flag for manual review and consider additional authentication.`);
      mitigations.push('Route through step-up authentication and tighten limits for the next 24 hours.');
    }

    if (mitigations.length === 0) {
      mitigations.push('Maintain MFA and anomaly-based monitoring to contain emerging attack vectors.');
    }

    return { narrative: parts.join('\n\n'), mitigations };
  };

  if (!predictions || stories.length === 0) {
    return null;
  }

  return (
    <div className="storyline-container">
      <div className="section-header" style={{ marginBottom: 30 }}>
        <FiBookOpen size={28} style={{ color: 'var(--primary)' }} />
        <h2>📖 Fraud Storylines - AI Explainability</h2>
        <p style={{ fontSize: '0.95em', color: 'var(--gray)', marginTop: 10 }}>
          Human-readable narratives explaining suspicious transaction patterns
        </p>
      </div>

      <div className="stories-grid">
        {stories.map((story, idx) => (
          <div key={story.id} className="story-card">
            <div className="story-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiAlertTriangle 
                  size={20} 
                  style={{ 
                    color: story.transaction.risk_level === 'critical' ? '#ff4757' : '#ffa502' 
                  }} 
                />
                <h3>Case #{idx + 1}</h3>
              </div>
              <span className={`risk-badge risk-${(story.transaction.risk_level || 'medium').toLowerCase()}`}>
                {story.transaction.risk_level}
              </span>
            </div>

            <div className="story-details">
              <div className="detail-row">
                <FiDollarSign size={16} />
                <span>Amount: ₹{parseFloat(story.transaction.amount || 0).toFixed(2)}</span>
              </div>
              <div className="detail-row">
                <FiTrendingUp size={16} />
                <span>Confidence: {(parseFloat(story.transaction.fraud_probability || 0) * 100).toFixed(1)}%</span>
              </div>
              {story.transaction.merchant_category && (
                <div className="detail-row">
                  <FiClock size={16} />
                  <span>Category: {story.transaction.merchant_category}</span>
                </div>
              )}
            </div>

            <div className="story-narrative">
              {story.narrative.split('\n\n').map((paragraph, pIdx) => (
                <p key={pIdx} className="story-paragraph">
                  {paragraph}
                </p>
              ))}
            </div>

            {story.mitigations?.length > 0 && (
              <div className="story-mitigation">
                <h4>🛡️ How to contain it</h4>
                <ul>
                  {story.mitigations.map((tip, tipIdx) => (
                    <li key={tipIdx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {stories.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          color: 'var(--gray)',
          fontSize: '0.95em'
        }}>
          No high-risk transactions found to generate storylines.
        </div>
      )}
    </div>
  );
};
