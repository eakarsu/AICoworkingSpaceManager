import { useEffect, useRef, useState } from 'react';
import api from '../api';
import FormattedAIReport from '../components/FormattedAIReport';
import FullFieldPresets from '../components/FullFieldPresets';

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
        placeholder: '[{"requester":"Member inquiry","size":"medium","priority":"high"}]' },
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

const newToolPresets = {
  'predictive-maintenance': [
    { label: 'HVAC review', values: { equipment: '[{"id":"HVAC-01","name":"Rooftop HVAC","type":"hvac","age_years":7,"runtime_hours":18400,"condition":"intermittent vibration"},{"id":"HVAC-02","name":"Lobby HVAC","type":"hvac","age_years":3,"runtime_hours":7900,"condition":"normal"}]', history: '[{"equipment_id":"HVAC-01","date":"2026-08-14","action":"replaced belt and filter","cost":460},{"equipment_id":"HVAC-02","date":"2026-09-02","action":"quarterly inspection","cost":180}]' } },
    { label: 'Office equipment', values: { equipment: '[{"id":"PRN-02","name":"Color printer","type":"office equipment","age_years":5,"monthly_pages":9200,"condition":"frequent paper jams"},{"id":"ESP-01","name":"Espresso machine","type":"kitchen","age_years":4,"daily_cycles":140,"condition":"slow heating"}]', history: '[{"equipment_id":"PRN-02","date":"2026-07-11","action":"roller cleaning","cost":95},{"equipment_id":"ESP-01","date":"2026-08-23","action":"descaled boiler","cost":210}]' } },
    { label: 'Safety systems', values: { equipment: '[{"id":"DOOR-01","name":"Main access controller","type":"security","age_years":6,"condition":"two recent offline alerts"},{"id":"LIFT-01","name":"Passenger elevator","type":"vertical transport","age_years":11,"condition":"inspection due in 21 days"}]', history: '[{"equipment_id":"DOOR-01","date":"2026-09-29","action":"firmware update","cost":0},{"equipment_id":"LIFT-01","date":"2026-04-15","action":"semiannual service","cost":1250}]' } },
  ],
  'cleaning-schedule-optimizer': [
    { label: 'Weekday peak', values: { areas: '[{"name":"Lobby","sqft":1200,"high_touch":true,"current_frequency":"daily"},{"name":"Floor 1 restrooms","sqft":320,"high_touch":true,"current_frequency":"twice daily"},{"name":"Open Area A","sqft":2800,"high_touch":false,"current_frequency":"daily"}]', occupancy_pattern: 'Monday-Friday: 85% occupancy from 9:00-17:00, lunch peak at 12:30; weekends average 20%.', staff_count: '3' } },
    { label: 'Event evening', values: { areas: '[{"name":"Summit Room","sqft":1800,"high_touch":true,"event_capacity":50},{"name":"Event kitchen","sqft":420,"high_touch":true,"event_capacity":20},{"name":"Floor 3 restrooms","sqft":280,"high_touch":true,"event_capacity":50}]', occupancy_pattern: 'Thursday event from 17:00-21:00 with 45 attendees; normal member use continues until 18:00.', staff_count: '2' } },
    { label: 'Weekend light use', values: { areas: '[{"name":"Open Area A","sqft":2800,"high_touch":false},{"name":"Kitchen Floor 1","sqft":600,"high_touch":true},{"name":"Phone Booths Floor 2","sqft":180,"high_touch":true}]', occupancy_pattern: 'Saturday 10:00-16:00 averages 18 members; Sunday closed except pre-booked teams.', staff_count: '1' } },
  ],
  'parking-utilization': [
    { label: 'Commuter peak', values: { spaces: '[{"id":"P1-01","level":-1,"type":"car","reserved":false},{"id":"P1-02","level":-1,"type":"car","reserved":true},{"id":"P1-03","level":-1,"type":"ev","reserved":false}]', demand_history: '[{"date":"2026-10-05","hour":9,"occupied":15,"capacity":16},{"date":"2026-10-06","hour":9,"occupied":16,"capacity":16},{"date":"2026-10-07","hour":9,"occupied":14,"capacity":16}]', peak_hours: 'Monday-Friday 08:00-10:30 and 16:00-18:00' } },
    { label: 'Event overflow', values: { spaces: '[{"id":"P1-01","level":-1,"type":"car","reserved":false},{"id":"P1-09","level":-1,"type":"accessible","reserved":true},{"id":"P2-01","level":-2,"type":"car","reserved":false}]', demand_history: '[{"date":"2026-09-18","event":"Startup Pitch Night","occupied":16,"capacity":16,"overflow":9},{"date":"2026-09-25","event":"Community Workshop","occupied":15,"capacity":16,"overflow":3}]', peak_hours: 'Event arrivals 17:00-18:30; departures 20:00-21:00' } },
    { label: 'EV allocation', values: { spaces: '[{"id":"EV-01","level":-1,"type":"ev","reserved":false,"charger_kw":7.2},{"id":"EV-02","level":-1,"type":"ev","reserved":false,"charger_kw":7.2},{"id":"P1-10","level":-1,"type":"car","reserved":false}]', demand_history: '[{"date":"2026-10-01","ev_requests":5,"ev_spaces":2,"avg_session_hours":6.5},{"date":"2026-10-02","ev_requests":4,"ev_spaces":2,"avg_session_hours":7}]', peak_hours: 'EV arrivals 08:00-09:30; charging sessions typically last all workday' } },
  ],
  'storage-allocation': [
    { label: 'Priority waitlist', values: { units: '[{"id":"S1","size":"small","floor":1,"assigned_to":null},{"id":"M2","size":"medium","floor":2,"assigned_to":null},{"id":"L1","size":"large","floor":1,"assigned_to":null}]', requests: '[{"requester":"Member inquiry","size":"medium","priority":"high","reason":"daily equipment storage"},{"requester":"Member inquiry","size":"small","priority":"normal","reason":"documents"}]' } },
    { label: 'Team allocation', values: { units: '[{"id":"M4","size":"medium","floor":2,"assigned_to":null},{"id":"M5","size":"medium","floor":2,"assigned_to":null},{"id":"L3","size":"large","floor":3,"assigned_to":null}]', requests: '[{"requester":"Team inquiry","member_count":5,"size":"large","priority":"high"},{"requester":"Team inquiry","member_count":2,"size":"medium","priority":"normal"}]' } },
    { label: 'Downsize review', values: { units: '[{"id":"L2","size":"large","floor":1,"assigned_to":null,"utilization_pct":20},{"id":"M6","size":"medium","floor":2,"assigned_to":null,"utilization_pct":95},{"id":"S8","size":"small","floor":3,"assigned_to":null,"utilization_pct":0}]', requests: '[{"requester":"Member inquiry","size":"small","priority":"normal","reason":"laptop accessories"},{"requester":"Member inquiry","size":"medium","priority":"high","reason":"product samples"}]' } },
  ],
  'phone-booth-optimization': [
    { label: 'Morning demand', values: { booths: '[{"id":"B1","capacity":1,"location":"Floor 1","acoustic_rating":"high"},{"id":"B2","capacity":1,"location":"Floor 2","acoustic_rating":"medium"}]', bookings: '[{"booth_id":"B1","start":"2026-10-05T09:00:00","duration_min":30,"status":"completed"},{"booth_id":"B1","start":"2026-10-05T09:30:00","duration_min":60,"status":"completed"},{"booth_id":"B2","start":"2026-10-05T10:00:00","duration_min":30,"status":"no_show"}]' } },
    { label: 'No-show review', values: { booths: '[{"id":"B3","capacity":1,"location":"Floor 2","acoustic_rating":"high"},{"id":"B4","capacity":1,"location":"Floor 3","acoustic_rating":"high"}]', bookings: '[{"booth_id":"B3","start":"2026-10-06T13:00:00","duration_min":60,"status":"no_show"},{"booth_id":"B3","start":"2026-10-06T14:00:00","duration_min":30,"status":"cancelled"},{"booth_id":"B4","start":"2026-10-06T14:00:00","duration_min":45,"status":"completed"}]' } },
    { label: 'Capacity plan', values: { booths: '[{"id":"B1","capacity":1,"location":"Floor 1","weekly_available_min":2400},{"id":"B2","capacity":1,"location":"Floor 2","weekly_available_min":2400},{"id":"B5","capacity":2,"location":"Floor 3","weekly_available_min":2400}]', bookings: '[{"booth_id":"B1","week":"2026-W40","booked_min":2110,"turnaways":14},{"booth_id":"B2","week":"2026-W40","booked_min":1680,"turnaways":4},{"booth_id":"B5","week":"2026-W40","booked_min":720,"turnaways":0}]' } },
  ],
};

