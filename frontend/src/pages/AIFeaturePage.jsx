import { useState, useEffect } from 'react';
import api from '../api';

function parseAIResponse(text) {
  if (!text) return null;
  // Try to extract JSON from the response
  try {
    // If it's already an object
    if (typeof text === 'object') return text;
    // Try direct parse
    const parsed = JSON.parse(text);
    return parsed;
  } catch {
    // Try to find JSON in the text
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function AIResponseDisplay({ response }) {
  if (!response) return null;

  // Get the actual content string from different response shapes
  let content = response;
  if (typeof response === 'object') {
    content = response.suggestions || response.analysis || response.newsletter || response.recommendations || response;
  }

  const parsed = parseAIResponse(content);

  if (parsed) {
    return <StructuredAIDisplay data={parsed} />;
  }

  // Fallback: render as formatted text
  return (
    <div className="ai-output">
      <div className="ai-output-section">
        <div className="ai-output-text" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
          {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
        </div>
      </div>
    </div>
  );
}

function StructuredAIDisplay({ data }) {
  if (!data || typeof data !== 'object') return null;

  return (
    <div className="ai-output">
      {/* Member Matching */}
      {data.matches && (
        <div className="ai-output-section">
          <h3 className="ai-section-title">Recommended Connections</h3>
          {data.matches.map((match, i) => (
            <div key={i} className="ai-recommendation-card">
              <div className="ai-rec-header">
                <span className="ai-rec-number">#{i + 1}</span>
                <span className="ai-rec-name">{match.member_name || match.name}</span>
              </div>
              <p className="ai-rec-reason">{match.reason}</p>
              {match.collaboration_idea && (
                <div className="ai-rec-idea">
                  <strong>Collaboration Idea:</strong> {match.collaboration_idea}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Room Analysis */}
      {data.analysis && (
        <div className="ai-output-section">
          <h3 className="ai-section-title">Room Usage Analysis</h3>
          {data.analysis.utilization_rates && (
            <div className="ai-metrics-grid">
              {data.analysis.utilization_rates.map((rate, i) => (
                <div key={i} className="ai-metric-card">
                  <div className="ai-metric-label">{rate.room || rate.name || `Room ${i + 1}`}</div>
                  <div className="ai-metric-value">{rate.rate || rate.utilization || rate.percentage || '—'}</div>
                </div>
              ))}
            </div>
          )}
          {data.analysis.peak_times && (
            <div className="ai-callout ai-callout-info">
              <h4>Peak Times</h4>
              <ul className="ai-list">{data.analysis.peak_times.map((t, i) => <li key={i}>{typeof t === 'string' ? t : JSON.stringify(t)}</li>)}</ul>
            </div>
          )}
          {data.analysis.recommendations && (
            <div className="ai-callout ai-callout-success">
              <h4>Recommendations</h4>
              <ul className="ai-list">{data.analysis.recommendations.map((r, i) => <li key={i}>{typeof r === 'string' ? r : r.recommendation || r.suggestion || JSON.stringify(r)}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {/* Newsletter */}
      {data.subject && data.sections && (
        <div className="ai-output-section">
          <div className="ai-newsletter">
            <div className="ai-newsletter-subject">
              <span className="ai-label">Subject Line:</span>
              <h3>{data.subject}</h3>
            </div>
            {data.sections.map((section, i) => (
              <div key={i} className="ai-newsletter-section">
                <h4>{section.title}</h4>
                <div className="ai-newsletter-content">{section.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Recommendations */}
      {data.recommended_plan && (
        <div className="ai-output-section">
          <h3 className="ai-section-title">Pricing Recommendation</h3>
          <div className="ai-recommendation-card ai-highlight">
            <h4>Recommended: {data.recommended_plan}</h4>
            <p>{data.reasoning}</p>
            {data.estimated_savings && (
              <div className="ai-callout ai-callout-success">
                <strong>Estimated Savings:</strong> {data.estimated_savings}
              </div>
            )}
          </div>
          {data.alternatives && data.alternatives.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ marginBottom: '8px' }}>Alternative Options</h4>
              <ul className="ai-list">{data.alternatives.map((alt, i) => <li key={i}>{typeof alt === 'string' ? alt : alt.plan || alt.name || JSON.stringify(alt)}</li>)}</ul>
            </div>
          )}
          {data.add_on_suggestions && data.add_on_suggestions.length > 0 && (
            <div className="ai-callout ai-callout-info" style={{ marginTop: '16px' }}>
              <h4>Suggested Add-ons</h4>
              <ul className="ai-list">{data.add_on_suggestions.map((s, i) => <li key={i}>{typeof s === 'string' ? s : JSON.stringify(s)}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {/* Event Suggestions */}
      {data.suggested_events && (
        <div className="ai-output-section">
          <h3 className="ai-section-title">Suggested Events</h3>
          <div className="ai-events-grid">
            {data.suggested_events.map((evt, i) => (
              <div key={i} className="ai-recommendation-card">
                <div className="ai-rec-header">
                  <span className="ai-rec-number">#{i + 1}</span>
                  <span className="ai-rec-name">{evt.title}</span>
                  {evt.type && <span className="badge badge-primary" style={{ marginLeft: '8px' }}>{evt.type}</span>}
                </div>
                <p className="ai-rec-reason">{evt.description}</p>
                <div className="ai-event-meta">
                  {evt.expected_attendance && <span>Expected: {evt.expected_attendance} attendees</span>}
                  {evt.best_time && <span>Best Time: {evt.best_time}</span>}
                </div>
                {evt.resources_needed && evt.resources_needed.length > 0 && (
                  <div className="ai-tags">
                    {evt.resources_needed.map((r, j) => <span key={j} className="badge badge-secondary">{r}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Space Utilization */}
      {data.utilization_score !== undefined && (
        <div className="ai-output-section">
          <h3 className="ai-section-title">Space Utilization Analysis</h3>
          <div className="ai-score-display">
            <div className="ai-score-circle">
              <span className="ai-score-value">{data.utilization_score}</span>
              <span className="ai-score-label">/10</span>
            </div>
            <span className="ai-score-text">Overall Utilization Score</span>
          </div>
          {data.underutilized && data.underutilized.length > 0 && (
            <div className="ai-callout ai-callout-warning">
              <h4>Underutilized Areas</h4>
              <ul className="ai-list">{data.underutilized.map((u, i) => <li key={i}>{typeof u === 'string' ? u : JSON.stringify(u)}</li>)}</ul>
            </div>
          )}
          {data.overcrowded && data.overcrowded.length > 0 && (
            <div className="ai-callout ai-callout-danger">
              <h4>Overcrowded Areas</h4>
              <ul className="ai-list">{data.overcrowded.map((o, i) => <li key={i}>{typeof o === 'string' ? o : JSON.stringify(o)}</li>)}</ul>
            </div>
          )}
          {data.layout_recommendations && data.layout_recommendations.length > 0 && (
            <div className="ai-callout ai-callout-success">
              <h4>Layout Recommendations</h4>
              <ul className="ai-list">{data.layout_recommendations.map((r, i) => <li key={i}>{typeof r === 'string' ? r : JSON.stringify(r)}</li>)}</ul>
            </div>
          )}
          {data.estimated_impact && (
            <div className="ai-callout ai-callout-info">
              <h4>Estimated Impact</h4>
              <p>{data.estimated_impact}</p>
            </div>
          )}
        </div>
      )}

      {/* Generic fallback for unrecognized structures */}
      {!data.matches && !data.analysis && !data.subject && !data.recommended_plan && !data.suggested_events && data.utilization_score === undefined && (
        <div className="ai-output-section">
          <GenericDisplay data={data} />
        </div>
      )}
    </div>
  );
}

function GenericDisplay({ data, depth = 0 }) {
  if (typeof data !== 'object' || data === null) {
    return <span>{String(data)}</span>;
  }
  if (Array.isArray(data)) {
    return (
      <ul className="ai-list">
        {data.map((item, i) => (
          <li key={i}><GenericDisplay data={item} depth={depth + 1} /></li>
        ))}
      </ul>
    );
  }
  return (
    <div style={{ paddingLeft: depth > 0 ? '16px' : 0 }}>
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="ai-generic-field" style={{ marginBottom: '8px' }}>
          <strong style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}:</strong>{' '}
          {typeof value === 'object' ? <GenericDisplay data={value} depth={depth + 1} /> : String(value)}
        </div>
      ))}
    </div>
  );
}

export default function AIFeaturePage({ config }) {
  const { title, endpoint, description, icon, needsUserId } = config;
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    if (needsUserId) {
      api.get('/users').then(res => setUsers(res.data)).catch(() => {});
    }
    setResponse(null);
    setError(null);
  }, [endpoint, needsUserId]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const payload = needsUserId ? { user_id: parseInt(selectedUserId) || 1 } : {};
      const res = await api.post(`/${endpoint}`, payload);
      setResponse(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate AI response. Check your OpenRouter API key.');
    } finally {
      setLoading(false);
    }
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
        <button className="btn btn-primary btn-lg" onClick={handleGenerate} disabled={loading || (needsUserId && !selectedUserId)}>
          {loading ? (
            <>
              <span className="spinner" style={{ width: '20px', height: '20px', marginRight: '8px' }}></span>
              Generating AI Analysis...
            </>
          ) : (
            `Generate ${title.replace('AI ', '')}`
          )}
        </button>
      </div>

      {error && (
        <div className="ai-callout ai-callout-danger" style={{ marginTop: '24px' }}>
          <h4>Error</h4>
          <p>{error}</p>
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
          <AIResponseDisplay response={response} />
        </div>
      )}
    </div>
  );
}
