import React, { useState, useEffect, useRef } from 'react';
import { FiRadio, FiTarget } from 'react-icons/fi';

export const FraudRadar = ({ predictions }) => {
  const canvasRef = useRef(null);
  const [radarData, setRadarData] = useState([]);
  const [sweepAngle, setSweepAngle] = useState(0);
  const [detectedCount, setDetectedCount] = useState(0);

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
      setSweepAngle(prev => (prev + 2) % 360);
    }, 30);
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

    // Clear canvas
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, width, height);

    // Draw concentric circles
    [0.25, 0.5, 0.75, 1].forEach((factor, index) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * factor, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(37, 117, 252, ${0.15 + index * 0.1})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw cross lines
    ctx.strokeStyle = 'rgba(37, 117, 252, 0.2)';
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

  }, [sweepAngle, radarData]);

  if (!predictions || radarData.length === 0) {
    return null;
  }

  return (
    <div className="radar-container">
      <div className="section-header">
        <FiRadio size={28} style={{ color: 'var(--success)' }} />
        <h2>📡 Fraud Detection Radar</h2>
        <p>Real-time scanning of transaction patterns</p>
      </div>

      <div className="radar-display">
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          className="radar-canvas"
        />
        
        <div className="radar-stats">
          <div className="radar-stat">
            <FiTarget className="stat-icon-radar" />
            <div className="stat-content-radar">
              <strong>{radarData.length}</strong>
              <span>Transactions Scanned</span>
            </div>
          </div>
          <div className="radar-stat threat">
            <div className="threat-icon">⚠️</div>
            <div className="stat-content-radar">
              <strong>{detectedCount}</strong>
              <span>Threats Detected</span>
            </div>
          </div>
        </div>

        <div className="radar-legend">
          <div className="legend-item-radar">
            <div className="legend-dot green-dot"></div>
            <span>Normal Transaction</span>
          </div>
          <div className="legend-item-radar">
            <div className="legend-dot red-dot"></div>
            <span>Fraud Detected</span>
          </div>
          <div className="legend-item-radar">
            <div className="legend-line"></div>
            <span>Active Scan</span>
          </div>
        </div>
      </div>

      <div className="radar-info-box">
        <div className="info-icon">💡</div>
        <p>
          The radar continuously scans transactions. <strong>Red blips</strong> indicate
          detected fraud (&gt;60% probability), while <strong>green blips</strong> show
          normal activity. Distance from center represents fraud probability.
        </p>
      </div>
    </div>
  );
};
