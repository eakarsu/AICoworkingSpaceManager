import { useState, useEffect, useCallback } from 'react';
import api from '../api';

function formatValue(val) {
  if (val === null || val === undefined) return '-';
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object') return JSON.stringify(val);
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
    return new Date(val).toLocaleString();
  }
  return String(val);
}

function getStatusBadge(status) {
  const map = {
    available: 'badge-success', active: 'badge-success', paid: 'badge-success', confirmed: 'badge-success', completed: 'badge-success', resolved: 'badge-success', rewarded: 'badge-success',
    occupied: 'badge-warning', pending: 'badge-warning', in_progress: 'badge-warning', upcoming: 'badge-warning', expected: 'badge-warning', signed_up: 'badge-warning', notified: 'badge-warning',
    maintenance: 'badge-danger', overdue: 'badge-danger', cancelled: 'badge-danger', closed: 'badge-danger', unavailable: 'badge-danger', expired: 'badge-danger',
    open: 'badge-primary', received: 'badge-primary', used: 'badge-secondary',
  };
  return map[status] || 'badge-secondary';
}

function formatFieldName(field) {
  return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace(/Id$/, 'ID');
}

export default function FeaturePage({ config }) {
  const { title, endpoint, fields, icon } = config;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/${endpoint}`);
      setItems(res.data);
    } catch (err) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchItems();
    setSelectedItem(null);
    setShowModal(false);
    setEditItem(null);
  }, [fetchItems]);

  const handleRowClick = (item) => {
    setSelectedItem(selectedItem?.id === item.id ? null : item);
  };

  const handleNew = () => {
    setEditItem(null);
    const initial = {};
    fields.forEach(f => { initial[f] = ''; });
    setFormData(initial);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    const data = {};
    fields.forEach(f => {
      let val = item[f];
      if (Array.isArray(val)) val = val.join(', ');
      else if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
      else if (val === null || val === undefined) val = '';
      else val = String(val);
      data[f] = val;
    });
    setFormData(data);
    setShowModal(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete this item?`)) return;
    try {
      await api.delete(`/${endpoint}/${item.id}`);
      showToast('Deleted successfully');
      setSelectedItem(null);
      fetchItems();
    } catch (err) {
      showToast('Failed to delete', 'error');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData };
      // Convert numeric fields
      Object.keys(payload).forEach(key => {
        if (['price_monthly','amount','hourly_rate','capacity','max_members','floor','attendees','usage_count','likes','member_count','reward_amount','price','occupancy_count','hour','monthly_rate'].includes(key)) {
          if (payload[key] !== '') payload[key] = Number(payload[key]);
        }
        if (['pinned'].includes(key)) {
          payload[key] = payload[key] === 'true' || payload[key] === true;
        }
        if (payload[key] === '') delete payload[key];
      });

      if (editItem) {
        await api.put(`/${endpoint}/${editItem.id}`, payload);
        showToast('Updated successfully');
      } else {
        await api.post(`/${endpoint}`, payload);
        showToast('Created successfully');
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Determine display columns - show first 6 fields max in table
  const displayFields = fields.slice(0, 6);
  const allDisplayKeys = items.length > 0 ? Object.keys(items[0]).filter(k => !['password_hash','password'].includes(k)) : fields;

  return (
    <div className="page">
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            <div className="toast-message">{toast.message}</div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>{icon} {title}</h1>
          <p className="page-subtitle">{items.length} records</p>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Item</button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{icon}</div>
          <h3>No records found</h3>
          <p>Get started by creating your first item</p>
          <button className="btn btn-primary" onClick={handleNew}>+ Create New</button>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  {displayFields.map(f => <th key={f}>{formatFieldName(f)}</th>)}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id || idx} className={`table-row ${selectedItem?.id === item.id ? 'selected' : ''}`} onClick={() => handleRowClick(item)}>
                    <td>{item.id || idx + 1}</td>
                    {displayFields.map(f => (
                      <td key={f}>
                        {f === 'status' || f === 'priority' || f === 'access_type' || f === 'type' ? (
                          <span className={`badge ${getStatusBadge(item[f])}`}>{formatValue(item[f])}</span>
                        ) : formatValue(item[f])}
                      </td>
                    ))}
                    <td>
                      <div className="action-buttons" onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(item)}>Edit</button>
                        <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)'}} onClick={() => handleDelete(item)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail Panel */}
          {selectedItem && (
            <div className="detail-panel">
              <div className="detail-header">
                <h3>Record Details #{selectedItem.id}</h3>
                <div className="detail-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selectedItem)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selectedItem)}>Delete</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedItem(null)}>Close</button>
                </div>
              </div>
              <div className="detail-body">
                {allDisplayKeys.map(key => (
                  <div className="detail-row" key={key}>
                    <span className="detail-label">{formatFieldName(key)}</span>
                    <span className="detail-value">
                      {key === 'status' || key === 'priority' ? (
                        <span className={`badge ${getStatusBadge(selectedItem[key])}`}>{formatValue(selectedItem[key])}</span>
                      ) : formatValue(selectedItem[key])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? 'Edit Item' : 'Create New Item'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {fields.map(field => (
                  <div className="form-group" key={field}>
                    <label>{formatFieldName(field)}</label>
                    {field === 'description' || field === 'content' || field === 'bio' || field === 'notes' ? (
                      <textarea value={formData[field] || ''} onChange={e => setFormData({ ...formData, [field]: e.target.value })} rows={3} />
                    ) : field === 'status' ? (
                      <select value={formData[field] || ''} onChange={e => setFormData({ ...formData, [field]: e.target.value })}>
                        <option value="">Select status</option>
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                        <option value="completed">Completed</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="received">Received</option>
                        <option value="notified">Notified</option>
                        <option value="picked_up">Picked Up</option>
                        <option value="expired">Expired</option>
                        <option value="used">Used</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    ) : field === 'priority' ? (
                      <select value={formData[field] || ''} onChange={e => setFormData({ ...formData, [field]: e.target.value })}>
                        <option value="">Select priority</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    ) : field === 'type' && endpoint === 'desks' ? (
                      <select value={formData[field] || ''} onChange={e => setFormData({ ...formData, [field]: e.target.value })}>
                        <option value="">Select type</option>
                        <option value="hot_desk">Hot Desk</option>
                        <option value="dedicated_desk">Dedicated Desk</option>
                        <option value="standing_desk">Standing Desk</option>
                      </select>
                    ) : field === 'type' && endpoint === 'membership-plans' ? (
                      <select value={formData[field] || ''} onChange={e => setFormData({ ...formData, [field]: e.target.value })}>
                        <option value="">Select type</option>
                        <option value="hot_desk">Hot Desk</option>
                        <option value="dedicated_desk">Dedicated Desk</option>
                        <option value="private_office">Private Office</option>
                      </select>
                    ) : field === 'role' ? (
                      <select value={formData[field] || ''} onChange={e => setFormData({ ...formData, [field]: e.target.value })}>
                        <option value="">Select role</option>
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="guest">Guest</option>
                      </select>
                    ) : field.includes('date') || field.includes('time') ? (
                      <input type="datetime-local" value={formData[field] || ''} onChange={e => setFormData({ ...formData, [field]: e.target.value })} />
                    ) : field.includes('amount') || field.includes('price') || field.includes('rate') || field === 'capacity' || field === 'floor' || field === 'max_members' || field === 'attendees' || field === 'likes' || field === 'member_count' || field === 'usage_count' || field === 'hour' || field === 'occupancy_count' ? (
                      <input type="number" step="0.01" value={formData[field] || ''} onChange={e => setFormData({ ...formData, [field]: e.target.value })} />
                    ) : field.includes('email') ? (
                      <input type="email" value={formData[field] || ''} onChange={e => setFormData({ ...formData, [field]: e.target.value })} />
                    ) : (
                      <input type="text" value={formData[field] || ''} onChange={e => setFormData({ ...formData, [field]: e.target.value })} placeholder={`Enter ${formatFieldName(field).toLowerCase()}`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editItem ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
