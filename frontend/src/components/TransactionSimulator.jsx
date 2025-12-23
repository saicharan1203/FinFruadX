import React, { useState } from 'react';
import { FiRefreshCw, FiZap } from 'react-icons/fi';

export const TransactionSimulator = () => {
  const [scenario, setScenario] = useState('normal');
  const [results, setResults] = useState(null);
  const [animating, setAnimating] = useState(false);

  const scenarios = {
    normal: {
      name: 'Normal Shopping',
      icon: '🛒',
      exposure: 'Low exposure pattern',
      summary: '3 txns · Low risk',
      transactions: [
        { desc: 'Grocery Store', amount: '$45', risk: 5, time: '10:30 AM' },
        { desc: 'Gas Station', amount: '$50', risk: 3, time: '2:15 PM' },
        { desc: 'Restaurant', amount: '$35', risk: 4, time: '7:45 PM' }
      ]
    },
    velocity: {
      name: 'Velocity Attack',
      icon: '⚡',
      exposure: 'High exposure pattern',
      summary: '5 txns · Critical risk',
      transactions: [
        { desc: 'Online Store burst', amount: '$299', risk: 65, time: '10:00 AM' },
        { desc: 'Online Store burst', amount: '$450', risk: 70, time: '10:02 AM' },
        { desc: 'Online Store burst', amount: '$680', risk: 75, time: '10:03 AM' },
        { desc: 'Online Store burst', amount: '$920', risk: 85, time: '10:04 AM' },
        { desc: 'Online Store burst', amount: '$1200', risk: 95, time: '10:05 AM' }
      ]
    },
    geographic: {
      name: 'Location Anomaly',
      icon: '🌍',
      exposure: 'High exposure pattern',
      summary: '3 txns · High risk',
      transactions: [
        { desc: 'Coffee Shop (NYC)', amount: '$5', risk: 20, time: '8:00 AM' },
        { desc: 'Electronics (LA)', amount: '$1500', risk: 75, time: '8:30 AM' },
        { desc: 'Jewelry (Miami)', amount: '$3000', risk: 90, time: '9:00 AM' }
      ]
    },
    unusual_time: {
      name: 'Late Night Activity',
      icon: '🌙',
      exposure: 'Medium exposure pattern',
      summary: '3 txns · High risk',
      transactions: [
        { desc: 'Jewelry Store', amount: '$2500', risk: 85, time: '2:30 AM' },
        { desc: 'Electronics', amount: '$1800', risk: 80, time: '3:15 AM' },
        { desc: 'Luxury Goods', amount: '$3200', risk: 92, time: '3:45 AM' }
      ]
    },
    card_testing: {
      name: 'Card Testing',
      icon: '🧪',
      exposure: 'Medium exposure pattern',
      summary: '4 txns · Medium risk',
      transactions: [
        { desc: 'Online micro-charge', amount: '$1', risk: 20, time: '11:00 PM' },
        { desc: 'Online micro-charge', amount: '$1', risk: 30, time: '11:01 PM' },
        { desc: 'Online micro-charge', amount: '$5', risk: 45, time: '11:02 PM' },
        { desc: 'High ticket test', amount: '$2500', risk: 95, time: '11:10 PM' }
      ]
    },
    hybrid: {
      name: 'Multi-Vector Attack',
      icon: '💥',
      exposure: 'High exposure pattern',
      summary: '4 txns · Critical risk',
      transactions: [
        { desc: 'ATM Withdrawal (NYC)', amount: '$500', risk: 25, time: '2:00 AM' },
        { desc: 'Online Purchase (London)', amount: '$1200', risk: 65, time: '2:05 AM' },
        { desc: 'Gas Station (NYC)', amount: '$800', risk: 45, time: '2:10 AM' },
        { desc: 'Jewelry (Tokyo)', amount: '$5000', risk: 95, time: '2:15 AM' }
      ]
    }
  };

  const classifyRisk = (score) => {
    if (score >= 70) return { label: 'Critical', className: 'critical' };
    if (score >= 50) return { label: 'High', className: 'high' };
    if (score >= 25) return { label: 'Medium', className: 'medium' };
    return { label: 'Low', className: 'low' };
  };

  const runSimulation = () => {
    setAnimating(true);
    setResults(null);
    
    setTimeout(() => {
      const txns = scenarios[scenario].transactions;
      const avgRisk = txns.reduce((sum, t) => sum + t.risk, 0) / txns.length;
      const maxRisk = Math.max(...txns.map(t => t.risk));
      const flagged = txns.filter(t => t.risk > 60).length;
      
      setResults({
        avgRisk: avgRisk.toFixed(1),
        maxRisk,
        flagged,
        total: txns.length,
        verdict: avgRisk > 70 ? 'BLOCK IMMEDIATELY' : avgRisk > 50 ? 'REQUIRE VERIFICATION' : avgRisk > 25 ? 'MONITOR CLOSELY' : 'ALLOW'
      });
      setAnimating(false);
    }, 2000);
  };

  return (
    <div className="simulator-container">
      <div className="simulator-grid">
        <div className="scenario-selector">
          <div className="scenario-selector-header">
            <div>
              <p className="scenario-label">Planner</p>
              <h3>Select Attack Scenario</h3>
            </div>
            <span className="scenario-chip">{Object.keys(scenarios).length} presets</span>
          </div>

          <div className="scenario-cards">
            {Object.keys(scenarios).map((key) => {
              const txns = scenarios[key].transactions;
              const avgRisk = txns.reduce((sum, t) => sum + t.risk, 0) / txns.length;
              const { label, className } = classifyRisk(avgRisk);

              return (
                <div
                  key={key}
                  className={`scenario-card ${scenario === key ? 'active' : ''}`}
                  onClick={() => setScenario(key)}
                >
                  <div className="scenario-icon-pill">{scenarios[key].icon}</div>
                  <div className="scenario-details">
                    <p className="scenario-name">{scenarios[key].name}</p>
                    <span className="scenario-subtext">{scenarios[key].exposure}</span>
                    <span className="scenario-footnote">{scenarios[key].summary}</span>
                  </div>
                  <div className="scenario-meta">
                    <span className={`scenario-risk ${className}`}>{label} risk</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="scenario-footer">
            <div className="scenario-hint">
              <FiZap size={16} /> Choose a preset above to preview paths.
            </div>
            <button
              className={`simulator-cta ${animating ? 'is-busy' : ''}`}
              onClick={runSimulation}
              disabled={animating}
            >
              {animating ? <FiRefreshCw className="spin-icon" /> : <FiZap />}
              <div>
                <span>{animating ? 'Simulating...' : 'Run Simulation'}</span>
                <small>{animating ? 'Processing flow & scores' : 'Launch selected attack path'}</small>
              </div>
            </button>
          </div>
        </div>

        <div className="simulation-display">
          <div className="simulation-header">
            <div>
              <p className="simulation-label">Flow Preview</p>
              <h3>Transaction Flow</h3>
            </div>
            <span className={`simulation-status ${animating ? 'live' : 'idle'}`}>
              {animating ? 'Running scenario...' : 'Ready'}
            </span>
          </div>
          <div className="transaction-flow">
            {scenarios[scenario].transactions.map((txn, idx) => {
              const { label: txnRiskLabel, className: txnRiskClass } = classifyRisk(txn.risk);
              const action = txn.risk > 70 ? 'Block immediately' : txn.risk > 50 ? 'Require step-up auth' : txn.risk > 25 ? 'Monitor closely' : 'Allow';

              return (
                <div
                  key={idx}
                  className={`flow-card ${animating ? 'animating' : ''} risk-${txnRiskClass}`}
                  style={{ animationDelay: animating ? `${idx * 0.4}s` : '0s' }}
                >
                  <div className="flow-card-top">
                    <div className="flow-time-row">
                      <span className="flow-time-chip">{txn.time}</span>
                      <span className={`flow-risk-chip ${txnRiskClass}`}>{txnRiskLabel} risk</span>
                    </div>
                    <p className="flow-desc">{txn.desc} – <strong>{txn.amount}</strong></p>
                    <p className="flow-subtext">{action} · {txn.risk}% probability</p>
                  </div>
                </div>
              );
            })}
          </div>

          {results && (
            <div className="simulation-results">
              <h3>🎯 Simulation Results</h3>
              <div className="results-grid">
                <div className="result-box">
                  <div className="result-label">Average Risk</div>
                  <div className="result-value">{results.avgRisk}%</div>
                </div>
                <div className="result-box">
                  <div className="result-label">Peak Risk</div>
                  <div className="result-value">{results.maxRisk}%</div>
                </div>
                <div className="result-box">
                  <div className="result-label">Flagged</div>
                  <div className="result-value">{results.flagged}/{results.total}</div>
                </div>
              </div>
              <div className={`verdict-pill verdict-${results.verdict.replace(/\s+/g, '-').toLowerCase()}`}>
                {results.verdict}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
