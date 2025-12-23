import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../apiConfig';

const NetworkTest = () => {
  const [status, setStatus] = useState('Testing...');
  const [details, setDetails] = useState('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        const backendResponse = await axios.get(`${API_URL}/api/health`);
        setStatus('Backend Connection: ✅ Success');
        setDetails(`Backend response: ${JSON.stringify(backendResponse.data)}`);
      } catch (backendError) {
        setStatus('❌ Connection Failed');
        setDetails(`Backend error: ${backendError.message}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ padding: '20px', margin: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h3>Network Connection Test</h3>
      <p><strong>Status:</strong> {status}</p>
      <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
        {details}
      </pre>
    </div>
  );
};

export default NetworkTest;