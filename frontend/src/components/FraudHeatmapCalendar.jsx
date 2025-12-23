import React, { useState, useEffect, useMemo } from 'react';
import { FiCalendar, FiTrendingUp, FiAlertTriangle, FiClock, FiZap } from 'react-icons/fi';
import '../styles/dashboard.css';

export const FraudHeatmapCalendar = ({ predictions }) => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [stats, setStats] = useState({ peak: null, total: 0, avgPerDay: 0, totalTransactions: 0 });

  useEffect(() => {
    if (!predictions) return;

    // Prefer pre-aggregated heatmap_data from backend if available
    if (predictions.heatmap_data && predictions.heatmap_data.length > 0) {
      processPreAggregatedData(predictions.heatmap_data);
    } else if (predictions.results || predictions.predictions) {
      generateHeatmapData(predictions.results || predictions.predictions);
    }
  }, [predictions]);

  // Process pre-aggregated data from backend
  const processPreAggregatedData = (data) => {
    const heatmapArray = data.map(item => ({
      date: item.date,
      count: item.count || 0,
      fraudCount: item.fraud_count || 0,
      totalAmount: item.total_amount || 0
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Fill in missing dates between min and max
    if (heatmapArray.length > 0) {
      const dateCounts = {};
      heatmapArray.forEach(d => { dateCounts[d.date] = d; });

      const minDate = new Date(heatmapArray[0].date);
      const maxDate = new Date(heatmapArray[heatmapArray.length - 1].date);
      const currentDate = new Date(minDate);

      while (currentDate <= maxDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (!dateCounts[dateStr]) {
          dateCounts[dateStr] = { date: dateStr, count: 0, fraudCount: 0, totalAmount: 0 };
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const filledArray = Object.values(dateCounts).sort((a, b) => new Date(a.date) - new Date(b.date));
      calculateStatsAndSet(filledArray);
    } else {
      calculateStatsAndSet(heatmapArray);
    }
  };

  const calculateStatsAndSet = (heatmapArray) => {
    const totalFrauds = heatmapArray.reduce((sum, d) => sum + d.fraudCount, 0);
    const totalTransactions = heatmapArray.reduce((sum, d) => sum + d.count, 0);
    const peakDay = heatmapArray.reduce((max, d) =>
      d.fraudCount > max.fraudCount ? d : max
      , { fraudCount: 0 });
    const avgPerDay = heatmapArray.length > 0 ? totalFrauds / heatmapArray.length : 0;

    setHeatmapData(heatmapArray);
    setStats({
      peak: peakDay.fraudCount > 0 ? peakDay : null,
      total: totalFrauds,
      avgPerDay: avgPerDay.toFixed(1),
      totalTransactions
    });
  };

  const generateHeatmapData = (results) => {
    const dateCounts = {};
    let minDate = null;
    let maxDate = null;

    results.forEach(txn => {
      if (txn.timestamp) {
        try {
          const date = new Date(txn.timestamp);
          const dateStr = date.toISOString().split('T')[0];

          if (!minDate || date < minDate) minDate = date;
          if (!maxDate || date > maxDate) maxDate = date;

          if (!dateCounts[dateStr]) {
            dateCounts[dateStr] = { date: dateStr, count: 0, fraudCount: 0, totalAmount: 0 };
          }

          dateCounts[dateStr].count++;
          dateCounts[dateStr].totalAmount += parseFloat(txn.amount || 0);

          // Check both possible probability field names
          const fraudProb = parseFloat(txn.ensemble_fraud_probability || txn.fraud_probability || 0);
          if (fraudProb > 0.5) {
            dateCounts[dateStr].fraudCount++;
          }
        } catch (e) {
          // Skip invalid timestamps
        }
      }
    });

    // Fill in missing dates
    if (minDate && maxDate) {
      const currentDate = new Date(minDate);
      while (currentDate <= maxDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (!dateCounts[dateStr]) {
          dateCounts[dateStr] = { date: dateStr, count: 0, fraudCount: 0, totalAmount: 0 };
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    const heatmapArray = Object.values(dateCounts).sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    calculateStatsAndSet(heatmapArray);
  };

  // Group data by weeks for the grid
  const weeklyData = useMemo(() => {
    if (!heatmapData.length) return [];

    const weeks = [];
    let currentWeek = [];

    // Start from the first day and add padding for incomplete first week
    if (heatmapData.length > 0) {
      const firstDay = new Date(heatmapData[0].date).getDay();
      for (let i = 0; i < firstDay; i++) {
        currentWeek.push(null);
      }
    }

    heatmapData.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // Add remaining days to last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [heatmapData]);

  const maxFraud = useMemo(() => {
    return Math.max(...heatmapData.map(d => d.fraudCount), 1);
  }, [heatmapData]);

  const getCellColor = (fraudCount) => {
    if (fraudCount === 0) return 'fraud-level-0';
    const ratio = fraudCount / maxFraud;
    if (ratio > 0.75) return 'fraud-level-4';
    if (ratio > 0.5) return 'fraud-level-3';
    if (ratio > 0.25) return 'fraud-level-2';
    return 'fraud-level-1';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getMonthLabels = () => {
    const months = [];
    let lastMonth = -1;

    weeklyData.forEach((week, weekIndex) => {
      const validDay = week.find(d => d !== null);
      if (validDay) {
        const month = new Date(validDay.date).getMonth();
        if (month !== lastMonth) {
          months.push({
            index: weekIndex,
            label: new Date(validDay.date).toLocaleDateString('en-US', { month: 'short' })
          });
          lastMonth = month;
        }
      }
    });

    return months;
  };

  if (!predictions || heatmapData.length === 0) {
    return null;
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthLabels = getMonthLabels();

  return (
    <div className="fraud-heatmap-calendar">
      {/* Header */}
      <div className="heatmap-header">
        <div className="header-title">
          <div className="header-icon">
            <FiCalendar size={24} />
          </div>
          <div>
            <h2>Fraud Activity Calendar</h2>
            <p>Daily fraud detection patterns across the analysis period</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="heatmap-stats-row">
        <div className="heatmap-stat-card">
          <div className="stat-icon-wrapper red">
            <FiAlertTriangle size={20} />
          </div>
          <div className="stat-details">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-title">Total Frauds</span>
          </div>
        </div>

        <div className="heatmap-stat-card">
          <div className="stat-icon-wrapper blue">
            <FiClock size={20} />
          </div>
          <div className="stat-details">
            <span className="stat-number">{heatmapData.length}</span>
            <span className="stat-title">Days Analyzed</span>
          </div>
        </div>

        <div className="heatmap-stat-card">
          <div className="stat-icon-wrapper orange">
            <FiTrendingUp size={20} />
          </div>
          <div className="stat-details">
            <span className="stat-number">{stats.avgPerDay}</span>
            <span className="stat-title">Avg/Day</span>
          </div>
        </div>

        {stats.peak && (
          <div className="heatmap-stat-card peak">
            <div className="stat-icon-wrapper purple">
              <FiZap size={20} />
            </div>
            <div className="stat-details">
              <span className="stat-number">{stats.peak.fraudCount}</span>
              <span className="stat-title">Peak Day</span>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="heatmap-calendar-container">
        {/* Month Labels */}
        <div className="month-labels">
          {monthLabels.map((month, idx) => (
            <span
              key={idx}
              className="month-label"
              style={{ gridColumn: month.index + 2 }}
            >
              {month.label}
            </span>
          ))}
        </div>

        <div className="calendar-grid-wrapper">
          {/* Day Labels */}
          <div className="day-labels">
            {dayLabels.map((day, idx) => (
              <span key={idx} className="day-label">{day}</span>
            ))}
          </div>

          {/* Heatmap Grid */}
          <div
            className="heatmap-grid"
            style={{ gridTemplateColumns: `repeat(${weeklyData.length}, 1fr)` }}
          >
            {weeklyData.map((week, weekIdx) => (
              <div key={weekIdx} className="week-column">
                {week.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className={`heatmap-cell ${day ? getCellColor(day.fraudCount) : 'empty'} ${selectedCell === day?.date ? 'selected' : ''
                      }`}
                    onClick={() => day && setSelectedCell(day.date === selectedCell ? null : day.date)}
                    title={day ? `${formatDate(day.date)}\nFrauds: ${day.fraudCount}\nTransactions: ${day.count}` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="heatmap-legend-bar">
        <span className="legend-text">Less</span>
        <div className="legend-cells">
          <div className="legend-cell fraud-level-0" title="0 frauds"></div>
          <div className="legend-cell fraud-level-1" title="Low"></div>
          <div className="legend-cell fraud-level-2" title="Medium"></div>
          <div className="legend-cell fraud-level-3" title="High"></div>
          <div className="legend-cell fraud-level-4" title="Critical"></div>
        </div>
        <span className="legend-text">More</span>
      </div>

      {/* Selected Day Details */}
      {selectedCell && (
        <div className="selected-day-details">
          {(() => {
            const dayData = heatmapData.find(d => d.date === selectedCell);
            if (!dayData) return null;
            return (
              <>
                <div className="detail-header">
                  <FiCalendar size={18} />
                  <strong>{formatDate(dayData.date)}</strong>
                </div>
                <div className="detail-stats">
                  <div className="detail-item">
                    <span className="detail-label">Frauds Detected</span>
                    <span className="detail-value fraud">{dayData.fraudCount}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Transactions</span>
                    <span className="detail-value">{dayData.count}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Amount</span>
                    <span className="detail-value">₹{dayData.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Fraud Rate</span>
                    <span className="detail-value">
                      {dayData.count > 0 ? ((dayData.fraudCount / dayData.count) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Insights */}
      <div className="heatmap-insights-section">
        <h3>📊 Key Insights</h3>
        <div className="insights-list">
          {generateInsights(heatmapData, stats).map((insight, idx) => (
            <div key={idx} className={`insight-item ${insight.type}`}>
              <span className="insight-icon">{insight.icon}</span>
              <span className="insight-text">{insight.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const generateInsights = (data, stats) => {
  const insights = [];

  if (data.length === 0) {
    return [{ icon: '📊', text: 'No data available for analysis', type: 'neutral' }];
  }

  // Peak day insight
  if (stats.peak) {
    insights.push({
      icon: '🔴',
      text: `Highest fraud activity on ${new Date(stats.peak.date).toLocaleDateString('en-US', {
        weekday: 'long', month: 'short', day: 'numeric'
      })} with ${stats.peak.fraudCount} fraud${stats.peak.fraudCount > 1 ? 's' : ''} detected`,
      type: 'warning'
    });
  }

  // Weekend vs weekday pattern
  const weekendData = data.filter(d => {
    const day = new Date(d.date).getDay();
    return day === 0 || day === 6;
  });
  const weekdayData = data.filter(d => {
    const day = new Date(d.date).getDay();
    return day !== 0 && day !== 6;
  });

  const weekendAvg = weekendData.reduce((sum, d) => sum + d.fraudCount, 0) / (weekendData.length || 1);
  const weekdayAvg = weekdayData.reduce((sum, d) => sum + d.fraudCount, 0) / (weekdayData.length || 1);

  if (weekendAvg > weekdayAvg * 1.3) {
    insights.push({
      icon: '📅',
      text: `Weekend fraud rate is ${((weekendAvg / weekdayAvg) * 100 - 100).toFixed(0)}% higher than weekdays`,
      type: 'alert'
    });
  } else if (weekdayAvg > weekendAvg * 1.3) {
    insights.push({
      icon: '📅',
      text: `Weekday fraud rate is ${((weekdayAvg / weekendAvg) * 100 - 100).toFixed(0)}% higher than weekends`,
      type: 'info'
    });
  }

  // Trend analysis
  const halfPoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, halfPoint);
  const secondHalf = data.slice(halfPoint);
  const firstAvg = firstHalf.reduce((sum, d) => sum + d.fraudCount, 0) / (firstHalf.length || 1);
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.fraudCount, 0) / (secondHalf.length || 1);

  if (secondAvg > firstAvg * 1.2) {
    insights.push({
      icon: '📈',
      text: `Fraud activity trending upward - recent period shows ${((secondAvg / firstAvg) * 100 - 100).toFixed(0)}% increase`,
      type: 'warning'
    });
  } else if (firstAvg > secondAvg * 1.2) {
    insights.push({
      icon: '📉',
      text: `Fraud activity trending downward - recent period shows ${((1 - secondAvg / firstAvg) * 100).toFixed(0)}% decrease`,
      type: 'success'
    });
  }

  // Zero fraud days
  const zeroFraudDays = data.filter(d => d.fraudCount === 0).length;
  if (zeroFraudDays > data.length * 0.5) {
    insights.push({
      icon: '✅',
      text: `${zeroFraudDays} out of ${data.length} days had zero fraud detections`,
      type: 'success'
    });
  }

  return insights.length > 0 ? insights : [
    { icon: '✅', text: 'Fraud activity shows consistent patterns across the analysis period', type: 'neutral' }
  ];
};

export default FraudHeatmapCalendar;
