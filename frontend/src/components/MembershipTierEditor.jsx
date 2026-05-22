import { useEffect, useState } from 'react';
import api from '../api';

const TIER_TYPES = ['hot_desk', 'dedicated_desk', 'private_office'];
const ACCESS_OPTIONS = ['24/7', 'weekday_9_18', 'weekday_8_22'];

function extractAccessRules(features) {
  if (!Array.isArray(features)) return {};
  const ruleEntry = features.find(f => f && typeof f === 'object' && f.__access_rules);
  return ruleEntry?.__access_rules || {};
}

function stripAccessFromFeatures(features) {
  if (!Array.isArray(features)) return [];
  return features.filter(f => !(f && typeof f === 'object' && f.__access_rules));
}

const EMPTY = {
  name: '', type: 'hot_desk', price_monthly: 0, max_members: 1,
  featuresText: '',
  access_hours: '24/7',
  access_meeting_rooms_per_month: 0,
  access_guest_passes_per_month: 0,
  access_printing: false,
};

export default function MembershipTierEditor() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/custom-views/tiers')
      .then(r => { setTiers(r.data); setError(null); })
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const startNew = () => { setEditingId(null); setEditing(EMPTY); };

  const startEdit = (t) => {
    const rules = extractAccessRules(t.features);
    const visibleFeatures = stripAccessFromFeatures(t.features);
    setEditingId(t.id);
    setEditing({
      name: t.name || '',
      type: t.type || 'hot_desk',
      price_monthly: t.price_monthly || 0,
      max_members: t.max_members || 1,
      featuresText: visibleFeatures.filter(f => typeof f === 'string').join(', '),
      access_hours: rules.hours || '24/7',
      access_meeting_rooms_per_month: rules.meeting_rooms_per_month || 0,
      access_guest_passes_per_month: rules.guest_passes_per_month || 0,
      access_printing: !!rules.printing,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const featuresArr = editing.featuresText
        .split(',').map(s => s.trim()).filter(Boolean);
      const access_rules = {
        hours: editing.access_hours,
        meeting_rooms_per_month: Number(editing.access_meeting_rooms_per_month) || 0,
        guest_passes_per_month: Number(editing.access_guest_passes_per_month) || 0,
        printing: !!editing.access_printing,
      };
      const payload = {
        name: editing.name,
        type: editing.type,
        price_monthly: Number(editing.price_monthly),
        max_members: Number(editing.max_members),
        features: featuresArr,
        access_rules,
      };
      if (editingId) {
        await api.put(`/custom-views/tiers/${editingId}`, payload);
      } else {
        await api.post('/custom-views/tiers', payload);
      }
      startNew();
      load();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this tier?')) return;
    try {
      await api.delete(`/custom-views/tiers/${id}`);
      load();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Access Rules & Membership Tier Editor</h3>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* Editor form */}
      <div style={{ background: '#f8fafc', padding: 12, borderRadius: 4, marginBottom: 16 }}>
        <h4 style={{ marginTop: 0 }}>{editingId ? `Edit Tier #${editingId}` : 'Create New Tier'}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label>Name<input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} style={{ width: '100%' }} /></label>
          <label>Type
            <select value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value })} style={{ width: '100%' }}>
              {TIER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>Monthly Price ($)<input type="number" step="0.01" value={editing.price_monthly} onChange={e => setEditing({ ...editing, price_monthly: e.target.value })} style={{ width: '100%' }} /></label>
          <label>Max Members<input type="number" value={editing.max_members} onChange={e => setEditing({ ...editing, max_members: e.target.value })} style={{ width: '100%' }} /></label>
          <label style={{ gridColumn: '1 / -1' }}>Features (comma-separated)
            <input value={editing.featuresText} onChange={e => setEditing({ ...editing, featuresText: e.target.value })} style={{ width: '100%' }} />
          </label>
        </div>
        <h5 style={{ marginBottom: 6 }}>Access Rules</h5>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
          <label>Access Hours
            <select value={editing.access_hours} onChange={e => setEditing({ ...editing, access_hours: e.target.value })} style={{ width: '100%' }}>
              {ACCESS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label>Meeting Rooms/mo<input type="number" value={editing.access_meeting_rooms_per_month} onChange={e => setEditing({ ...editing, access_meeting_rooms_per_month: e.target.value })} style={{ width: '100%' }} /></label>
          <label>Guest Passes/mo<input type="number" value={editing.access_guest_passes_per_month} onChange={e => setEditing({ ...editing, access_guest_passes_per_month: e.target.value })} style={{ width: '100%' }} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={editing.access_printing} onChange={e => setEditing({ ...editing, access_printing: e.target.checked })} />
            Printing
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : (editingId ? 'Update Tier' : 'Create Tier')}
          </button>
          {editingId && <button onClick={startNew} className="btn btn-ghost" style={{ marginLeft: 8 }}>Cancel</button>}
        </div>
      </div>

      {/* Existing tiers */}
      <h4>Existing Tiers</h4>
      {loading && <p>Loading...</p>}
      {!loading && tiers.length === 0 && <p>No tiers yet.</p>}
      {!loading && tiers.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: 6, textAlign: 'left' }}>ID</th>
              <th style={{ padding: 6, textAlign: 'left' }}>Name</th>
              <th style={{ padding: 6, textAlign: 'left' }}>Type</th>
              <th style={{ padding: 6, textAlign: 'right' }}>Price/mo</th>
              <th style={{ padding: 6, textAlign: 'left' }}>Access Hours</th>
              <th style={{ padding: 6 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map(t => {
              const rules = extractAccessRules(t.features);
              return (
                <tr key={t.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: 6 }}>{t.id}</td>
                  <td style={{ padding: 6 }}>{t.name}</td>
                  <td style={{ padding: 6 }}>{t.type}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>${Number(t.price_monthly).toFixed(2)}</td>
                  <td style={{ padding: 6 }}>{rules.hours || '-'}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>
                    <button onClick={() => startEdit(t)} className="btn btn-ghost btn-sm">Edit</button>
                    <button onClick={() => handleDelete(t.id)} className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
