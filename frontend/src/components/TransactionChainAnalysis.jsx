import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FiLink, FiAlertTriangle, FiArrowRight, FiClock, FiDollarSign, FiUser, FiFilter, FiMaximize2 } from 'react-icons/fi';

export const TransactionChainAnalysis = ({ predictions }) => {
    const [selectedChain, setSelectedChain] = useState(null);
    const [filterRiskLevel, setFilterRiskLevel] = useState('all');
    const [hoveredNode, setHoveredNode] = useState(null);
    const svgRef = useRef(null);

    // Generate transaction chains from predictions data
    const transactionChains = useMemo(() => {
        const results = predictions?.results || predictions?.predictions || [];

        if (!results.length) {
            // Generate sample chain data
            return generateSampleChains();
        }

        // Group transactions by customer/account to find chains
        const customerTransactions = {};
        results.forEach((tx, idx) => {
            const customerId = tx.customer_id || tx.account_id || `customer_${idx % 10}`;
            if (!customerTransactions[customerId]) {
                customerTransactions[customerId] = [];
            }
            customerTransactions[customerId].push({
                ...tx,
                id: tx.transaction_id || `TXN-${idx}`,
                index: idx
            });
        });

        // Create chains from grouped transactions
        const chains = [];
        Object.entries(customerTransactions).forEach(([customerId, transactions]) => {
            if (transactions.length >= 2) {
                // Calculate chain risk based on fraud probabilities
                const avgProb = transactions.reduce((sum, tx) => sum + (tx.fraud_probability || 0), 0) / transactions.length;
                const maxProb = Math.max(...transactions.map(tx => tx.fraud_probability || 0));

                let riskLevel = 'Low';
                if (maxProb > 0.8 || avgProb > 0.6) riskLevel = 'Critical';
                else if (maxProb > 0.6 || avgProb > 0.4) riskLevel = 'High';
                else if (maxProb > 0.4 || avgProb > 0.25) riskLevel = 'Medium';

                chains.push({
                    id: `chain_${customerId}`,
                    customerId,
                    transactions: transactions.slice(0, 6), // Limit to 6 for visualization
                    totalAmount: transactions.reduce((sum, tx) => sum + (tx.amount || tx.transaction_amount || 0), 0),
                    avgFraudProb: avgProb,
                    maxFraudProb: maxProb,
                    riskLevel,
                    pattern: detectPattern(transactions)
                });
            }
        });

        return chains.slice(0, 15); // Limit to 15 chains
    }, [predictions]);

    // Filter chains by risk level
    const filteredChains = useMemo(() => {
        if (filterRiskLevel === 'all') return transactionChains;
        return transactionChains.filter(chain => chain.riskLevel === filterRiskLevel);
    }, [transactionChains, filterRiskLevel]);

    // Stats summary
    const chainStats = useMemo(() => {
        return {
            total: transactionChains.length,
            critical: transactionChains.filter(c => c.riskLevel === 'Critical').length,
            high: transactionChains.filter(c => c.riskLevel === 'High').length,
            totalAmount: transactionChains.reduce((sum, c) => sum + c.totalAmount, 0),
            avgChainLength: transactionChains.length ?
                transactionChains.reduce((sum, c) => sum + c.transactions.length, 0) / transactionChains.length : 0
        };
    }, [transactionChains]);

    const getRiskColor = (riskLevel) => {
        switch (riskLevel) {
            case 'Critical': return '#ff4757';
            case 'High': return '#ff6b6b';
            case 'Medium': return '#ffa502';
            case 'Low': return '#2ed573';
            default: return '#a4b0be';
        }
    };

    const getPatternIcon = (pattern) => {
        switch (pattern) {
            case 'rapid': return '⚡';
            case 'escalating': return '📈';
            case 'round_robin': return '🔄';
            case 'smurfing': return '💰';
            default: return '🔗';
        }
    };

    const getPatternLabel = (pattern) => {
        switch (pattern) {
            case 'rapid': return 'Rapid Succession';
            case 'escalating': return 'Escalating Amounts';
            case 'round_robin': return 'Round Robin';
            case 'smurfing': return 'Smurfing Pattern';
            default: return 'Standard Chain';
        }
    };

    // Render chain visualization
    const renderChainVisualization = (chain) => {
        const nodeSpacing = 100;
        const nodeRadius = 25;
        const startX = 50;
        const centerY = 80;

        return (
            <svg
                className="chain-visualization-svg"
                width={chain.transactions.length * nodeSpacing + 100}
                height="160"
                viewBox={`0 0 ${chain.transactions.length * nodeSpacing + 100} 160`}
            >
                <defs>
                    <linearGradient id={`chainGrad_${chain.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: getRiskColor(chain.riskLevel), stopOpacity: 0.3 }} />
                        <stop offset="100%" style={{ stopColor: getRiskColor(chain.riskLevel), stopOpacity: 0.1 }} />
                    </linearGradient>
                    <filter id="nodeShadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
                    </filter>
                    <marker
                        id={`arrowhead_${chain.id}`}
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon
                            points="0 0, 10 3.5, 0 7"
                            fill={getRiskColor(chain.riskLevel)}
                            opacity="0.7"
                        />
                    </marker>
                </defs>

                {/* Background path */}
                <rect
                    x="0" y="0"
                    width={chain.transactions.length * nodeSpacing + 100}
                    height="160"
                    fill={`url(#chainGrad_${chain.id})`}
                    rx="10"
                />

                {/* Connection lines */}
                {chain.transactions.slice(0, -1).map((tx, idx) => (
                    <line
                        key={`line_${idx}`}
                        x1={startX + idx * nodeSpacing + nodeRadius}
                        y1={centerY}
                        x2={startX + (idx + 1) * nodeSpacing - nodeRadius}
                        y2={centerY}
                        stroke={getRiskColor(chain.riskLevel)}
                        strokeWidth="3"
                        strokeDasharray={tx.fraud_probability > 0.5 ? "0" : "5,5"}
                        opacity="0.6"
                        markerEnd={`url(#arrowhead_${chain.id})`}
                    />
                ))}

                {/* Transaction nodes */}
                {chain.transactions.map((tx, idx) => {
                    const x = startX + idx * nodeSpacing;
                    const prob = tx.fraud_probability || 0;
                    const isHighRisk = prob > 0.5;
                    const nodeColor = prob > 0.7 ? '#ff4757' : prob > 0.4 ? '#ffa502' : '#2ed573';

                    return (
                        <g
                            key={`node_${idx}`}
                            className="chain-node"
                            onMouseEnter={() => setHoveredNode({ chain: chain.id, idx, tx })}
                            onMouseLeave={() => setHoveredNode(null)}
                            style={{ cursor: 'pointer' }}
                        >
                            {/* Pulse ring for high risk */}
                            {isHighRisk && (
                                <circle
                                    cx={x}
                                    cy={centerY}
                                    r={nodeRadius + 5}
                                    fill="none"
                                    stroke={nodeColor}
                                    strokeWidth="2"
                                    opacity="0.4"
                                    className="pulse-ring"
                                />
                            )}

                            {/* Main node */}
                            <circle
                                cx={x}
                                cy={centerY}
                                r={nodeRadius}
                                fill={nodeColor}
                                filter="url(#nodeShadow)"
                                stroke="white"
                                strokeWidth="2"
                            />

                            {/* Node label */}
                            <text
                                x={x}
                                y={centerY + 4}
                                textAnchor="middle"
                                fill="white"
                                fontSize="10"
                                fontWeight="bold"
                            >
                                #{idx + 1}
                            </text>

                            {/* Amount label below */}
                            <text
                                x={x}
                                y={centerY + 45}
                                textAnchor="middle"
                                fill="rgba(255,255,255,0.8)"
                                fontSize="9"
                            >
                                ${(tx.amount || tx.transaction_amount || 0).toLocaleString()}
                            </text>

                            {/* Risk indicator */}
                            <text
                                x={x}
                                y={centerY - 35}
                                textAnchor="middle"
                                fill={nodeColor}
                                fontSize="9"
                                fontWeight="bold"
                            >
                                {(prob * 100).toFixed(0)}%
                            </text>
                        </g>
                    );
                })}

                {/* Tooltip */}
                {hoveredNode && hoveredNode.chain === chain.id && (
                    <g className="chain-tooltip">
                        <rect
                            x={startX + hoveredNode.idx * nodeSpacing - 60}
                            y={centerY - 90}
                            width="120"
                            height="50"
                            rx="6"
                            fill="rgba(20, 25, 40, 0.95)"
                            stroke={getRiskColor(chain.riskLevel)}
                        />
                        <text
                            x={startX + hoveredNode.idx * nodeSpacing}
                            y={centerY - 70}
                            textAnchor="middle"
                            fill="white"
                            fontSize="10"
                            fontWeight="bold"
                        >
                            {hoveredNode.tx.id || `TXN-${hoveredNode.idx}`}
                        </text>
                        <text
                            x={startX + hoveredNode.idx * nodeSpacing}
                            y={centerY - 55}
                            textAnchor="middle"
                            fill="#a4b0be"
                            fontSize="9"
                        >
                            Risk: {((hoveredNode.tx.fraud_probability || 0) * 100).toFixed(1)}%
                        </text>
                    </g>
                )}
            </svg>
        );
    };

    return (
        <div className="transaction-chain-container">
            <div className="component-header">
                <div className="header-left">
                    <FiLink className="header-icon" />
                    <div>
                        <h3>🔗 Transaction Chain Analysis</h3>
                        <p>Visualize sequences of related suspicious transactions</p>
                    </div>
                </div>
                <div className="chain-filters">
                    <select
                        value={filterRiskLevel}
                        onChange={(e) => setFilterRiskLevel(e.target.value)}
                        className="risk-filter-select"
                    >
                        <option value="all">All Risk Levels</option>
                        <option value="Critical">🔴 Critical</option>
                        <option value="High">🟠 High</option>
                        <option value="Medium">🟡 Medium</option>
                        <option value="Low">🟢 Low</option>
                    </select>
                </div>
            </div>

            {/* Chain Stats */}
            <div className="chain-stats-bar">
                <div className="stat-item">
                    <span className="stat-value">{chainStats.total}</span>
                    <span className="stat-label">Total Chains</span>
                </div>
                <div className="stat-item critical">
                    <span className="stat-value">{chainStats.critical}</span>
                    <span className="stat-label">Critical Chains</span>
                </div>
                <div className="stat-item high">
                    <span className="stat-value">{chainStats.high}</span>
                    <span className="stat-label">High Risk</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">${chainStats.totalAmount.toLocaleString()}</span>
                    <span className="stat-label">Total Amount</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{chainStats.avgChainLength.toFixed(1)}</span>
                    <span className="stat-label">Avg Chain Length</span>
                </div>
            </div>

            {/* Chain Cards */}
            <div className="chain-cards-container">
                {filteredChains.length === 0 ? (
                    <div className="empty-chains">
                        <FiLink size={40} />
                        <p>No transaction chains found</p>
                        <span>Upload data to analyze transaction patterns</span>
                    </div>
                ) : (
                    filteredChains.map(chain => (
                        <div
                            key={chain.id}
                            className={`chain-card ${selectedChain === chain.id ? 'selected' : ''}`}
                            onClick={() => setSelectedChain(selectedChain === chain.id ? null : chain.id)}
                        >
                            <div className="chain-card-header">
                                <div className="chain-info">
                                    <div className="chain-id">
                                        <FiUser className="mini-icon" />
                                        <span>{chain.customerId}</span>
                                    </div>
                                    <div className={`risk-badge ${chain.riskLevel.toLowerCase()}`}>
                                        {chain.riskLevel}
                                    </div>
                                </div>
                                <div className="chain-pattern">
                                    <span className="pattern-icon">{getPatternIcon(chain.pattern)}</span>
                                    <span className="pattern-label">{getPatternLabel(chain.pattern)}</span>
                                </div>
                            </div>

                            <div className="chain-visualization">
                                {renderChainVisualization(chain)}
                            </div>

                            <div className="chain-card-footer">
                                <div className="chain-stat">
                                    <FiClock className="mini-icon" />
                                    <span>{chain.transactions.length} transactions</span>
                                </div>
                                <div className="chain-stat">
                                    <FiDollarSign className="mini-icon" />
                                    <span>${chain.totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="chain-stat">
                                    <FiAlertTriangle className="mini-icon" />
                                    <span>{(chain.maxFraudProb * 100).toFixed(0)}% max risk</span>
                                </div>
                            </div>

                            {selectedChain === chain.id && (
                                <div className="chain-details-expanded">
                                    <h4>Transaction Details</h4>
                                    <div className="transaction-detail-list">
                                        {chain.transactions.map((tx, idx) => (
                                            <div key={idx} className="tx-detail-row">
                                                <span className="tx-order">#{idx + 1}</span>
                                                <span className="tx-id">{tx.id}</span>
                                                <span className="tx-amount">${(tx.amount || tx.transaction_amount || 0).toLocaleString()}</span>
                                                <span
                                                    className="tx-risk"
                                                    style={{ color: (tx.fraud_probability || 0) > 0.5 ? '#ff4757' : '#2ed573' }}
                                                >
                                                    {((tx.fraud_probability || 0) * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// Helper function to detect transaction patterns
function detectPattern(transactions) {
    if (transactions.length < 2) return 'standard';

    const amounts = transactions.map(tx => tx.amount || tx.transaction_amount || 0);
    const isEscalating = amounts.every((amt, idx) => idx === 0 || amt >= amounts[idx - 1]);
    const isSmurfing = amounts.every(amt => amt < 10000) && amounts.reduce((a, b) => a + b, 0) > 20000;

    // Check for rapid succession (simulated)
    const isRapid = transactions.length >= 3;

    if (isSmurfing) return 'smurfing';
    if (isEscalating && transactions.length >= 3) return 'escalating';
    if (isRapid) return 'rapid';

    return 'standard';
}

// Generate sample chains for demo
function generateSampleChains() {
    const patterns = ['rapid', 'escalating', 'smurfing', 'standard', 'round_robin'];
    const riskLevels = ['Critical', 'High', 'Medium', 'Low'];

    return Array.from({ length: 8 }, (_, i) => {
        const txCount = Math.floor(Math.random() * 4) + 3; // 3-6 transactions
        const baseProb = Math.random();
        const riskLevel = baseProb > 0.7 ? 'Critical' : baseProb > 0.5 ? 'High' : baseProb > 0.3 ? 'Medium' : 'Low';

        const transactions = Array.from({ length: txCount }, (_, j) => ({
            id: `TXN-${1000 + i * 10 + j}`,
            amount: Math.floor(Math.random() * 5000) + 100,
            fraud_probability: Math.min(1, baseProb + (Math.random() - 0.5) * 0.3),
            customer_id: `CUST-${100 + i}`
        }));

        return {
            id: `chain_${i}`,
            customerId: `CUST-${100 + i}`,
            transactions,
            totalAmount: transactions.reduce((sum, tx) => sum + tx.amount, 0),
            avgFraudProb: transactions.reduce((sum, tx) => sum + tx.fraud_probability, 0) / transactions.length,
            maxFraudProb: Math.max(...transactions.map(tx => tx.fraud_probability)),
            riskLevel,
            pattern: patterns[i % patterns.length]
        };
    });
}

export default TransactionChainAnalysis;
