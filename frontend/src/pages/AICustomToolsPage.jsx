import FormattedAIReport from '../components/FormattedAIReport';
import FullFieldPresets from '../components/FullFieldPresets';
import { useCallback, useEffect, useRef, useState } from 'react';
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
    fields: [
      { name: 'analysis_focus', label: 'Analysis Focus' },
      { name: 'planning_horizon_days', label: 'Planning Horizon (days)', type: 'number' },
    ]},
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

const futureDate = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const customToolPresets = {
  'smart-desk-matching': [
    { label: 'Quiet focus day', values: { work_style: 'focused/quiet', preferred_zone: 'Quiet Zone, Floor 2', date: futureDate(1) } },
    { label: 'Team collaboration', values: { work_style: 'collaborative', preferred_zone: 'Open Area A, Floor 1', date: futureDate(2) } },
    { label: 'Active workday', values: { work_style: 'standing/active', preferred_zone: 'Standing Area, Floor 3', date: futureDate(3) } },
  ],
  'reputation-score': [
    { label: 'First available member', values: {} },
    { label: 'Another member', values: {} },
    { label: 'Member review', values: {} },
  ],
  'conflict-resolution-scheduler': [
    { label: 'Room booking conflict', values: { participants: 'James Chen, Olivia Martinez', conflict_summary: 'Both teams need the same meeting room for client calls on Tuesday afternoon. Find a private, neutral time and a fair booking agreement.', urgency: 'high' } },
    { label: 'Noise concern', values: { participants: 'Priya Shah, Marcus Lee', conflict_summary: 'Repeated phone calls in the quiet zone are disrupting focused work. Recommend a respectful mediation session and practical zone rules.', urgency: 'medium' } },
    { label: 'Shared resource dispute', values: { participants: 'Nina Patel, Carlos Rivera', conflict_summary: 'Two members disagree about recurring access to the podcast equipment. Propose a balanced schedule and follow-up plan.', urgency: 'low' } },
  ],
  'revenue-forecasting': [
    { label: 'Quarter outlook', values: { horizon_months: '3' } },
    { label: 'Half-year plan', values: { horizon_months: '6' } },
    { label: 'Annual plan', values: { horizon_months: '12' } },
  ],
  'facility-health-dashboard': [
    { label: 'Safety priorities', values: { analysis_focus: 'Safety-critical maintenance, overdue work orders, and amenity downtime', planning_horizon_days: '30' } },
    { label: 'Member experience', values: { analysis_focus: 'Cleaning reliability, comfort issues, and high-use member amenities', planning_horizon_days: '60' } },
    { label: 'Capital planning', values: { analysis_focus: 'Recurring failures, replacement candidates, and preventive maintenance investment', planning_horizon_days: '90' } },
  ],
  'mentorship-matching': [
    { label: 'AI product growth', values: { focus_area: 'Turning machine-learning expertise into a repeatable B2B product and sales process' } },
    { label: 'Design leadership', values: { focus_area: 'Building a design portfolio, leading critiques, and mentoring junior designers' } },
    { label: 'Founder finance', values: { focus_area: 'Cash-flow planning, pricing strategy, and investor-readiness for an early-stage company' } },
  ],
  'resource-sharing-marketplace': [
    { label: 'Podcast exchange', values: { offer: 'Two hours of audio editing and show-note support this month.', request: 'A quiet podcast booth and a USB microphone for a 45-minute interview.', category: 'media equipment' } },
    { label: 'Design for analytics', values: { offer: 'A one-hour landing-page design review with written recommendations.', request: 'Help building a simple cohort-retention dashboard in Python.', category: 'skill exchange' } },
    { label: 'Event partnership', values: { offer: 'Event photography for a community workshop of up to 40 attendees.', request: 'A co-host and projector for a practical founder-finance session.', category: 'community events' } },
  ],
};

