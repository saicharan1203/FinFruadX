import React, { useMemo } from 'react';
import { FiUsers, FiShoppingBag, FiAlertTriangle, FiTrendingUp } from 'react-icons/fi';
import '../styles/dashboard.css';

export const TopSuspiciousEntities = ({ predictions }) => {
    const results = useMemo(() => {
        return predictions?.results || predictions?.predictions || [];
    }, [predictions]);

    // Group by customer and calculate risk
    const topCustomers = useMemo(() => {
        const customerMap = new Map();

        results.forEach(tx => {
            const customerId = tx.customer_id || 'Unknown';
            if (!customerMap.has(customerId)) {
                customerMap.set(customerId, {
                    id: customerId,
                    transactions: 0,
                    totalAmount: 0,
                    totalRisk: 0,
                    highRiskCount: 0
                });
            }
            const customer = customerMap.get(customerId);
            customer.transactions += 1;
            customer.totalAmount += tx.amount || 0;
            customer.totalRisk += tx.fraud_probability || 0;
            if ((tx.fraud_probability || 0) > 0.7) {
                customer.highRiskCount += 1;
            }
        });

        return Array.from(customerMap.values())
            .map(c => ({
                ...c,
                avgRisk: c.totalRisk / c.transactions
            }))
            .sort((a, b) => b.avgRisk - a.avgRisk)
            .slice(0, 5);
    }, [results]);

    // Group by merchant and calculate risk
    const topMerchants = useMemo(() => {
        const merchantMap = new Map();

        results.forEach(tx => {
            const merchantId = tx.merchant_id || tx.merchant_category || 'Unknown';
            if (!merchantMap.has(merchantId)) {
                merchantMap.set(merchantId, {
                    id: merchantId,
                    transactions: 0,
                    totalAmount: 0,
                    totalRisk: 0,
                    highRiskCount: 0
                });
            }
            const merchant = merchantMap.get(merchantId);
            merchant.transactions += 1;
            merchant.totalAmount += tx.amount || 0;
            merchant.totalRisk += tx.fraud_probability || 0;
            if ((tx.fraud_probability || 0) > 0.7) {
                merchant.highRiskCount += 1;
            }
        });

        return Array.from(merchantMap.values())
            .map(m => ({
                ...m,
                avgRisk: m.totalRisk / m.transactions
            }))
            .sort((a, b) => b.avgRisk - a.avgRisk)
            .slice(0, 5);
    }, [results]);

    const getRiskColor = (risk) => {
        if (risk > 0.7) return '#ef4444';
        if (risk > 0.5) return '#f59e0b';
        if (risk > 0.3) return '#eab308';
        return '#22c55e';
    };

    const getRiskLabel = (risk) => {
        if (risk > 0.7) return 'Critical';
        if (risk > 0.5) return 'High';
        if (risk > 0.3) return 'Medium';
        return 'Low';
    };

    if (results.length === 0) {
        return null;
    }

    return (
        <div className="suspicious-entities">
            <div className="entities-header">
                <FiAlertTriangle style={{ color: '#f59e0b' }} />
                <h3>Top Suspicious Entities</h3>
                <p>Entities with highest average fraud probability</p>
            </div>

            <div className="entities-grid">
                <div className="entity-card">
                    <div className="entity-card-header">
                        <FiUsers />
                        <h4>High Risk Customers</h4>
                    </div>
                    <div className="entity-list">
                        {topCustomers.map((customer, idx) => (
                            <div key={customer.id} className="entity-item">
                                <div className="entity-rank">#{idx + 1}</div>
                                <div className="entity-info">
                                    <span className="entity-id">{customer.id}</span>
                                    <span className="entity-meta">
                                        {customer.transactions} txns • ${customer.totalAmount.toLocaleString()}
                                    </span>
                                </div>
                                <div
                                    className="entity-risk-badge"
                                    style={{ backgroundColor: getRiskColor(customer.avgRisk) }}
                                >
                                    {(customer.avgRisk * 100).toFixed(0)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="entity-card">
                    <div className="entity-card-header">
                        <FiShoppingBag />
                        <h4>High Risk Merchants</h4>
                    </div>
                    <div className="entity-list">
                        {topMerchants.map((merchant, idx) => (
                            <div key={merchant.id} className="entity-item">
                                <div className="entity-rank">#{idx + 1}</div>
                                <div className="entity-info">
                                    <span className="entity-id">{merchant.id}</span>
                                    <span className="entity-meta">
                                        {merchant.transactions} txns • ${merchant.totalAmount.toLocaleString()}
                                    </span>
                                </div>
                                <div
                                    className="entity-risk-badge"
                                    style={{ backgroundColor: getRiskColor(merchant.avgRisk) }}
                                >
                                    {(merchant.avgRisk * 100).toFixed(0)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
