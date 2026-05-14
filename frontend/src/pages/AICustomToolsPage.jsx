import { useState, useEffect } from 'react';
import api from '../api';

const tools = [
  { id: 'smart-desk-matching', name: 'Smart Desk Matching', icon: '🎯',
    desc: 'AI recommends best desk by work style and history',
    fields: [
      { name: 'user_id', label: 'Member ID (optional, defaults to you)', type: 'number' },
      { name: 'work_style', label: 'Work Style', type: 'select',
        options: ['focused/quiet', 'collaborative', 'creative', 'phone-heavy', 'standing/active'] },
      { name: 'preferred_zone', label: 'Preferred Zone' },
      { name: 'date', label: 'Date', type: 'date' },
    ]},
  { id: 'reputation-score', name: 'Reputation Score', icon: '🏅',
    desc: 'Compute reputation score and badges',
    fields: [{ name: 'user_id', label: 'Member ID', type: 'number' }]},
  { id: 'conflict-resolution-scheduler', name: 'Conflict Resolution', icon: '🤝',
    desc: 'Schedule mediation room and session',
    fields: [
      { name: 'participants', label: 'Participants (comma-separated names)' },
      { name: 'conflict_summary', label: 'Conflict Summary', type: 'textarea', required: true },
      { name: 'urgency', label: 'Urgency', type: 'select', options: ['low', 'medium', 'high', 'urgent'] },
    ]},
  { id: 'revenue-forecasting', name: 'Revenue Forecasting', icon: '📈',
    desc: 'Predict revenue, churn, demand',
    fields: [{ name: 'horizon_months', label: 'Horizon (months)', type: 'number' }]},
  { id: 'facility-health-dashboard', name: 'Facility Health', icon: '🏥',
    desc: 'AI insights on facility KPIs',
    fields: []},
  { id: 'mentorship-matching', name: 'Mentorship Matching', icon: '🌱',
    desc: 'Pair mentee with experienced mentors',
    fields: [
      { name: 'mentee_id', label: 'Mentee Member ID', type: 'number', required: true },
      { name: 'focus_area', label: 'Focus Area' },
    ]},
  { id: 'resource-sharing-marketplace', name: 'Resource Marketplace', icon: '🛍️',
    desc: 'Match offers and requests in community',
    fields: [
      { name: 'offer', label: 'I am offering', type: 'textarea' },
      { name: 'request', label: 'I am looking for', type: 'textarea' },
      { name: 'category', label: 'Category' },
    ]},
];

