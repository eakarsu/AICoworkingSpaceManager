import { useEffect, useState } from 'react';
import api from '../api';

export default function OccupancyHeatmap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(90);

  useEffect(() => {
    setLoading(true);
    api.get(`/custom-views/occupancy-heatmap?days=${days}`)
      .then(r => { setData(r.data); setError(null); })
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <div className="card"><p>Loading heatmap...</p></div>;
  if (error) return <div className="card"><p style={{ color: 'red' }}>Error: {error}</p></div>;
  if (!data || !data.zones || data.zones.length === 0) {
    return <div className="card"><p>No occupancy data available.</p></div>;
  }

  const getColor = (val, max) => {
    if (val === 0) return '#f1f5f9';
    const intensity = Math.min(1, val / max);
    const r = Math.round(37 + (220 - 37) * intensity);
    const g = Math.round(99 - 50 * intensity);
    const b = Math.round(235 - 200 * intensity);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Occupancy Heatmap (Zone x Hour)</h3>
        <div>
          <label style={{ marginRight: 8 }}>Days:</label>
          <select value={days} onChange={e => setDays(parseInt(e.target.value))}>
            <option value="7">7</option>
            <option value="30">30</option>
            <option value="90">90</option>
          </select>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ padding: 4, textAlign: 'left', border: '1px solid #e2e8f0' }}>Zone</th>
              {data.hours.map(h => (
                <th key={h} style={{ padding: '4px 6px', border: '1px solid #e2e8f0', minWidth: 28 }}>{h}h</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.zones.map((zone, zi) => (
              <tr key={zone}>
                <td style={{ padding: 4, fontWeight: 600, border: '1px solid #e2e8f0' }}>{zone}</td>
                {data.matrix[zi].map((val, hi) => (
                  <td key={hi}
                    title={`${zone} @ ${hi}h: ${val}`}
                    style={{
                      backgroundColor: getColor(val, data.max),
                      padding: '6px 4px',
                      textAlign: 'center',
                      border: '1px solid #e2e8f0',
                      color: val > data.max * 0.5 ? '#fff' : '#1e293b',
                      minWidth: 28,
                    }}>
                    {val || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
        Max occupancy: <strong>{data.max}</strong> | Cells with data: <strong>{data.total_cells}</strong> | Window: last {data.days_back} days
      </p>
    </div>
  );
}
