import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { FiClock, FiUser, FiFilter, FiSearch } from 'react-icons/fi';

export const ActivityLogPage = () => {
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Generate sample activity log
    const sampleActivities = [
      {
        id: 1,
        type: 'detection',
        action: 'Fraud Alert Triggered',
        details: 'High-risk transaction detected - ₹45,000',
        user: 'System',
        timestamp: new Date(Date.now() - 3600000).toLocaleString(),
        severity: 'critical'
      },
      {
        id: 2,
        type: 'user',
        action: 'Profile Updated',
        details: 'Changed role to Security Analyst',
        user: 'Koka Venkata Sai Charan',
        timestamp: new Date(Date.now() - 7200000).toLocaleString(),
        severity: 'info'
      },
      {
        id: 3,
        type: 'system',
        action: 'Model Training Completed',
        details: 'Random Forest model trained with 95% accuracy',
        user: 'System',
        timestamp: new Date(Date.now() - 10800000).toLocaleString(),
        severity: 'success'
      },
      {
        id: 4,
        type: 'detection',
        action: 'Investigation Started',
        details: 'Transaction ID: TXN-12345 marked for investigation',
        user: 'Koka Venkata Sai Charan',
        timestamp: new Date(Date.now() - 14400000).toLocaleString(),
        severity: 'warning'
      },
      {
        id: 5,
        type: 'security',
        action: 'Login Attempt',
        details: 'Successful login from IP: 192.168.1.1',
        user: 'Koka Venkata Sai Charan',
        timestamp: new Date(Date.now() - 18000000).toLocaleString(),
        severity: 'info'
      },
      {
        id: 6,
        type: 'data',
        action: 'Sample Data Generated',
        details: '1000 rows of transaction data created',
        user: 'System',
        timestamp: new Date(Date.now() - 21600000).toLocaleString(),
        severity: 'success'
      },
      {
        id: 7,
        type: 'detection',
        action: 'Fraud Pattern Detected',
        details: 'Velocity attack pattern identified in 5 transactions',
        user: 'System',
        timestamp: new Date(Date.now() - 25200000).toLocaleString(),
        severity: 'critical'
      },
      {
        id: 8,
        type: 'user',
        action: 'Settings Modified',
        details: 'Notification preferences updated',
        user: 'Koka Venkata Sai Charan',
        timestamp: new Date(Date.now() - 28800000).toLocaleString(),
        severity: 'info'
      }
    ];

    setActivities(sampleActivities);
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredActivities = activities.filter(activity => {
    const matchesFilter = filter === 'all' || activity.type === filter;
    const actionText = (activity.action || '').toString().toLowerCase();
    const detailText = (activity.details || '').toString().toLowerCase();
    const matchesSearch =
      normalizedSearch === '' ||
      actionText.includes(normalizedSearch) ||
      detailText.includes(normalizedSearch);
    return matchesFilter && matchesSearch;
  });

  const getActivityIcon = (type) => {
    switch (type) {
      case 'detection': return '🚨';
      case 'user': return '👤';
      case 'system': return '⚙️';
      case 'security': return '🔒';
      case 'data': return '📊';
      default: return '📝';
    }
  };

  const stats = [
    { label: 'Total Activities', value: activities.length },
    { label: 'Critical Events', value: activities.filter(a => a.severity === 'critical').length },
    { label: 'Detections', value: activities.filter(a => a.type === 'detection').length },
    { label: 'User Actions', value: activities.filter(a => a.type === 'user').length },
    { label: 'System Events', value: activities.filter(a => a.type === 'system').length }
  ];

  return (
    <Box className="page-container activity-page">
      <Box className="activity-hero">
        <Box className="hero-badge">🛡️ Bio Shield</Box>
        <Box>
          <h1>Activity Log</h1>
          <p>All system activities and analyst actions in one unified stream.</p>
        </Box>
        <Box className="hero-status-grid">
          <Box>
            <span>Presence:</span>
            <strong>Confirmed</strong>
          </Box>
          <Box>
            <span>Session Integrity:</span>
            <strong>99.4%</strong>
          </Box>
        </Box>
        <Box className="hero-metrics">
          <Box>
            <span>Typing variance</span>
            <Box className="metric-bar"><span style={{ width: '0%' }} /></Box>
          </Box>
          <Box>
            <span>Touch rhythm</span>
            <Box className="metric-bar"><span style={{ width: '100%' }} /></Box>
          </Box>
          <Box>
            <span>Idle pulse</span>
            <Box className="metric-bar"><span style={{ width: '80%' }} /></Box>
          </Box>
        </Box>
      </Box>

      <Box className="activity-stat-pills">
        {stats.map((stat) => (
          <Box key={stat.label} className="stat-pill">
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </Box>
        ))}
      </Box>

      <Box className="activity-controls">
        <Box className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Box>

        <Box className="filter-group">
          <FiFilter />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Activities</option>
            <option value="detection">Fraud Detection</option>
            <option value="user">User Actions</option>
            <option value="system">System Events</option>
            <option value="security">Security</option>
            <option value="data">Data Operations</option>
          </select>
        </Box>
      </Box>

      <Box className="activity-timeline">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity) => (
            <Box key={activity.id} className={`activity-item severity-${activity.severity}`}>
              <Box className="activity-icon">
                {getActivityIcon(activity.type)}
              </Box>
              <Box className="activity-content">
                <Box className="activity-header">
                  <h3>{activity.action}</h3>
                  <span className={`severity-badge ${activity.severity}`}>
                    {activity.severity}
                  </span>
                </Box>
                <p className="activity-details">{activity.details}</p>
                <Box className="activity-meta">
                  <span className="meta-item">
                    <FiUser size={14} /> {activity.user}
                  </span>
                  <span className="meta-item">
                    <FiClock size={14} /> {activity.timestamp}
                  </span>
                  <span className="meta-item type-badge">
                    {activity.type}
                  </span>
                </Box>
              </Box>
            </Box>
          ))
        ) : (
          <Box className="empty-state-activity">
            <Box className="empty-icon">🔍</Box>
            <h3>No activities found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </Box>
        )}
      </Box>
    </Box>
  );
};
