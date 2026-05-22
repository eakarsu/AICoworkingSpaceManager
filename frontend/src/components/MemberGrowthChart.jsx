import { useEffect, useState } from 'react';
import api from '../api';

export default function MemberGrowthChart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [months, setMonths] = useState(12);

  useEffect(() => {
    setLoading(true);
    api.get(`/custom-views/member-growth?months=${months}`)
      .then(r => { setData(r.data); setError(null); })
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, [months]);

  if (loading) return <div className="card"><p>Loading member growth...</p></div>;
  if (error) return <div className="card"><p style={{ color: 'red' }}>Error: {error}</p></div>;
  if (!data || !data.series || data.series.length === 0) {
    return <div className="card"><p>No member growth data.</p></div>;
  }

  const width = 600;
  const height = 240;
  const padding = { l: 50, r: 20, t: 20, b: 40 };
  const innerW = width - padding.l - padding.r;
  const innerH = height - padding.t - padding.b;

  const maxCum = Math.max(...data.series.map(s => s.cumulative), 1);
  const maxActive = Math.max(...data.series.map(s => s.active_members), 1);
  const yMax = Math.max(maxCum, maxActive);

  const xStep = data.series.length > 1 ? innerW / (data.series.length - 1) : 0;

  const buildPath = (key) => {
    return data.series.map((s, i) => {
      const x = padding.l + i * xStep;
      const y = padding.t + innerH - (s[key] / yMax) * innerH;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(p => ({
    value: Math.round(yMax * p),
    y: padding.t + innerH - p * innerH,
  }));

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Member Growth & Retention</h3>
        <div>
          <label style={{ marginRight: 8 }}>Months:</label>
          <select value={months} onChange={e => setMonths(parseInt(e.target.value))}>
            <option value="6">6</option>
            <option value="12">12</option>
            <option value="24">24</option>
          </select>
        </div>
      </div>
      <svg width={width} height={height} style={{ background: '#f8fafc', borderRadius: 4 }}>
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padding.l} y1={t.y} x2={width - padding.r} y2={t.y} stroke="#e2e8f0" />
            <text x={padding.l - 6} y={t.y + 4} textAnchor="end" fontSize="10" fill="#64748b">{t.value}</text>
          </g>
        ))}
        {data.series.map((s, i) => (
          <text key={i} x={padding.l + i * xStep} y={height - padding.b + 14}
            textAnchor="middle" fontSize="9" fill="#64748b" transform={`rotate(-30 ${padding.l + i * xStep} ${height - padding.b + 14})`}>
            {s.month}
          </text>
        ))}
        <path d={buildPath('cumulative')} stroke="#2563eb" strokeWidth="2" fill="none" />
        <path d={buildPath('active_members')} stroke="#10b981" strokeWidth="2" fill="none" />
        {data.series.map((s, i) => {
          const x = padding.l + i * xStep;
          const yc = padding.t + innerH - (s.cumulative / yMax) * innerH;
          const ya = padding.t + innerH - (s.active_members / yMax) * innerH;
          return (
            <g key={i}>
              <circle cx={x} cy={yc} r="3" fill="#2563eb"><title>{s.month}: cum={s.cumulative}</title></circle>
              <circle cx={x} cy={ya} r="3" fill="#10b981"><title>{s.month}: active={s.active_members}</title></circle>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: 20, marginTop: 8, fontSize: 12 }}>
        <span><span style={{ color: '#2563eb' }}>●</span> Cumulative Members</span>
        <span><span style={{ color: '#10b981' }}>●</span> Active (checked-in)</span>
      </div>
      <p style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
        Total growth: <strong>{data.total_growth}</strong> | Avg retention: <strong>{data.avg_retention}%</strong>
      </p>
    </div>
  );
}
