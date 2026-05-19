import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import FeaturePage from './pages/FeaturePage';
import AIFeaturePage from './pages/AIFeaturePage';
import AICustomToolsPage from './pages/AICustomToolsPage';
import AINewToolsPage from './pages/AINewToolsPage';
import CustomViewsPage from './pages/CustomViewsPage';

// // === Batch 02 Gaps & Frontend Mounts ===
import CfPredictiveMaintenanceOccupancy from './pages/CfPredictiveMaintenanceOccupancy';
import CfDynamicPricingRevenueOptimization from './pages/CfDynamicPricingRevenueOptimization';
import CfCommunityGrowthViralLoops from './pages/CfCommunityGrowthViralLoops';
import CfAmenityUtilizationPrediction from './pages/CfAmenityUtilizationPrediction';
import CfMemberLifetimeValueModeling from './pages/CfMemberLifetimeValueModeling';
import GapMaintenanceCleaningParkingStoragePhoneboothsLackAiEnd from './pages/GapMaintenanceCleaningParkingStoragePhoneboothsLackAiEnd';
import GapAccesscontrolCheckinsLackAiAnomalyDetection from './pages/GapAccesscontrolCheckinsLackAiAnomalyDetection';
import GapLimitedGuestWifiBandwidthManagement from './pages/GapLimitedGuestWifiBandwidthManagement';
import GapLimitedCalendarIntegrationNoFullGoogleOutlookAdapter from './pages/GapLimitedCalendarIntegrationNoFullGoogleOutlookAdapter';
import GapLimitedPaymentIntegrationOnlyStripeStub from './pages/GapLimitedPaymentIntegrationOnlyStripeStub';
import GapNoMemberMobileAppForCheckInBookingCommunity from './pages/GapNoMemberMobileAppForCheckInBookingCommunity';
import GapNoWebhooks from './pages/GapNoWebhooks';

const featureRoutes = [
  { path: 'memberships', title: 'Membership Plans', endpoint: 'membership-plans', fields: ['name','type','price_monthly','features','max_members'], icon: '💳' },
  { path: 'desks', title: 'Desk Management', endpoint: 'desks', fields: ['name','type','floor','zone','status','assigned_to','features'], icon: '🪑' },
  { path: 'meeting-rooms', title: 'Meeting Rooms', endpoint: 'meeting-rooms', fields: ['name','capacity','floor','amenities','hourly_rate','status'], icon: '🏢' },
  { path: 'meeting-bookings', title: 'Room Bookings', endpoint: 'meeting-room-bookings', fields: ['room_id','title','start_time','end_time','attendees','status'], icon: '📅' },
  { path: 'phone-booths', title: 'Phone Booths', endpoint: 'phone-booths', fields: ['name','floor','status'], icon: '📞' },
  { path: 'phone-booth-bookings', title: 'Booth Bookings', endpoint: 'phone-booth-bookings', fields: ['booth_id','start_time','end_time','status'], icon: '🗓️' },
  { path: 'checkins', title: 'Check-in Tracking', endpoint: 'checkins', fields: ['user_id','desk_id','check_in_time','check_out_time'], icon: '✅' },
  { path: 'invoices', title: 'Billing & Invoicing', endpoint: 'invoices', fields: ['user_id','amount','description','status','due_date','paid_date'], icon: '💰' },
  { path: 'visitors', title: 'Visitor Management', endpoint: 'visitors', fields: ['visitor_name','visitor_email','visitor_company','purpose','check_in_time','status'], icon: '🏷️' },
  { path: 'events', title: 'Events Calendar', endpoint: 'events', fields: ['title','description','event_date','start_time','end_time','location','capacity','type','status'], icon: '🎉' },
  { path: 'members', title: 'Member Directory', endpoint: 'users', fields: ['name','email','company','skills','bio','phone','role'], icon: '👥' },
  { path: 'maintenance', title: 'Maintenance Requests', endpoint: 'maintenance-requests', fields: ['title','description','location','priority','status','assigned_to'], icon: '🔧' },
  { path: 'day-passes', title: 'Day Pass Management', endpoint: 'day-passes', fields: ['guest_name','guest_email','guest_phone','date','status','price'], icon: '🎫' },
  { path: 'teams', title: 'Team Accounts', endpoint: 'teams', fields: ['name','company','plan_id','member_count','billing_email'], icon: '👔' },
  { path: 'parking', title: 'Parking Allocation', endpoint: 'parking-spots', fields: ['spot_number','floor','type','status','assigned_to','vehicle_info'], icon: '🅿️' },
  { path: 'storage', title: 'Storage Lockers', endpoint: 'storage-lockers', fields: ['locker_number','size','floor','status','assigned_to','monthly_rate'], icon: '🔐' },
  { path: 'mail-packages', title: 'Mail & Packages', endpoint: 'mail-packages', fields: ['user_id','type','sender','tracking_number','status','notes'], icon: '📦' },
  { path: 'amenities', title: 'Amenity Management', endpoint: 'amenities', fields: ['name','type','description','status','location','usage_count'], icon: '☕' },
  { path: 'access-control', title: 'Access Control', endpoint: 'access-logs', fields: ['user_id','access_point','access_type','method','timestamp'], icon: '🔑' },
  { path: 'community-board', title: 'Community Board', endpoint: 'community-posts', fields: ['title','content','category','likes','pinned'], icon: '📋' },
  { path: 'referrals', title: 'Referral Program', endpoint: 'referrals', fields: ['referee_name','referee_email','status','reward_amount'], icon: '🤝' },
  { path: 'analytics', title: 'Usage Analytics', endpoint: 'usage-analytics', fields: ['date','area','hour','occupancy_count'], icon: '📊' },
  { path: 'cleaning', title: 'Cleaning Schedules', endpoint: 'cleaning-schedules', fields: ['area','scheduled_time','status','assigned_to','notes'], icon: '🧹' },
  { path: 'guest-wifi', title: 'Guest WiFi', endpoint: 'guest-wifi', fields: ['guest_name','access_code','expires_at','status'], icon: '📶' },
];

