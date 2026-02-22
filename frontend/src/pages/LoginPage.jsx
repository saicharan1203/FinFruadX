import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import API_URL from '../apiConfig';
import './LoginPage.css';

// Night Sky Background Component
const NightSkyBackground = () => (
    <div className="night-sky-bg">
        <div className="stars-layer"></div>
        <div className="mountains"></div>
    </div>
);

// Login/Signup Modal Component
const AuthModal = ({ isOpen, onClose, isLogin, setIsLogin, onLoginSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        full_name: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
                : { ...formData };

            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (data.success) {
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

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: credentialResponse.credential }),
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));
                onLoginSuccess(data.user);
            } else {
                setError(data.error || 'Google authentication failed');
            }
        } catch (err) {
            setError('Connection error. Please ensure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>

                <div className="auth-modal-header">
                    <span className="auth-icon">{isLogin ? '💜' : '💚'}</span>
                    <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <input
                                type="text"
                                name="full_name"
                                placeholder="Full Name"
                                value={formData.full_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}
                    {!isLogin && (
                        <div className="form-group">
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group password-group">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
                    <button
                        type="submit"
                        className={`btn-submit ${isLogin ? 'login-submit' : 'signup-submit'}`}
                        disabled={loading}
                    >
                        {loading ? (isLogin ? 'Signing in...' : 'Creating...') : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className="divider">
                    <span>or continue with</span>
                </div>

                <div className="google-login-wrapper">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google login failed')}
                        theme="filled_black"
                        size="large"
                        width="100%"
                    />
                </div>

                <div className="auth-switch">
                    {isLogin ? (
                        <p>Don't have an account? <button onClick={() => setIsLogin(false)}>Sign Up</button></p>
                    ) : (
                        <p>Already have an account? <button onClick={() => setIsLogin(true)}>Login</button></p>
                    )}
                </div>
            </div>
        </div>
    );
};

// Use Cases Modal Component
const UseCasesModal = ({ open, onClose }) => {
    const [activeCategory, setActiveCategory] = useState(0);

    const categories = [
        {
            name: 'Banking',
            icon: '🏦',
            useCases: [
                { title: 'Account Takeover Prevention', description: 'Detect unauthorized access attempts using behavioral analysis.', tags: ['Real-time', 'ML'] },
                { title: 'Wire Fraud Detection', description: 'Monitor wire transfers for suspicious patterns and anomalies.', tags: ['Critical', 'Automated'] },
                { title: 'Credit Card Fraud', description: 'Identify fraudulent transactions before they complete.', tags: ['Fast', 'Accurate'] },
                { title: 'Money Laundering Detection', description: 'Track complex transaction patterns across accounts.', tags: ['Compliance', 'AML'] },
            ],
        },
        {
            name: 'E-Commerce',
            icon: '🛒',
            useCases: [
                { title: 'Payment Fraud Prevention', description: 'Stop fraudulent purchases at checkout.', tags: ['Checkout', 'Secure'] },
                { title: 'Return Fraud Detection', description: 'Identify abuse of return policies.', tags: ['Returns', 'Policy'] },
                { title: 'Promo Code Abuse', description: 'Detect misuse of promotional offers.', tags: ['Marketing', 'Loss'] },
                { title: 'Bot Attack Prevention', description: 'Block automated purchasing bots.', tags: ['Security', 'Bots'] },
            ],
        },
        {
            name: 'Insurance',
            icon: '🛡️',
            useCases: [
                { title: 'Claims Fraud Detection', description: 'Analyze claims for fraudulent patterns.', tags: ['Claims', 'AI'] },
                { title: 'Identity Verification', description: 'Verify policyholder identities accurately.', tags: ['KYC', 'Verify'] },
                { title: 'Premium Fraud', description: 'Detect falsified information on applications.', tags: ['Underwriting', 'Risk'] },
                { title: 'Medical Billing Fraud', description: 'Identify overbilling and phantom claims.', tags: ['Healthcare', 'Billing'] },
            ],
        },
        {
            name: 'Fintech',
            icon: '💳',
            useCases: [
                { title: 'Crypto Fraud Detection', description: 'Monitor blockchain for suspicious activity.', tags: ['Crypto', 'Blockchain'] },
                { title: 'P2P Payment Fraud', description: 'Secure peer-to-peer transactions.', tags: ['P2P', 'Mobile'] },
                { title: 'Lending Fraud', description: 'Detect fraudulent loan applications.', tags: ['Lending', 'Credit'] },
                { title: 'Investment Scams', description: 'Protect users from fraudulent investments.', tags: ['Invest', 'Scam'] },
            ],
        },
    ];

    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content use-cases-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>
                <div className="modal-header">
                    <h2>Fraud Detection Use Cases</h2>
                    <p>Explore how FinFraudX protects across industries</p>
                </div>
                <div className="category-tabs">
                    {categories.map((cat, idx) => (
                        <button
                            key={cat.name}
                            className={`category-tab ${activeCategory === idx ? 'active' : ''}`}
                            onClick={() => setActiveCategory(idx)}
                        >
                            <span className="tab-icon">{cat.icon}</span>
                            <span>{cat.name}</span>
                        </button>
                    ))}
                </div>
                <div className="use-cases-grid">
                    {categories[activeCategory].useCases.map((useCase, idx) => (
                        <div key={idx} className="use-case-card">
                            <h4>{useCase.title}</h4>
                            <p>{useCase.description}</p>
                            <div className="use-case-tags">
                                {useCase.tags.map((tag) => (
                                    <span key={tag} className="tag">{tag}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="modal-footer">
                    <div className="stats-row">
                        {[
                            { value: '16+', label: 'Use Cases' },
                            { value: '4', label: 'Industries' },
                            { value: 'Real-time', label: 'Detection' },
                            { value: 'AI', label: 'Powered' },
                        ].map((stat) => (
                            <div key={stat.label} className="stat-item">
                                <span className="stat-value">{stat.value}</span>
                                <span className="stat-label">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main Login Page Component
export const LoginPage = ({ onLoginSuccess }) => {
    const [showUseCases, setShowUseCases] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isLogin, setIsLogin] = useState(true);

    useEffect(() => {
        document.body.classList.remove('dark-theme');
        return () => {
            if (localStorage.getItem('theme') === 'dark') {
                document.body.classList.add('dark-theme');
            }
        };
    }, []);

    const openLoginModal = () => {
        setIsLogin(true);
        setShowAuthModal(true);
    };

    const openSignupModal = () => {
        setIsLogin(false);
        setShowAuthModal(true);
    };

    return (
        <div className="login-page">
            <NightSkyBackground />

            <div className="login-container">
                <div className="login-grid">
                    {/* Left: Hero Section */}
                    <div className="hero-section">
                        <div className="hero-badge">
                            <span className="badge-icon">🛡️</span>
                            <span>Secure AI Console</span>
                        </div>

                        <h1 className="hero-title">
                            Experience liftoff with<br />
                            our next‑gen fraud guardian.
                        </h1>

                        <p className="hero-description">
                            Command a real-time fraud cockpit with adaptive scoring, particle-speed
                            telemetry, and multi-channel insights—all before the risk wave hits
                            your stack.
                        </p>

                        <div className="hero-buttons">
                            <button className="btn-primary" onClick={() => setShowUseCases(true)}>
                                <span className="btn-icon">🚀</span>
                                Explore Platform
                            </button>
                            <button className="btn-secondary" onClick={() => setShowUseCases(true)}>
                                See Use Cases
                            </button>
                        </div>
                    </div>

                    {/* Right: Auth Buttons */}
                    <div className="auth-buttons">
                        <button className="auth-btn login-btn" onClick={openLoginModal}>
                            <span className="btn-heart">♡</span>
                            <span>LOGIN</span>
                            <span className="btn-heart">♡</span>
                        </button>
                        <button className="auth-btn signup-btn" onClick={openSignupModal}>
                            <span className="btn-sparkle">✦</span>
                            <span>SIGN UP</span>
                            <span className="btn-sparkle">✦</span>
                        </button>
                    </div>
                </div>
            </div>

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                isLogin={isLogin}
                setIsLogin={setIsLogin}
                onLoginSuccess={onLoginSuccess}
            />
            <UseCasesModal open={showUseCases} onClose={() => setShowUseCases(false)} />
        </div>
    );
};

export default LoginPage;
