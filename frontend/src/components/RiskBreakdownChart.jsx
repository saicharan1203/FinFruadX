import React, { useMemo } from 'react';
import { FiPieChart, FiTrendingUp } from 'react-icons/fi';
import '../styles/dashboard.css';

export const RiskBreakdownChart = ({ predictions }) => {
    const results = useMemo(() => {
        return predictions?.results || predictions?.predictions || [];
    }, [predictions]);

    // Category breakdown
    const categoryBreakdown = useMemo(() => {
        const categoryMap = new Map();

        results.forEach(tx => {
            const category = tx.merchant_category || tx.category || 'Unknown';
            if (!categoryMap.has(category)) {
                categoryMap.set(category, {
                    name: category,
                    total: 0,
                    fraudCount: 0,
                    totalRisk: 0
                });
            }
            const cat = categoryMap.get(category);
            cat.total += 1;
            cat.totalRisk += tx.fraud_probability || 0;
            if ((tx.fraud_probability || 0) > 0.5) {
                cat.fraudCount += 1;
            }
        });

        return Array.from(categoryMap.values())
            .map(c => ({
                ...c,
                avgRisk: c.totalRisk / c.total,
                fraudRate: (c.fraudCount / c.total) * 100
            }))
            .sort((a, b) => b.fraudRate - a.fraudRate)
            .slice(0, 8);
    }, [results]);

    // Risk distribution
    const riskDistribution = useMemo(() => {
        const dist = { low: 0, medium: 0, high: 0, critical: 0 };

        results.forEach(tx => {
            const prob = tx.fraud_probability || 0;
            if (prob <= 0.3) dist.low++;
            else if (prob <= 0.6) dist.medium++;
            else if (prob <= 0.8) dist.high++;
            else dist.critical++;
        });

        const total = results.length || 1;
        return {
            low: { count: dist.low, percent: (dist.low / total) * 100 },
            medium: { count: dist.medium, percent: (dist.medium / total) * 100 },
            high: { count: dist.high, percent: (dist.high / total) * 100 },
            critical: { count: dist.critical, percent: (dist.critical / total) * 100 }
        };
    }, [results]);

    if (results.length === 0) {
        return null;
    }

    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4', '#6366f1', '#84cc16'];

    return (
        <div className="risk-breakdown">
            <div className="breakdown-header">
                <FiPieChart style={{ color: '#8b5cf6' }} />
                <h3>Risk Analysis Breakdown</h3>
            </div>

            <div className="breakdown-content">
                {/* Risk Distribution Donut */}
                <div className="breakdown-card">
                    <h4>Risk Distribution</h4>
                    <div className="risk-donut-container">
                        <svg viewBox="0 0 100 100" className="risk-donut">
                            {(() => {
                                const radius = 40;
                                const circumference = 2 * Math.PI * radius;
                                let offset = 0;
                                const segments = [
                                    { key: 'low', color: '#22c55e', ...riskDistribution.low },
                                    { key: 'medium', color: '#f59e0b', ...riskDistribution.medium },
                                    { key: 'high', color: '#ef4444', ...riskDistribution.high },
                                    { key: 'critical', color: '#dc2626', ...riskDistribution.critical }
                                ];

                                return segments.map((seg, i) => {
                                    const dashLength = (seg.percent / 100) * circumference;
                                    const dashOffset = -offset;
                                    offset += dashLength;

                                    return (
                                        <circle
                                            key={seg.key}
                                            cx="50"
                                            cy="50"
                                            r={radius}
                                            fill="transparent"
                                            stroke={seg.color}
                                            strokeWidth="12"
                                            strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                                            strokeDashoffset={dashOffset}
                                            transform="rotate(-90 50 50)"
                                            className="donut-segment"
                                        />
                                    );
                                });
                            })()}
                            <text x="50" y="48" textAnchor="middle" className="donut-center-text">
                                {results.length}
                            </text>
                            <text x="50" y="58" textAnchor="middle" className="donut-center-label">
                                Total
                            </text>
                        </svg>
                        <div className="donut-legend">
                            <div className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: '#22c55e' }}></span>
                                <span>Low ({riskDistribution.low.percent.toFixed(0)}%)</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: '#f59e0b' }}></span>
                                <span>Medium ({riskDistribution.medium.percent.toFixed(0)}%)</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: '#ef4444' }}></span>
                                <span>High ({riskDistribution.high.percent.toFixed(0)}%)</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: '#dc2626' }}></span>
                                <span>Critical ({riskDistribution.critical.percent.toFixed(0)}%)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category Bars */}
                <div className="breakdown-card">
                    <h4>Fraud Rate by Category</h4>
                    <div className="category-bars">
                        {categoryBreakdown.map((cat, i) => (
                            <div key={cat.name} className="category-bar-item">
                                <div className="category-bar-label">
                                    <span className="category-name">{cat.name}</span>
                                    <span className="category-rate">{cat.fraudRate.toFixed(1)}%</span>
                                </div>
                                <div className="category-bar-track">
                                    <div
                                        className="category-bar-fill"
                                        style={{
                                            width: `${Math.min(cat.fraudRate, 100)}%`,
                                            backgroundColor: colors[i % colors.length]
                                        }}
                                    />
                                </div>
                                <span className="category-count">{cat.total} txns</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
