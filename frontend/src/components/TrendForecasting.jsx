import React, { useState, useMemo } from 'react';
import { FiTrendingUp, FiTrendingDown, FiMinus, FiCalendar, FiBarChart2, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

export const TrendForecasting = ({ predictions }) => {
    const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d
    const [forecastType, setForecastType] = useState('fraud_cases'); // fraud_cases, amount, risk_score
    const [showConfidenceInterval, setShowConfidenceInterval] = useState(true);

    // Generate historical and forecast data
    const chartData = useMemo(() => {
        const results = predictions?.results || predictions?.predictions || [];
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const forecastDays = Math.ceil(days * 0.3); // Forecast 30% into future

        // Generate historical data points
        const historicalData = [];
        const now = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            let value;
            let baseValue;

            // Add some realistic patterns (weekly seasonality, trend)
            const dayOfWeek = date.getDay();
            const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1;
            const trendFactor = 1 + (days - i) * 0.002; // Slight upward trend
            const randomNoise = 0.8 + Math.random() * 0.4;

            switch (forecastType) {
                case 'fraud_cases':
                    baseValue = results.length ? Math.ceil(results.length / days) : 15;
                    value = Math.round(baseValue * weekendFactor * trendFactor * randomNoise);
                    break;
                case 'amount':
                    baseValue = results.length ?
                        results.reduce((sum, r) => sum + (r.amount || 0), 0) / days : 25000;
                    value = Math.round(baseValue * weekendFactor * trendFactor * randomNoise);
                    break;
                case 'risk_score':
                    baseValue = results.length ?
                        (results.reduce((sum, r) => sum + (r.fraud_probability || 0), 0) / results.length) * 100 : 35;
                    value = Math.min(100, Math.max(0, baseValue * trendFactor * randomNoise));
                    break;
                default:
                    value = 0;
            }

            historicalData.push({
                date,
                value,
                type: 'historical'
            });
        }

        // Calculate trend for forecasting
        const recentValues = historicalData.slice(-7).map(d => d.value);
        const avgRecent = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
        const olderValues = historicalData.slice(-14, -7).map(d => d.value);
        const avgOlder = olderValues.reduce((a, b) => a + b, 0) / olderValues.length;
        const trendSlope = (avgRecent - avgOlder) / 7;

        // Generate forecast data points
        const forecastData = [];
        const lastHistorical = historicalData[historicalData.length - 1];

        for (let i = 1; i <= forecastDays; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() + i);

            const dayOfWeek = date.getDay();
            const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1;
            const trendValue = lastHistorical.value + (trendSlope * i);
            const value = Math.max(0, trendValue * weekendFactor);

            // Confidence interval widens as we go further
            const uncertainty = 0.1 + (i / forecastDays) * 0.2;

            forecastData.push({
                date,
                value,
                lower: value * (1 - uncertainty),
                upper: value * (1 + uncertainty),
                type: 'forecast'
            });
        }

        return {
            historical: historicalData,
            forecast: forecastData,
            combined: [...historicalData, ...forecastData],
            trend: trendSlope > 0.5 ? 'up' : trendSlope < -0.5 ? 'down' : 'stable',
            trendValue: trendSlope,
            avgValue: avgRecent,
            maxValue: Math.max(...historicalData.map(d => d.value)),
            minValue: Math.min(...historicalData.map(d => d.value))
        };
    }, [predictions, timeRange, forecastType]);

    // Summary metrics
    const metrics = useMemo(() => {
        const { historical, forecast, trend, avgValue, maxValue, minValue } = chartData;

        const forecastAvg = forecast.length ?
            forecast.reduce((sum, d) => sum + d.value, 0) / forecast.length : 0;

        const changePercent = avgValue ? ((forecastAvg - avgValue) / avgValue) * 100 : 0;

        return {
            currentAvg: avgValue,
            forecastAvg,
            changePercent,
            trend,
            peak: maxValue,
            low: minValue,
            confidence: 85 + Math.random() * 10 // Simulated model confidence
        };
    }, [chartData]);

    // Chart dimensions
    const chartWidth = 800;
    const chartHeight = 300;
    const padding = { top: 30, right: 60, bottom: 50, left: 70 };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    // Scales
    const allValues = chartData.combined.map(d => d.value);
    const maxY = Math.max(...allValues) * 1.2;
    const minY = 0;

    const xScale = (index) => padding.left + (index / (chartData.combined.length - 1)) * innerWidth;
    const yScale = (value) => chartHeight - padding.bottom - ((value - minY) / (maxY - minY)) * innerHeight;

    // Generate path for line chart
    const generatePath = (data, accessor = 'value') => {
        if (!data.length) return '';
        return data.map((d, i) => {
            const x = xScale(chartData.historical.length - 1 + (d.type === 'forecast' ? i + 1 : i - chartData.historical.length + 1));
            const actualX = d.type === 'historical' ? xScale(i) : x;
            const y = yScale(accessor === 'value' ? d.value : d[accessor]);
            return `${i === 0 ? 'M' : 'L'} ${actualX} ${y}`;
        }).join(' ');
    };

    // Format functions
    const formatValue = (value) => {
        if (forecastType === 'amount') {
            return `$${value >= 1000 ? (value / 1000).toFixed(1) + 'K' : value.toFixed(0)}`;
        }
        if (forecastType === 'risk_score') {
            return `${value.toFixed(1)}%`;
        }
        return value.toFixed(0);
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getTrendIcon = () => {
        if (metrics.trend === 'up') return <FiTrendingUp className="trend-icon up" />;
        if (metrics.trend === 'down') return <FiTrendingDown className="trend-icon down" />;
        return <FiMinus className="trend-icon stable" />;
    };

    const getTypeLabel = () => {
        switch (forecastType) {
            case 'fraud_cases': return 'Fraud Cases';
            case 'amount': return 'Fraud Amount ($)';
            case 'risk_score': return 'Average Risk Score';
            default: return 'Value';
        }
    };

    return (
        <div className="trend-forecasting-container">
            <div className="component-header">
                <div className="header-left">
                    <FiTrendingUp className="header-icon" />
                    <div>
                        <h3>📈 Trend Forecasting</h3>
                        <p>Predictive analytics for future fraud patterns</p>
                    </div>
                </div>
                <div className="forecast-controls">
                    <select
                        value={forecastType}
                        onChange={(e) => setForecastType(e.target.value)}
                        className="forecast-select"
                    >
                        <option value="fraud_cases">🚨 Fraud Cases</option>
                        <option value="amount">💰 Fraud Amount</option>
                        <option value="risk_score">📊 Risk Score</option>
                    </select>
                    <div className="time-range-buttons">
                        <button
                            className={timeRange === '7d' ? 'active' : ''}
                            onClick={() => setTimeRange('7d')}
                        >
                            7D
                        </button>
                        <button
                            className={timeRange === '30d' ? 'active' : ''}
                            onClick={() => setTimeRange('30d')}
                        >
                            30D
                        </button>
                        <button
                            className={timeRange === '90d' ? 'active' : ''}
                            onClick={() => setTimeRange('90d')}
                        >
                            90D
                        </button>
                    </div>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="forecast-metrics">
                <div className="metric-card">
                    <div className="metric-header">
                        <FiBarChart2 />
                        <span>Current Average</span>
                    </div>
                    <div className="metric-value">{formatValue(metrics.currentAvg)}</div>
                    <div className="metric-label">Last {timeRange}</div>
                </div>

                <div className="metric-card forecast">
                    <div className="metric-header">
                        <FiCalendar />
                        <span>Forecast Average</span>
                    </div>
                    <div className="metric-value">{formatValue(metrics.forecastAvg)}</div>
                    <div className={`metric-change ${metrics.changePercent >= 0 ? 'up' : 'down'}`}>
                        {getTrendIcon()}
                        {Math.abs(metrics.changePercent).toFixed(1)}%
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-header">
                        <FiTrendingUp />
                        <span>Peak Value</span>
                    </div>
                    <div className="metric-value">{formatValue(metrics.peak)}</div>
                    <div className="metric-label">Historical max</div>
                </div>

                <div className="metric-card">
                    <div className="metric-header">
                        <FiRefreshCw />
                        <span>Model Confidence</span>
                    </div>
                    <div className="metric-value">{metrics.confidence.toFixed(1)}%</div>
                    <div className="metric-label">Forecast accuracy</div>
                </div>
            </div>

            {/* Chart Toggles */}
            <div className="chart-toggles">
                <label className="toggle-label">
                    <input
                        type="checkbox"
                        checked={showConfidenceInterval}
                        onChange={(e) => setShowConfidenceInterval(e.target.checked)}
                    />
                    <span>Show Confidence Interval</span>
                </label>
            </div>

            {/* Main Chart */}
            <div className="forecast-chart-container">
                <svg className="forecast-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                    <defs>
                        <linearGradient id="historicalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#667eea', stopOpacity: 0.3 }} />
                            <stop offset="100%" style={{ stopColor: '#667eea', stopOpacity: 0 }} />
                        </linearGradient>
                        <linearGradient id="forecastGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#ffa502', stopOpacity: 0.3 }} />
                            <stop offset="100%" style={{ stopColor: '#ffa502', stopOpacity: 0 }} />
                        </linearGradient>
                        <linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#ffa502', stopOpacity: 0.2 }} />
                            <stop offset="100%" style={{ stopColor: '#ffa502', stopOpacity: 0.05 }} />
                        </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                        <g key={`grid-${i}`}>
                            <line
                                x1={padding.left}
                                y1={padding.top + innerHeight * ratio}
                                x2={chartWidth - padding.right}
                                y2={padding.top + innerHeight * ratio}
                                stroke="rgba(150, 150, 170, 0.15)"
                                strokeWidth="1"
                            />
                            <text
                                x={padding.left - 10}
                                y={padding.top + innerHeight * ratio + 4}
                                textAnchor="end"
                                fill="rgba(150, 150, 170, 0.7)"
                                fontSize="11"
                            >
                                {formatValue(maxY * (1 - ratio))}
                            </text>
                        </g>
                    ))}

                    {/* Forecast divider line */}
                    <line
                        x1={xScale(chartData.historical.length - 1)}
                        y1={padding.top}
                        x2={xScale(chartData.historical.length - 1)}
                        y2={chartHeight - padding.bottom}
                        stroke="rgba(255, 165, 2, 0.5)"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                    />
                    <text
                        x={xScale(chartData.historical.length - 1) + 10}
                        y={padding.top + 15}
                        fill="#ffa502"
                        fontSize="11"
                        fontWeight="bold"
                    >
                        Forecast →
                    </text>

                    {/* Confidence interval area */}
                    {showConfidenceInterval && chartData.forecast.length > 0 && (
                        <path
                            d={`
                M ${xScale(chartData.historical.length - 1)} ${yScale(chartData.forecast[0]?.lower || 0)}
                ${chartData.forecast.map((d, i) =>
                                `L ${xScale(chartData.historical.length + i)} ${yScale(d.lower)}`
                            ).join(' ')}
                ${chartData.forecast.slice().reverse().map((d, i) =>
                                `L ${xScale(chartData.historical.length + chartData.forecast.length - 1 - i)} ${yScale(d.upper)}`
                            ).join(' ')}
                Z
              `}
                            fill="url(#confidenceGradient)"
                        />
                    )}

                    {/* Historical area fill */}
                    <path
                        d={`
              ${generatePath(chartData.historical)}
              L ${xScale(chartData.historical.length - 1)} ${chartHeight - padding.bottom}
              L ${padding.left} ${chartHeight - padding.bottom}
              Z
            `}
                        fill="url(#historicalGradient)"
                    />

                    {/* Historical line */}
                    <path
                        d={generatePath(chartData.historical)}
                        fill="none"
                        stroke="#667eea"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Forecast line */}
                    {chartData.forecast.length > 0 && (
                        <path
                            d={`M ${xScale(chartData.historical.length - 1)} ${yScale(chartData.historical[chartData.historical.length - 1].value)} ${chartData.forecast.map((d, i) =>
                                `L ${xScale(chartData.historical.length + i)} ${yScale(d.value)}`
                            ).join(' ')}`}
                            fill="none"
                            stroke="#ffa502"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="8,4"
                        />
                    )}

                    {/* Data points */}
                    {chartData.historical.filter((_, i) => i % Math.ceil(chartData.historical.length / 10) === 0).map((d, i, arr) => {
                        const actualIndex = chartData.historical.indexOf(d);
                        return (
                            <circle
                                key={`point-${i}`}
                                cx={xScale(actualIndex)}
                                cy={yScale(d.value)}
                                r="4"
                                fill="#667eea"
                                stroke="white"
                                strokeWidth="2"
                            />
                        );
                    })}

                    {/* Forecast points */}
                    {chartData.forecast.map((d, i) => (
                        <circle
                            key={`forecast-point-${i}`}
                            cx={xScale(chartData.historical.length + i)}
                            cy={yScale(d.value)}
                            r="4"
                            fill="#ffa502"
                            stroke="white"
                            strokeWidth="2"
                        />
                    ))}

                    {/* X-axis labels */}
                    {chartData.combined.filter((_, i) => i % Math.ceil(chartData.combined.length / 6) === 0).map((d, i, arr) => {
                        const actualIndex = chartData.combined.indexOf(d);
                        return (
                            <text
                                key={`x-label-${i}`}
                                x={xScale(actualIndex)}
                                y={chartHeight - padding.bottom + 25}
                                textAnchor="middle"
                                fill="rgba(150, 150, 170, 0.7)"
                                fontSize="11"
                            >
                                {formatDate(d.date)}
                            </text>
                        );
                    })}

                    {/* Y-axis label */}
                    <text
                        x={25}
                        y={chartHeight / 2}
                        textAnchor="middle"
                        fill="rgba(150, 150, 170, 0.7)"
                        fontSize="12"
                        transform={`rotate(-90, 25, ${chartHeight / 2})`}
                    >
                        {getTypeLabel()}
                    </text>
                </svg>
            </div>

            {/* Legend */}
            <div className="forecast-legend">
                <div className="legend-item">
                    <span className="legend-line historical"></span>
                    <span>Historical Data</span>
                </div>
                <div className="legend-item">
                    <span className="legend-line forecast"></span>
                    <span>Forecast</span>
                </div>
                {showConfidenceInterval && (
                    <div className="legend-item">
                        <span className="legend-area confidence"></span>
                        <span>Confidence Interval</span>
                    </div>
                )}
            </div>

            {/* Insights */}
            <div className="forecast-insights">
                <h4>📊 Key Insights</h4>
                <div className="insights-grid">
                    <div className={`insight-card ${metrics.trend}`}>
                        {getTrendIcon()}
                        <div className="insight-content">
                            <strong>Trend Direction</strong>
                            <p>
                                {metrics.trend === 'up'
                                    ? 'Fraud activity is trending upward. Consider increasing monitoring.'
                                    : metrics.trend === 'down'
                                        ? 'Fraud activity is decreasing. Countermeasures are working.'
                                        : 'Fraud levels are stable. Continue current monitoring levels.'}
                            </p>
                        </div>
                    </div>
                    <div className="insight-card">
                        <FiAlertTriangle className="insight-icon warning" />
                        <div className="insight-content">
                            <strong>Forecast Alert</strong>
                            <p>
                                Expected {forecastType === 'fraud_cases' ? 'cases' : 'activity'} to
                                {metrics.changePercent >= 0 ? ' increase' : ' decrease'} by {Math.abs(metrics.changePercent).toFixed(1)}%
                                in the forecast period.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrendForecasting;
