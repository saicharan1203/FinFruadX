import React, { useState, useEffect } from 'react';
import { FiClock, FiZap, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

export const FraudTimeline = ({ predictions }) => {
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    if (!predictions || !Array.isArray(predictions)) return;

    const events = predictions
      .map((pred, index) => ({
        id: index,
        timestamp: pred.timestamp || new Date(Date.now() - Math.random() * 86400000).toISOString(),
        amount: pred.amount || 0,
        fraudProb: pred.fraud_probability || 0,
        customer: pred.customer_id || `C${index + 1}`,
        merchant: pred.merchant_id || `M${index + 1}`,
        category: pred.merchant_category || 'Unknown',
        type: pred.transaction_type || 'purchase'
      }))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(0, 20);

    setTimelineEvents(events);
  }, [predictions]);

  const getEventVisuals = (fraudProb) => {
    if (fraudProb > 0.7) {
      return {
        icon: <FiAlertCircle />,
        color: '#ff4757',
        label: 'FRAUD',
        level: 'critical'
      };
    }
    if (fraudProb > 0.4) {
      return {
        icon: <FiZap />,
        color: '#ffa502',
        label: 'SUSPICIOUS',
        level: 'warning'
      };
    }
    return {
      icon: <FiCheckCircle />,
      color: '#2ed573',
      label: 'NORMAL',
      level: 'safe'
    };
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (timelineEvents.length === 0) {
    return null;
  }

  return (
    <div className="timeline-container">
      <div className="section-header">
        <FiClock size={28} style={{ color: 'var(--primary)' }} />
        <h2>⏱️ Fraud Pattern Timeline</h2>
        <p>Chronological view of transaction patterns and anomalies</p>
      </div>

      <div className="timeline-wrapper">
        {timelineEvents.map((event) => {
          const { icon, color, label, level } = getEventVisuals(event.fraudProb);
          const riskPercent = (event.fraudProb * 100).toFixed(1);

          return (
            <div
              key={event.id}
              className={`timeline-block timeline-block-${level}`}
              onClick={() => setSelectedEvent(event)}
            >
              <div className="timeline-block-header">
                <div className="timeline-block-left">
                  <div className="timeline-block-icon" style={{ background: color }}>
                    {icon}
                  </div>
                  <div className="timeline-block-meta">
                    <span className="timeline-block-time">{formatTime(event.timestamp)}</span>
                    <span className="timeline-block-date">{formatDate(event.timestamp)}</span>
                  </div>
                </div>

                <div className="timeline-block-right">
                  <span className={`timeline-status-badge timeline-status-${level}`}>
                    {label}
                  </span>
                  <span className="timeline-block-amount">₹{event.amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="timeline-block-details">
                <div className="timeline-detail">
                  <label>Customer:</label>
                  <strong>{event.customer}</strong>
                </div>
                <div className="timeline-detail">
                  <label>Merchant:</label>
                  <strong>{event.merchant}</strong>
                </div>
                <div className="timeline-detail">
                  <label>Category:</label>
                  <strong>{event.category}</strong>
                </div>
                <div className="timeline-detail">
                  <label>Risk:</label>
                  <strong>{riskPercent}%</strong>
                </div>
              </div>

              <div className="timeline-progress">
                <div
                  className="timeline-progress-bar"
                  style={{ width: `${riskPercent}%`, background: color }}
                />
              </div>

              {event.fraudProb > 0.7 && (
                <div className="timeline-alert timeline-alert-inline">
                  ⚠️ High fraud probability detected!
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedEvent && (
        <div className="timeline-modal" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Transaction Details</h3>
            <div className="modal-grid">
              <div className="modal-item">
                <strong>Customer ID:</strong>
                <span>{selectedEvent.customer}</span>
              </div>
              <div className="modal-item">
                <strong>Merchant ID:</strong>
                <span>{selectedEvent.merchant}</span>
              </div>
              <div className="modal-item">
                <strong>Amount:</strong>
                <span>₹{selectedEvent.amount.toFixed(2)}</span>
              </div>
              <div className="modal-item">
                <strong>Category:</strong>
                <span>{selectedEvent.category}</span>
              </div>
              <div className="modal-item">
                <strong>Type:</strong>
                <span>{selectedEvent.type}</span>
              </div>
              <div className="modal-item">
                <strong>Fraud Probability:</strong>
                <span>{(selectedEvent.fraudProb * 100).toFixed(2)}%</span>
              </div>
              <div className="modal-item">
                <strong>Timestamp:</strong>
                <span>{new Date(selectedEvent.timestamp).toLocaleString()}</span>
              </div>
            </div>
            <button className="modal-close" onClick={() => setSelectedEvent(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
