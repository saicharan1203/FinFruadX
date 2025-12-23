import React, { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { FiMaximize2, FiMinimize2, FiRefreshCw, FiInfo } from 'react-icons/fi';
import '../styles/dashboard.css';

export const FraudNetworkGraph = ({ predictions }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [graphKey, setGraphKey] = useState(0);
  const fgRef = useRef();

  useEffect(() => {
    if (predictions && predictions.results) {
      buildNetworkGraph(predictions.results);
    }
  }, [predictions]);

  const buildNetworkGraph = (results) => {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();

    // Only show TOP 20 highest risk transactions for a clean view
    const highRiskResults = results
      .filter(r => parseFloat(r.ensemble_fraud_probability || r.fraud_probability || 0) > 0.5)
      .sort((a, b) => (parseFloat(b.ensemble_fraud_probability || b.fraud_probability || 0)) -
        (parseFloat(a.ensemble_fraud_probability || a.fraud_probability || 0)))
      .slice(0, 20);

    // If not enough high-risk, include some medium risk
    if (highRiskResults.length < 5) {
      const mediumRisk = results
        .filter(r => {
          const prob = parseFloat(r.ensemble_fraud_probability || r.fraud_probability || 0);
          return prob > 0.3 && prob <= 0.5;
        })
        .slice(0, 15);
      highRiskResults.push(...mediumRisk);
    }

    // Limit to 25 max for clean visualization
    const sampledResults = highRiskResults.slice(0, 25);

    if (sampledResults.length === 0) {
      setGraphData({ nodes: [], links: [] });
      return;
    }

    sampledResults.forEach((txn, idx) => {
      const customerId = `C${txn.customer_id}`;
      const merchantId = `M${txn.merchant_id || 'Unknown'}`;
      const txnId = `T${idx}`;
      const fraudProb = parseFloat(txn.ensemble_fraud_probability || txn.fraud_probability || 0);
      const amount = parseFloat(txn.amount || 0);
      const riskLevel = (txn.risk_level || 'medium').toLowerCase();

      // Add customer node
      if (!nodeMap.has(customerId)) {
        nodeMap.set(customerId, {
          id: customerId,
          name: `Customer ${txn.customer_id}`,
          type: 'customer',
          group: 1,
          val: 12,
          color: '#6a11cb',
          transactions: 0,
          totalAmount: 0,
          fraudCount: 0
        });
      }
      const customerNode = nodeMap.get(customerId);
      customerNode.transactions++;
      customerNode.totalAmount += amount;
      if (fraudProb > 0.5) customerNode.fraudCount++;

      // Add merchant node
      if (!nodeMap.has(merchantId)) {
        nodeMap.set(merchantId, {
          id: merchantId,
          name: `Merchant ${txn.merchant_id || 'Unknown'}`,
          type: 'merchant',
          group: 2,
          val: 10,
          color: '#2575fc',
          transactions: 0,
          totalAmount: 0,
          fraudCount: 0,
          category: txn.merchant_category || 'Unknown'
        });
      }
      const merchantNode = nodeMap.get(merchantId);
      merchantNode.transactions++;
      merchantNode.totalAmount += amount;
      if (fraudProb > 0.5) merchantNode.fraudCount++;

      // Add transaction node ONLY for high risk (>0.5)
      if (fraudProb > 0.5) {
        nodes.push({
          id: txnId,
          name: `₹${amount.toFixed(0)} (${(fraudProb * 100).toFixed(0)}% Risk)`,
          type: 'transaction',
          group: 3,
          val: Math.min(amount / 500, 12) + 6,
          color: riskLevel === 'critical' ? '#ff4757' :
            riskLevel === 'high' ? '#ffa502' : '#ffd93d',
          fraudProb: fraudProb,
          amount: amount,
          riskLevel: riskLevel,
          timestamp: txn.timestamp,
          category: txn.merchant_category
        });

        // Link customer to transaction
        links.push({
          source: customerId,
          target: txnId,
          value: 2,
          color: fraudProb > 0.8 ? 'rgba(255, 71, 87, 0.6)' :
            fraudProb > 0.6 ? 'rgba(255, 165, 2, 0.5)' : 'rgba(255, 217, 61, 0.4)'
        });

        // Link transaction to merchant
        links.push({
          source: txnId,
          target: merchantId,
          value: 2,
          color: fraudProb > 0.8 ? 'rgba(255, 71, 87, 0.6)' :
            fraudProb > 0.6 ? 'rgba(255, 165, 2, 0.5)' : 'rgba(255, 217, 61, 0.4)'
        });
      }
    });

    // Add customer and merchant nodes
    nodeMap.forEach(node => {
      // Highlight nodes with multiple fraud connections
      if (node.fraudCount > 2) {
        node.val = node.val + 4;
        node.color = '#ff4757';
      } else if (node.fraudCount > 0) {
        node.val = node.val + 2;
        node.color = node.type === 'customer' ? '#9b59b6' : '#3498db';
      }
      nodes.push(node);
    });

    setGraphData({ nodes, links });
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(3, 1000);
    }
  };

  const resetGraph = () => {
    setGraphKey(prev => prev + 1);
    setSelectedNode(null);
    setTimeout(() => {
      if (fgRef.current) {
        fgRef.current.zoomToFit(400);
      }
    }, 100);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!predictions || graphData.nodes.length === 0) {
    return (
      <div className="network-graph-container">
        <div className="section-header" style={{ marginBottom: 20 }}>
          <h2>🕸️ Fraud Network Graph - Detective View</h2>
          <p style={{ fontSize: '0.9em', color: 'var(--gray)', marginTop: 10 }}>
            Interactive network showing relationships between customers, merchants, and fraudulent transactions
          </p>
        </div>
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(106, 17, 203, 0.05)',
          borderRadius: '10px',
          color: 'var(--gray)'
        }}>
          <p style={{ fontSize: '1.2em', marginBottom: 10 }}>📊 No network data to display</p>
          <p>Run fraud predictions to visualize the transaction network</p>
        </div>
      </div>
    );
  }

  if (graphData.nodes.length < 3) {
    return (
      <div className="network-graph-container">
        <div className="section-header" style={{ marginBottom: 20 }}>
          <h2>🕸️ Fraud Network Graph - Detective View</h2>
          <p style={{ fontSize: '0.9em', color: 'var(--gray)', marginTop: 10 }}>
            Interactive network showing relationships between customers, merchants, and fraudulent transactions
          </p>
        </div>
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(255, 165, 2, 0.05)',
          borderRadius: '10px',
          color: 'var(--gray)'
        }}>
          <p style={{ fontSize: '1.2em', marginBottom: 10 }}>⚠️ Insufficient network data</p>
          <p>Need more medium/high-risk transactions to create meaningful network visualization</p>
          <p style={{ marginTop: 10, fontSize: '0.9em' }}>Found {graphData.nodes.length} nodes - at least 3 required</p>
        </div>
      </div>
    );
  }

  const graphHeight = isFullscreen ? 700 : 500;

  return (
    <div className={`network-graph-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <h2>🕸️ Fraud Network Graph - Detective View</h2>
          <div className="button-group" style={{ marginLeft: 'auto' }}>
            <button onClick={resetGraph} className="btn btn-secondary btn-sm" title="Reset View">
              <FiRefreshCw />
            </button>
            <button onClick={toggleFullscreen} className="btn btn-secondary btn-sm" title="Toggle Fullscreen">
              {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
            </button>
          </div>
        </div>
        <p style={{ fontSize: '0.9em', color: 'var(--gray)', marginTop: 10 }}>
          Interactive network showing relationships between customers, merchants, and fraudulent transactions
        </p>
      </div>

      <div className="graph-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#6a11cb' }}></div>
          <span>Customer</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#2575fc' }}></div>
          <span>Merchant</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#ff4757' }}></div>
          <span>Critical Fraud</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#ffa502' }}></div>
          <span>High Risk</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#ffd93d' }}></div>
          <span>Medium Risk</span>
        </div>
      </div>

      <div className="graph-wrapper" style={{ height: graphHeight, position: 'relative', border: '2px solid rgba(106, 17, 203, 0.3)', borderRadius: '10px', overflow: 'hidden' }}>
        <ForceGraph2D
          key={graphKey}
          ref={fgRef}
          graphData={graphData}
          width={isFullscreen ? window.innerWidth - 100 : undefined}
          height={graphHeight}
          nodeLabel={node => `${node.name}${node.type === 'transaction' ? '' : ` (${node.transactions} txns)`}`}
          nodeColor={node => node.color}
          nodeVal={node => node.val}
          nodeRelSize={6}
          nodeCanvasObjectMode={() => 'replace'}
          nodeCanvasObject={(node, ctx, globalScale) => {
            // Draw node circle with glow for selected
            const isSelected = selectedNode && selectedNode.id === node.id;

            if (isSelected) {
              ctx.shadowColor = node.color;
              ctx.shadowBlur = 15;
            }

            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI);
            ctx.fillStyle = node.color;
            ctx.fill();

            // Add white border
            ctx.shadowBlur = 0;
            ctx.strokeStyle = isSelected ? '#000' : '#fff';
            ctx.lineWidth = isSelected ? 3 : 2;
            ctx.stroke();

            // Draw icon/symbol - smaller and centered
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const fontSize = Math.max(node.val * 0.8, 8);
            ctx.font = `${fontSize}px Arial`;
            const symbol = node.type === 'customer' ? '👤' :
              node.type === 'merchant' ? '🏪' : '💳';
            ctx.fillText(symbol, node.x, node.y);
          }}
          linkColor={link => link.color}
          linkWidth={link => 1.5}
          linkDirectionalParticles={0}
          onNodeClick={handleNodeClick}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          cooldownTicks={150}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          onEngineStop={() => {
            setTimeout(() => {
              if (fgRef.current) {
                fgRef.current.zoomToFit(400, 80);
              }
            }, 300);
          }}
          backgroundColor="#f8f9fa"
        />
      </div>

      {selectedNode && (
        <div className="node-details-panel">
          <div className="panel-header">
            <h3>{selectedNode.name}</h3>
            <button onClick={() => setSelectedNode(null)} className="btn btn-sm">✕</button>
          </div>
          <div className="panel-content">
            <div className="detail-item">
              <strong>Type:</strong> {selectedNode.type}
            </div>
            {selectedNode.type === 'transaction' && (
              <>
                <div className="detail-item">
                  <strong>Amount:</strong> ₹{selectedNode.amount.toFixed(2)}
                </div>
                <div className="detail-item">
                  <strong>Fraud Probability:</strong> {(selectedNode.fraudProb * 100).toFixed(1)}%
                </div>
                <div className="detail-item">
                  <strong>Risk Level:</strong>
                  <span className={`risk-badge risk-${selectedNode.riskLevel}`}>
                    {selectedNode.riskLevel}
                  </span>
                </div>
                {selectedNode.category && (
                  <div className="detail-item">
                    <strong>Category:</strong> {selectedNode.category}
                  </div>
                )}
              </>
            )}
            {(selectedNode.type === 'customer' || selectedNode.type === 'merchant') && (
              <>
                <div className="detail-item">
                  <strong>Total Transactions:</strong> {selectedNode.transactions}
                </div>
                <div className="detail-item">
                  <strong>Total Amount:</strong> ₹{selectedNode.totalAmount.toFixed(2)}
                </div>
                <div className="detail-item">
                  <strong>Fraud Count:</strong>
                  <span style={{ color: selectedNode.fraudCount > 0 ? '#ff4757' : '#2ed573', fontWeight: 'bold' }}>
                    {selectedNode.fraudCount}
                  </span>
                </div>
                {selectedNode.category && (
                  <div className="detail-item">
                    <strong>Category:</strong> {selectedNode.category}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="graph-info">
        <FiInfo size={14} />
        <span>Click nodes to explore • Drag to pan • Scroll to zoom • Red links = high fraud risk</span>
      </div>

      <div className="graph-stats">
        <div className="stat-box">
          <strong>{graphData.nodes.filter(n => n.type === 'customer').length}</strong>
          <span>Customers</span>
        </div>
        <div className="stat-box">
          <strong>{graphData.nodes.filter(n => n.type === 'merchant').length}</strong>
          <span>Merchants</span>
        </div>
        <div className="stat-box">
          <strong>{graphData.nodes.filter(n => n.type === 'transaction').length}</strong>
          <span>High-Risk Txns</span>
        </div>
        <div className="stat-box">
          <strong>{graphData.links.length}</strong>
          <span>Connections</span>
        </div>
      </div>
    </div>
  );
};
