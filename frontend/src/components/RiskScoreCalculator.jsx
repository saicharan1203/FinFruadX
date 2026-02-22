import React, { useState } from 'react';
import { Box } from '@mui/material';
import { FiActivity, FiSliders, FiTrendingUp, FiShield, FiSmartphone, FiGlobe, FiCpu, FiWifi } from 'react-icons/fi';

export const RiskScoreCalculator = ({ predictions }) => {
  const [customInput, setCustomInput] = useState({
    amount: 1000,
    hour: 12,
    velocity: 1,
    category: 'retail',
    location: 'domestic'
  });
  const [riskScore, setRiskScore] = useState(null);

  const generatePredictedReasons = (score, input) => {
    const reasons = [];
    if (input.velocity > 8) {
      reasons.push('Velocity spike detected vs 30-day baseline');
    }
    if (input.amount > 20000) {
      reasons.push('High ticket size requires secondary review');
    }
    if (input.location !== 'domestic') {
      reasons.push('Geo deviation from historical spending zone');
    }
    if (input.hour < 6 || input.hour > 22) {
      reasons.push('Transaction outside comfort window');
    }
    if (reasons.length === 0) {
      reasons.push('Pattern consistent with trusted history');
    }
    return reasons.slice(0, 3);
  };

  const buildBehaviourComparison = (input) => {
    const baselineVelocity = Math.max(1, input.velocity - 2);
    const baselineAmount = Math.max(500, Math.round(input.amount * 0.6));
    const baselineGeo = input.location === 'domestic' ? 1 : 0.5;

    const toPercent = (current, baseline) => {
      if (!baseline) return 100;
      return Math.min(180, Math.round((current / baseline) * 100));
    };

    return [
      {
        label: 'Velocity',
        metric: 'txn/hr',
        current: input.velocity,
        baseline: baselineVelocity,
        percent: toPercent(input.velocity, baselineVelocity)
      },
      {
        label: 'Spending',
        metric: '₹',
        current: input.amount,
        baseline: baselineAmount,
        percent: toPercent(input.amount, baselineAmount)
      },
      {
        label: 'Geo variance',
        metric: 'regions',
        current: input.location === 'domestic' ? 1 : 3,
        baseline: baselineGeo,
        percent: toPercent(input.location === 'domestic' ? 1 : 3, baselineGeo)
      }
    ];
  };

  const deriveStageScores = (input, totalScore) => {
    const geoScore = Math.min(
      100,
      (input.location === 'domestic' ? 55 : 78) +
      (input.location === 'unknown' ? 18 : 0) +
      (input.velocity > 6 ? 12 : 0)
    );
    const behaviourScore = Math.min(
      100,
      (input.velocity * 6) +
      (input.hour < 6 || input.hour > 22 ? 25 : 8) +
      (input.amount > 15000 ? 18 : 6)
    );
    const mlScore = totalScore;
    const combined = Math.round(geoScore * 0.3 + behaviourScore * 0.3 + mlScore * 0.4);
    return {
      combined,
      layers: [
        {
          key: 'geo',
          title: 'Geo + Device',
          score: geoScore,
          description:
            input.location === 'domestic'
              ? 'Aligned with trusted region'
              : 'New device signature detected'
        },
        {
          key: 'behaviour',
          title: 'Behaviour + Time',
          score: behaviourScore,
          description:
            input.hour < 6 || input.hour > 22
              ? 'Irregular hour engagement'
              : 'Routine activity window'
        },
        {
          key: 'ml',
          title: 'ML Ensemble Scoring',
          score: mlScore,
          description: 'Ensemble vote based on 220+ signals'
        }
      ]
    };
  };

  const buildDeviceIntel = (input) => {
    const deviceSeed = Math.abs(Math.floor(input.amount)) % 9000;
    const fingerprint = `DX-${(deviceSeed + 4096).toString(16).toUpperCase()}`;
    const browser = input.location === 'international' ? 'Chrome 120' : 'Edge 119';
    const os = input.location === 'international' ? 'Android 14' : 'Windows 11';
    const loginHistory = [
      { city: input.location === 'domestic' ? 'Mumbai' : 'Singapore', time: 'Now', risk: 'current' },
      { city: input.location === 'domestic' ? 'Pune' : 'Dubai', time: '12h ago', risk: 'medium' },
      { city: 'Delhi', time: '3d ago', risk: 'low' }
    ];
    return {
      deviceId: fingerprint,
      browser,
      os,
      loginHistory
    };
  };

  const detectNetworkSignals = (input) => {
    const vpnOrTor = input.location !== 'domestic';
    const incognito = input.velocity > 7;
    const boost = vpnOrTor ? (input.location === 'unknown' ? 12 : 7) : 0;
    return {
      vpnOrTor,
      incognito,
      boost,
      descriptor: vpnOrTor ? 'VPN / TOR edge detected' : 'Clean residential network'
    };
  };

  const detectCardClone = (input) => {
    const suspected = input.velocity > 8 && input.amount > 20000;
    const reasons = [];
    if (suspected) {
      reasons.push('Parallel high-value attempts within minutes');
      reasons.push('Spending velocity exceeds cardholder norm');
    }
    return {
      suspected,
      severity: suspected ? (input.amount > 50000 ? 'critical' : 'high') : 'normal',
      reasons
    };
  };

  const calculateRiskScore = () => {
    let score = 50; // Base score

    // Amount factor (0-30 points)
    if (customInput.amount > 50000) score += 30;
    else if (customInput.amount > 20000) score += 20;
    else if (customInput.amount > 5000) score += 10;
    else score -= 10;

    // Time factor (0-20 points)
    if (customInput.hour < 6 || customInput.hour > 22) score += 20;
    else if (customInput.hour >= 9 && customInput.hour <= 17) score -= 10;

    // Velocity factor (0-25 points)
    if (customInput.velocity > 10) score += 25;
    else if (customInput.velocity > 5) score += 15;
    else if (customInput.velocity > 3) score += 10;

    // Category factor (0-15 points)
    const riskyCat = ['electronics', 'jewelry', 'cash_withdrawal'];
    if (riskyCat.includes(customInput.category)) score += 15;

    // Location factor (0-10 points)
    if (customInput.location === 'international') score += 10;
    else if (customInput.location === 'unknown') score += 15;

    // Normalize to 0-100
    score = Math.max(0, Math.min(100, score));

    const behaviourComparison = buildBehaviourComparison(customInput);
    const predictedReasons = generatePredictedReasons(score, customInput);
    const stageScores = deriveStageScores(customInput, score);
    const deviceIntel = buildDeviceIntel(customInput);
    const networkSignals = detectNetworkSignals(customInput);
    const cardClone = detectCardClone(customInput);

    setRiskScore({
      total: score,
      level: score > 75 ? 'Critical' : score > 50 ? 'High' : score > 25 ? 'Medium' : 'Low',
      color: score > 75 ? '#ff4757' : score > 50 ? '#ffa502' : score > 25 ? '#ffd93d' : '#2ed573',
      recommendations: generateRecommendations(score, customInput),
      predictedReasons,
      behaviourComparison,
      stageScores,
      deviceIntel,
      networkSignals,
      cardClone,
      aiAssistant: buildAssistantResponse(score, predictedReasons, networkSignals, cardClone)
    });
  };

  const buildAssistantResponse = (score, reasons, networkSignals, cardClone) => {
    const fraudReason = reasons[0];
    const severity = score > 85 ? 'Critical' : score > 60 ? 'High' : score > 35 ? 'Elevated' : 'Low';
    const nextSteps = [];
    if (score > 75 || cardClone.suspected || networkSignals.vpnOrTor) {
      nextSteps.push('Initiate emergency lockdown for 30 mins');
      nextSteps.push('Verify customer through OTP + knowledge check');
    } else {
      nextSteps.push('Monitor upcoming sessions');
      nextSteps.push('Send informational alert to customer');
    }

    const prevention = [
      'Enable device binding and geofencing',
      'Rotate passwords + enable biometric approvals',
      networkSignals.vpnOrTor ? 'Block risky exit nodes for 24h' : 'Keep behavioral biometrics active'
    ];

    return {
      severity,
      fraudReason,
      nextSteps,
      prevention
    };
  };

  const generateRecommendations = (score, input) => {
    const recs = [];

    if (score > 75) {
      recs.push('🚫 BLOCK transaction immediately');
      recs.push('📞 Contact customer for verification');
      recs.push('🔍 Flag account for investigation');
    } else if (score > 50) {
      recs.push('⚠️ Require additional authentication');
      recs.push('💬 Send verification SMS/Email');
      recs.push('⏱️ Add 2-hour hold period');
    } else if (score > 25) {
      recs.push('✓ Allow with monitoring');
      recs.push('📊 Track transaction patterns');
    } else {
      recs.push('✅ Safe to proceed');
      recs.push('📈 Normal risk profile');
    }

    if (input.amount > 20000) {
      recs.push('💰 Large amount - extra scrutiny required');
    }
    if (input.velocity > 5) {
      recs.push('⚡ High velocity detected - check recent activity');
    }

    return recs;
  };

  const getAmountRiskLabel = (amount) => {
    if (amount > 50000) return 'Severe';
    if (amount > 20000) return 'High';
    if (amount > 5000) return 'Medium';
    return 'Low';
  };

  const getTimeRiskLabel = (hour) => {
    if (hour < 6 || hour > 22) return 'Off-hours';
    if (hour >= 9 && hour <= 17) return 'Business Safe';
    return 'Moderate';
  };

  const getVelocityRiskLabel = (velocity) => {
    if (velocity > 10) return 'Very Fast';
    if (velocity > 5) return 'Fast';
    if (velocity > 3) return 'Elevated';
    return 'Normal';
  };

  const getLevelMessage = (level) => {
    switch (level) {
      case 'Critical':
        return 'Immediate intervention required. Block or escalate now.';
      case 'High':
        return 'Elevated risk detected. Tighten controls and verify user.';
      case 'Medium':
        return 'Monitor closely and keep additional authentication handy.';
      default:
        return 'Risk is within the safe band. Continue to observe patterns.';
    }
  };

  const levelMessage = riskScore ? getLevelMessage(riskScore.level) : '';
  const amountLabel = getAmountRiskLabel(customInput.amount);
  const timeLabel = getTimeRiskLabel(customInput.hour);
  const velocityLabel = getVelocityRiskLabel(customInput.velocity);

  const amountCopy = {
    Severe: 'Large-ticket spike - immediate secondary review advised.',
    High: 'Above comfort band. Add manual authorization.',
    Medium: 'Notable spend increase. Track closely.',
    Low: 'Within trusted spend limits.'
  };

  const timeCopy = {
    'Off-hours': 'Occurs outside the customer’s typical window.',
    'Business Safe': 'Aligned with business hours and habits.',
    Moderate: 'Slight deviation from usual login times.'
  };

  const velocityCopy = {
    'Very Fast': 'Burst of transactions indicates automation risk.',
    Fast: 'Higher than average—keep OTP handy.',
    Elevated: 'Slight uptick over baseline.',
    Normal: 'Matches historical frequency.'
  };

  return (
    <Box className="risk-calculator-container">
      <div className="section-header">
        <FiActivity size={28} style={{ color: 'var(--primary)' }} />
        <h2>🧮 AI Risk Score Calculator</h2>
        <p>Interactive fraud risk assessment tool</p>
      </div>

      <div className="calculator-layout">
        <div className="calculator-inputs">
          <h3><FiSliders /> Input Parameters</h3>

          <div className="input-group">
            <label>💰 Transaction Amount (₹)</label>
            <input
              type="range"
              min="100"
              max="100000"
              step="100"
              value={customInput.amount}
              onChange={(e) => setCustomInput({ ...customInput, amount: parseInt(e.target.value) })}
            />
            <span className="input-value">₹{customInput.amount.toLocaleString()}</span>
          </div>

          <div className="input-group">
            <label>🕐 Transaction Hour (0-23)</label>
            <input
              type="range"
              min="0"
              max="23"
              value={customInput.hour}
              onChange={(e) => setCustomInput({ ...customInput, hour: parseInt(e.target.value) })}
            />
            <span className="input-value">{customInput.hour}:00</span>
          </div>

          <div className="input-group">
            <label>⚡ Transaction Velocity (txn/hour)</label>
            <input
              type="range"
              min="1"
              max="20"
              value={customInput.velocity}
              onChange={(e) => setCustomInput({ ...customInput, velocity: parseInt(e.target.value) })}
            />
            <span className="input-value">{customInput.velocity} txn/hr</span>
          </div>

          <div className="input-group">
            <label>🏪 Merchant Category</label>
            <select
              value={customInput.category}
              onChange={(e) => setCustomInput({ ...customInput, category: e.target.value })}
            >
              <option value="retail">Retail</option>
              <option value="groceries">Groceries</option>
              <option value="electronics">Electronics</option>
              <option value="jewelry">Jewelry</option>
              <option value="dining">Dining</option>
              <option value="cash_withdrawal">Cash Withdrawal</option>
              <option value="online">Online Shopping</option>
            </select>
          </div>

          <div className="input-group">
            <label>🌍 Transaction Location</label>
            <select
              value={customInput.location}
              onChange={(e) => setCustomInput({ ...customInput, location: e.target.value })}
            >
              <option value="domestic">Domestic</option>
              <option value="international">International</option>
              <option value="unknown">Unknown/Suspicious</option>
            </select>
          </div>

          <button className="btn-calculate" onClick={calculateRiskScore}>
            <FiTrendingUp /> Calculate Risk Score
          </button>
        </div>

        {riskScore && (
          <div className="calculator-results">
            <h3>📊 Risk Assessment</h3>

            <div className="risk-score-display">
              <div className="score-visual">
                <div
                  className="score-gauge"
                  style={{
                    background: `conic-gradient(${riskScore.color} ${riskScore.total * 3.6}deg, #e0e0e0 0deg)`
                  }}
                >
                  <div className="score-inner">
                    <div className="score-number">{riskScore.total}</div>
                    <div className="score-max">/100</div>
                  </div>
                </div>
                <div className="risk-level-badge" style={{ background: riskScore.color }}>
                  {riskScore.level} Risk
                </div>
                <div className={`risk-meter risk-meter-${riskScore.level.toLowerCase()}`}>
                  <div className="risk-meter-track">
                    <div
                      className="risk-meter-fill"
                      style={{ width: `${riskScore.total}%` }}
                    ></div>
                  </div>
                  <span className="risk-meter-label">Live risk meter</span>
                </div>
              </div>
              <div className="risk-score-details">
                <p className="risk-score-label">Current exposure</p>
                <h4>{riskScore.level} Risk</h4>
                <p className="risk-score-message">{levelMessage}</p>
                <div className="risk-detail-grid">
                  <div className="detail-metric">
                    <span>Ensemble score</span>
                    <strong>{riskScore.total}</strong>
                    <small>Live ML output</small>
                  </div>
                  <div className="detail-metric">
                    <span>Defense alignment</span>
                    <strong>{riskScore.stageScores.combined}%</strong>
                    <small>Geo · Behaviour · ML</small>
                  </div>
                  <div className="detail-metric">
                    <span>Severity tier</span>
                    <strong>{riskScore.aiAssistant?.severity}</strong>
                    <small>Next-step urgency</small>
                  </div>
                </div>
                <div className="risk-detail-badges">
                  {riskScore.predictedReasons.slice(0, 2).map((reason, idx) => (
                    <span key={idx} className="detail-badge">{reason}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="risk-breakdown">
              <h4>Risk Factors:</h4>
              <div className="factor-list">
                <div className="factor-item">
                  <span>💰 Amount Impact:</span>
                  <div className="factor-bar">
                    <div
                      className="factor-fill"
                      style={{ width: `${Math.min(100, customInput.amount / 1000)}%`, background: '#ffa502' }}
                    ></div>
                  </div>
                </div>
                <div className="factor-item">
                  <span>🕐 Time Risk:</span>
                  <div className="factor-bar">
                    <div
                      className="factor-fill"
                      style={{
                        width: `${(customInput.hour < 6 || customInput.hour > 22) ? 80 : 20}%`,
                        background: '#ff4757'
                      }}
                    ></div>
                  </div>
                </div>
                <div className="factor-item">
                  <span>⚡ Velocity Risk:</span>
                  <div className="factor-bar">
                    <div
                      className="factor-fill"
                      style={{ width: `${Math.min(100, customInput.velocity * 5)}%`, background: '#ffd93d' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="recommendations-box">
              <h4>💡 Recommended Actions:</h4>
              <ul>
                {riskScore.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>

            <div className="advanced-risk-grid">
              <div className="fraud-trailer-card glass-card">
                <div className="card-heading">
                  <span>2️⃣ Fraud Probability Trailer</span>
                  <small>Animated prediction preview</small>
                </div>
                <div className="trailer-hero">
                  <div className="trailer-animation" style={{ boxShadow: `0 0 40px ${riskScore.color}55` }}>
                    <div className="trailer-score">{riskScore.total}%</div>
                    <span>probability</span>
                  </div>
                  <div className="trailer-meta">
                    <p>Predicted reasons</p>
                    <ul className="prediction-reasons">
                      {riskScore.predictedReasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="behaviour-comparison">
                  <h5>📈 Behaviour vs 30-day baseline</h5>
                  <div className="comparison-grid">
                    {riskScore.behaviourComparison.map((item, idx) => (
                      <div key={idx} className="comparison-item">
                        <div className="comparison-label">
                          <strong>{item.label}</strong>
                          <span>{item.current} {item.metric}</span>
                        </div>
                        <div className="comparison-bars">
                          <div className="baseline-bar" style={{ width: `${Math.min(100, item.baseline || 1) / (item.baseline || 1) * 60}%` }}></div>
                          <div className="current-bar" style={{ width: `${Math.min(100, item.percent)}%` }}></div>
                        </div>
                        <span className="comparison-delta">{item.percent}% of baseline</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="verification-card glass-card">
                <div className="card-heading">
                  <span>5️⃣ Multi-Stage Transaction Verification</span>
                  <small>Geo + Behaviour + ML</small>
                </div>
                <div className="stage-rows">
                  {riskScore.stageScores.layers.map((layer) => (
                    <div key={layer.key} className="stage-row">
                      <div className="stage-info">
                        <strong>{layer.title}</strong>
                        <p>{layer.description}</p>
                      </div>
                      <div className="stage-meter">
                        <div className="stage-fill" style={{ width: `${layer.score}%` }}></div>
                        <span>{layer.score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="combined-score">
                  <FiShield /> Final score: <strong>{riskScore.stageScores.combined}%</strong>
                </div>
              </div>
            </div>

            <div className="intelligence-grid">
              <div className="device-intel-panel glass-card">
                <div className="card-heading">
                  <span>Device Intelligence Panel</span>
                  <small>Fingerprints and login trail</small>
                </div>
                <div className="device-meta-grid">
                  <div>
                    <label>Device ID</label>
                    <p>{riskScore.deviceIntel.deviceId}</p>
                  </div>
                  <div>
                    <label>Browser</label>
                    <p>{riskScore.deviceIntel.browser}</p>
                  </div>
                  <div>
                    <label>Operating System</label>
                    <p>{riskScore.deviceIntel.os}</p>
                  </div>
                </div>
                <div className="login-history">
                  {riskScore.deviceIntel.loginHistory.map((entry, idx) => (
                    <div key={idx} className={`login-entry risk-${entry.risk}`}>
                      <FiSmartphone />
                      <div>
                        <strong>{entry.city} : {entry.time}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="network-panel glass-card">
                <div className="card-heading">
                  <span>Network Intelligence</span>
                  <small>VPN / TOR / Incognito detection</small>
                </div>
                <div className="network-meta">
                  <div className={`intel-badge ${riskScore.networkSignals.vpnOrTor ? 'alert' : 'safe'}`}>
                    <FiWifi /> {riskScore.networkSignals.vpnOrTor ? 'VPN / TOR channel' : 'Residential network'}
                  </div>
                  <div className={`intel-badge ${riskScore.networkSignals.incognito ? 'alert' : 'safe'}`}>
                    <FiGlobe /> {riskScore.networkSignals.incognito ? 'Private session hints' : 'Standard browser'}
                  </div>
                </div>
                <p className="network-description">{riskScore.networkSignals.descriptor}</p>
                {riskScore.networkSignals.boost > 0 && (
                  <p className="network-boost">Risk boost applied: +{riskScore.networkSignals.boost} pts</p>
                )}

                <div className={`clone-detector ${riskScore.cardClone.suspected ? 'alert' : 'safe'}`}>
                  <div className="card-heading">
                    <span>Card Clone Detector</span>
                    <small>{riskScore.cardClone.suspected ? 'Anomaly spotted' : 'No clone signals'}</small>
                  </div>
                  {riskScore.cardClone.suspected ? (
                    <ul>
                      {riskScore.cardClone.reasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Spending rhythm follows genuine cardholder patterns.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="lockdown-assistant-grid">
              <div className="lockdown-card glass-card">
                <div className="card-heading">
                  <span>Emergency Lockdown Mode</span>
                  <small>One-tap containment</small>
                </div>
                <p className="lockdown-description">
                  Freeze account activity, token issuance, and device logins instantly. Use for high-severity incidents.
                </p>
                <button className="lockdown-btn">
                  <FiShield /> Engage Lockdown
                </button>
                <div className="lockdown-status">
                  <span>Cooldown window</span>
                  <strong>30 min</strong>
                  <p>Auto-notifies SOC and customer via secure channels.</p>
                </div>
              </div>

              <div className="assistant-card glass-card">
                <div className="card-heading">
                  <span>AI Fraud Assistant</span>
                  <small>Explainability + guidance</small>
                </div>
                <div className="assistant-body">
                  <div className="assistant-severity">
                    <FiCpu />
                    <div>
                      <label>Severity</label>
                      <p>{riskScore.aiAssistant.severity}</p>
                    </div>
                  </div>
                  <div className="assistant-block">
                    <label>Fraud reason</label>
                    <p>{riskScore.aiAssistant.fraudReason}</p>
                  </div>
                  <div className="assistant-block">
                    <label>Next steps</label>
                    <ul>
                      {riskScore.aiAssistant.nextSteps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="assistant-block">
                    <label>Prevention tips</label>
                    <ul>
                      {riskScore.aiAssistant.prevention.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Box>
  );
};
