import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import axios from 'axios';
import { FiUploadCloud, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import API_URL from '../apiConfig';
import '../styles/dashboard.css';

export const UploadSection = ({ onUploadSuccess, onGenerateSample }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [healthStatus, setHealthStatus] = useState('checking');

  useEffect(() => {
    const check = async () => {
      try {
        await axios.get(`${API_URL}/api/health`, { timeout: 5000 });
        setHealthStatus('online');
      } catch {
        setHealthStatus('offline');
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  const [dragActive, setDragActive] = useState(false);
  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragActive(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setMessage(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const validateAndUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      let response;
      try {
        response = await axios.post(`${API_URL}/api/validate-csv`, formData, {
          timeout: 30000
        });
      } catch (primaryErr) {
        throw primaryErr;
      }

      if (response.data.success) {
        setFileInfo(response.data);
        try { localStorage.setItem('ffx_fileInfo', JSON.stringify(response.data)); } catch { }
        setMessage({
          type: 'success',
          text: `✅ File validated! ${response.data.rows} rows, ${response.data.columns?.length || 0} columns`
        });
        onUploadSuccess(response.data);
      } else {
        setMessage({ type: 'error', text: `❌ ${response.data.error}` });
      }
    } catch (error) {
      console.error('Upload error:', error);
      let errorMessage = 'Upload failed';
      if (error.response) {
        errorMessage = error.response.data?.error || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Network error - please check your connection';
      } else {
        errorMessage = error.message;
      }
      setMessage({
        type: 'error',
        text: `❌ Upload failed: ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSample = async () => {
    setLoading(true);
    setMessage(null);
    try {
      let response;
      try {
        response = await axios.get(`${API_URL}/api/sample-data`, { timeout: 30000 });
      } catch (primaryErr) {
        throw primaryErr;
      }

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: '✅ Sample data generated successfully!'
        });
        const sampleData = {
          ...response.data,
          sample: response.data.sample || []
        };
        try { localStorage.setItem('ffx_fileInfo', JSON.stringify(sampleData)); } catch { }
        onGenerateSample(sampleData);
      } else {
        setMessage({ type: 'error', text: `❌ ${response.data.error || 'Failed to generate sample data'}` });
      }
    } catch (error) {
      console.error('Sample generation error:', error);
      setMessage({ type: 'error', text: `❌ Failed to generate sample data: ${error.response?.data?.error || error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = async () => {
    try {
      setLoading(true);
      let resp;
      try {
        resp = await axios.get(`${API_URL}/api/sample-data`, { timeout: 30000 });
      } catch (primaryErr) {
        throw primaryErr;
      }

      if (resp.data && resp.data.success) {
        const filepath = resp.data.filepath || 'uploads/sample_data.csv';
        const filename = filepath.split(/[/\\]/).pop();
        const a = document.createElement('a');
        const downloadUrl = `${API_URL}/api/download-results/${filename}`;
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setMessage({ type: 'success', text: '✅ Sample CSV downloaded' });
      } else {
        setMessage({ type: 'error', text: `❌ ${resp.data?.error || 'Failed to generate sample'}` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: `❌ Download failed: ${err.response?.data?.error || err.message}` });
    } finally {
      setLoading(false);
    }
  };
  const resumeLast = () => {
    try {
      const s = localStorage.getItem('ffx_fileInfo');
      if (!s) { setMessage({ type: 'error', text: 'No previous dataset found' }); return; }
      const data = JSON.parse(s);
      setFileInfo(data);
      onUploadSuccess(data);
      setMessage({ type: 'success', text: '✅ Resumed last dataset' });
    } catch (e) {
      setMessage({ type: 'error', text: `Failed to resume: ${e.message}` });
    }
  };
  return (
    <Box className="upload-section" style={{ position: 'relative' }}>
      <Box className="health-status-badge" style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 6, background: 'white', padding: '6px 12px', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 10 }}>
        <Box style={{ width: 8, height: 8, borderRadius: '50%', background: healthStatus === 'online' ? '#2ed573' : '#ff4757' }} />
        <span style={{ fontSize: '0.8em', fontWeight: 600, color: 'var(--dark)' }}>
          {healthStatus === 'online' ? 'Online' : 'Offline'}
        </span>
      </Box>
      <Box className="upload-card">
        <FiUploadCloud className="upload-icon" />
        <h2>📤 Upload Transaction Data</h2>
        <p style={{ marginBottom: '20px', color: 'var(--gray)' }}>
          Select a CSV file containing transaction data for fraud detection analysis
        </p>

        <Box style={{
          position: 'relative',
          margin: '20px 0',
          padding: '10px',
          border: '2px dashed rgba(106, 17, 203, 0.3)',
          borderRadius: '10px',
          backgroundColor: 'rgba(106, 17, 203, 0.05)'
        }}>
          <Box style={{
            position: 'absolute',
            top: '-12px',
            left: '20px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '0.8em',
            fontWeight: 'bold'
          }}>
            STEP 1
          </Box>
          <Box className={`file-input-wrapper ${dragActive ? 'drag-active' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              disabled={loading}
              className="file-input"
              id="file-input"
            />
            <label htmlFor="file-input" className="file-label file-label-highlight">
              {file ? `📄 ${file.name}` : '📁 Choose CSV File'}
            </label>
          </Box>
        </Box>

        <Box style={{
          position: 'relative',
          margin: '30px 0 20px 0',
          padding: '10px',
          border: '2px dashed rgba(37, 117, 252, 0.3)',
          borderRadius: '10px',
          backgroundColor: 'rgba(37, 117, 252, 0.05)'
        }}>
          <Box style={{
            position: 'absolute',
            top: '-12px',
            left: '20px',
            backgroundColor: 'var(--secondary)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '0.8em',
            fontWeight: 'bold'
          }}>
            STEP 2
          </Box>
          <Box className="button-group">
            <button
              onClick={validateAndUpload}
              disabled={loading || !file}
              className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
            >
              {loading ? '⏳ Validating...' : '✅ Validate & Upload'}
            </button>
            <button
              onClick={generateSample}
              disabled={loading}
              className={`btn btn-secondary ${loading ? 'btn-loading' : ''}`}
            >
              {loading ? '⏳ Generating...' : '🎲 Generate Sample Data'}
            </button>
            <button
              onClick={downloadSample}
              disabled={loading}
              className={`btn btn-secondary ${loading ? 'btn-loading' : ''}`}
            >
              ⬇️ Download Sample CSV
            </button>
            <button
              onClick={resumeLast}
              disabled={loading}
              className={`btn btn-secondary ${loading ? 'btn-loading' : ''}`}
            >
              ♻️ Resume Last Dataset
            </button>
          </Box>
        </Box>

        {message && (
          <Box className={`message message-${message.type}`}>
            {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
            {message.text}
          </Box>
        )}

        {fileInfo && (
          <Box className="file-info">
            <h3>📊 File Information</h3>
            <p><strong>Rows:</strong> {fileInfo.rows}</p>
            <p><strong>Columns:</strong> {fileInfo.columns?.join(', ') || 'N/A'}</p>
            {fileInfo.sample && fileInfo.sample.length > 0 && (
              <details>
                <summary>View Sample Data</summary>
                <pre>{JSON.stringify(fileInfo.sample, null, 2)}</pre>
              </details>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};