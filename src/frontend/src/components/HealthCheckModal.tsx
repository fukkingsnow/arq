import React, { useState, useEffect } from 'react';

interface HealthStatus {
  status: string;
  timestamp: string;
  activeTasks: number;
  service: string;
  version?: string;
  uptime?: number;
  tasks?: any[];
}

interface HealthCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HealthCheckModal: React.FC<HealthCheckModalProps> = ({ isOpen, onClose }) => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://arq-ai.ru/api/v1/arq/health');
      const data = await res.json();
      setHealth(data);
      setLastCheck(new Date());
    } catch (e) {
      console.error('Health check failed:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0', fontSize: '24px' }}>🏥 System Health Check</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ✕
          </button>
        </div>

        {loading && <p style={{ textAlign: 'center' }}>Checking system health...</p>}

        {health && (
          <div>
            {/* Status Section */}
            <div style={{
              padding: '15px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #0284c7'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '20px', marginRight: '10px' }}>✅</span>
                <strong>Service Status: </strong>
                <span style={{ marginLeft: '10px', color: '#059669', fontWeight: 'bold' }}>
                  {health.status.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Last check: {lastCheck?.toLocaleTimeString()}
              </div>
            </div>

            {/* Key Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px',
              marginBottom: '20px'
            }}>
              <div style={{
                padding: '15px',
                backgroundColor: '#fef3c7',
                borderRadius: '8px',
                border: '1px solid #f59e0b'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Active Tasks</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#d97706' }}>
                  {health.activeTasks}
                </div>
              </div>

              <div style={{
                padding: '15px',
                backgroundColor: '#e0e7ff',
                borderRadius: '8px',
                border: '1px solid #4f46e5'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Version</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4f46e5' }}>
                  v{health.version || '1.0.1'}
                </div>
              </div>
            </div>

            {/* Service Info */}
            <div style={{
              padding: '15px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <strong style={{ display: 'block', marginBottom: '10px' }}>📋 Service Information</strong>
              <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#333' }}>
                <div><strong>Service:</strong> {health.service}</div>
                <div><strong>Timestamp:</strong> {new Date(health.timestamp).toLocaleString()}</div>
                {health.uptime && <div><strong>Uptime:</strong> {Math.round(health.uptime / 1000)}s</div>}
              </div>
            </div>

            {/* Active Tasks Details */}
            {health.activeTasks > 0 && (
              <div style={{
                padding: '15px',
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #ef4444'
              }}>
                <strong style={{ display: 'block', marginBottom: '10px' }}>🔄 Active Processes ({health.activeTasks})</strong>
                <div style={{
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: '#333',
                  backgroundColor: 'white',
                  padding: '10px',
                  borderRadius: '4px'
                }}>
                  {health.tasks && health.tasks.length > 0 ? (
                    health.tasks.map((task: any, idx: number) => (
                      <div key={idx} style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
                        <div><strong>Task {idx + 1}:</strong> {task.taskId || 'Unknown'}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Status: {task.status}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Branch: {task.branch}</div>
                      </div>
                    ))
                  ) : (
                    <div>
                      <div style={{ marginBottom: '5px' }}>• Process 1: Development Task Engine</div>
                      <div>• Process 2: Backend API Server</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginTop: '20px'
            }}>
              <button
                onClick={fetchHealth}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                🔄 Refresh
              </button>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#e5e7eb',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthCheckModal;
