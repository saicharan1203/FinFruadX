import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const NotificationContext = createContext(null);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

const generateId = () => `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const DEFAULT_NOTIFICATIONS = [
    {
        id: generateId(),
        type: 'fraud_alert',
        title: 'High Risk Transaction Detected',
        message: 'Transaction #TXN-7849 flagged with 94% fraud probability',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        priority: 'critical',
        metadata: { transactionId: 'TXN-7849', amount: 4500 }
    },
    {
        id: generateId(),
        type: 'fraud_alert',
        title: 'Suspicious Pattern Identified',
        message: 'Multiple rapid transactions from same IP detected',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false,
        priority: 'high',
        metadata: { patternType: 'velocity', count: 12 }
    },
    {
        id: generateId(),
        type: 'system',
        title: 'Model Retrained Successfully',
        message: 'Fraud detection model updated with latest data. Accuracy: 96.4%',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        read: true,
        priority: 'info',
        metadata: { accuracy: 96.4 }
    },
    {
        id: generateId(),
        type: 'info',
        title: 'Weekly Report Ready',
        message: 'Your fraud analytics report for this week is now available',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        read: true,
        priority: 'low',
        metadata: {}
    }
];

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [settings, setSettings] = useState({
        soundEnabled: true,
        desktopEnabled: true,
        showOnlyUnread: false
    });

    // Initialize with some default notifications
    useEffect(() => {
        const saved = localStorage.getItem('fraudx_notifications');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setNotifications(parsed.map(n => ({
                    ...n,
                    timestamp: new Date(n.timestamp)
                })));
            } catch (e) {
                setNotifications(DEFAULT_NOTIFICATIONS);
            }
        } else {
            setNotifications(DEFAULT_NOTIFICATIONS);
        }
    }, []);

    // Save notifications to localStorage
    useEffect(() => {
        if (notifications.length > 0) {
            localStorage.setItem('fraudx_notifications', JSON.stringify(notifications));
        }
    }, [notifications]);

    const addNotification = useCallback((notification) => {
        const newNotification = {
            id: generateId(),
            timestamp: new Date(),
            read: false,
            priority: 'medium',
            metadata: {},
            ...notification
        };

        setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep max 50 notifications

        // Play sound if enabled
        if (settings.soundEnabled && notification.priority === 'critical') {
            // Could add actual sound here
            console.log('🔔 Critical notification received');
        }

        return newNotification;
    }, [settings.soundEnabled]);

    const markAsRead = useCallback((id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
        localStorage.removeItem('fraudx_notifications');
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const getNotificationsByType = useCallback((type) => {
        return notifications.filter(n => n.type === type);
    }, [notifications]);

    const getRecentNotifications = useCallback((count = 10) => {
        return notifications.slice(0, count);
    }, [notifications]);

    // Simulate receiving new fraud alerts periodically (for demo)
    useEffect(() => {
        const interval = setInterval(() => {
            // 10% chance of new notification every 30 seconds
            if (Math.random() < 0.1) {
                const types = ['fraud_alert', 'system', 'info'];
                const type = types[Math.floor(Math.random() * types.length)];

                const templates = {
                    fraud_alert: [
                        { title: 'Suspicious Transaction', message: `Transaction flagged with ${(Math.random() * 30 + 70).toFixed(1)}% fraud probability`, priority: 'high' },
                        { title: 'Anomaly Detected', message: 'Unusual pattern in transaction volume detected', priority: 'high' },
                        { title: 'Critical Alert', message: 'Multiple high-risk transactions from same account', priority: 'critical' }
                    ],
                    system: [
                        { title: 'System Update', message: 'New fraud rules applied successfully', priority: 'low' },
                        { title: 'Performance Alert', message: 'Model accuracy has improved to 97.2%', priority: 'info' }
                    ],
                    info: [
                        { title: 'Tip', message: 'Review pending cases to improve model feedback', priority: 'low' },
                        { title: 'Reminder', message: 'Weekly fraud analysis meeting in 1 hour', priority: 'info' }
                    ]
                };

                const options = templates[type];
                const template = options[Math.floor(Math.random() * options.length)];

                addNotification({ type, ...template });
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [addNotification]);

    const value = {
        notifications,
        unreadCount,
        settings,
        setSettings,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        getNotificationsByType,
        getRecentNotifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;
