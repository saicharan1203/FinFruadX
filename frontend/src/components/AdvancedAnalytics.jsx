import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/dashboard.css';

export const AdvancedAnalytics = ({ predictions }) => {
  if (!predictions || !predictions.results) return null;

  const stats = predictions.statistics;
  const results = predictions.results || [];

  // Fraud by category
  const categoryData = Object.entries(stats.category_fraud_rates || {})
    .map(([name, rate]) => ({ name, rate: parseFloat(rate.toFixed(2)) }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 6);

  // Risk distribution for pie chart
  const riskData = Object.entries(stats.by_risk_level || {})
    .map(([name, value]) => ({ name, value }));

  // Hourly pattern (if timestamp available)
  const hourlyPattern = {};
  results.forEach(r => {
    if (r.timestamp) {
      try {
        const h = new Date(r.timestamp).getHours();
        hourlyPattern[h] = (hourlyPattern[h] || 0) + 1;
      } catch {}
    }
  });
  const hourlyData = Object.keys(hourlyPattern).length > 0
    ? Object.entries(hourlyPattern).map(([hour, count]) => ({ hour: `${hour}h`, count })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour))
    : [];

  // Avg amount by risk
  const riskAmounts = {};
  const riskCounts = {};
  results.forEach(r => {
    const level = r.risk_level || 'Low';
    riskAmounts[level] = (riskAmounts[level] || 0) + (r.amount || 0);
    riskCounts[level] = (riskCounts[level] || 0) + 1;
  });
  const avgAmountData = Object.keys(riskAmounts).map(level => ({
    level,
    avg: (riskAmounts[level] / (riskCounts[level] || 1)).toFixed(2)
  }));

  const COLORS = ['#ff4757', '#ffa502', '#ffd93d', '#2ed573'];

  return (
    <div className="visualization-section">
      <h2>📊 Advanced Analytics</h2>
      <div className="charts-grid">
        <div className="chart-container">
          <h3>Fraud Rate by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="rate" fill="var(--danger)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {hourlyData.length > 0 && (
          <div className="chart-container">
            <h3>Transaction Pattern (Hourly)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="chart-container">
          <h3>Avg Amount by Risk Level</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={avgAmountData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avg" fill="var(--secondary)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
