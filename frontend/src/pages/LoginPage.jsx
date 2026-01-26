import React, { useEffect, useRef, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import API_URL from '../apiConfig';
import './LoginPage.css';

// Use Cases Modal Component
const UseCasesModal = ({ isOpen, onClose }) => {
    const [activeCategory, setActiveCategory] = useState('banking');

    const categories = {
        banking: {
            title: 'Banking & Finance',
            icon: '🏦',
            color: '#667eea'
        },
        ecommerce: {
            title: 'E-Commerce',
            icon: '🛒',
            color: '#ff4757'
        },
        insurance: {
            title: 'Insurance',
            icon: '🛡️',
            color: '#2ed573'
        },
        fintech: {
            title: 'Fintech & Payments',
            icon: '💳',
            color: '#a29bfe'
        }
    };

    const useCases = {
        banking: [
            {
                icon: '💳',
                title: 'Card Testing Attack Detection',
                description: 'Detect rapid small-value transactions used by fraudsters to validate stolen card details before making larger purchases.',
                tags: ['Velocity Checks', 'Pattern Detection', 'Real-time Alerts']
            },
            {
                icon: '👤',
                title: 'Account Takeover Prevention',
                description: 'Identify unauthorized access attempts through behavioral analysis, unusual login patterns, and device fingerprinting.',
                tags: ['Behavioral Analysis', 'Device ID', 'Risk Scoring']
            },
            {
                icon: '🌍',
                title: 'Impossible Travel Detection',
                description: 'Flag transactions occurring in geographically distant locations within impossibly short timeframes.',
                tags: ['Geo-location', 'Time Analysis', 'Travel Rules']
            },
            {
                icon: '💰',
                title: 'Money Laundering Screening',
                description: 'Detect structuring, layering, and placement patterns that indicate money laundering activities.',
                tags: ['AML Compliance', 'Transaction Patterns', 'Risk Flags']
            }
        ],
        ecommerce: [
            {
                icon: '🛍️',
                title: 'Friendly Fraud Prevention',
                description: 'Identify customers who make legitimate purchases then dispute charges falsely to get refunds.',
                tags: ['Chargeback Analysis', 'Customer History', 'Dispute Patterns']
            },
            {
                icon: '🤖',
                title: 'Bot & Automated Attack Detection',
                description: 'Detect automated scripts used for credential stuffing, inventory hoarding, or scalping attacks.',
                tags: ['Bot Detection', 'Rate Limiting', 'CAPTCHA Triggers']
            },
            {
                icon: '📦',
                title: 'Shipping Address Fraud',
                description: 'Identify mismatches between billing and shipping addresses that indicate potential fraud.',
                tags: ['Address Verification', 'Delivery Risk', 'Mule Detection']
            },
            {
                icon: '🎁',
                title: 'Promo & Coupon Abuse',
                description: 'Detect customers creating multiple accounts to exploit promotional offers and discount codes.',
                tags: ['Multi-Account Detection', 'Promo Tracking', 'Device Linking']
            }
        ],
        insurance: [
            {
                icon: '🚗',
                title: 'Claims Fraud Detection',
                description: 'Analyze claim patterns to identify staged accidents, inflated damages, or fraudulent injury claims.',
                tags: ['Claim Analysis', 'Pattern Matching', 'Investigation Queue']
            },
            {
                icon: '📋',
                title: 'Application Fraud Screening',
                description: 'Detect false information on insurance applications including identity, history, and risk factors.',
                tags: ['Identity Verification', 'Data Validation', 'Risk Assessment']
            },
            {
                icon: '🔄',
                title: 'Duplicate Claims Detection',
                description: 'Identify the same incident being claimed multiple times across different policies or insurers.',
                tags: ['Cross-Reference', 'Claim Matching', 'Fraud Networks']
            },
            {
                icon: '🏥',
                title: 'Medical Billing Fraud',
                description: 'Detect phantom billing, upcoding, and unbundling in healthcare insurance claims.',
                tags: ['Billing Analysis', 'Code Verification', 'Provider Monitoring']
            }
        ],
        fintech: [
            {
                icon: '📱',
                title: 'Mobile Payment Fraud',
                description: 'Protect mobile wallets and P2P transfers from unauthorized transactions and social engineering.',
                tags: ['App Security', 'Transaction Limits', 'Device Trust']
            },
            {
                icon: '🔐',
                title: 'Account Creation Fraud',
                description: 'Prevent synthetic identity fraud and fake account creation for money mule operations.',
                tags: ['KYC Enhanced', 'Identity Graphs', 'Risk Scoring']
            },
            {
                icon: '💱',
                title: 'Crypto Transaction Monitoring',
                description: 'Track suspicious cryptocurrency transactions and identify potential laundering patterns.',
                tags: ['Blockchain Analysis', 'Wallet Tracking', 'Exchange Monitoring']
            },
            {
                icon: '⚡',
                title: 'Real-time Payment Protection',
                description: 'Secure instant payment systems with sub-second fraud decisioning for UPI, instant transfers.',
                tags: ['Instant Decisioning', 'Low Latency', 'High Accuracy']
            }
        ]
    };

    if (!isOpen) return null;

    return (
        <div className="usecases-overlay" onClick={onClose}>
            <div className="usecases-modal" onClick={(e) => e.stopPropagation()}>
                <button className="usecases-close" onClick={onClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                <div className="usecases-header">
                    <div className="usecases-badge">
                        <span className="badge-pulse"></span>
                        Industry Solutions
                    </div>
                    <h2>Use Cases</h2>
                    <p>Discover how our AI-powered platform protects businesses across industries</p>
                </div>

                <div className="usecases-categories">
                    {Object.entries(categories).map(([key, cat]) => (
                        <button
                            key={key}
                            className={`category-tab ${activeCategory === key ? 'active' : ''}`}
                            onClick={() => setActiveCategory(key)}
                            style={{ '--cat-color': cat.color }}
                        >
                            <span className="cat-icon">{cat.icon}</span>
                            <span className="cat-title">{cat.title}</span>
                        </button>
                    ))}
                </div>

                <div className="usecases-content">
                    <div className="features-grid">
                        {useCases[activeCategory].map((useCase, index) => (
                            <div
                                key={useCase.title}
                                className="feature-card"
                                style={{
                                    '--card-delay': `${index * 0.1}s`,
                                    '--accent-color': categories[activeCategory].color
                                }}
                            >
                                <div className="feature-icon-wrap">
                                    <span className="feature-icon">{useCase.icon}</span>
                                    <div className="icon-glow"></div>
                                </div>
                                <div className="feature-info">
                                    <h3>{useCase.title}</h3>
                                    <p>{useCase.description}</p>
                                    <div className="feature-tags">
                                        {useCase.tags.map(tag => (
                                            <span key={tag} className="feature-tag">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="usecases-footer">
                    <div className="stats-row">
                        <div className="stat-item">
                            <span className="stat-value">16+</span>
                            <span className="stat-label">Use Cases</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">4</span>
                            <span className="stat-label">Industries</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">Real-time</span>
                            <span className="stat-label">Detection</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">AI</span>
                            <span className="stat-label">Powered</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Explore Platform Modal Component
const ExplorePlatformModal = ({ isOpen, onClose }) => {
    const [activeCategory, setActiveCategory] = useState('core');

    const categories = {
        core: {
            title: 'Core Features',
            icon: '🎯',
            color: '#667eea'
        },
        detection: {
            title: 'Detection & Analysis',
            icon: '🔍',
            color: '#ff4757'
        },
        monitoring: {
            title: 'Monitoring & Alerts',
            icon: '📡',
            color: '#2ed573'
        },
        ai: {
            title: 'AI & ML Services',
            icon: '🤖',
            color: '#a29bfe'
        }
    };

    const features = {
        core: [
            {
                icon: '📊',
                title: 'Main Dashboard',
                description: 'Upload transaction data, train ML models, and get real-time fraud predictions with visual analytics.',
                tags: ['Data Upload', 'Model Training', 'Predictions']
            },
            {
                icon: '📈',
                title: 'Advanced Analytics',
                description: 'Deep dive into model performance with risk analysis, transaction insights, and approval confidence.',
                tags: ['Risk Analysis', 'Performance Metrics', 'Trends']
            },
            {
                icon: '🧭',
                title: 'Data Explorer',
                description: 'Explore and analyze raw transaction data with filtering, sorting, and visualization tools.',
                tags: ['Data Filtering', 'Visualization', 'Export']
            },
            {
                icon: '📄',
                title: 'Reports Generator',
                description: 'Generate comprehensive fraud analysis reports in PDF/CSV formats with customizable templates.',
                tags: ['PDF Export', 'Custom Reports', 'Scheduling']
            }
        ],
        detection: [
            {
                icon: '🛡️',
                title: 'Fraud Detection Engine',
                description: 'Analyze detected fraud patterns with network graphs, storylines, and anomaly detection algorithms.',
                tags: ['Pattern Recognition', 'Network Analysis', 'Anomalies']
            },
            {
                icon: '🔬',
                title: 'Fraud Patterns Analysis',
                description: 'Visual timeline of historical fraud patterns, trends, and emerging threat indicators.',
                tags: ['Timeline View', 'Pattern History', 'Threat Intel']
            },
            {
                icon: '🔗',
                title: 'Network Graph Visualization',
                description: 'Interactive graph showing connections between suspicious transactions and entities.',
                tags: ['Entity Links', 'Interactive Graph', 'Clusters']
            },
            {
                icon: '📖',
                title: 'Fraud Storyline',
                description: 'Narrative view of fraud events showing the complete picture of suspicious activities.',
                tags: ['Event Timeline', 'Narrative View', 'Context']
            }
        ],
        monitoring: [
            {
                icon: '📡',
                title: 'Real-Time Monitoring',
                description: 'Live fraud detection alerts with radar visualization and immediate action capabilities.',
                tags: ['Live Alerts', 'Radar View', 'Instant Actions']
            },
            {
                icon: '🎮',
                title: 'Transaction Simulator',
                description: 'Test fraud scenarios including velocity attacks, geographic anomalies, and multi-vector attacks.',
                tags: ['Scenario Testing', 'Attack Simulation', 'Validation']
            },
            {
                icon: '🔔',
                title: 'Alert System',
                description: 'Configurable alerts with sound notifications, risk-based prioritization, and action workflows.',
                tags: ['Sound Alerts', 'Priority Queue', 'Workflows']
            },
            {
                icon: '📝',
                title: 'Activity Log',
                description: 'Complete audit trail of all detection activities, user actions, and system events.',
                tags: ['Audit Trail', 'User Actions', 'Compliance']
            }
        ],
        ai: [
            {
                icon: '🧠',
                title: 'Ensemble ML Models',
                description: 'Multiple machine learning algorithms working together for higher accuracy and reduced false positives.',
                tags: ['Random Forest', 'XGBoost', 'Neural Networks']
            },
            {
                icon: '⚡',
                title: 'Risk Score Calculator',
                description: 'Real-time fraud probability scoring with explainable AI insights and confidence levels.',
                tags: ['Real-time Scoring', 'Explainable AI', 'Confidence']
            },
            {
                icon: '📊',
                title: 'Feature Importance',
                description: 'Understand what drives fraud detection with detailed feature analysis and contribution metrics.',
                tags: ['Feature Analysis', 'Contribution', 'Insights']
            },
            {
                icon: '⚖️',
                title: 'Fairness Checker',
                description: 'Bias detection in model predictions ensuring ethical and compliant fraud detection.',
                tags: ['Bias Detection', 'Ethical AI', 'Compliance']
            }
        ]
    };

    if (!isOpen) return null;

    return (
        <div className="usecases-overlay" onClick={onClose}>
            <div className="usecases-modal" onClick={(e) => e.stopPropagation()}>
                <button className="usecases-close" onClick={onClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                <div className="usecases-header">
                    <div className="usecases-badge" style={{ background: 'linear-gradient(135deg, rgba(46,213,115,0.15) 0%, rgba(0,210,211,0.1) 100%)', borderColor: 'rgba(46,213,115,0.3)', color: '#2ed573' }}>
                        <span className="badge-pulse" style={{ background: 'linear-gradient(135deg, #2ed573, #00d2d3)' }}></span>
                        Platform Overview
                    </div>
                    <h2>Features & Services</h2>
                    <p>Explore the complete suite of fraud detection tools and AI-powered capabilities</p>
                </div>

                <div className="usecases-categories">
                    {Object.entries(categories).map(([key, cat]) => (
                        <button
                            key={key}
                            className={`category-tab ${activeCategory === key ? 'active' : ''}`}
                            onClick={() => setActiveCategory(key)}
                            style={{ '--cat-color': cat.color }}
                        >
                            <span className="cat-icon">{cat.icon}</span>
                            <span className="cat-title">{cat.title}</span>
                        </button>
                    ))}
                </div>

                <div className="usecases-content">
                    <div className="features-grid">
                        {features[activeCategory].map((feature, index) => (
                            <div
                                key={feature.title}
                                className="feature-card"
                                style={{
                                    '--card-delay': `${index * 0.1}s`,
                                    '--accent-color': categories[activeCategory].color
                                }}
                            >
                                <div className="feature-icon-wrap">
                                    <span className="feature-icon">{feature.icon}</span>
                                    <div className="icon-glow"></div>
                                </div>
                                <div className="feature-info">
                                    <h3>{feature.title}</h3>
                                    <p>{feature.description}</p>
                                    <div className="feature-tags">
                                        {feature.tags.map(tag => (
                                            <span key={tag} className="feature-tag">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="usecases-footer">
                    <div className="stats-row">
                        <div className="stat-item">
                            <span className="stat-value">11+</span>
                            <span className="stat-label">Core Features</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">4</span>
                            <span className="stat-label">AI Models</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">24/7</span>
                            <span className="stat-label">Monitoring</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">99.9%</span>
                            <span className="stat-label">Accuracy</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const LoginPage = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        full_name: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [showUseCases, setShowUseCases] = useState(false);
    const [showExplore, setShowExplore] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const pointerRef = useRef({ x: 0.5, y: 0.5 });
    const centerRef = useRef({ x: 0, y: 0 });
    const particlesRef = useRef([]);

    // Force remove dark-theme on login page for glassmorphism
    useEffect(() => {
        const wasDark = document.body.classList.contains('dark-theme');
        document.body.classList.remove('dark-theme');

        return () => {
            // Restore dark theme on unmount if it was active
            if (wasDark && localStorage.getItem('theme') === 'dark') {
                document.body.classList.add('dark-theme');
            }
        };
    }, []);

    // Track mouse movement
    const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;

        // Normalize to -1 to 1 range
        const x = (clientX / innerWidth - 0.5) * 2;
        const y = (clientY / innerHeight - 0.5) * 2;

        setMousePosition({ x, y });
        pointerRef.current = {
            x: clientX / innerWidth,
            y: clientY / innerHeight
        };
    };

    const handleMouseLeave = () => {
        pointerRef.current = { x: 0.5, y: 0.5 };
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const payload = isLogin
                ? { username: formData.username, password: formData.password }
                : formData;

            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (data.success) {
                // Store token and user info
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));
                onLoginSuccess(data.user);
            } else {
                setError(data.error || 'Authentication failed');
            }
        } catch (err) {
            setError('Connection error. Please ensure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    // Handle Google Sign-In success
    const handleGoogleSuccess = async (credentialResponse) => {
        setGoogleLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    credential: credentialResponse.credential,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Store token and user info
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));
                onLoginSuccess(data.user);
            } else {
                setError(data.error || 'Google authentication failed');
            }
        } catch (err) {
            setError('Connection error. Please ensure the backend is running.');
        } finally {
            setGoogleLoading(false);
        }
    };

    // Handle Google Sign-In error
    const handleGoogleError = () => {
        setError('Google Sign-In was unsuccessful. Please try again.');
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        let width = 0;
        let height = 0;

        const createParticles = () => {
            const particleCount = width < 768 ? 140 : 240;
            particlesRef.current = Array.from({ length: particleCount }).map((_, idx) => ({
                angle: Math.random() * Math.PI * 2,
                baseRadius: Math.random() * (Math.min(width, height) * 0.45) + 40,
                speed: 0.0008 + Math.random() * 0.0015,
                size: 0.8 + Math.random() * 1.4,
                seed: idx + Math.random() * 10,
                twinkleSpeed: 0.002 + Math.random() * 0.003,
                twinkleOffset: Math.random() * Math.PI * 2
            }));
        };

        const resize = () => {
            const { innerWidth, innerHeight } = window;
            width = innerWidth;
            height = innerHeight;
            canvas.width = innerWidth * dpr;
            canvas.height = innerHeight * dpr;
            canvas.style.width = `${innerWidth}px`;
            canvas.style.height = `${innerHeight}px`;
            ctx.scale(dpr, dpr);
            centerRef.current = { x: width / 2, y: height / 2 };
            createParticles();
        };

        const render = () => {
            animationRef.current = requestAnimationFrame(render);
            ctx.clearRect(0, 0, width, height);

            const targetX = pointerRef.current.x * width;
            const targetY = pointerRef.current.y * height;
            centerRef.current.x += (targetX - centerRef.current.x) * 0.035;
            centerRef.current.y += (targetY - centerRef.current.y) * 0.035;

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            particlesRef.current.forEach((particle) => {
                particle.angle += particle.speed;
                const wobble = Math.sin(particle.seed + performance.now() * 0.0004) * 8;
                const radius = particle.baseRadius + wobble;
                const x = centerRef.current.x + Math.cos(particle.angle) * radius;
                const y = centerRef.current.y + Math.sin(particle.angle) * radius;

                const twinkleFactor = 0.5 + Math.sin(performance.now() * particle.twinkleSpeed + particle.twinkleOffset) * 0.5;
                const alpha = 0.55 + Math.sin(particle.angle * 2) * 0.2;
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, particle.size * 4.8);
                gradient.addColorStop(0, `rgba(255, 255, 255, ${0.6 + 0.35 * twinkleFactor})`);
                gradient.addColorStop(0.4, `rgba(194, 213, 255, ${alpha})`);
                gradient.addColorStop(1, 'rgba(180, 209, 255, 0)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, particle.size * 6, 0, Math.PI * 2);
                ctx.fill();

                // bright core
                const shine = ctx.createRadialGradient(x, y, 0, x, y, particle.size * 2.2);
                const coreAlpha = 0.45 + twinkleFactor * 0.5;
                shine.addColorStop(0, `rgba(255, 255, 255, ${coreAlpha})`);
                shine.addColorStop(1, 'rgba(210, 235, 255, 0)');
                ctx.fillStyle = shine;
                ctx.beginPath();
                ctx.arc(x, y, particle.size * 3, 0, Math.PI * 2);
                ctx.fill();

                // sparkle streak
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 + 0.25 * twinkleFactor})`;
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                const streak = particle.size * (1.2 + twinkleFactor);
                ctx.moveTo(x - streak, y);
                ctx.lineTo(x + streak, y);
                ctx.moveTo(x, y - streak);
                ctx.lineTo(x, y + streak);
                ctx.stroke();
            });
            ctx.restore();
        };

        resize();
        render();
        window.addEventListener('resize', resize);

        return () => {
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <div className="login-container" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
            <div className="login-background">
                {/* Canvas particle animation disabled for performance */}
                {/* <canvas ref={canvasRef} className="particle-canvas" /> */}
                <div
                    className="background-gradient"
                    style={{
                        transform: `translate(${mousePosition.x * 18}px, ${mousePosition.y * 18}px)`
                    }}
                />
                <div className="background-noise" />
            </div>

            <div className="login-content">
                <div className="login-hero">
                    <div className="hero-badge">
                        <span className="badge-dot" />
                        Secure AI Console
                    </div>
                    <h1>Experience liftoff with our next‑gen fraud guardian.</h1>
                    <p>
                        Command a real-time fraud cockpit with adaptive scoring, particle-speed telemetry, and
                        multi-channel insights—all before the risk wave hits your stack.
                    </p>
                    <div className="hero-ctas">
                        <button className="hero-pill primary" onClick={() => setShowExplore(true)}>Explore platform</button>
                        <button className="hero-pill ghost" onClick={() => setShowUseCases(true)}>See use cases</button>
                    </div>
                </div>

                {/* Auth Cards Container - Login and Sign Up side by side */}
                <div className="auth-cards-wrapper">
                    {/* LOGIN Card */}
                    <div
                        className={`login-card ${isExpanded && isLogin ? 'expanded' : 'collapsed'}`}
                        onMouseEnter={() => {
                            setIsExpanded(true);
                            setIsLogin(true);
                        }}
                        onMouseLeave={() => {
                            if (!formData.username && !formData.password) {
                                setIsExpanded(false);
                            }
                        }}
                    >
                        {/* Compact LOGIN button */}
                        <div className={`login-compact-btn ${isExpanded && isLogin ? 'hidden' : ''}`}>
                            <span className="heart-icon left">♡</span>
                            <span className="login-text">LOGIN</span>
                            <span className="heart-icon right">♥</span>
                        </div>

                        {/* Expanded Login form */}
                        <div className={`login-expanded-content ${isExpanded && isLogin ? 'visible' : ''}`}>
                            <div className="login-header">
                                <div className="expanded-title">
                                    <span className="heart-icon left">♡</span>
                                    <span className="login-text">LOGIN</span>
                                    <span className="heart-icon right">♥</span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="login-form">
                                {error && isLogin && (
                                    <div className="error-message">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                        {error}
                                    </div>
                                )}

                                <div className="form-group">
                                    <input
                                        type="text"
                                        id="login-username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="Username"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <input
                                        type="password"
                                        id="login-password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Password"
                                        required
                                    />
                                </div>

                                <button type="submit" className="submit-button" disabled={loading || googleLoading}>
                                    {loading && isLogin ? (
                                        <>
                                            <span className="spinner"></span>
                                            Signing in...
                                        </>
                                    ) : (
                                        'Sign in'
                                    )}
                                </button>
                            </form>

                            <div className="login-footer">
                                <button className="link-button forgot" onClick={() => { }}>
                                    Forgot Password
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SIGN UP Card */}
                    <div
                        className={`login-card signup-card ${isExpanded && !isLogin ? 'expanded' : 'collapsed'}`}
                        onMouseEnter={() => {
                            setIsExpanded(true);
                            setIsLogin(false);
                        }}
                        onMouseLeave={() => {
                            if (!formData.username && !formData.password && !formData.email && !formData.full_name) {
                                setIsExpanded(false);
                            }
                        }}
                    >
                        {/* Compact SIGN UP button */}
                        <div className={`login-compact-btn ${isExpanded && !isLogin ? 'hidden' : ''}`}>
                            <span className="heart-icon left">✦</span>
                            <span className="login-text">SIGN UP</span>
                            <span className="heart-icon right">✦</span>
                        </div>

                        {/* Expanded Sign Up form */}
                        <div className={`login-expanded-content ${isExpanded && !isLogin ? 'visible' : ''}`}>
                            <div className="login-header">
                                <div className="expanded-title">
                                    <span className="heart-icon left">✦</span>
                                    <span className="login-text">SIGN UP</span>
                                    <span className="heart-icon right">✦</span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="login-form">
                                {error && !isLogin && (
                                    <div className="error-message">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                        {error}
                                    </div>
                                )}

                                <div className="form-group">
                                    <input
                                        type="text"
                                        id="signup-fullname"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        placeholder="Full Name"
                                    />
                                </div>

                                <div className="form-group">
                                    <input
                                        type="text"
                                        id="signup-username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="Username"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <input
                                        type="email"
                                        id="signup-email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Email"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <input
                                        type="password"
                                        id="signup-password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Password"
                                        required
                                    />
                                </div>

                                <button type="submit" className="submit-button" disabled={loading || googleLoading}>
                                    {loading && !isLogin ? (
                                        <>
                                            <span className="spinner"></span>
                                            Creating account...
                                        </>
                                    ) : (
                                        'Create Account'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <UseCasesModal isOpen={showUseCases} onClose={() => setShowUseCases(false)} />
            <ExplorePlatformModal isOpen={showExplore} onClose={() => setShowExplore(false)} />
        </div>
    );
};
