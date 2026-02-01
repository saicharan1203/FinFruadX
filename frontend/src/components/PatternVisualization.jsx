import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import '../styles/dashboard.css';

export const PatternVisualization = ({ predictions }) => {
  const results = useMemo(
    () => (predictions && predictions.results) || [],
    [predictions]
  );

  const riskByCategory = useMemo(() => {
    const categoryData = {};
    results.forEach(tx => {
      const category = tx.merchant_category || 'unknown';
      if (!categoryData[category]) {
        categoryData[category] = { fraudCount: 0, total: 0 };
      }
      categoryData[category].total++;
      if (tx.is_fraud_predicted) categoryData[category].fraudCount++;
    });
    return Object.entries(categoryData).map(([category, data]) => ({
      category: category.substring(0, 10),
      fraudRate: (data.fraudCount / data.total * 100).toFixed(2),
      fraudCount: data.fraudCount,
      total: data.total
    }));
  }, [results]);

  const amountDistribution = useMemo(() => {
    const bins = { low: 0, medium: 0, high: 0, critical: 0 };
    results.forEach(tx => {
      const amount = tx.amount || 0;
      if (amount < 100) bins.low++;
      else if (amount < 500) bins.medium++;
      else if (amount < 2000) bins.high++;
      else bins.critical++;
    });
    return Object.entries(bins).map(([name, value]) => ({ name, value }));
  }, [results]);

  const riskScoreDistribution = useMemo(() => {
    const bins = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    results.forEach(tx => {
      const score = Math.floor((tx.ensemble_fraud_probability || 0) * 10);
      if (score < 10) bins[score]++;
    });
    return bins.map((count, idx) => ({
      range: `${(idx * 10)}-${((idx + 1) * 10)}%`,
      count: count
    }));
  }, [results]);

  const COLORS = ['#2ed573', '#ffa502', '#ff6348', '#ff4757'];

  return (
    <Box className="visualization-section">
      <h2>📊 Fraud Pattern Analysis</h2>

      <Box className="charts-grid">
        <Box className="chart-container">
          <h3>📂 Fraud Rate by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={riskByCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="fraudRate"
                fill="#ff4757"
                name="Fraud Rate %"
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        <Box className="chart-container">
          <h3>💰 Transaction Amount Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={amountDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {amountDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        <Box className="chart-container">
          <h3>📈 Risk Score Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={riskScoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="count"
                fill="#3da5c4"
                name="Number of Transactions"
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Box>
  );
};