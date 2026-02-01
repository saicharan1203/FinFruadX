import React, { useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import axios from 'axios';
import { FiFolderPlus, FiRefreshCcw, FiTrash2, FiTag, FiEdit2, FiZap } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const formatCurrency = (value) => currencyFormatter.format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString();
};

const QUICK_ADD_GRADIENTS = [
  'linear-gradient(135deg, #ff5f6d, #ffc371)',
  'linear-gradient(135deg, #f7971e, #ffd200)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)'
];

const defaultFormState = {
  transaction_id: '',
  customer_id: '',
  merchant_id: '',
  amount: '',
  risk_level: 'Investigating',
  status: 'Open',
  notes: '',
  tags: ''
};

const createPlaceholderId = (prefix) => `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
const ensureValue = (value, fallback) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'string' && value.trim() === '') return fallback;
  return value;
};

const sanitizeTags = (tags, fallback = []) => {
  let resolved = [];
  if (Array.isArray(tags)) {
    resolved = tags;
  } else if (typeof tags === 'string') {
    resolved = tags.split(',');
  }

  const cleaned = resolved
    .map(tag => (tag ?? '').toString().trim().toLowerCase())
    .filter(Boolean);

  const merged = [...cleaned, ...fallback.map(tag => tag.toLowerCase())];
  const unique = Array.from(new Set(merged));
  return unique;
};

const stringifyTags = (tags) => sanitizeTags(tags).join(', ');

const buildCasePayload = (source, { fallbackTags = [] } = {}) => ({
  transaction_id: ensureValue(source.transaction_id, createPlaceholderId('TXN')),
  customer_id: ensureValue(source.customer_id, createPlaceholderId('CUST')),
  merchant_id: ensureValue(source.merchant_id, createPlaceholderId('MCH')),
  amount: Number(source.amount) || 0,
  risk_level: ensureValue(source.risk_level, 'Investigating'),
  status: ensureValue(source.status, 'Open'),
  notes: (source.notes ?? '').toString()
    .trim(),
  tags: sanitizeTags(source.tags, fallbackTags)
});

const formatCaseForForm = (caseData) => ({
  transaction_id: ensureValue(caseData.transaction_id, createPlaceholderId('TXN')),
  customer_id: ensureValue(caseData.customer_id, createPlaceholderId('CUST')),
  merchant_id: ensureValue(caseData.merchant_id, createPlaceholderId('MCH')),
  amount: (caseData.amount ?? '').toString(),
  risk_level: ensureValue(caseData.risk_level, 'Investigating'),
  status: ensureValue(caseData.status, 'Open'),
  notes: caseData.notes || 'Auto-generated sample case. Please review details.',
  tags: stringifyTags(caseData.tags?.length ? caseData.tags : ['sample'])
});

export const CaseBuilder = ({ predictions }) => {
  const { isDarkMode } = useTheme();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [form, setForm] = useState(defaultFormState);
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [error, setError] = useState(null);
  const [samplePreview, setSamplePreview] = useState(null);
  const [pendingSync, setPendingSync] = useState(false);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/cases');
      setCases(data?.cases || []);
      setPendingSync(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load cases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const quickAddOptions = useMemo(() => {
    if (!predictions) return [];
    const watchlistHits = predictions.watchlist_hits || [];
    const candidates = watchlistHits.length > 0 ? watchlistHits : predictions.results || [];
    return candidates
      .slice(0, 5)
      .map((item, index) => ({
        id: item.transaction_id || item.id || `txn-${index}`,
        transaction_id: item.transaction_id || item.id || `txn-${index}`,
        customer_id: item.customer_id || 'unknown',
        merchant_id: item.merchant_id || 'unknown',
        amount: item.amount || 0,
        risk_level: item.risk_level || 'Medium',
        probability: item.ensemble_fraud_probability || item.probability || 0
      }));
  }, [predictions]);

  const persistCase = async (payload, { highlight = true } = {}) => {
    const { data } = await axios.post('/api/cases', payload);
    if (!data?.success || !data?.case) {
      throw new Error(data?.error || 'Unable to save case');
    }
    const savedCase = data.case;
    setCases(prev => {
      const next = [savedCase, ...prev];
      return next.slice(0, 100);
    });
    if (highlight) {
      setActiveCaseId(savedCase?.id || null);
    }
    setPendingSync(true);
    return savedCase;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = buildCasePayload(form);

    try {
      await persistCase(payload);
      setForm(defaultFormState);
      setSamplePreview(null);
      if (pendingSync) {
        await fetchCases();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save case');
    } finally {
      setSaving(false);
    }
  };

  const updateCase = async (caseId, updates) => {
    try {
      const { data } = await axios.put(`/api/cases/${caseId}`, updates);
      setCases(prev => prev.map(item => (item.id === caseId ? data.case : item)));
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to update case');
    }
  };

  const deleteCase = async (caseId) => {
    try {
      await axios.delete(`/api/cases/${caseId}`);
      setCases(prev => prev.filter(item => item.id !== caseId));
      if (activeCaseId === caseId) {
        setActiveCaseId(null);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to delete case');
    }
  };

  const handleQuickFill = (option) => {
    setForm(prev => ({
      ...prev,
      transaction_id: option.transaction_id,
      customer_id: option.customer_id,
      merchant_id: option.merchant_id,
      amount: option.amount,
      risk_level: option.risk_level
    }));
  };

  const generateSampleCase = async () => {
    setSampleLoading(true);
    setError(null);
    setSamplePreview(null);

    try {
      const { data } = await axios.post('/api/cases/sample', {
        risk_level: form.risk_level
      });

      if (!data?.success || !data?.case) {
        throw new Error(data?.error || 'Unable to generate sample case');
      }

      const sample = data.case;

      const fallbackTags = ['sample', sample.risk_level?.toLowerCase(), sample.merchant_category?.toLowerCase()].filter(Boolean);
      const normalizedPayload = buildCasePayload(sample, { fallbackTags });
      const populatedForm = formatCaseForForm({ ...sample, ...normalizedPayload });
      setForm(populatedForm);

      setSamplePreview({
        probability: sample.probability ?? 0,
        risk_level: sample.risk_level || 'Investigating',
        merchant_category: sample.merchant_category || 'unknown',
        confidence: sample.confidence_score ?? sample.confidence ?? 0.85
      });

      await persistCase(normalizedPayload);
      if (pendingSync) {
        await fetchCases();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Unable to generate sample case');
    } finally {
      setSampleLoading(false);
    }
  };

  const previewRiskLevel = samplePreview?.risk_level?.toLowerCase() || null;
  const handleScrollToForm = () => {
    const formElement = document.querySelector('.case-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Box className="case-builder">
      <Box className="section-header case-header">
        <Box className="case-icon-pill">
          <span className="case-icon-glow"></span>
          <svg width="28" height="28" viewBox="0 0 48 48" aria-hidden="true">
            <defs>
              <linearGradient id="caseIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f4d03f" />
                <stop offset="100%" stopColor="#f16b6f" />
              </linearGradient>
            </defs>
            <path d="M8 15a4 4 0 0 1 4-4h8l3 4h13a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V15z" fill="url(#caseIconGradient)" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
            <path d="M18 27l4 4 8-9" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Box>
        <div>
          <h2>🗂️ Case Builder</h2>
          <p>Pin suspicious transactions, add analyst notes, and track resolution.</p>
        </div>
        <button className="btn btn-sm btn-secondary" onClick={fetchCases} disabled={loading}>
          <FiRefreshCcw /> {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </Box>

      {error && <div className="case-error">{error}</div>}

      <Box className="case-layout">
        <form className="case-form" onSubmit={handleSubmit}>
          <h3>Create / Update Case</h3>

          <div className="sample-case-card">
            <div className="sample-card-content">
              <div>
                <span className="sample-eyebrow">AI Assist</span>
                <h4>Generate sample case</h4>
                <p>Instantly prefill this form with a realistic, high-risk scenario produced by the trained ensemble.</p>
                <div className="sample-meta">
                  <span className="sample-meta-chip">
                    Preferred risk: <strong>{form.risk_level}</strong>
                  </span>
                  {samplePreview && (
                    <span className="sample-meta-chip accent">
                      Last probability: <strong>{(samplePreview.probability * 100).toFixed(1)}%</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="sample-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-outline glow generate-sample-btn"
                  onClick={generateSampleCase}
                  disabled={sampleLoading}
                >
                  <FiZap /> {sampleLoading ? 'Generating sample...' : 'Generate Sample Case'}
                </button>
                <small>Uses the live model, so results evolve with every training run.</small>
              </div>
            </div>

            {samplePreview && (
              <div className="sample-preview-panel">
                <div className={`sample-preview-pill ${previewRiskLevel ? `risk-${previewRiskLevel}` : ''}`}>
                  <strong>{samplePreview.risk_level}</strong>
                  <span>{(samplePreview.probability * 100).toFixed(1)}% fraud likelihood</span>
                </div>
                <div className="sample-preview-details">
                  <div>
                    <p className="sample-detail-label">Merchant category</p>
                    <p className="sample-detail-value">{samplePreview.merchant_category}</p>
                  </div>
                  <div>
                    <p className="sample-detail-label">Confidence</p>
                    <p className="sample-detail-value">{(samplePreview.confidence ?? 0.85).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="sample-detail-label">Notes</p>
                    <p className="sample-detail-value">Prefilled with generated investigation context.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="case-field-grid">
            <div className="input-group accent">
              <label>Transaction ID:</label>
              <input
                type="text"
                value={form.transaction_id}
                onChange={(e) => setForm({ ...form, transaction_id: e.target.value })}
                required
              />
            </div>
            <div className="input-group accent">
              <label>Customer ID:</label>
              <input
                type="text"
                value={form.customer_id}
                onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
              />
            </div>
            <div className="input-group accent">
              <label>Merchant ID:</label>
              <input
                type="text"
                value={form.merchant_id}
                onChange={(e) => setForm({ ...form, merchant_id: e.target.value })}
              />
            </div>
            <div className="input-group accent">
              <label>Amount:</label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
          </div>

          <div className="case-field-grid compact">
            <div className="input-group accent-lite">
              <label>Risk Level:</label>
              <select
                value={form.risk_level}
                onChange={(e) => setForm({ ...form, risk_level: e.target.value })}
              >
                <option value="Investigating">Investigating</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="input-group accent-lite">
              <label>Status:</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Open">Open</option>
                <option value="Investigating">Investigating</option>
                <option value="Escalated">Escalated</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Tags (comma separated):</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="card testing, mule, chargeback"
            />
          </div>

          <div className="input-group">
            <label>Notes:</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Add investigation notes"
            />
          </div>

          {quickAddOptions.length > 0 && (
            <div className="quick-add">
              <div className="quick-add-heading">
                <h4>Quick Add from Latest Detections</h4>
                <p>Tap a card to autofill the form with a high-risk transaction.</p>
              </div>
              <div className="quick-add-grid">
                {quickAddOptions.map((option, index) => (
                  <button
                    type="button"
                    key={option.transaction_id}
                    className="quick-add-pill"
                    style={{ background: QUICK_ADD_GRADIENTS[index % QUICK_ADD_GRADIENTS.length] }}
                    onClick={() => handleQuickFill(option)}
                    aria-label={`Prefill case for ${option.customer_id} at ${option.merchant_id}`}
                  >
                    <div className="quick-pill-text">
                      <span className="quick-pill-id">{option.transaction_id}</span>
                      <span className="quick-pill-arrow">→</span>
                      <span className="quick-pill-risk">{(option.probability * 100).toFixed(1)}% risk</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button className="btn btn-primary btn-gradient save-case-btn" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Case'}
          </button>
        </form>

        <Box
          className="case-list"
          style={{
            background: isDarkMode
              ? 'rgba(31, 36, 48, 0.95)'
              : 'rgba(248, 250, 255, 0.98)',
            border: isDarkMode
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.08)'
          }}
        >
          <Box className="case-list-header">
            <h3 style={{ color: isDarkMode ? '#ffffff' : '#1f2430' }}>Active Cases ({cases.length})</h3>
            <button type="button" className="case-save-shortcut" onClick={handleScrollToForm}>
              Save Case
            </button>
          </Box>
          {cases.length === 0 ? (
            <div
              className="empty-state-activity"
              style={{
                background: isDarkMode
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(106, 17, 203, 0.04)'
              }}
            >
              <div className="empty-icon">🗃️</div>
              <h3 style={{ color: isDarkMode ? 'rgba(255,255,255,0.9)' : '#1f2430' }}>No cases logged</h3>
              <p style={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : '#7a869a' }}>Select a suspicious transaction to start an investigation.</p>
            </div>
          ) : (
            <Box className="case-grid">
              {cases.map(item => (
                <div
                  key={item.id}
                  className={`case-card ${activeCaseId === item.id ? 'active' : ''}`}
                  onClick={() => setActiveCaseId(item.id)}
                >
                  <div className="case-card-header">
                    <div className="case-pill-row">
                      <span className={`case-status status-${(item.status || 'open').toLowerCase()}`}>
                        {item.status || 'Open'}
                      </span>
                      <span className={`case-risk risk-${(item.risk_level || 'low').toLowerCase()}`}>
                        {item.risk_level || 'Low'}
                      </span>
                    </div>
                    <span className="case-transaction-label">
                      Txn: <strong>{item.transaction_id || 'N/A'}</strong>
                    </span>
                  </div>

                  <div className="case-meta-grid">
                    <div className="case-meta-item">
                      <span className="meta-label">Customer</span>
                      <span className="meta-value">{item.customer_id || '—'}</span>
                    </div>
                    <div className="case-meta-item">
                      <span className="meta-label">Merchant</span>
                      <span className="meta-value">{item.merchant_id || '—'}</span>
                    </div>
                    <div className="case-meta-item">
                      <span className="meta-label">Amount</span>
                      <span className="meta-value">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="case-meta-item">
                      <span className="meta-label">Created</span>
                      <span className="meta-value">{formatDate(item.created_at)}</span>
                    </div>
                    <div className="case-meta-item">
                      <span className="meta-label">Updated</span>
                      <span className="meta-value">{formatDate(item.updated_at)}</span>
                    </div>
                    <div className="case-meta-item">
                      <span className="meta-label">Status</span>
                      <span className="meta-value">{item.status || 'Open'}</span>
                    </div>
                  </div>

                  {Array.isArray(item.tags) && item.tags.length > 0 && (
                    <div className="case-tags">
                      <FiTag size={12} />
                      <div className="case-tag-chips">
                        {item.tags.map(tag => (
                          <span key={`${item.id}-${tag}`}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="case-description">{item.notes || 'Sample case auto-generated by monitoring pipeline.'}</p>

                  <div className="case-card-footer">
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateCase(item.id, { status: item.status === 'Resolved' ? 'Investigating' : 'Resolved' });
                      }}
                    >
                      <FiEdit2 /> {item.status === 'Resolved' ? 'Reopen' : 'Resolve'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCase(item.id);
                      }}
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};
