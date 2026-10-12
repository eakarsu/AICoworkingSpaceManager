import { useEffect, useRef, useState } from 'react';
import api from '../api';
import FormattedAIReport from '../components/FormattedAIReport';

const analysisPresets = [
  { label: 'Operations review', focus: 'Identify the most important operational patterns, immediate risks, and three practical actions for the next 30 days.' },
  { label: 'Member experience', focus: 'Prioritize member experience, accessibility, fairness, and service improvements; clearly separate evidence from assumptions.' },
  { label: 'Executive briefing', focus: 'Summarize business impact, cost or revenue implications, key tradeoffs, and the decisions leadership should make next.' },
];

export default function AIFeaturePage({ config }) {
  const { title, endpoint, description, icon, needsUserId } = config;
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [analysisFocus, setAnalysisFocus] = useState('');
  const request = useRef(null);

  useEffect(() => {
    if (needsUserId) {
      api.get('/users').then(res => {
        const rows = Array.isArray(res.data) ? res.data : res.data?.data;
        if (!Array.isArray(rows)) throw new Error('The server returned an invalid member list.');
        setUsers(rows);
      }).catch((err) => setError(err.response?.data?.error || err.message || 'Members could not be loaded.'));
    }
    setResponse(null);
    setError(null);
    setAnalysisFocus('');
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [endpoint, needsUserId]);

  const handleGenerate = async () => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const memberKey = endpoint === 'ai/member-matching' ? 'member_id' : 'user_id';
      const payload = { analysis_focus: analysisFocus, ...(needsUserId ? { [memberKey]: parseInt(selectedUserId, 10) } : {}) };
      const res = await api.post(`/${endpoint}`, payload, { signal: controller.signal });
      if (request.current !== controller) return;
      setResponse(res.data);
    } catch (err) {
      if (request.current === controller && err.code !== 'ERR_CANCELED') setError(err.response?.data?.error || 'Failed to generate AI response. Check your OpenRouter API key.');
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
          <h1>{icon} {title}</h1>
          <p className="page-subtitle">{description}</p>
        </div>
      </div>

      <div className="ai-control-panel">
        {needsUserId && (
          <div className="form-group" style={{ maxWidth: '400px', marginBottom: '16px' }}>
            <label>Select Member</label>
            <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
              <option value="">Choose a member...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} - {u.company || 'Independent'}</option>
              ))}
            </select>
          </div>
        )}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label>Analysis Focus <span style={{ color: '#6b7280', fontWeight: 400 }}>(optional)</span></label>
          <textarea rows={3} value={analysisFocus} onChange={(event) => setAnalysisFocus(event.target.value)} placeholder="Add priorities, questions, or decision criteria for this analysis." />
        </div>
        <div className="ai-preset-bar">
          <div><strong>Complete examples</strong><p>Each preset fills every editable AI field, including optional fields.</p></div>
          <div className="ai-actions">
            {analysisPresets.map((preset, index) => <button type="button" className="btn btn-secondary" key={preset.label} disabled={loading || (needsUserId && users.length === 0)} onClick={() => { setAnalysisFocus(preset.focus); if (needsUserId && !selectedUserId) setSelectedUserId(String(users[index % users.length].id)); setResponse(null); setError(null); }}>{preset.label}</button>)}
          </div>
        </div>
        <div className="ai-actions">
          {loading && <button type="button" className="btn btn-secondary btn-lg" onClick={cancel}>Cancel</button>}
          <button className="btn btn-primary btn-lg" onClick={handleGenerate} disabled={loading || (needsUserId && !selectedUserId)}>
          {loading ? (
            <>
              <span className="spinner" style={{ width: '20px', height: '20px', marginRight: '8px' }}></span>
              Generating AI Analysis...
            </>
          ) : (
            'Generate with OpenRouter'
          )}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="ai-callout ai-callout-danger" style={{ marginTop: '24px' }}>
          <h4>Error</h4>
          <p>{error}</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleGenerate} disabled={needsUserId && !selectedUserId}>Retry</button>
        </div>
      )}

      {loading && (
        <div className="ai-loading">
          <div className="ai-loading-animation">
            <div className="ai-loading-dot"></div>
            <div className="ai-loading-dot"></div>
            <div className="ai-loading-dot"></div>
          </div>
          <p>AI is analyzing your data...</p>
        </div>
      )}

      {response && !loading && (
        <div style={{ marginTop: '24px' }}>
          <FormattedAIReport response={response} title={title} />
        </div>
      )}
    </div>
  );
}
