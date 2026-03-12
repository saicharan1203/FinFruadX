import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
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
                onLoginSuccess(data.user, data.access_token);
            } else {
                setError(data.error || 'Authentication failed');
            }
        } catch (err) {
            setError('Connection error. Please ensure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (tokenResponse) => {
        setLoading(true);
        setError('');

        try {
            // Exchange access token for user info
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            const userInfo = await userInfoRes.json();

            const response = await fetch(`${API_URL}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    access_token: tokenResponse.access_token,
                    user_info: userInfo,
                }),
            });

            const data = await response.json();

            if (data.success) {
                onLoginSuccess(data.user, data.access_token);
            } else {
                setError(data.error || 'Google authentication failed');
            }
        } catch (err) {
            setError('Connection error. Please ensure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => setError('Google login failed'),
    });

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
                    <button
                        type="button"
                        className="google-custom-btn"
                        onClick={() => googleLogin()}
                        disabled={loading}
                    >
                        {/* Google Logo SVG */}
                        <svg className="google-custom-btn-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span className="google-custom-btn-text">Sign in with Google</span>
                    </button>
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