export default function AICustomToolsPage() {
  const [activeId, setActiveId] = useState(tools[0].id);
  const [form, setForm] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [members, setMembers] = useState([]);
  const [membersError, setMembersError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const request = useRef(null);

  const tool = tools.find(t => t.id === activeId);
  const memberField = activeId === 'mentorship-matching' ? 'mentee_id' : ['smart-desk-matching', 'reputation-score'].includes(activeId) ? 'user_id' : null;
  const presets = (customToolPresets[activeId] || []).map((preset, index) => ({
    ...preset,
    values: memberField ? { ...preset.values, [memberField]: form[memberField] || (members.length ? String(members[index % members.length].id) : '') } : preset.values,
  }));

  useEffect(() => {
    let active = true;
    api.get('/users', { params: { limit: 100 } }).then(({ data }) => {
      const rows = Array.isArray(data) ? data : data?.data;
      if (!Array.isArray(rows)) throw new Error('The server returned an invalid member list.');
      if (active) setMembers(rows);
    }).catch((error) => { if (active) setMembersError(`${error.message || 'Members could not be loaded.'} Select an existing member ID before generating.`); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    request.current?.abort();
    request.current = null;
    setLoading(false);
    setForm({});
    setResult(null);
    setError(null);
  }, [activeId]);

  useEffect(() => () => request.current?.abort(), []);

  const loadHistory = useCallback(async () => {
    try {
      const { data } = await api.get('/ai/results', { params: { feature: activeId, limit: 20 } });
      const rows = Array.isArray(data) ? data : data?.data;
      if (!Array.isArray(rows)) throw new Error('The server returned an invalid result history.');
      setHistory(rows);
    } catch (e) { setError(e.response?.data?.error || e.message); }
  }, [activeId]);

  useEffect(() => { if (showHistory) loadHistory(); }, [showHistory, loadHistory]);

  const submit = async () => {
    if (request.current) return;
    setError(null); setResult(null);
    const missing = tool.fields.find(f => f.required && (!form[f.name] || String(form[f.name]).trim() === ''));
    if (missing) { setError(`${missing.label} is required`); return; }
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    try {
      const payload = { ...form };
      // convert participants list
      if (form.participants && typeof form.participants === 'string') {
        payload.participants = form.participants.split(',').map(s => s.trim()).filter(Boolean);
      }
      const { data } = await api.post(`/ai/${activeId}`, payload, { signal: controller.signal });
      if (request.current !== controller) return;
      setResult(data);
      if (showHistory) loadHistory();
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
          <FullFieldPresets
            value={form}
            presets={presets}
            disabled={loading || (memberField && !members.length)}
            onChange={(values) => { setForm(values); setResult(null); setError(null); }}
          />
          {memberField && !members.length && <p role="status">{membersError || 'Loading members for complete examples…'}</p>}
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
          <div className="ai-actions" style={{marginTop: 8}}>
            {loading && <button type="button" className="btn btn-secondary btn-lg" onClick={cancel}>Cancel</button>}
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={submit}
              disabled={loading}
              style={{padding: '10px 20px', borderRadius: 6, background: '#6366f1', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer'}}
            >
              {loading ? 'Generating…' : 'Generate with OpenRouter'}
            </button>
          </div>
          {error && <div role="alert" style={{marginTop:12,padding:10,background:'#fef2f2',color:'#991b1b',borderRadius:4,fontSize:13}}>{error}<div style={{marginTop:8}}><button type="button" className="btn btn-secondary btn-sm" onClick={submit}>Retry</button></div></div>}
        </div>

        <div style={{background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e5e7eb'}}>
          <h2 style={{marginBottom:16}}>Result</h2>
          {loading && <div style={{color:'#6b7280'}}>Running AI analysis...</div>}
          {!loading && !result && <div style={{color:'#9ca3af',fontSize:13}}>No result yet. Run a tool to see output.</div>}
          {result && (
            <div>
              {result.model && <div style={{fontSize:11,color:'#6b7280',marginBottom:8}}>Model: {result.model} · Tokens: {result.usage?.total_tokens || 'n/a'}</div>}
              <FormattedAIReport response={result} />
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
              <FormattedAIReport response={r.output} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
