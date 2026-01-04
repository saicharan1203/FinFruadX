import React, { useState, useEffect, useRef } from 'react';
import { FiRadio, FiTarget } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';

export const FraudRadar = ({ predictions }) => {
  const canvasRef = useRef(null);
  const [radarData, setRadarData] = useState([]);
  const [sweepAngle, setSweepAngle] = useState(0);
  const [detectedCount, setDetectedCount] = useState(0);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (!predictions || !Array.isArray(predictions)) return;

    // Convert predictions to radar blips
    const blips = predictions
      .filter((_, index) => index < 50) // Limit to 50 for performance
      .map((pred, index) => {
        const fraudProb = pred.fraud_probability || 0;
        const angle = (index / 50) * 360;
        const distance = 30 + (fraudProb * 60); // 30-90% of radius

        return {
          angle,
          distance,
          risk: fraudProb,
          amount: pred.amount || 0,
          category: pred.merchant_category || 'unknown',
          detected: fraudProb > 0.6
        };
      });

    setRadarData(blips);
    setDetectedCount(blips.filter(b => b.detected).length);
  }, [predictions]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSweepAngle(prev => (prev + 6) % 360); // Faster increment to compensate
    }, 100); // Slowed from 30ms to 100ms for better performance
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 20;

    // Theme-aware colors
    const bgColor = isDarkMode ? '#0a1628' : '#f0f4ff';
    const circleColor = isDarkMode ? 'rgba(37, 117, 252, ' : 'rgba(106, 17, 203, ';

    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Draw concentric circles
    [0.25, 0.5, 0.75, 1].forEach((factor, index) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * factor, 0, Math.PI * 2);
      ctx.strokeStyle = `${circleColor}${0.15 + index * 0.1})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw cross lines
    ctx.strokeStyle = isDarkMode ? 'rgba(37, 117, 252, 0.2)' : 'rgba(106, 17, 203, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - maxRadius);
    ctx.lineTo(centerX, centerY + maxRadius);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX - maxRadius, centerY);
    ctx.lineTo(centerX + maxRadius, centerY);
    ctx.stroke();

    // Draw sweeping line
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((sweepAngle * Math.PI) / 180);

    const gradient = ctx.createLinearGradient(0, 0, 0, -maxRadius);
    gradient.addColorStop(0, 'rgba(46, 213, 115, 0)');
    gradient.addColorStop(0.5, 'rgba(46, 213, 115, 0.5)');
    gradient.addColorStop(1, 'rgba(46, 213, 115, 0.8)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-maxRadius * 0.15, -maxRadius);
    ctx.lineTo(maxRadius * 0.15, -maxRadius);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Draw blips
    radarData.forEach((blip) => {
      const angleRad = (blip.angle * Math.PI) / 180;
      const radius = (blip.distance / 100) * maxRadius;
      const x = centerX + radius * Math.cos(angleRad - Math.PI / 2);
      const y = centerY + radius * Math.sin(angleRad - Math.PI / 2);

      // Fade effect based on sweep angle
      const angleDiff = Math.abs(sweepAngle - blip.angle);
      const normalizedDiff = Math.min(angleDiff, 360 - angleDiff);
      const opacity = Math.max(0, 1 - normalizedDiff / 90);

      ctx.beginPath();
      ctx.arc(x, y, blip.detected ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = blip.detected
        ? `rgba(255, 71, 87, ${opacity})`
        : `rgba(46, 213, 115, ${opacity * 0.6})`;
      ctx.fill();

      if (blip.detected && opacity > 0.7) {
        ctx.strokeStyle = 'rgba(255, 71, 87, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

  }, [sweepAngle, radarData, isDarkMode]);

  if (!predictions || radarData.length === 0) {
    return null;
  }

  return (
    <div
      className="radar-container"
      style={{
        background: isDarkMode
          ? 'rgba(15, 20, 35, 0.95)'
          : 'rgba(255, 255, 255, 0.98)',
        border: isDarkMode
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(0, 0, 0, 0.08)'
      }}
    >
      <div className="section-header">
        <FiRadio size={28} style={{ color: isDarkMode ? 'var(--success)' : '#6a11cb' }} />
        <h2 style={{ color: isDarkMode ? '#ffffff' : '#1f2430' }}>📡 Fraud Detection Radar</h2>
        <p style={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : '#7a869a' }}>Real-time scanning of transaction patterns</p>
      </div>

      <div
        className="radar-display"
        style={{
          background: isDarkMode
            ? 'rgba(10, 22, 40, 0.95)'
            : 'rgba(248, 250, 255, 0.95)',
          border: isDarkMode
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(106, 17, 203, 0.1)'
        }}
      >
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          className="radar-canvas"
        />

        <div className="radar-stats">
          <div
            className="radar-stat"
            style={{
              background: isDarkMode
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.95)',
              border: isDarkMode
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(0, 0, 0, 0.06)'
            }}
          >
            <FiTarget className="stat-icon-radar" style={{ color: isDarkMode ? '#00d4ff' : '#6a11cb' }} />
            <div className="stat-content-radar">
              <strong style={{ color: isDarkMode ? '#ffffff' : '#1f2430' }}>{radarData.length}</strong>
              <span style={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : '#7a869a' }}>Transactions Scanned</span>
            </div>
          </div>
          <div
            className="radar-stat threat"
            style={{
              background: isDarkMode
                ? 'rgba(255, 71, 87, 0.15)'
                : 'rgba(255, 71, 87, 0.08)',
              border: isDarkMode
                ? '1px solid rgba(255, 71, 87, 0.3)'
                : '1px solid rgba(255, 71, 87, 0.2)'
            }}
          >
            <div className="threat-icon">⚠️</div>
            <div className="stat-content-radar">
              <strong style={{ color: isDarkMode ? '#ff4757' : '#dc2626' }}>{detectedCount}</strong>
              <span style={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : '#7a869a' }}>Threats Detected</span>
            </div>
          </div>
        </div>

        <div
          className="radar-legend"
          style={{
            background: isDarkMode
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(106, 17, 203, 0.04)'
          }}
        >
          <div className="legend-item-radar">
            <div className="legend-dot green-dot"></div>
            <span style={{ color: isDarkMode ? 'rgba(255,255,255,0.8)' : '#4b5164' }}>Normal Transaction</span>
          </div>
          <div className="legend-item-radar">
            <div className="legend-dot red-dot"></div>
            <span style={{ color: isDarkMode ? 'rgba(255,255,255,0.8)' : '#4b5164' }}>Fraud Detected</span>
          </div>
          <div className="legend-item-radar">
            <div className="legend-line"></div>
            <span style={{ color: isDarkMode ? 'rgba(255,255,255,0.8)' : '#4b5164' }}>Active Scan</span>
          </div>
        </div>
      </div>

      <div
        className="radar-info-box"
        style={{
          background: isDarkMode
            ? 'rgba(37, 117, 252, 0.1)'
            : 'rgba(106, 17, 203, 0.05)',
          border: isDarkMode
            ? '1px solid rgba(37, 117, 252, 0.2)'
            : '1px solid rgba(106, 17, 203, 0.12)'
        }}
      >
        <div className="info-icon">💡</div>
        <p style={{ color: isDarkMode ? 'rgba(255,255,255,0.8)' : '#4b5164' }}>
          The radar continuously scans transactions. <strong style={{ color: isDarkMode ? '#ff4757' : '#dc2626' }}>Red blips</strong> indicate
          detected fraud (&gt;60% probability), while <strong style={{ color: isDarkMode ? '#2ed573' : '#0a8341' }}>green blips</strong> show
          normal activity. Distance from center represents fraud probability.
        </p>
      </div>
    </div>
  );
};
