import React, { useState, useMemo } from 'react';
import { FiFilter, FiSearch, FiX, FiChevronDown } from 'react-icons/fi';
import '../styles/dashboard.css';

export const TransactionFilter = ({ predictions, onFilterChange }) => {
    const [filters, setFilters] = useState({
        riskLevel: 'all',
        category: 'all',
        amountMin: '',
        amountMax: '',
        searchTerm: ''
    });
    const [isExpanded, setIsExpanded] = useState(true);

    const results = useMemo(() => {
        return predictions?.results || predictions?.predictions || [];
    }, [predictions]);

    // Get unique categories
    const categories = useMemo(() => {
        const cats = new Set(results.map(tx => tx.merchant_category || tx.category || 'Unknown'));
        return ['all', ...Array.from(cats)];
    }, [results]);

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);

        // Apply filters
        let filtered = [...results];

        // Risk level filter
        if (newFilters.riskLevel !== 'all') {
            filtered = filtered.filter(tx => {
                const prob = tx.fraud_probability || 0;
                switch (newFilters.riskLevel) {
                    case 'low': return prob <= 0.3;
                    case 'medium': return prob > 0.3 && prob <= 0.6;
                    case 'high': return prob > 0.6 && prob <= 0.8;
                    case 'critical': return prob > 0.8;
                    default: return true;
                }
            });
        }

        // Category filter
        if (newFilters.category !== 'all') {
            filtered = filtered.filter(tx =>
                (tx.merchant_category || tx.category || 'Unknown') === newFilters.category
            );
        }

        // Amount filter
        if (newFilters.amountMin) {
            filtered = filtered.filter(tx => (tx.amount || 0) >= parseFloat(newFilters.amountMin));
        }
        if (newFilters.amountMax) {
            filtered = filtered.filter(tx => (tx.amount || 0) <= parseFloat(newFilters.amountMax));
        }

        // Search term
        if (newFilters.searchTerm) {
            const term = newFilters.searchTerm.toLowerCase();
            filtered = filtered.filter(tx =>
                (tx.customer_id || '').toLowerCase().includes(term) ||
                (tx.merchant_id || '').toLowerCase().includes(term) ||
                (tx.transaction_id || '').toLowerCase().includes(term)
            );
        }

        if (onFilterChange) {
            onFilterChange(filtered);
        }
    };

    const clearFilters = () => {
        const clearedFilters = {
            riskLevel: 'all',
            category: 'all',
            amountMin: '',
            amountMax: '',
            searchTerm: ''
        };
        setFilters(clearedFilters);
        if (onFilterChange) {
            onFilterChange(results);
        }
    };

    const activeFilterCount = Object.entries(filters).filter(([key, value]) =>
        value !== 'all' && value !== ''
    ).length;

    return (
        <div className="transaction-filter">
            <div className="filter-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="filter-title">
                    <FiFilter />
                    <h3>Filter Transactions</h3>
                    {activeFilterCount > 0 && (
                        <span className="filter-badge">{activeFilterCount} active</span>
                    )}
                </div>
                <FiChevronDown className={`expand-icon ${isExpanded ? 'expanded' : ''}`} />
            </div>

            {isExpanded && (
                <div className="filter-content">
                    <div className="filter-row">
                        <div className="filter-group">
                            <label>Search</label>
                            <div className="search-input-wrap">
                                <FiSearch />
                                <input
                                    type="text"
                                    placeholder="Customer, Merchant, or Transaction ID..."
                                    value={filters.searchTerm}
                                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="filter-row">
                        <div className="filter-group">
                            <label>Risk Level</label>
                            <select
                                value={filters.riskLevel}
                                onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
                            >
                                <option value="all">All Levels</option>
                                <option value="low">Low (0-30%)</option>
                                <option value="medium">Medium (30-60%)</option>
                                <option value="high">High (60-80%)</option>
                                <option value="critical">Critical (80-100%)</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Category</label>
                            <select
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat === 'all' ? 'All Categories' : cat}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Amount Range</label>
                            <div className="amount-inputs">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.amountMin}
                                    onChange={(e) => handleFilterChange('amountMin', e.target.value)}
                                />
                                <span>to</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={filters.amountMax}
                                    onChange={(e) => handleFilterChange('amountMax', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {activeFilterCount > 0 && (
                        <button className="clear-filters-btn" onClick={clearFilters}>
                            <FiX /> Clear All Filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
