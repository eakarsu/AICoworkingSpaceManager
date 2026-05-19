import OccupancyHeatmap from '../components/OccupancyHeatmap';
import MemberGrowthChart from '../components/MemberGrowthChart';
import InvoicePdfGenerator from '../components/InvoicePdfGenerator';
import MembershipTierEditor from '../components/MembershipTierEditor';

export default function CustomViewsPage() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Space Views</h1>
        <p style={{ color: '#64748b', marginTop: 4 }}>
          Custom views for coworking space management: occupancy patterns, member growth, invoicing, and access rules.
        </p>
      </div>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, color: '#1e293b' }}>Visual Insights</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 16 }}>
          <OccupancyHeatmap />
          <MemberGrowthChart />
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 18, color: '#1e293b' }}>Operational Tools</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          <InvoicePdfGenerator />
          <MembershipTierEditor />
        </div>
      </section>
    </div>
  );
}
