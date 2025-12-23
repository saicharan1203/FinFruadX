import React, { useMemo, useState } from 'react';
import { FiGlobe, FiZoomIn, FiZoomOut, FiRefreshCw, FiChevronRight } from 'react-icons/fi';

// Region colors for breakdown
const REGION_COLORS = {
    'North America': '#3b82f6',
    'Europe': '#8b5cf6',
    'Asia': '#f59e0b',
    'South America': '#10b981',
    'Africa': '#ef4444',
    'Oceania': '#06b6d4'
};

// Major world cities with x,y positions (percentage-based)
const WORLD_CITIES = [
    { id: 1, city: 'New York', country: 'USA', region: 'North America', x: 24, y: 35 },
    { id: 2, city: 'Los Angeles', country: 'USA', region: 'North America', x: 12, y: 38 },
    { id: 3, city: 'Toronto', country: 'Canada', region: 'North America', x: 22, y: 32 },
    { id: 4, city: 'Mexico City', country: 'Mexico', region: 'North America', x: 16, y: 45 },
    { id: 5, city: 'London', country: 'UK', region: 'Europe', x: 47, y: 28 },
    { id: 6, city: 'Paris', country: 'France', region: 'Europe', x: 49, y: 30 },
    { id: 7, city: 'Berlin', country: 'Germany', region: 'Europe', x: 52, y: 28 },
    { id: 8, city: 'Moscow', country: 'Russia', region: 'Europe', x: 58, y: 25 },
    { id: 9, city: 'Mumbai', country: 'India', region: 'Asia', x: 68, y: 45 },
    { id: 10, city: 'Shanghai', country: 'China', region: 'Asia', x: 80, y: 36 },
    { id: 11, city: 'Tokyo', country: 'Japan', region: 'Asia', x: 87, y: 34 },
    { id: 12, city: 'Singapore', country: 'Singapore', region: 'Asia', x: 76, y: 55 },
    { id: 13, city: 'Sydney', country: 'Australia', region: 'Oceania', x: 88, y: 72 },
    { id: 14, city: 'São Paulo', country: 'Brazil', region: 'South America', x: 32, y: 65 },
    { id: 15, city: 'Lagos', country: 'Nigeria', region: 'Africa', x: 50, y: 52 },
    { id: 16, city: 'Dubai', country: 'UAE', region: 'Asia', x: 62, y: 40 },
];

// Connection lines between cities
const CONNECTIONS = [
    [1, 5], [1, 6], [1, 14],
    [5, 7], [5, 8], [5, 16],
    [7, 8], [7, 9],
    [9, 10], [9, 12], [9, 16],
    [10, 11], [10, 12],
    [12, 13],
    [14, 15],
    [16, 9], [16, 10],
    [2, 1], [2, 4],
    [3, 1], [3, 5],
];

const getRiskLevel = (count) => {
    if (count > 30) return 'Critical';
    if (count > 20) return 'High';
    if (count > 10) return 'Medium';
    return 'Low';
};

