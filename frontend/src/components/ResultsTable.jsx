import React, { useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import '../styles/dashboard.css';

export const ResultsTable = ({ predictions }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [filterLevel, setFilterLevel] = useState('All');
  const [search, setSearch] = useState('');
  const [threshold, setThreshold] = useState(0.5);

  const results = predictions.results || [];
  const filteredResults = results.filter((r) => {
    const level = (r.risk_level || 'Low').toLowerCase();
    const levelOk = filterLevel === 'All' || level === filterLevel.toLowerCase();
    const text = `${r.customer_id || ''} ${r.merchant_category || ''} ${r.amount || ''}`.toString().toLowerCase();
    const searchOk = search.trim() === '' || text.includes(search.trim().toLowerCase());
    return levelOk && searchOk;
  });

  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const currentResults = filteredResults.slice(startIdx, endIdx);

  const downloadResults = () => {
    const csv = convertToCSV(results);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fraud_predictions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (data) => {
    if (data.length === 0) return '';
    const keys = Object.keys(data[0]);
    const header = keys.join(',');
    const rows = data.map(obj =>
      keys.map(key => {
        const val = obj[key];
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val}"`;
        }
        return val;
      }).join(',')
    );
    return [header, ...rows].join('\n');
  };

  return (
    <div className="results-table-section">
      <div className="table-header">
        <h2>📋 Detailed Predictions</h2>
        <div className="button-group" style={{ justifyContent: 'flex-end' }}>
          <select
            value={filterLevel}
            onChange={(e) => { setCurrentPage(1); setFilterLevel(e.target.value); }}
            className="btn btn-sm"
            style={{ background: 'white', color: 'var(--dark)' }}
          >
            <option>All</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
          <input
            value={search}
            onChange={(e) => { setCurrentPage(1); setSearch(e.target.value); }}
            placeholder="Search customer, category, amount"
            className="btn btn-sm"
            style={{ background: 'white', color: 'var(--dark)', minWidth: 240 }}
          />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="btn btn-sm"
            style={{ background: 'white', color: 'var(--dark)', width: 150 }}
          />
          <span style={{ fontWeight: 600, color: 'var(--dark)' }}>Threshold: {(threshold * 100).toFixed(0)}%</span>
          <button onClick={downloadResults} className="btn btn-secondary btn-sm">
            <FiDownload /> Download CSV
          </button>
          {predictions.results_file && (
            <button
              onClick={() => {
                const filename = (predictions.results_file || '').split(/[/\\]/).pop();
                if (!filename) return;
                const a = document.createElement('a');
                a.href = `/api/download-results/${filename}`;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
              className="btn btn-secondary btn-sm"
            >
              <FiDownload /> Server CSV
            </button>
          )}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="results-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Risk Probability</th>
              <th>Risk Level</th>
              <th>Fraud?</th>
              <th>Anomaly?</th>
            </tr>
          </thead>
          <tbody>
            {currentResults.map((tx, idx) => (
              <tr key={idx} className={( (tx.ensemble_fraud_probability || 0) >= threshold ? 'fraud-row' : '' )}>
                <td>{tx.customer_id || 'N/A'}</td>
                <td>${(tx.amount || 0)?.toFixed(2)}</td>
                <td>{tx.merchant_category || 'N/A'}</td>
                <td>
                  <div className="probability-bar">
                    <div
                      className="probability-fill"
                      style={{
                        width: `${(tx.ensemble_fraud_probability || 0) * 100}%`,
                        backgroundColor:
                          (tx.ensemble_fraud_probability || 0) > 0.7 ? '#ff4757' :
                          (tx.ensemble_fraud_probability || 0) > 0.5 ? '#ffa502' :
                          '#2ed573'
                      }}
                    />
                    <span>{(((tx.ensemble_fraud_probability || 0) * 100).toFixed(1))}%</span>
                  </div>
                </td>
                <td>
                  <span className={`risk-badge risk-${(tx.risk_level || 'low').toLowerCase()}`}>
                    {tx.risk_level || 'Low'}
                  </span>
                </td>
                <td>{tx.is_fraud_predicted ? '🚨 Yes' : '✅ No'}</td>
                <td>{tx.is_anomaly ? '⚠️ Yes' : '✅ No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          ← Previous
        </button>
        <span>{currentPage} / {totalPages || 1}</span>
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Next →
        </button>
      </div>
    </div>
  );
};