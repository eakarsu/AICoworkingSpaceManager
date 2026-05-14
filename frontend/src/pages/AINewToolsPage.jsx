import { useState } from 'react';
import api from '../api';

const tools = [
  {
    id: 'predictive-maintenance',
    name: 'Predictive Maintenance',
    icon: '🔧',
    desc: 'Predict equipment failures and recommend maintenance actions',
    fields: [
      { name: 'equipment', label: 'Equipment list (JSON or text)', type: 'textarea', required: true,
        placeholder: '[{"id":1,"name":"HVAC-01","type":"hvac","age_years":4}]' },
      { name: 'history', label: 'Maintenance history (optional, JSON or text)', type: 'textarea',
        placeholder: '[{"equipment_id":1,"date":"2024-01-15","action":"filter replaced"}]' },
    ],
  },
  {
    id: 'cleaning-schedule-optimizer',
    name: 'Cleaning Schedule Optimizer',
    icon: '🧹',
    desc: 'Optimize cleaning frequency, time windows, and staff assignment',
    fields: [
      { name: 'areas', label: 'Areas (JSON or text)', type: 'textarea', required: true,
        placeholder: '[{"name":"Lobby","sqft":1200,"high_touch":true},{"name":"Restroom A","sqft":150,"high_touch":true}]' },
      { name: 'occupancy_pattern', label: 'Occupancy pattern (optional)', type: 'textarea',
        placeholder: 'Mon-Fri busy 9am-6pm; weekends light' },
      { name: 'staff_count', label: 'Staff count (optional)', type: 'number' },
    ],
  },
  {
    id: 'parking-utilization',
    name: 'Parking Utilization Forecast',
    icon: '🅿️',
    desc: 'Forecast parking demand and identify overflow risks',
    fields: [
      { name: 'spaces', label: 'Spaces (JSON or text)', type: 'textarea', required: true,
        placeholder: '[{"id":"P1","level":1,"reserved":false}]' },
      { name: 'demand_history', label: 'Demand history (optional)', type: 'textarea',
        placeholder: '[{"date":"2025-04-01","occupied":42}]' },
      { name: 'peak_hours', label: 'Peak hours (optional)', type: 'text',
        placeholder: 'Mon-Fri 8am-10am, 4pm-6pm' },
    ],
  },
  {
    id: 'storage-allocation',
    name: 'Storage Allocation Optimizer',
    icon: '📦',
    desc: 'Recommend storage unit assignments and waitlist handling',
    fields: [
      { name: 'units', label: 'Storage units (JSON or text)', type: 'textarea', required: true,
        placeholder: '[{"id":"S1","size":"medium","assigned_to":null}]' },
      { name: 'requests', label: 'Member requests (optional)', type: 'textarea',
        placeholder: '[{"member_id":12,"size":"medium","priority":"high"}]' },
    ],
  },
  {
    id: 'phone-booth-optimization',
    name: 'Phone Booth Optimization',
    icon: '📞',
    desc: 'Optimize phone-booth booking patterns and capacity',
    fields: [
      { name: 'booths', label: 'Booths (JSON or text)', type: 'textarea', required: true,
        placeholder: '[{"id":"B1","capacity":1,"location":"floor 2"}]' },
      { name: 'bookings', label: 'Bookings (optional)', type: 'textarea',
        placeholder: '[{"booth_id":"B1","start":"2025-05-01T10:00","duration_min":30}]' },
    ],
  },
];

export default function AINewToolsPage() {
  const [activeId, setActiveId] = useState(tools[0].id);
  const [form, setForm] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tool = tools.find((t) => t.id === activeId);

  const switchTool = (id) => {
    setActiveId(id);
    setForm({});
    setResult(null);
    setError(null);
  };

  const submit = async () => {
    setError(null);
    setResult(null);
    const missing = tool.fields.find(
      (f) => f.required && (!form[f.name] || String(form[f.name]).trim() === '')
    );
    if (missing) {
      setError(`${missing.label} is required`);
      return;
    }
    setLoading(true);
    try {
      const payload = {};
      for (const f of tool.fields) {
        const v = form[f.name];
        if (v === undefined || v === '' || v === null) continue;
        if (f.type === 'textarea') {
          // Try JSON parse, fall back to string
          try {
            payload[f.name] = JSON.parse(v);
          } catch {
            payload[f.name] = v;
          }
        } else if (f.type === 'number') {
          payload[f.name] = Number(v);
        } else {
          payload[f.name] = v;
        }
      }
      const { data } = await api.post(`/ai/${tool.id}`, payload);
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>🆕 AI New Tools</h1>
          <p className="page-subtitle">Predictive maintenance and cleaning schedule optimization</p>
        </div>
      </div>

      <div
        className="ai-tools-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => switchTool(t.id)}
            className={`ai-tool-card ${activeId === t.id ? 'active' : ''}`}
            style={{
              padding: 14,
              borderRadius: 8,
              textAlign: 'left',
              border: activeId === t.id ? '2px solid #6366f1' : '2px solid #e5e7eb',
              background: activeId === t.id ? '#eef2ff' : '#fff',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>{t.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{t.desc}</div>
          </button>
        ))}
      </div>

      <div
        className="ai-control-panel"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}
      >
        <div
          style={{
            background: '#fff',
            padding: 20,
            borderRadius: 8,
            border: '1px solid #e5e7eb',
          }}
        >
          <h2 style={{ marginBottom: 16 }}>
            {tool.icon} {tool.name}
          </h2>
          {tool.fields.map((f) => (
            <div key={f.name} className="form-group" style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                {f.label}
                {f.required && <span style={{ color: 'red' }}> *</span>}
              </label>
              {f.type === 'textarea' ? (
                <textarea
                  rows={5}
                  placeholder={f.placeholder || ''}
                  value={form[f.name] || ''}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #d1d5db',
                    borderRadius: 4,
                    fontFamily: 'inherit',
                  }}
                />
              ) : (
                <input
                  type={f.type || 'text'}
                  placeholder={f.placeholder || ''}
                  value={form[f.name] || ''}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #d1d5db',
                    borderRadius: 4,
                  }}
                />
              )}
            </div>
          ))}
          <button
            className="btn btn-primary btn-lg"
            onClick={submit}
            disabled={loading}
            style={{
              marginTop: 8,
              padding: '10px 20px',
              borderRadius: 6,
              background: '#6366f1',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Running...' : 'Run AI Tool'}
          </button>
          {error && (
            <div
              style={{
                marginTop: 12,
                padding: 10,
                background: '#fef2f2',
                color: '#991b1b',
                borderRadius: 4,
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div
          style={{
            background: '#fff',
            padding: 20,
            borderRadius: 8,
            border: '1px solid #e5e7eb',
          }}
        >
          <h2 style={{ marginBottom: 16 }}>Result</h2>
          {loading && <div style={{ color: '#6b7280' }}>Running AI analysis...</div>}
          {!loading && !result && (
            <div style={{ color: '#9ca3af', fontSize: 13 }}>
              No result yet. Run a tool to see output.
            </div>
          )}
          {result && (
            <pre
              style={{
                background: '#f9fafb',
                padding: 12,
                borderRadius: 4,
                fontSize: 11,
                overflow: 'auto',
                maxHeight: 600,
                whiteSpace: 'pre-wrap',
              }}
            >
              {typeof result.analysis === 'string'
                ? result.analysis
                : JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
