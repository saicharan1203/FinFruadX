import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * VideoScrollTransition
 * Procedurally generates a neon credit-card sequence that behaves like the provided GIF.
 * The "video" frames are drawn in real-time on a canvas so we can scrub/tilt the card with scroll.
 */
export const VideoScrollTransition = () => {
  const canvasRef = useRef(null);
  const hostRef = useRef(null);
  const cardRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const pointerRef = useRef({ x: 0.5, y: 0.5 });
  const [isReady, setIsReady] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    document.body.classList.add('has-video-transition');
    return () => document.body.classList.remove('has-video-transition');
  }, []);

  useEffect(() => {
    const handlePointer = (e) => {
      pointerRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      };
    };
    window.addEventListener('pointermove', handlePointer);
    return () => window.removeEventListener('pointermove', handlePointer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
      setScrollProgress(progress);
      if (hostRef.current) {
        hostRef.current.style.setProperty('--scroll-progress', progress.toFixed(3));
      }
      if (cardRef.current) {
        const tiltX = (pointerRef.current.y - 0.5) * -12 + progress * 6;
        const tiltY = (pointerRef.current.x - 0.5) * 18;
        cardRef.current.style.transform = `translate3d(-50%, -50%, 0) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let width = 0;
    let height = 0;

    const createParticles = () => {
      const count = 120;
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 0.3 + Math.random() * 0.7,
        size: 1 + Math.random() * 2,
        hue: 190 + Math.random() * 90,
        drift: Math.random() * 0.5 + 0.15
      }));
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      createParticles();
    };

    const render = () => {
      animationRef.current = requestAnimationFrame(render);
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#010712');
      gradient.addColorStop(0.35, '#050f2a');
      gradient.addColorStop(1, '#04030f');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      particlesRef.current.forEach((particle, idx) => {
        const progress = (scrollProgress * 0.8 + idx * 0.001) % 1;
        particle.x += particle.speed + progress * 1.5;
        particle.y -= particle.drift + progress;
        if (particle.x > width + 20) particle.x = -20;
        if (particle.y < -20) particle.y = height + 20;
        const glow = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, 30);
        glow.addColorStop(0, `hsla(${particle.hue}, 90%, 60%, 0.8)`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 18, 0, Math.PI * 2);
        ctx.fill();
      });

      setIsReady(true);
    };

    resize();
    render();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [scrollProgress]);

  useEffect(() => {
    // mimic quick snap when route changes
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div ref={hostRef} className={`video-scroll-transition generated ${isReady ? 'ready' : ''}`}>
      <canvas ref={canvasRef} className="transition-canvas" aria-hidden="true" />
      <div className="video-scroll-overlay" />
      <div className="video-scroll-grid" />
      <div className="scanline" />
      <div className="holo-card" ref={cardRef} aria-hidden="true">
        <div className="card-glow" />
        <div className="card-chip">
          <span />
          <span />
        </div>
        <div className="card-brand">SpectraSecure</div>
        <div className="card-number">5278&nbsp;9412&nbsp;6700&nbsp;2025</div>
        <div className="card-name">FINFRAUDX GUARDIAN</div>
        <div className="card-bottom">
          <div>
            <span className="label">VALID</span>
            <strong>12/36</strong>
          </div>
          <div className="card-scanbar">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoScrollTransition;
