import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiUsers, FiShield, FiAlertTriangle } from 'react-icons/fi';
import '../styles/dashboard.css';

export const ReportMetricsDashboard = ({ predictions }) => {
    const metrics = useMemo(() => {
        const results = predictions?.results || predictions?.predictions || predictions || [];
        if (!Array.isArray(results) || results.length === 0) {
            return null;
        }

        const totalTransactions = results.length;
        const fraudCases = results.filter(p => (p.fraud_probability || 0) > 0.5);
        const highRiskCases = results.filter(p => (p.fraud_probability || 0) > 0.7);
        const totalAmount = results.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const fraudAmount = fraudCases.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const avgRisk = results.reduce((sum, p) => sum + (p.fraud_probability || 0), 0) / totalTransactions;

        // Get unique customers and merchants
        const uniqueCustomers = new Set(results.map(p => p.customer_id)).size;
        const uniqueMerchants = new Set(results.map(p => p.merchant_id || p.merchant_category)).size;

        // Category with highest fraud
        const categoryFraud = {};
        results.forEach(p => {
            const cat = p.merchant_category || p.category || 'Unknown';
            if (!categoryFraud[cat]) categoryFraud[cat] = { total: 0, fraud: 0 };
            categoryFraud[cat].total++;
            if ((p.fraud_probability || 0) > 0.5) categoryFraud[cat].fraud++;
        });

        const topCategory = Object.entries(categoryFraud)
            .map(([name, data]) => ({ name, rate: (data.fraud / data.total) * 100 }))
            .sort((a, b) => b.rate - a.rate)[0];

        return {
            totalTransactions,
            fraudCases: fraudCases.length,
            highRiskCases: highRiskCases.length,
            fraudRate: ((fraudCases.length / totalTransactions) * 100).toFixed(1),
            totalAmount,
            fraudAmount,
            avgRisk: (avgRisk * 100).toFixed(1),
            uniqueCustomers,
            uniqueMerchants,
            topFraudCategory: topCategory?.name || 'N/A',
            topCategoryRate: topCategory?.rate?.toFixed(1) || '0'
        };
    }, [predictions]);

    if (!metrics) {
        return null;
    }

    return (
        <Box className="report-metrics-dashboard">
            <Box className="metrics-header">
                <h3>📊 Executive Overview</h3>
                <p>Key performance indicators for the current dataset</p>
            </Box>

            <Box className="metrics-grid-reports">
                <Box className="metric-tile primary">
                    <Box className="metric-tile-icon">
                        <FiTrendingUp />
                    </Box>
                    <Box className="metric-tile-content">
                        <span className="metric-tile-value">{metrics.totalTransactions.toLocaleString()}</span>
                        <span className="metric-tile-label">Total Transactions</span>
                    </Box>
                </Box>

                <Box className="metric-tile danger">
                    <Box className="metric-tile-icon">
                        <FiAlertTriangle />
                    </Box>
                    <Box className="metric-tile-content">
                        <span className="metric-tile-value">{metrics.fraudCases}</span>
                        <span className="metric-tile-label">Fraud Detected</span>
                        <span className="metric-tile-badge">{metrics.fraudRate}%</span>
                    </Box>
                </Box>

                <Box className="metric-tile warning">
                    <Box className="metric-tile-icon">
                        <FiShield />
                    </Box>
                    <Box className="metric-tile-content">
                        <span className="metric-tile-value">{metrics.highRiskCases}</span>
                        <span className="metric-tile-label">High Risk Cases</span>
                    </Box>
                </Box>

                <Box className="metric-tile success">
                    <Box className="metric-tile-icon">
                        <FiDollarSign />
                    </Box>
                    <Box className="metric-tile-content">
                        <span className="metric-tile-value">₹{(metrics.totalAmount / 1000).toFixed(1)}K</span>
                        <span className="metric-tile-label">Total Volume</span>
                    </Box>
                </Box>

                <Box className="metric-tile info">
                    <Box className="metric-tile-icon">
                        <FiDollarSign />
                    </Box>
                    <Box className="metric-tile-content">
                        <span className="metric-tile-value">₹{(metrics.fraudAmount / 1000).toFixed(1)}K</span>
                        <span className="metric-tile-label">Fraud Amount</span>
                    </Box>
                </Box>

                <Box className="metric-tile purple">
                    <Box className="metric-tile-icon">
                        <FiUsers />
                    </Box>
                    <Box className="metric-tile-content">
                        <span className="metric-tile-value">{metrics.uniqueCustomers}</span>
                        <span className="metric-tile-label">Unique Customers</span>
                    </Box>
                </Box>
            </Box>

            <Box className="metrics-highlight-row">
                <Box className="highlight-card">
                    <span className="highlight-label">Average Risk Score</span>
                    <span className="highlight-value" style={{ color: parseFloat(metrics.avgRisk) > 50 ? '#ef4444' : '#22c55e' }}>
                        {metrics.avgRisk}%
                    </span>
                </Box>
                <Box className="highlight-card">
                    <span className="highlight-label">Top Fraud Category</span>
                    <span className="highlight-value">{metrics.topFraudCategory}</span>
                    <span className="highlight-sub">{metrics.topCategoryRate}% fraud rate</span>
                </Box>
                <Box className="highlight-card">
                    <span className="highlight-label">Merchants Analyzed</span>
                    <span className="highlight-value">{metrics.uniqueMerchants}</span>
                </Box>
            </Box>
        </Box>
    );
};
