import React, { useState, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
// import axios from 'axios';
import { FiSearch, FiDownload } from 'react-icons/fi';

export const DataExplorer = ({ predictions }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    riskLevel: '',
    merchantCategory: '',
    transactionType: '',
    minAmount: '',
    maxAmount: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const applyFilters = useCallback(() => {
    if (!predictions?.results) return;

    let filtered = [...predictions.results];

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        Object.values(item).some(val =>
          val && val.toString().toLowerCase().includes(term)
        )
      );
    }

    // Apply filters
    if (filters.riskLevel) {
      filtered = filtered.filter(item => item.risk_level === filters.riskLevel);
    }

    if (filters.merchantCategory) {
      filtered = filtered.filter(item => item.merchant_category === filters.merchantCategory);
    }

    if (filters.transactionType) {
      filtered = filtered.filter(item => item.transaction_type === filters.transactionType);
    }

    if (filters.minAmount) {
      filtered = filtered.filter(item => item.amount >= parseFloat(filters.minAmount));
    }

    if (filters.maxAmount) {
      filtered = filtered.filter(item => item.amount <= parseFloat(filters.maxAmount));
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [predictions, searchTerm, filters]);

  useEffect(() => {
    if (predictions?.results) {
      setFilteredData(predictions.results);
    }
  }, [predictions]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, predictions?.results, applyFilters]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sorted = [...filteredData].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredData(sorted);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const exportData = () => {
    if (!filteredData.length) return;

    const csvContent = [
      Object.keys(filteredData[0]).join(','),
      ...filteredData.map(item =>
        Object.values(item).map(val =>
          `"${String(val).replace(/"/g, '""')}"`
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transaction_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Get unique values for filters
  const riskLevels = [...new Set(predictions?.results?.map(item => item.risk_level))];
  const merchantCategories = [...new Set(predictions?.results?.map(item => item.merchant_category))];
  const transactionTypes = [...new Set(predictions?.results?.map(item => item.transaction_type))];

  return (
    <Box className="data-explorer">
      <div className="explorer-header">
        <h2><FiSearch /> Data Explorer</h2>
        <p>Search, filter, and analyze transaction data</p>
      </div>

      {/* Filters */}
      <div className="explorer-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Search:</label>
            <div className="search-input">
              <input
                type="text"
                placeholder="Search all fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Risk Level:</label>
            <select
              value={filters.riskLevel}
              onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
            >
              <option value="">All</option>
              {riskLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Merchant Category:</label>
            <select
              value={filters.merchantCategory}
              onChange={(e) => handleFilterChange('merchantCategory', e.target.value)}
            >
              <option value="">All</option>
              {merchantCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label>Transaction Type:</label>
            <select
              value={filters.transactionType}
              onChange={(e) => handleFilterChange('transactionType', e.target.value)}
            >
              <option value="">All</option>
              {transactionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Min Amount:</label>
            <input
              type="number"
              placeholder="0"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Max Amount:</label>
            <input
              type="number"
              placeholder="Any"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
            />
          </div>
        </div>

        <div className="filter-actions">
          <button className="btn btn-secondary" onClick={exportData}>
            <FiDownload /> Export Data ({filteredData.length})
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <p>Showing {currentItems.length} of {filteredData.length} transactions</p>
      </div>

      {/* Data Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('customer_id')}>
                Customer ID {sortConfig.key === 'customer_id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('merchant_id')}>
                Merchant ID {sortConfig.key === 'merchant_id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('amount')}>
                Amount {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('transaction_type')}>
                Type {sortConfig.key === 'transaction_type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('merchant_category')}>
                Category {sortConfig.key === 'merchant_category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('risk_level')}>
                Risk Level {sortConfig.key === 'risk_level' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('ensemble_fraud_probability')}>
                Fraud Probability {sortConfig.key === 'ensemble_fraud_probability' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('confidence_score')}>
                Confidence {sortConfig.key === 'confidence_score' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item, index) => (
              <tr key={index}>
                <td>{item.customer_id}</td>
                <td>{item.merchant_id}</td>
                <td>${parseFloat(item.amount).toFixed(2)}</td>
                <td>{item.transaction_type}</td>
                <td>{item.merchant_category}</td>
                <td>
                  <span className={`risk-badge risk-${item.risk_level?.toLowerCase()}`}>
                    {item.risk_level}
                  </span>
                </td>
                <td>{(parseFloat(item.ensemble_fraud_probability) * 100).toFixed(2)}%</td>
                <td>{(parseFloat(item.confidence_score) * 100).toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>

          <button
            className="btn btn-sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </Box>
  );
};