import React, { useState, useRef, useEffect } from 'react';
import { FiBell, FiX, FiCheck, FiCheckCircle, FiAlertTriangle, FiInfo, FiSettings, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import { useNotifications } from '../contexts/NotificationContext';

export const NotificationCenter = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState('all'); // all, unread, fraud_alert, system, info
    const dropdownRef = useRef(null);

    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        settings,
        setSettings
    } = useNotifications();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getTimeAgo = (timestamp) => {
        const now = new Date();
        const diff = now - new Date(timestamp);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const getNotificationIcon = (type, priority) => {
        if (priority === 'critical') {
            return <FiAlertCircle className="notif-type-icon critical" />;
        }
        switch (type) {
            case 'fraud_alert':
                return <FiAlertTriangle className="notif-type-icon fraud" />;
            case 'system':
                return <FiSettings className="notif-type-icon system" />;
            case 'info':
                return <FiInfo className="notif-type-icon info" />;
            default:
                return <FiBell className="notif-type-icon" />;
        }
    };

    const getPriorityClass = (priority) => {
        switch (priority) {
            case 'critical': return 'priority-critical';
            case 'high': return 'priority-high';
            case 'low': return 'priority-low';
            default: return 'priority-medium';
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.read;
        return n.type === filter;
    });

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        // Could add navigation logic here based on notification type
    };

    return (
        <div className="notification-center" ref={dropdownRef}>
            <button
                className={`notification-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Notifications"
            >
                <FiBell />
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
                {unreadCount > 0 && <span className="notification-pulse"></span>}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notif-header">
                        <h3>
                            Notifications
                            {unreadCount > 0 && <span className="unread-count">({unreadCount} new)</span>}
                        </h3>
                        <div className="notif-header-actions">
                            {unreadCount > 0 && (
                                <button
                                    className="mark-all-read"
                                    onClick={markAllAsRead}
                                    title="Mark all as read"
                                >
                                    <FiCheckCircle /> Mark all read
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="notif-filters">
                        <button
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </button>
                        <button
                            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                            onClick={() => setFilter('unread')}
                        >
                            Unread
                        </button>
                        <button
                            className={`filter-btn ${filter === 'fraud_alert' ? 'active' : ''}`}
                            onClick={() => setFilter('fraud_alert')}
                        >
                            🚨 Alerts
                        </button>
                        <button
                            className={`filter-btn ${filter === 'system' ? 'active' : ''}`}
                            onClick={() => setFilter('system')}
                        >
                            ⚙️ System
                        </button>
                    </div>

                    <div className="notif-list">
                        {filteredNotifications.length === 0 ? (
                            <div className="notif-empty">
                                <FiBell size={40} />
                                <p>No notifications</p>
                                <span>You're all caught up!</span>
                            </div>
                        ) : (
                            filteredNotifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`notif-item ${!notification.read ? 'unread' : ''} ${getPriorityClass(notification.priority)}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="notif-icon-wrap">
                                        {getNotificationIcon(notification.type, notification.priority)}
                                    </div>
                                    <div className="notif-content">
                                        <div className="notif-title">
                                            {notification.title}
                                            {!notification.read && <span className="new-badge">NEW</span>}
                                        </div>
                                        <p className="notif-message">{notification.message}</p>
                                        <span className="notif-time">{getTimeAgo(notification.timestamp)}</span>
                                    </div>
                                    <div className="notif-actions">
                                        {!notification.read && (
                                            <button
                                                className="notif-action-btn"
                                                onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                                                title="Mark as read"
                                            >
                                                <FiCheck />
                                            </button>
                                        )}
                                        <button
                                            className="notif-action-btn delete"
                                            onClick={(e) => { e.stopPropagation(); removeNotification(notification.id); }}
                                            title="Remove"
                                        >
                                            <FiX />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="notif-footer">
                            <button className="clear-all-btn" onClick={clearAll}>
                                <FiTrash2 /> Clear All
                            </button>
                            <button className="view-all-btn" onClick={() => setIsOpen(false)}>
                                View All Activity →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