export default function AINewToolsPage() {
  const [activeId, setActiveId] = useState(tools[0].id);
  const [form, setForm] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const request = useRef(null);

  const tool = tools.find((t) => t.id === activeId);
  const presets = newToolPresets[activeId] || [];

  useEffect(() => () => request.current?.abort(), []);

  const switchTool = (id) => {
    request.current?.abort();
    request.current = null;
    setLoading(false);
    setActiveId(id);
    setForm({});
    setResult(null);
    setError(null);
  };

  const submit = async () => {
    if (request.current) return;
    setError(null);
    setResult(null);
    const missing = tool.fields.find(
      (f) => f.required && (!form[f.name] || String(form[f.name]).trim() === '')
    );
    if (missing) {
      setError(`${missing.label} is required`);
      return;
    }
    const controller = new AbortController();
    request.current = controller;
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
      const { data } = await api.post(`/ai/${tool.id}`, payload, { signal: controller.signal });
      if (request.current !== controller) return;
      setResult(data);
    } catch (e) {
      if (request.current === controller && e.code !== 'ERR_CANCELED') setError(e.response?.data?.error || e.message);
    } finally {
      if (request.current === controller) {
        request.current = null;
        setLoading(false);
      }
    }
  };

  const cancel = () => {
    request.current?.abort();
    request.current = null;
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
          <FullFieldPresets
            value={form}
            presets={presets}
            disabled={loading}
            onChange={(values) => { setForm(values); setResult(null); setError(null); }}
          />
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
          <div className="ai-actions" style={{ marginTop: 8 }}>
            {loading && <button type="button" className="btn btn-secondary btn-lg" onClick={cancel}>Cancel</button>}
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={submit}
              disabled={loading}
              style={{
                padding: '10px 20px',
                borderRadius: 6,
                background: '#6366f1',
                color: 'white',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Generating…' : 'Generate with OpenRouter'}
            </button>
          </div>
          {error && (
            <div
              role="alert"
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
              <div style={{ marginTop: 8 }}><button type="button" className="btn btn-secondary btn-sm" onClick={submit}>Retry</button></div>
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
          {result && <FormattedAIReport response={result} title={tool.name} />}
        </div>
      </div>
    </div>
  );
}
