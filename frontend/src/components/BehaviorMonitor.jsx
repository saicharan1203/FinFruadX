import React, { useEffect, useRef, useState } from 'react';
import { FiActivity, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

const initialSnapshot = {
  scrollScore: 0,
  typingScore: 0,
  touchScore: 0,
  idleScore: 0,
  confidence: 0,
  verdict: 'Collecting interaction data…'
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const average = (arr) => (arr.length ? arr.reduce((sum, val) => sum + val, 0) / arr.length : 0);
const variance = (arr) => {
  if (arr.length < 2) return 0;
  const avg = average(arr);
  return arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / (arr.length - 1);
};

export const BehaviorMonitor = () => {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const metricsRef = useRef({
    scrollSpeeds: [],
    keyIntervals: [],
    touchIntervals: [],
    idleIntervals: [],
    lastScrollY: typeof window !== 'undefined' ? window.scrollY : 0,
    lastScrollTime: typeof performance !== 'undefined' ? performance.now() : 0,
    lastKeyTime: null,
    lastTouchTime: null,
    lastActivity: Date.now(),
    lastIdlePing: Date.now()
  });

  const pushMetric = (array, value, limit = 40) => {
    array.push(value);
    if (array.length > limit) array.shift();
  };

  const markActivity = () => {
    const now = Date.now();
    const gap = now - metricsRef.current.lastActivity;
    if (gap > 250) {
      pushMetric(metricsRef.current.idleIntervals, gap);
    }
    metricsRef.current.lastActivity = now;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleScroll = () => {
      const now = performance.now();
      const deltaY = Math.abs(window.scrollY - metricsRef.current.lastScrollY);
      const deltaTime = Math.max(now - metricsRef.current.lastScrollTime, 16);
      const speed = (deltaY / deltaTime) * 1000; // px per second

      pushMetric(metricsRef.current.scrollSpeeds, speed);
      metricsRef.current.lastScrollY = window.scrollY;
      metricsRef.current.lastScrollTime = now;
      markActivity();
    };

    const handleKeyDown = () => {
      const now = performance.now();
      if (metricsRef.current.lastKeyTime) {
        const interval = now - metricsRef.current.lastKeyTime;
        pushMetric(metricsRef.current.keyIntervals, interval);
      }
      metricsRef.current.lastKeyTime = now;
      markActivity();
    };

    const handlePointerDown = () => {
      const now = performance.now();
      if (metricsRef.current.lastTouchTime) {
        const interval = now - metricsRef.current.lastTouchTime;
        pushMetric(metricsRef.current.touchIntervals, interval);
      }
      metricsRef.current.lastTouchTime = now;
      markActivity();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        markActivity();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('visibilitychange', handleVisibility);

    const evaluator = setInterval(() => {
      const { scrollSpeeds, keyIntervals, touchIntervals, idleIntervals, lastActivity } = metricsRef.current;
      const now = Date.now();
      const idleGap = now - lastActivity;

      const scrollVarianceScore = clamp(variance(scrollSpeeds) / 20000, 0, 1);
      const typingVarianceScore = clamp(variance(keyIntervals) / 8000, 0, 1);
      const touchVarianceScore = clamp(variance(touchIntervals) / 10000, 0, 1);
      const idleVarianceScore = clamp(variance(idleIntervals) / 200000, 0, 1);

      const idlePenalty = idleGap > 45000 ? 0.2 : idleGap > 30000 ? 0.1 : 0;
      const composite = clamp((scrollVarianceScore + typingVarianceScore + touchVarianceScore + idleVarianceScore) / 4 - idlePenalty, 0, 1);

      let verdict = 'Collecting interaction data…';
      if (scrollSpeeds.length + keyIntervals.length + touchIntervals.length > 20) {
        verdict = composite > 0.6 ? 'Human presence confirmed' : composite < 0.3 ? 'Bot-like behaviour detected' : 'Activity seems robotic — monitoring';
      }

      setSnapshot({
        scrollScore: scrollVarianceScore,
        typingScore: typingVarianceScore,
        touchScore: touchVarianceScore,
        idleScore: 1 - clamp(idleGap / 60000, 0, 1),
        confidence: composite,
        verdict
      });
    }, 3000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(evaluator);
    };
  }, []);

  const confidenceLabel = snapshot.confidence > 0.7 ? 'secure' : snapshot.confidence < 0.35 ? 'alert' : 'watch';

  return (
    <div className={`behavior-monitor behavior-${confidenceLabel}`}>
      <div className="behavior-header">
        <FiActivity />
        <div>
          <strong>Liveness Shield</strong>
          <p>{snapshot.verdict}</p>
        </div>
        <span className="confidence-pill">{Math.round(snapshot.confidence * 100)}%</span>
      </div>
      <div className="behavior-metrics">
        <MetricBar label="Scroll diversity" value={snapshot.scrollScore} />
        <MetricBar label="Typing variance" value={snapshot.typingScore} />
        <MetricBar label="Touch rhythm" value={snapshot.touchScore} />
        <MetricBar label="Idle pulse" value={snapshot.idleScore} />
      </div>
      {confidenceLabel === 'alert' && (
        <div className="behavior-warning">
          <FiAlertTriangle />
          <span>Interactions look highly uniform. Challenge session or request MFA.</span>
        </div>
      )}
      {confidenceLabel === 'secure' && snapshot.confidence > 0.8 && (
        <div className="behavior-success">
          <FiCheckCircle />
          <span>Healthy human interaction detected.</span>
        </div>
      )}
    </div>
  );
};

const MetricBar = ({ label, value }) => (
  <div className="metric-bar">
    <div className="metric-label">
      <span>{label}</span>
      <span>{Math.round(value * 100)}%</span>
    </div>
    <div className="metric-track">
      <div className="metric-fill" style={{ width: `${clamp(value, 0, 1) * 100}%` }}></div>
    </div>
  </div>
);