const aiFeatures = [
  { path: 'ai/member-matching', title: 'AI Member Matching', endpoint: 'ai/member-matching', description: 'Find networking matches based on skills and interests', icon: '🤖', needsUserId: true },
  { path: 'ai/room-optimization', title: 'AI Room Optimization', endpoint: 'ai/room-optimization', description: 'Optimize meeting room usage patterns', icon: '📐' },
  { path: 'ai/newsletter', title: 'AI Newsletter Generator', endpoint: 'ai/newsletter', description: 'Generate community newsletters automatically', icon: '📰' },
  { path: 'ai/pricing', title: 'AI Pricing Recommendations', endpoint: 'ai/pricing-recommendations', description: 'Get personalized pricing tier suggestions', icon: '💡', needsUserId: true },
  { path: 'ai/event-suggestions', title: 'AI Event Suggestions', endpoint: 'ai/event-suggestions', description: 'Get AI-powered event programming ideas', icon: '🎯' },
  { path: 'ai/space-utilization', title: 'AI Space Analysis', endpoint: 'ai/space-utilization', description: 'Analyze space utilization and get layout recommendations', icon: '🏗️' },
];

// Standalone AI custom tools (rendered with their own page, not via AIFeaturePage wrapper)
const customAiPages = [
  { path: 'ai-custom-tools', title: 'AI Custom Tools (7 new)', icon: '🤖' },
  { path: 'ai-new-tools', title: 'AI New Tools (Maintenance & Cleaning)', icon: '🆕' },
];

export { customAiPages };

export { featureRoutes, aiFeatures };

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        
        {/* // === Batch 02 Gaps & Frontend Mounts === */}
        <Route path="/cf/predictive-maintenance-occupancy" element={<CfPredictiveMaintenanceOccupancy />} />
        <Route path="/cf/dynamic-pricing-revenue-optimization" element={<CfDynamicPricingRevenueOptimization />} />
        <Route path="/cf/community-growth-viral-loops" element={<CfCommunityGrowthViralLoops />} />
        <Route path="/cf/amenity-utilization-prediction" element={<CfAmenityUtilizationPrediction />} />
        <Route path="/cf/member-lifetime-value-modeling" element={<CfMemberLifetimeValueModeling />} />
        <Route path="/gap/maintenance-cleaning-parking-storage-phonebooths-lack-ai-end" element={<GapMaintenanceCleaningParkingStoragePhoneboothsLackAiEnd />} />
        <Route path="/gap/accesscontrol-checkins-lack-ai-anomaly-detection" element={<GapAccesscontrolCheckinsLackAiAnomalyDetection />} />
        <Route path="/gap/limited-guest-wifi-bandwidth-management" element={<GapLimitedGuestWifiBandwidthManagement />} />
        <Route path="/gap/limited-calendar-integration-no-full-google-outlook-adapter" element={<GapLimitedCalendarIntegrationNoFullGoogleOutlookAdapter />} />
        <Route path="/gap/limited-payment-integration-only-stripe-stub" element={<GapLimitedPaymentIntegrationOnlyStripeStub />} />
        <Route path="/gap/no-member-mobile-app-for-check-in-booking-community" element={<GapNoMemberMobileAppForCheckInBookingCommunity />} />
        <Route path="/gap/no-webhooks" element={<GapNoWebhooks />} />
      </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          {featureRoutes.map(route => (
            <Route key={route.path} path={`/${route.path}`} element={<FeaturePage config={route} />} />
          ))}
          {aiFeatures.map(route => (
            <Route key={route.path} path={`/${route.path}`} element={<AIFeaturePage config={route} />} />
          ))}
          <Route path="/ai-custom-tools" element={<AICustomToolsPage />} />
          <Route path="/ai-new-tools" element={<AINewToolsPage />} />
          <Route path="/custom-views" element={<CustomViewsPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
