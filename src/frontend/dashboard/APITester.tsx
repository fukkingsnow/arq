// @ts-nocheck
import React, { useState } from 'react';

interface ApiTestResult {
  status: number;
  data?: any;
  error?: string;
  responseTime: number;
}

const APITester: React.FC = () => {
  const [endpoint, setEndpoint] = useState('/health');
  const [method, setMethod] = useState('GET');
  const [body, setBody] = useState('');
  const [result, setResult] = useState<ApiTestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    const startTime = Date.now();
    try {
      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (body && method !== 'GET') {
        options.body = body;
      }
      const response = await fetch(`https://arq-ai.ru/api/v1/arq${endpoint}`, options);
      const data = await response.json();
      setResult({
        status: response.status,
        data,
        responseTime: Date.now() - startTime,
      });
    } catch (error: any) {
      setResult({
        status: 0,
        error: error.message,
        responseTime: Date.now() - startTime,
      });
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h2>API Tester</h2>
      <div style={styles.form}>
        <label>
          Method:
          <select value={method} onChange={(e) => setMethod(e.target.value)} style={styles.input}>
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>DELETE</option>
          </select>
        </label>
        <label>
          Endpoint:
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            style={styles.input}
            placeholder="/health"
          />
        </label>
        {method !== 'GET' && (
          <label>
            Body (JSON):
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{ ...styles.input, minHeight: '100px' }}
              placeholder='{"key": "value"}'
            />
          </label>
        )}
        <button onClick={handleTest} disabled={loading} style={styles.button}>
          {loading ? 'Testing...' : 'Test API'}
        </button>
      </div>
      {result && (
        <div style={styles.result}>
          <h3>Response (${result.responseTime}ms)</h3>
          <div style={styles.status}>
            Status: <span style={{ color: result.status === 200 ? '#10b981' : '#ef4444' }}>{result.status}</span>
          </div>
          {result.data && (
            <pre style={styles.pre}>{JSON.stringify(result.data, null, 2)}</pre>
          )}
          {result.error && (
            <div style={styles.error}>Error: {result.error}</div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '10px' },
  input: { padding: '8px', marginLeft: '10px', border: '1px solid #d1d5db', borderRadius: '4px' },
  button: { padding: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  result: { marginTop: '20px', padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '4px' },
  status: { fontWeight: 'bold', marginBottom: '10px' },
  pre: { backgroundColor: '#1f2937', color: '#10b981', padding: '10px', borderRadius: '4px', overflowX: 'auto' },
  error: { color: '#ef4444', padding: '10px', backgroundColor: '#fee2e2', borderRadius: '4px' },
};

export default APITester;
