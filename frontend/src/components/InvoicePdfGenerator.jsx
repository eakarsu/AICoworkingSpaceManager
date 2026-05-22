import { useEffect, useState } from 'react';
import api from '../api';

export default function InvoicePdfGenerator() {
  const [invoices, setInvoices] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/custom-views/invoices')
      .then(r => {
        setInvoices(r.data);
        if (r.data.length) setSelected(r.data[0].id);
        setError(null);
      })
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    if (!selected) return;
    setDownloading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(`http://localhost:4711/api/custom-views/invoice-pdf/${selected}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setDownloading(false);
    }
  };

  const selectedInv = invoices.find(i => String(i.id) === String(selected));

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Member Invoice PDF Generator</h3>
      {loading && <p>Loading invoices...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!loading && invoices.length === 0 && <p>No invoices available.</p>}
      {!loading && invoices.length > 0 && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Select Invoice:</label>
            <select value={selected} onChange={e => setSelected(e.target.value)} style={{ minWidth: 320, padding: 6 }}>
              {invoices.map(inv => (
                <option key={inv.id} value={inv.id}>
                  INV-{String(inv.id).padStart(6, '0')} | {inv.user_name} | ${Number(inv.amount).toFixed(2)} | {inv.status}
                </option>
              ))}
            </select>
          </div>
          {selectedInv && (
            <div style={{ marginBottom: 12, padding: 10, background: '#f1f5f9', borderRadius: 4, fontSize: 13 }}>
              <div><strong>Member:</strong> {selectedInv.user_name}</div>
              <div><strong>Amount:</strong> ${Number(selectedInv.amount).toFixed(2)}</div>
              <div><strong>Status:</strong> {selectedInv.status}</div>
              <div><strong>Due:</strong> {selectedInv.due_date ? new Date(selectedInv.due_date).toISOString().slice(0, 10) : 'N/A'}</div>
            </div>
          )}
          <button onClick={handleGenerate} disabled={downloading} className="btn btn-primary">
            {downloading ? 'Generating...' : 'Generate PDF'}
          </button>
          {pdfUrl && (
            <div style={{ marginTop: 16 }}>
              <a href={pdfUrl} download={`invoice-${selected}.pdf`} className="btn btn-secondary" style={{ marginRight: 8 }}>
                Download PDF
              </a>
              <a href={pdfUrl} target="_blank" rel="noreferrer" className="btn btn-ghost">
                Open in new tab
              </a>
              <iframe src={pdfUrl} title="invoice" style={{ display: 'block', marginTop: 12, width: '100%', height: 400, border: '1px solid #e2e8f0' }} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
