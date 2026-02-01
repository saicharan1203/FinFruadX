import React, { useState } from 'react';
import { Box } from '@mui/material';
import { FiClock, FiDownload, FiTrash2, FiEye } from 'react-icons/fi';
import '../styles/dashboard.css';

export const ReportHistory = ({ onViewReport }) => {
    // Simulated report history - in production would come from backend
    const [reports, setReports] = useState([
        {
            id: 1,
            name: 'Fraud Summary Report',
            type: 'summary',
            date: new Date().toLocaleDateString(),
            time: '10:30 AM',
            records: 1250,
            status: 'completed'
        },
        {
            id: 2,
            name: 'Detailed Analysis Report',
            type: 'detailed',
            date: new Date(Date.now() - 86400000).toLocaleDateString(),
            time: '3:45 PM',
            records: 890,
            status: 'completed'
        },
        {
            id: 3,
            name: 'CSV Data Export',
            type: 'csv',
            date: new Date(Date.now() - 172800000).toLocaleDateString(),
            time: '9:15 AM',
            records: 2340,
            status: 'completed'
        }
    ]);

    const getTypeIcon = (type) => {
        switch (type) {
            case 'summary': return '📈';
            case 'detailed': return '🧾';
            case 'csv': return '💾';
            default: return '📄';
        }
    };

    const getTypeBadgeColor = (type) => {
        switch (type) {
            case 'summary': return '#3b82f6';
            case 'detailed': return '#8b5cf6';
            case 'csv': return '#22c55e';
            default: return '#64748b';
        }
    };

    const handleDelete = (id) => {
        setReports(reports.filter(r => r.id !== id));
    };

    return (
        <Box className="report-history">
            <Box className="history-header">
                <Box className="history-title">
                    <FiClock />
                    <h3>Recent Reports</h3>
                </Box>
                <span className="history-count">{reports.length} reports</span>
            </Box>

            <Box className="history-list">
                {reports.length === 0 ? (
                    <Box className="history-empty">
                        <span>📭</span>
                        <p>No reports generated yet</p>
                    </Box>
                ) : (
                    reports.map(report => (
                        <Box key={report.id} className="history-item">
                            <Box className="history-item-icon">{getTypeIcon(report.type)}</Box>
                            <Box className="history-item-info">
                                <span className="history-item-name">{report.name}</span>
                                <span className="history-item-meta">
                                    {report.date} at {report.time} • {report.records.toLocaleString()} records
                                </span>
                            </Box>
                            <span
                                className="history-item-badge"
                                style={{ backgroundColor: getTypeBadgeColor(report.type) }}
                            >
                                {report.type}
                            </span>
                            <Box className="history-item-actions">
                                <button className="action-btn view" title="View">
                                    <FiEye />
                                </button>
                                <button className="action-btn download" title="Download">
                                    <FiDownload />
                                </button>
                                <button
                                    className="action-btn delete"
                                    title="Delete"
                                    onClick={() => handleDelete(report.id)}
                                >
                                    <FiTrash2 />
                                </button>
                            </Box>
                        </Box>
                    ))
                )}
            </Box>
        </Box>
    );
};
