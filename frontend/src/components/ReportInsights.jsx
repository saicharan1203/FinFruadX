import React, { useMemo } from 'react';
import { FiArrowUp, FiArrowDown, FiMinus } from 'react-icons/fi';
import '../styles/dashboard.css';

export const ReportInsights = ({ predictions }) => {
    const insights = useMemo(() => {
        const results = predictions?.results || predictions?.predictions || predictions || [];
        if (!Array.isArray(results) || results.length === 0) {
            return [];
        }

        const insightsList = [];
        const totalTransactions = results.length;
        const fraudCases = results.filter(p => (p.fraud_probability || 0) > 0.5);
        const highRiskCases = results.filter(p => (p.fraud_probability || 0) > 0.7);
        const fraudRate = (fraudCases.length / totalTransactions) * 100;

        // Fraud rate insight
        if (fraudRate > 10) {
            insightsList.push({
                type: 'critical',
                icon: '🚨',
                title: 'High Fraud Rate Detected',
                description: `${fraudRate.toFixed(1)}% of transactions are flagged as fraudulent. Immediate attention required.`,
                action: 'Review high-risk transactions in Detection page'
            });
        } else if (fraudRate > 5) {
            insightsList.push({
                type: 'warning',
                icon: '⚠️',
                title: 'Elevated Fraud Activity',
                description: `Fraud rate of ${fraudRate.toFixed(1)}% is above normal threshold.`,
                action: 'Monitor suspicious patterns closely'
            });
        } else {
            insightsList.push({
                type: 'success',
                icon: '✅',
                title: 'Fraud Rate Within Normal Range',
                description: `${fraudRate.toFixed(1)}% fraud rate is within acceptable limits.`,
                action: 'Continue standard monitoring'
            });
        }

        // High risk concentration
        if (highRiskCases.length > 0) {
            const highRiskAmount = highRiskCases.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
            insightsList.push({
                type: 'warning',
                icon: '💰',
                title: 'High-Risk Transaction Volume',
                description: `₹${(highRiskAmount / 1000).toFixed(1)}K at risk across ${highRiskCases.length} transactions.`,
                action: 'Prioritize review of these transactions'
            });
        }

        // Category analysis
        const categoryFraud = {};
        results.forEach(p => {
            const cat = p.merchant_category || p.category || 'Unknown';
            if (!categoryFraud[cat]) categoryFraud[cat] = { total: 0, fraud: 0 };
            categoryFraud[cat].total++;
            if ((p.fraud_probability || 0) > 0.5) categoryFraud[cat].fraud++;
        });

        const topFraudCategory = Object.entries(categoryFraud)
            .map(([name, data]) => ({ name, rate: (data.fraud / data.total) * 100, count: data.fraud }))
            .sort((a, b) => b.rate - a.rate)[0];

        if (topFraudCategory && topFraudCategory.rate > 20) {
            insightsList.push({
                type: 'info',
                icon: '📊',
                title: `${topFraudCategory.name} Shows High Fraud Rate`,
                description: `${topFraudCategory.rate.toFixed(1)}% fraud rate with ${topFraudCategory.count} cases.`,
                action: 'Consider enhanced monitoring for this category'
            });
        }

        // Late night activity check
        const lateNightTxns = results.filter(p => p.late_night || p.is_late_night);
        if (lateNightTxns.length > totalTransactions * 0.1) {
            insightsList.push({
                type: 'info',
                icon: '🌙',
                title: 'Significant Late-Night Activity',
                description: `${lateNightTxns.length} transactions occurred during late hours.`,
                action: 'Review late-night patterns for anomalies'
            });
        }

        return insightsList;
    }, [predictions]);

    if (insights.length === 0) {
        return null;
    }

    const getTypeColor = (type) => {
        switch (type) {
            case 'critical': return '#dc2626';
            case 'warning': return '#f59e0b';
            case 'success': return '#22c55e';
            case 'info': return '#3b82f6';
            default: return '#64748b';
        }
    };

    return (
        <div className="report-insights">
            <div className="insights-header">
                <h3>💡 Key Insights</h3>
                <p>AI-generated observations from your data</p>
            </div>

            <div className="insights-list">
                {insights.map((insight, idx) => (
                    <div
                        key={idx}
                        className="insight-card-report"
                        style={{ borderLeftColor: getTypeColor(insight.type) }}
                    >
                        <div className="insight-icon">{insight.icon}</div>
                        <div className="insight-content">
                            <h4>{insight.title}</h4>
                            <p>{insight.description}</p>
                            <span className="insight-action">
                                <FiArrowUp style={{ transform: 'rotate(45deg)' }} />
                                {insight.action}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