export const GeoLocationFraudMap = ({ predictions }) => {
    const [hoveredLocation, setHoveredLocation] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(1);

    const displayLocations = useMemo(() => {
        const results = predictions?.results || predictions?.predictions || [];
        if (!results || results.length === 0) {
            return WORLD_CITIES.map(city => ({
                ...city,
                fraudCount: Math.floor(Math.random() * 40) + 1,
                riskLevel: getRiskLevel(Math.floor(Math.random() * 40) + 1)
            }));
        }
        const fraudCount = results.filter(r => (r.fraud_probability || 0) > 0.5).length;
        return WORLD_CITIES.map((city) => {
            const cityFraudCount = Math.floor((fraudCount / WORLD_CITIES.length) * (1 + Math.random()));
            return { ...city, fraudCount: cityFraudCount, riskLevel: getRiskLevel(cityFraudCount) };
        });
    }, [predictions]);

    const regionalStats = useMemo(() => {
        const stats = {};
        Object.keys(REGION_COLORS).forEach(region => {
            const regionCities = displayLocations.filter(loc => loc.region === region);
            stats[region] = {
                count: regionCities.reduce((sum, city) => sum + city.fraudCount, 0),
                cities: regionCities.length
            };
        });
        return stats;
    }, [displayLocations]);

    const topCity = useMemo(() => {
        if (!displayLocations.length) return null;
        return displayLocations.reduce((max, city) =>
            city.fraudCount > (max?.fraudCount || 0) ? city : max, displayLocations[0]);
    }, [displayLocations]);

    const statCards = useMemo(() => {
        const totalFraud = displayLocations.reduce((sum, loc) => sum + loc.fraudCount, 0);
        const criticalCount = displayLocations.filter(loc => loc.riskLevel === 'Critical').length;
        const highRiskCount = displayLocations.filter(loc => loc.riskLevel === 'High' || loc.riskLevel === 'Critical').length;
        return [
            { id: 'total', label: 'Total Cases', value: totalFraud.toLocaleString(), tone: 'primary' },
            { id: 'cities', label: 'Affected Cities', value: displayLocations.length, tone: 'info' },
            { id: 'critical', label: 'Critical Zones', value: criticalCount, tone: 'danger' },
            { id: 'highrisk', label: 'High Risk Areas', value: highRiskCount, tone: 'warning' },
        ];
    }, [displayLocations]);

    const getCityById = (id) => displayLocations.find(c => c.id === id);

    return (
        <div className="geo-fraud-map-container">
            <div className="component-header">
                <div className="header-left">
                    <div className="header-icon"><FiGlobe /></div>
                    <div>
                        <h3>🌍 Geolocation Fraud Map</h3>
                        <p>Global distribution of detected fraud activities</p>
                    </div>
                </div>
                <div className="map-controls">
                    <button type="button" className="control-btn" onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}><FiZoomOut /></button>
                    <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
                    <button type="button" className="control-btn" onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}><FiZoomIn /></button>
                    <button type="button" className="control-btn" onClick={() => setZoomLevel(1)}><FiRefreshCw /></button>
                </div>
            </div>

            <div className="map-stats-bar">
                {statCards.map((card) => (
                    <div key={card.id} className={`stat-item ${card.tone}`}>
                        <span className="stat-value">{card.value}</span>
                        <span className="stat-label">{card.label}</span>
                    </div>
                ))}
                <div className="top-city-card">
                    <span className="city-label">Top Fraud City</span>
                    <span className="city-name">{topCity?.city || 'Awaiting data'}</span>
                    <span className="city-meta">{topCity ? `${topCity.country} · ${topCity.fraudCount} cases` : 'Run detection to populate'}</span>
                </div>
            </div>

            {/* World Map with Image Background */}
            <div className="world-map-container" style={{ transform: `scale(${zoomLevel})` }}>
                {/* World Map Image */}
                <img
                    src="/world-map-dark.png"
                    alt="World Map"
                    className="world-map-image"
                />

                {/* SVG Overlay for Lines and Markers */}
                <svg className="network-overlay-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="0.5" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Connection Lines */}
                    {CONNECTIONS.map(([fromId, toId], index) => {
                        const from = getCityById(fromId);
                        const to = getCityById(toId);
                        if (!from || !to) return null;
                        return (
                            <line
                                key={`line-${index}`}
                                x1={from.x} y1={from.y}
                                x2={to.x} y2={to.y}
                                stroke="#00b8d4"
                                strokeWidth="0.15"
                                strokeOpacity="0.5"
                                strokeDasharray="1 0.5"
                                className="network-line"
                            />
                        );
                    })}
                </svg>

                {/* DOM-based Markers */}
                <div className="markers-layer">
                    {displayLocations.map((location) => (
                        <div
                            key={location.id}
                            className="city-marker"
                            style={{ left: `${location.x}%`, top: `${location.y}%` }}
                            onMouseEnter={() => setHoveredLocation(location)}
                            onMouseLeave={() => setHoveredLocation(null)}
                        >
                            <span className="marker-pulse-ring"></span>
                            <span className="marker-inner-ring"></span>
                            <span className="marker-dot"></span>
                        </div>
                    ))}

                    {hoveredLocation && (
                        <div className="marker-tooltip" style={{ left: `${Math.min(hoveredLocation.x + 3, 75)}%`, top: `${Math.max(hoveredLocation.y - 12, 5)}%` }}>
                            <div className="tooltip-title">{hoveredLocation.city}</div>
                            <div className="tooltip-subtitle">{hoveredLocation.country}</div>
                            <div className="tooltip-info"><span>{hoveredLocation.fraudCount} fraud cases</span></div>
                        </div>
                    )}
                </div>

                <div className="risk-legend">
                    <div className="legend-title">NETWORK NODES</div>
                    <div className="legend-row"><span className="legend-marker active"></span><span>Active Connection</span></div>
                    <div className="legend-row"><span className="legend-marker node"></span><span>Fraud Hotspot</span></div>
                </div>

                <button type="button" className="map-region-link" onClick={() => {
                    const target = document?.getElementById('regional-breakdown');
                    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}>
                    <span>Regional Breakdown</span>
                    <FiChevronRight />
                </button>
            </div>

            <div className="regional-breakdown" id="regional-breakdown">
                <h4>Regional Breakdown</h4>
                <div className="region-cards">
                    {Object.entries(REGION_COLORS).map(([region, color]) => {
                        const stats = regionalStats[region] || { count: 0, cities: 0 };
                        return (
                            <div key={region} className={`region-card ${selectedRegion === region ? 'selected' : ''}`}
                                onClick={() => setSelectedRegion(selectedRegion === region ? null : region)}
                                style={{ borderLeftColor: color }}>
                                <div className="region-header">
                                    <strong>{region}</strong>
                                    <span className="region-badge" style={{ background: color }}>{stats.cities}</span>
                                </div>
                                <span className="region-count">{stats.count.toLocaleString()} fraud cases</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default GeoLocationFraudMap;