export default function AICustomToolsPage() {
  const [activeId, setActiveId] = useState(tools[0].id);
  const [form, setForm] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const tool = tools.find(t => t.id === activeId);

  useEffect(() => { setForm({}); setResult(null); setError(null); }, [activeId]);

  const loadHistory = async () => {
    try {
      const { data } = await api.get('/ai/results', { params: { feature: activeId, limit: 20 } });
      setHistory(data.data || []);
    } catch (e) { setError(e.response?.data?.error || e.message); }
  };

  useEffect(() => { if (showHistory) loadHistory(); }, [showHistory, activeId]);

  const submit = async () => {
    setError(null); setResult(null);
    const missing = tool.fields.find(f => f.required && (!form[f.name] || String(form[f.name]).trim() === ''));
    if (missing) { setError(`${missing.label} is required`); return; }
    setLoading(true);
    try {
      const payload = { ...form };
      // convert participants list
      if (form.participants && typeof form.participants === 'string') {
        payload.participants = form.participants.split(',').map(s => s.trim()).filter(Boolean);
      }
      const { data } = await api.post(`/ai/${activeId}`, payload);
      setResult(data);
      if (showHistory) loadHistory();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>🤖 AI Custom Tools</h1>
          <p className="page-subtitle">7 advanced AI tools for coworking community + ops</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? 'Hide' : 'Show'} History
        </button>
      </div>

      <div className="ai-tools-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12,marginBottom:20}}>
        {tools.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveId(t.id)}
            className={`ai-tool-card ${activeId === t.id ? 'active' : ''}`}
            style={{
              padding: 14, borderRadius: 8, textAlign: 'left',
              border: activeId === t.id ? '2px solid #6366f1' : '2px solid #e5e7eb',
              background: activeId === t.id ? '#eef2ff' : '#fff', cursor: 'pointer'
            }}
          >
            <div style={{fontSize: 24, marginBottom: 6}}>{t.icon}</div>
            <div style={{fontWeight: 600, fontSize: 14}}>{t.name}</div>
            <div style={{fontSize: 12, color: '#6b7280', marginTop: 4}}>{t.desc}</div>
          </button>
        ))}
      </div>

      <div className="ai-control-panel" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        <div style={{background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e5e7eb'}}>
          <h2 style={{marginBottom: 16}}>{tool.icon} {tool.name}</h2>
          {tool.fields.length === 0 && <div style={{color:'#6b7280',marginBottom:12}}>No inputs required.</div>}
          {tool.fields.map(f => (
            <div key={f.name} className="form-group" style={{marginBottom: 12}}>
              <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:500}}>
                {f.label}{f.required && <span style={{color:'red'}}> *</span>}
              </label>
              {f.type === 'textarea' ? (
                <textarea
                  rows={3}
                  value={form[f.name] || ''}
                  onChange={e => setForm({...form, [f.name]: e.target.value})}
                  style={{width:'100%',padding:8,border:'1px solid #d1d5db',borderRadius:4}}
                />
              ) : f.type === 'select' ? (
                <select
                  value={form[f.name] || ''}
                  onChange={e => setForm({...form, [f.name]: e.target.value})}
                  style={{width:'100%',padding:8,border:'1px solid #d1d5db',borderRadius:4}}
                >
                  <option value="">Select...</option>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={f.type || 'text'}
                  value={form[f.name] || ''}
                  onChange={e => setForm({...form, [f.name]: e.target.value})}
                  style={{width:'100%',padding:8,border:'1px solid #d1d5db',borderRadius:4}}
                />
              )}
            </div>
          ))}
          <button
            className="btn btn-primary btn-lg"
            onClick={submit}
            disabled={loading}
            style={{marginTop: 8, padding: '10px 20px', borderRadius: 6, background: '#6366f1', color: 'white', border: 'none', cursor: 'pointer'}}
          >
            {loading ? 'Running...' : 'Run AI Tool'}
          </button>
          {error && <div style={{marginTop:12,padding:10,background:'#fef2f2',color:'#991b1b',borderRadius:4,fontSize:13}}>{error}</div>}
        </div>

        <div style={{background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e5e7eb'}}>
          <h2 style={{marginBottom:16}}>Result</h2>
          {loading && <div style={{color:'#6b7280'}}>Running AI analysis...</div>}
          {!loading && !result && <div style={{color:'#9ca3af',fontSize:13}}>No result yet. Run a tool to see output.</div>}
          {result && (
            <div>
              {result.model && <div style={{fontSize:11,color:'#6b7280',marginBottom:8}}>Model: {result.model} · Tokens: {result.usage?.total_tokens || 'n/a'}</div>}
              <pre style={{background:'#f9fafb',padding:12,borderRadius:4,fontSize:11,overflow:'auto',maxHeight:600}}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {showHistory && (
        <div style={{marginTop:20,background:'#fff',padding:20,borderRadius:8,border:'1px solid #e5e7eb'}}>
          <h2 style={{marginBottom:16}}>Recent Results — {tool.name}</h2>
          {history.length === 0 && <div style={{color:'#9ca3af',fontSize:13}}>No history yet.</div>}
          {history.map(r => (
            <div key={r.id} style={{borderBottom:'1px solid #e5e7eb',padding:10}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span style={{fontFamily:'monospace',fontSize:11,color:'#6b7280'}}>#{r.id}</span>
                <span style={{fontSize:11,color:'#6b7280'}}>{new Date(r.created_at).toLocaleString()}</span>
              </div>
              <pre style={{fontSize:11,background:'#f9fafb',padding:8,borderRadius:4,maxHeight:200,overflow:'auto'}}>
                {JSON.stringify(r.output, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
