import React, { useState, useRef, useEffect } from 'react';
import { FiUser, FiMail, FiPhone, FiShield, FiBell, FiLock, FiCamera, FiSave, FiClock, FiMapPin } from 'react-icons/fi';

export const SettingsPage = () => {
  const [userProfile, setUserProfile] = useState({
    name: 'Koka Venkata Sai Charan',
    email: 'kokacharan2003@gmail.com',
    phone: '6301550164',
    role: 'Security Analyst',
    department: 'Fraud Detection',
    avatar: null,
    bio: 'AI-powered fraud detection specialist',
    location: 'India',
    timezone: 'Asia/Kolkata'
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsAlerts: true,
    soundAlerts: true,
    criticalOnly: false,
    language: 'en-US',
    alertThreshold: 70,
    refreshInterval: 30
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    autoLogout: true,
    ipWhitelist: '',
    loginHistory: true
  });

  const [apiSettings, setApiSettings] = useState({
    apiKey: '••••••••••••••••',
    webhookUrl: '',
    rateLimit: 1000,
    enableWebhooks: false
  });

  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedProfile = localStorage.getItem('userProfile');
    const savedPrefs = localStorage.getItem('userPreferences');
    const savedSecurity = localStorage.getItem('userSecurity');
    const savedApi = localStorage.getItem('apiSettings');

    if (savedProfile) setUserProfile(JSON.parse(savedProfile));
    if (savedPrefs) setPreferences(JSON.parse(savedPrefs));
    if (savedSecurity) setSecurity(JSON.parse(savedSecurity));
    if (savedApi) setApiSettings(JSON.parse(savedApi));
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        alert('File size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserProfile({ ...userProfile, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    localStorage.setItem('userSecurity', JSON.stringify(security));
    localStorage.setItem('apiSettings', JSON.stringify(apiSettings));
    
    // Dispatch custom event to notify Navigation component
    window.dispatchEvent(new Event('profileUpdated'));
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const roleOptions = [
    'Security Analyst',
    'Fraud Investigator',
    'Risk Manager',
    'Compliance Officer',
    'Data Scientist',
    'System Administrator',
    'Auditor',
    'Team Lead',
    'Senior Analyst',
    'Department Head'
  ];

  const departmentOptions = [
    'Fraud Detection',
    'Risk Management',
    'Compliance',
    'Security Operations',
    'Data Analytics',
    'Investigation',
    'IT Security'
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-with-logo">
          <svg className="page-logo" viewBox="0 0 80 80" width="50" height="50">
            <defs>
              <linearGradient id="settingsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#fd79a8', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#e056fd', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="35" fill="url(#settingsGradient)" opacity="0.2" />
            <circle cx="40" cy="40" r="20" fill="none" stroke="url(#settingsGradient)" strokeWidth="3" />
            <circle cx="40" cy="40" r="8" fill="url(#settingsGradient)" />
            <rect x="37" y="12" width="6" height="10" rx="2" fill="url(#settingsGradient)" />
            <rect x="37" y="58" width="6" height="10" rx="2" fill="url(#settingsGradient)" />
            <rect x="58" y="37" width="10" height="6" rx="2" fill="url(#settingsGradient)" />
            <rect x="12" y="37" width="10" height="6" rx="2" fill="url(#settingsGradient)" />
          </svg>
          <div>
            <h1>⚙️ Settings & Profile</h1>
            <p>Manage your account, preferences, and security settings</p>
          </div>
        </div>
      </div>

      {saved && (
        <div className="success-banner">
          <div className="success-icon">✅</div>
          <strong>Settings saved successfully!</strong>
          <p>Your changes have been applied.</p>
        </div>
      )}

      <div className="settings-layout">
        <div className="settings-tabs">
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FiUser /> Profile
          </button>
          <button 
            className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <FiBell /> Preferences
          </button>
          <button 
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <FiLock /> Security
          </button>
          <button 
            className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            <FiShield /> API & Integrations
          </button>
        </div>

        <div className="settings-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="settings-section">
              <h2>👤 Profile Information</h2>
              
              <div className="profile-photo-section">
                <div className="photo-preview">
                  {userProfile.avatar ? (
                    <img src={userProfile.avatar} alt="Profile" className="avatar-image" />
                  ) : (
                    <div className="avatar-placeholder">
                      <FiUser size={60} />
                    </div>
                  )}
                  <button 
                    className="change-photo-btn"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <FiCamera /> Change Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                  />
                </div>
                <div className="photo-info">
                  <h3>Profile Picture</h3>
                  <p>Upload a professional photo. Max size: 5MB</p>
                  <p className="text-muted">Supported formats: JPG, PNG, GIF</p>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label><FiUser /> Full Name</label>
                  <input
                    type="text"
                    value={userProfile.name}
                    onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-group">
                  <label><FiMail /> Email Address</label>
                  <input
                    type="email"
                    value={userProfile.email}
                    onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                    placeholder="your.email@example.com"
                  />
                </div>

                <div className="form-group">
                  <label><FiPhone /> Phone Number</label>
                  <input
                    type="tel"
                    value={userProfile.phone}
                    onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="form-group">
                  <label><FiShield /> Role</label>
                  <select
                    value={userProfile.role}
                    onChange={(e) => setUserProfile({...userProfile, role: e.target.value})}
                  >
                    {roleOptions.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label><FiShield /> Department</label>
                  <select
                    value={userProfile.department}
                    onChange={(e) => setUserProfile({...userProfile, department: e.target.value})}
                  >
                    {departmentOptions.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label><FiMapPin /> Location</label>
                  <input
                    type="text"
                    value={userProfile.location}
                    onChange={(e) => setUserProfile({...userProfile, location: e.target.value})}
                    placeholder="City, Country"
                  />
                </div>

                <div className="form-group">
                  <label><FiClock /> Timezone</label>
                  <select
                    value={userProfile.timezone}
                    onChange={(e) => setUserProfile({...userProfile, timezone: e.target.value})}
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">America/New York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label><FiUser /> Bio</label>
                  <textarea
                    value={userProfile.bio}
                    onChange={(e) => setUserProfile({...userProfile, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                    rows="4"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="settings-section">
              <h2>🔔 Notification Preferences</h2>
              
              <div className="preferences-group">
                <h3>Alert Settings</h3>
                <div className="toggle-list">
                  <div className="toggle-item">
                    <div className="toggle-info">
                      <strong>Email Notifications</strong>
                      <p>Receive fraud alerts via email</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications}
                        onChange={(e) => setPreferences({...preferences, emailNotifications: e.target.checked})}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <strong>SMS Alerts</strong>
                      <p>Get critical alerts via SMS</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={preferences.smsAlerts}
                        onChange={(e) => setPreferences({...preferences, smsAlerts: e.target.checked})}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <strong>Sound Alerts</strong>
                      <p>Play sound for fraud detection</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={preferences.soundAlerts}
                        onChange={(e) => setPreferences({...preferences, soundAlerts: e.target.checked})}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <strong>Critical Only</strong>
                      <p>Only notify for critical alerts</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={preferences.criticalOnly}
                        onChange={(e) => setPreferences({...preferences, criticalOnly: e.target.checked})}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                </div>
              </div>

              <div className="preferences-group">
                <h3>Display Settings</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Alert Threshold (%)</label>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={preferences.alertThreshold}
                      onChange={(e) => setPreferences({...preferences, alertThreshold: parseInt(e.target.value)})}
                    />
                    <span className="range-value">{preferences.alertThreshold}%</span>
                  </div>

                  <div className="form-group">
                    <label>Refresh Interval (seconds)</label>
                    <select
                      value={preferences.refreshInterval}
                      onChange={(e) => setPreferences({...preferences, refreshInterval: parseInt(e.target.value)})}
                    >
                      <option value="10">10 seconds</option>
                      <option value="30">30 seconds</option>
                      <option value="60">1 minute</option>
                      <option value="300">5 minutes</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Language</label>
                    <select
                      value={preferences.language}
                      onChange={(e) => setPreferences({...preferences, language: e.target.value})}
                    >
                      <option value="en-US">English (US)</option>
                      <option value="en-GB">English (UK)</option>
                      <option value="hi-IN">Hindi</option>
                      <option value="es-ES">Spanish</option>
                      <option value="fr-FR">French</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="settings-section">
              <h2>🔒 Security Settings</h2>
              
              <div className="security-group">
                <h3>Authentication</h3>
                <div className="toggle-list">
                  <div className="toggle-item">
                    <div className="toggle-info">
                      <strong>Two-Factor Authentication</strong>
                      <p>Add an extra layer of security to your account</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={security.twoFactorAuth}
                        onChange={(e) => setSecurity({...security, twoFactorAuth: e.target.checked})}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <strong>Auto Logout</strong>
                      <p>Automatically log out after inactivity</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={security.autoLogout}
                        onChange={(e) => setSecurity({...security, autoLogout: e.target.checked})}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <strong>Login History</strong>
                      <p>Track all login attempts and sessions</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={security.loginHistory}
                        onChange={(e) => setSecurity({...security, loginHistory: e.target.checked})}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="security-group">
                <h3>Session Management</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>IP Whitelist (comma-separated)</label>
                    <input
                      type="text"
                      value={security.ipWhitelist}
                      onChange={(e) => setSecurity({...security, ipWhitelist: e.target.value})}
                      placeholder="192.168.1.1, 10.0.0.1"
                    />
                  </div>
                </div>
              </div>

              <div className="security-actions">
                <button className="btn-danger">🔑 Change Password</button>
                <button className="btn-secondary">📱 Manage Devices</button>
                <button className="btn-secondary">📜 View Login History</button>
              </div>
            </div>
          )}

          {/* API & Integrations Tab */}
          {activeTab === 'api' && (
            <div className="settings-section">
              <h2>🔌 API & Integrations</h2>
              
              <div className="api-group">
                <h3>API Configuration</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>API Key</label>
                    <div className="input-with-action">
                      <input
                        type="text"
                        value={apiSettings.apiKey}
                        readOnly
                      />
                      <button className="btn-generate">🔄 Regenerate</button>
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Webhook URL</label>
                    <input
                      type="url"
                      value={apiSettings.webhookUrl}
                      onChange={(e) => setApiSettings({...apiSettings, webhookUrl: e.target.value})}
                      placeholder="https://your-domain.com/webhook"
                    />
                  </div>

                  <div className="form-group">
                    <label>Rate Limit (requests/hour)</label>
                    <input
                      type="number"
                      value={apiSettings.rateLimit}
                      onChange={(e) => setApiSettings({...apiSettings, rateLimit: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="toggle-list">
                  <div className="toggle-item">
                    <div className="toggle-info">
                      <strong>Enable Webhooks</strong>
                      <p>Receive real-time fraud alerts via webhooks</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={apiSettings.enableWebhooks}
                        onChange={(e) => setApiSettings({...apiSettings, enableWebhooks: e.target.checked})}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="api-documentation">
                <h3>📚 Quick Links</h3>
                <div className="link-cards">
                  <button type="button" className="link-card">
                    <div className="card-icon">📖</div>
                    <strong>API Documentation</strong>
                    <p>View complete API reference</p>
                  </button>
                  <button type="button" className="link-card">
                    <div className="card-icon">💻</div>
                    <strong>Code Examples</strong>
                    <p>Integration code snippets</p>
                  </button>
                  <button type="button" className="link-card">
                    <div className="card-icon">📊</div>
                    <strong>Usage Analytics</strong>
                    <p>Monitor API usage stats</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="settings-actions">
            <button className="btn-save" onClick={handleSave}>
              <FiSave /> Save All Changes
            </button>
            <button className="btn-reset" onClick={() => window.location.reload()}>
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
