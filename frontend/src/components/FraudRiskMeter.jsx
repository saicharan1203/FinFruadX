import React, { useMemo } from 'react';
import { FiAlertTriangle, FiShield, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import '../styles/dashboard.css';

export const FraudRiskMeter = ({ predictions }) => {
    const riskData = useMemo(() => {
        const results = predictions?.results || predictions?.predictions || [];
        if (!results || results.length === 0) {
            return { level: 'unknown', score: 0, label: 'No Data', color: '#94a3b8' };
        }

        // Calculate average fraud probability
        const avgProb = results.reduce((sum, tx) => sum + (tx.fraud_probability || 0), 0) / results.length;
        const highRiskCount = results.filter(tx => (tx.fraud_probability || 0) > 0.7).length;
        const highRiskRatio = (highRiskCount / results.length) * 100;

        // Determine risk level based on average and high-risk ratio
        let level, label, color, icon;

        if (avgProb < 0.2 && highRiskRatio < 5) {
            level = 'low';
            label = 'Low Risk';
            color = '#22c55e';
            icon = 'check';
        } else if (avgProb < 0.4 && highRiskRatio < 15) {
            level = 'medium';
            label = 'Medium Risk';
            color = '#f59e0b';
            icon = 'alert';
        } else if (avgProb < 0.6 && highRiskRatio < 30) {
            level = 'high';
            label = 'High Risk';
            color = '#ef4444';
            icon = 'warning';
        } else {
            level = 'critical';
            label = 'Critical Risk';
            color = '#dc2626';
            icon = 'danger';
        }

        return {
            level,
            label,
            color,
            icon,
            score: avgProb * 100,
            highRiskRatio,
            totalTransactions: results.length,
            highRiskCount
        };
    }, [predictions]);

    const needleRotation = useMemo(() => {
        // Map score (0-100) to needle rotation (-90 to 90 degrees)
        return -90 + (riskData.score / 100) * 180;
    }, [riskData.score]);

    const getIcon = () => {
        switch (riskData.icon) {
            case 'check':
                return <FiCheckCircle className="risk-meter-icon" style={{ color: riskData.color }} />;
            case 'alert':
                return <FiAlertCircle className="risk-meter-icon" style={{ color: riskData.color }} />;
            case 'warning':
                return <FiAlertTriangle className="risk-meter-icon" style={{ color: riskData.color }} />;
            case 'danger':
                return <FiShield className="risk-meter-icon" style={{ color: riskData.color }} />;
            default:
                return <FiShield className="risk-meter-icon" />;
        }
    };

    return (
        <div className="fraud-risk-meter">
            <div className="risk-meter-header">
                {getIcon()}
                <h3>Overall Risk Assessment</h3>
            </div>

            <div className="risk-meter-gauge">
                <svg viewBox="0 0 200 120" className="gauge-svg">
                    {/* Background arc */}
                    <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{ stopColor: '#22c55e' }} />
                            <stop offset="33%" style={{ stopColor: '#f59e0b' }} />
                            <stop offset="66%" style={{ stopColor: '#ef4444' }} />
                            <stop offset="100%" style={{ stopColor: '#dc2626' }} />
                        </linearGradient>
                    </defs>

                    {/* Arc background */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="12"
                        strokeLinecap="round"
                    />

                    {/* Colored arc */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="url(#gaugeGradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                    />

                    {/* Tick marks */}
                    {[0, 25, 50, 75, 100].map((tick, i) => {
                        const angle = -180 + (tick / 100) * 180;
                        const rad = (angle * Math.PI) / 180;
                        const x1 = 100 + 70 * Math.cos(rad);
                        const y1 = 100 + 70 * Math.sin(rad);
                        const x2 = 100 + 62 * Math.cos(rad);
                        const y2 = 100 + 62 * Math.sin(rad);
                        return (
                            <line
                                key={i}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke="rgba(255,255,255,0.5)"
                                strokeWidth="2"
                            />
                        );
                    })}

                    {/* Needle */}
                    <g transform={`rotate(${needleRotation}, 100, 100)`}>
                        <polygon
                            points="100,30 96,100 104,100"
                            fill={riskData.color}
                            className="gauge-needle"
                        />
                        <circle cx="100" cy="100" r="8" fill={riskData.color} />
                    </g>
                </svg>

                <div className="gauge-labels">
                    <span className="gauge-label low">Low</span>
                    <span className="gauge-label medium">Medium</span>
                    <span className="gauge-label high">High</span>
                    <span className="gauge-label critical">Critical</span>
                </div>
            </div>

            <div className="risk-meter-result" style={{ borderColor: riskData.color }}>
                <div className="risk-score" style={{ color: riskData.color }}>
                    {riskData.score.toFixed(1)}%
                </div>
                <div className="risk-label" style={{ backgroundColor: riskData.color }}>
                    {riskData.label}
                </div>
            </div>

            <div className="risk-meter-stats">
                <div className="risk-stat">
                    <span className="stat-value">{riskData.totalTransactions || 0}</span>
                    <span className="stat-label">Transactions</span>
                </div>
                <div className="risk-stat danger">
                    <span className="stat-value">{riskData.highRiskCount || 0}</span>
                    <span className="stat-label">High Risk</span>
                </div>
                <div className="risk-stat">
                    <span className="stat-value">{riskData.highRiskRatio?.toFixed(1) || 0}%</span>
                    <span className="stat-label">Risk Ratio</span>
                </div>
            </div>
        </div>
    );
};
