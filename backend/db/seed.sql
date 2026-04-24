-- AI Coworking Space Manager - Seed Data
-- Password for all users: password123
-- bcrypt hash: $2a$10$qeotCOYIIFdCxZ6o11XXg.kThpTwjLy4dTqpOa6V/LZyG7lGZxrGC

-- ============================================================
-- USERS (20 records)
-- ============================================================
INSERT INTO users (email, password_hash, name, role, company, skills, bio, phone, avatar_url) VALUES
('admin@coworkspace.com', '$2a$10$qeotCOYIIFdCxZ6o11XXg.kThpTwjLy4dTqpOa6V/LZyG7lGZxrGC', 'Sarah Mitchell', 'admin', 'CoWork Space Inc.', ARRAY['management', 'operations', 'leadership'], 'Space manager with 8 years of coworking experience.', '+1-555-0101', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah'),
('james.chen@techforge.io', '$2a$10$qeotCOYIIFdCxZ6o11XXg.kThpTwjLy4dTqpOa6V/LZyG7lGZxrGC', 'James Chen', 'member', 'TechForge', ARRAY['python', 'machine-learning', 'data-science'], 'ML engineer building NLP tools for healthcare.', '+1-555-0102', 'https://api.dicebear.com/7.x/avataaars/svg?seed=james'),
('olivia.martinez@designpulse.co', '$2a$10$qeotCOYIIFdCxZ6o11XXg.kThpTwjLy4dTqpOa6V/LZyG7lGZxrGC', 'Olivia Martinez', 'member', 'DesignPulse', ARRAY['ui-design', 'figma', 'user-research'], 'Product designer specializing in SaaS interfaces.', '+1-555-0103', 'https://api.dicebear.com/7.x/avataaars/svg?seed=olivia'),
('daniel.kim@nexlabs.dev', '$2a$10$qeotCOYIIFdCxZ6o11XXg.kThpTwjLy4dTqpOa6V/LZyG7lGZxrGC', 'Daniel Kim', 'member', 'NexLabs', ARRAY['react', 'node.js', 'typescript'], 'Full-stack developer and open-source contributor.', '+1-555-0104', 'https://api.dicebear.com/7.x/avataaars/svg?seed=daniel'),
('priya.sharma@greenleaf.eco', '$2a$10$qeotCOYIIFdCxZ6o11XXg.kThpTwjLy4dTqpOa6V/LZyG7lGZxrGC', 'Priya Sharma', 'member', 'GreenLeaf Ventures', ARRAY['sustainability', 'business-strategy', 'fundraising'], 'Climate-tech entrepreneur building carbon tracking tools.', '+1-555-0105', 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya'),
('marcus.johnson@freelance.com', '$2a$10$qeotCOYIIFdCxZ6o11XXg.kThpTwjLy4dTqpOa6V/LZyG7lGZxrGC', 'Marcus Johnson', 'member', NULL, ARRAY['copywriting', 'content-strategy', 'seo'], 'Freelance content strategist and copywriter.', '+1-555-0106', 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus'),
('emily.watson@bytecraft.ai', '$2a$10$qeotCOYIIFdCxZ6o11XXg.kThpTwjLy4dTqpOa6V/LZyG7lGZxrGC', 'Emily Watson', 'member', 'ByteCraft AI', ARRAY['ai', 'deep-learning', 'computer-vision'], 'AI researcher focused on generative models.', '+1-555-0107', 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily'),
('tom.anderson@coworkspace.com', '$2a$10$qeotCOYIIFdCxZ6o11XXg.kThpTwjLy4dTqpOa6V/LZyG7lGZxrGC', 'Tom Anderson', 'staff', 'CoWork Space Inc.', ARRAY['facilities', 'customer-service'], 'Community manager keeping the space running smoothly.', '+1-555-0108', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tom'),
('rachel.nguyen@pixelworks.studio', '$2a$10$qeotCOYIIFdCxZ6o11XXg.kThpTwjLy4dTqpOa6V/LZyG7lGZxrGC', 'Rachel Nguyen', 'member', 'PixelWorks Studio', ARRAY['video-production', 'animation', 'after-effects'], 'Motion designer creating brand animations.', '+1-555-0109', 'https://api.dicebear.com/7.x/avataaars/svg?seed=rachel'),
('alex.rivera@startupgrind.com', '$2a$10$qeotCOYIIFdCxZ6o11XXg.kThpTwjLy4dTqpOa6V/LZyG7lGZxrGC', 'Alex Rivera', 'member', 'Startup Grind', ARRAY['venture-capital', 'pitch-coaching', 'networking'], 'Startup advisor and angel investor.', '+1-555-0110', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex'),
('sofia.petrov@legaledge.law', '$2a$10$qeotCOYIIFdCxZ6o11XXg.kThpTwjLy4dTqpOa6V/LZyG7lGZxrGC', 'Sofia Petrov', 'member', 'LegalEdge', ARRAY['contract-law', 'ip-law', 'startups'], 'Tech-savvy attorney helping startups with legal needs.', '+1-555-0111', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sofia'),
('noah.williams@cloudnine.dev', '$2a$10$qeotCOYIIFdCxZ6o11XXg.kThpTwjLy4dTqpOa6V/LZyG7lGZxrGC', 'Noah Williams', 'member', 'CloudNine DevOps', ARRAY['aws', 'kubernetes', 'terraform'], 'DevOps engineer and cloud architecture consultant.', '+1-555-0112', 'https://api.dicebear.com/7.x/avataaars/svg?seed=noah'),
('lisa.chang@finpro.io', '$2a$10$qeotCOYIIFdCxZ6o11XXg.kThpTwjLy4dTqpOa6V/LZyG7lGZxrGC', 'Lisa Chang', 'member', 'FinPro Analytics', ARRAY['financial-modeling', 'excel', 'data-analysis'], 'Financial analyst building forecasting models.', '+1-555-0113', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa'),
('ben.okafor@socialboost.co', '$2a$10$qeotCOYIIFdCxZ6o11XXg.kThpTwjLy4dTqpOa6V/LZyG7lGZxrGC', 'Ben Okafor', 'member', 'SocialBoost', ARRAY['social-media', 'digital-marketing', 'analytics'], 'Digital marketing specialist scaling e-commerce brands.', '+1-555-0114', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ben'),
('hannah.lee@wellnessworks.co', '$2a$10$qeotCOYIIFdCxZ6o11XXg.kThpTwjLy4dTqpOa6V/LZyG7lGZxrGC', 'Hannah Lee', 'member', 'WellnessWorks', ARRAY['wellness', 'coaching', 'meditation'], 'Corporate wellness coach and mindfulness instructor.', '+1-555-0115', 'https://api.dicebear.com/7.x/avataaars/svg?seed=hannah'),
('carlos.mendez@appforge.dev', '$2a$10$qeotCOYIIFdCxZ6o11XXg.kThpTwjLy4dTqpOa6V/LZyG7lGZxrGC', 'Carlos Mendez', 'member', 'AppForge', ARRAY['ios', 'swift', 'mobile-development'], 'iOS developer building health and fitness apps.', '+1-555-0116', 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos'),
('maya.thompson@brandstory.agency', '$2a$10$qeotCOYIIFdCxZ6o11XXg.kThpTwjLy4dTqpOa6V/LZyG7lGZxrGC', 'Maya Thompson', 'member', 'BrandStory Agency', ARRAY['branding', 'graphic-design', 'photography'], 'Creative director with a passion for brand storytelling.', '+1-555-0117', 'https://api.dicebear.com/7.x/avataaars/svg?seed=maya'),
('kevin.patel@datastream.io', '$2a$10$qeotCOYIIFdCxZ6o11XXg.kThpTwjLy4dTqpOa6V/LZyG7lGZxrGC', 'Kevin Patel', 'member', 'DataStream', ARRAY['big-data', 'spark', 'scala'], 'Data engineer building real-time analytics pipelines.', '+1-555-0118', 'https://api.dicebear.com/7.x/avataaars/svg?seed=kevin'),
('jenny.coworkstaff@coworkspace.com', '$2a$10$qeotCOYIIFdCxZ6o11XXg.kThpTwjLy4dTqpOa6V/LZyG7lGZxrGC', 'Jenny Brooks', 'staff', 'CoWork Space Inc.', ARRAY['event-planning', 'community-management'], 'Events coordinator and community builder.', '+1-555-0119', 'https://api.dicebear.com/7.x/avataaars/svg?seed=jenny'),
('ryan.foster@quantumleap.tech', '$2a$10$qeotCOYIIFdCxZ6o11XXg.kThpTwjLy4dTqpOa6V/LZyG7lGZxrGC', 'Ryan Foster', 'member', 'QuantumLeap Tech', ARRAY['blockchain', 'solidity', 'web3'], 'Web3 developer building decentralized applications.', '+1-555-0120', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ryan');

-- ============================================================
-- MEMBERSHIP PLANS (15 records)
-- ============================================================
INSERT INTO membership_plans (name, type, price_monthly, features, max_members) VALUES
('Explorer', 'hot_desk', 199.00, '["5 days/month", "Community events", "High-speed WiFi", "Coffee & tea"]', 1),
('Flex Pass', 'hot_desk', 349.00, '["10 days/month", "Community events", "High-speed WiFi", "Coffee & tea", "Printing credits"]', 1),
('Unlimited Hot Desk', 'hot_desk', 499.00, '["Unlimited access", "Community events", "High-speed WiFi", "Coffee & tea", "Printing credits", "Mail handling"]', 1),
('Dedicated Desk Basic', 'dedicated_desk', 699.00, '["24/7 access", "Personal desk", "Lockable storage", "High-speed WiFi", "Mail handling"]', 1),
('Dedicated Desk Pro', 'dedicated_desk', 849.00, '["24/7 access", "Personal desk", "Lockable storage", "High-speed WiFi", "Mail handling", "4h meeting room/month", "Phone booth access"]', 1),
('Dedicated Desk Premium', 'dedicated_desk', 999.00, '["24/7 access", "Personal desk", "Lockable storage", "High-speed WiFi", "Mail handling", "8h meeting room/month", "Phone booth access", "Parking spot"]', 1),
('Small Office 2-4', 'private_office', 1800.00, '["24/7 access", "Private office", "2-4 people", "Furnished", "High-speed WiFi", "Mail handling", "8h meeting room/month"]', 4),
('Medium Office 5-8', 'private_office', 3200.00, '["24/7 access", "Private office", "5-8 people", "Furnished", "High-speed WiFi", "Mail handling", "16h meeting room/month", "Dedicated phone line"]', 8),
('Large Office 9-15', 'private_office', 5500.00, '["24/7 access", "Private office", "9-15 people", "Furnished", "High-speed WiFi", "Mail handling", "Unlimited meeting rooms", "Dedicated phone line", "Branding on door"]', 15),
('Enterprise Suite', 'private_office', 8500.00, '["24/7 access", "Private suite", "16-25 people", "Custom build-out", "Dedicated internet", "Admin support", "Unlimited meeting rooms"]', 25),
('Weekend Warrior', 'hot_desk', 149.00, '["Weekends only", "High-speed WiFi", "Coffee & tea"]', 1),
('Student Plan', 'hot_desk', 129.00, '["Weekdays 9-5", "High-speed WiFi", "Coffee & tea", "Community events"]', 1),
('Team Flex 5', 'hot_desk', 1599.00, '["5 team members", "Unlimited hot desk", "8h meeting room/month", "Team locker"]', 5),
('Startup Package', 'dedicated_desk', 2499.00, '["4 dedicated desks", "Meeting room credits", "Mentorship program", "Pitch event access"]', 4),
('Corporate Satellite', 'private_office', 4200.00, '["Private office 6-10", "Corporate branding", "Dedicated reception", "IT support", "Admin services"]', 10);

-- ============================================================
-- DESKS (20 records)
-- ============================================================
INSERT INTO desks (name, type, floor, zone, status, assigned_to, features) VALUES
('HD-101', 'hot_desk', 1, 'Open Area A', 'available', NULL, '["power-outlet", "monitor-arm"]'),
('HD-102', 'hot_desk', 1, 'Open Area A', 'occupied', 6, '["power-outlet"]'),
('HD-103', 'hot_desk', 1, 'Open Area A', 'available', NULL, '["power-outlet", "standing-option"]'),
('HD-104', 'hot_desk', 1, 'Open Area B', 'available', NULL, '["power-outlet"]'),
('HD-105', 'hot_desk', 1, 'Open Area B', 'maintenance', NULL, '["power-outlet"]'),
('HD-201', 'hot_desk', 2, 'Quiet Zone', 'available', NULL, '["power-outlet", "privacy-screen"]'),
('HD-202', 'hot_desk', 2, 'Quiet Zone', 'occupied', 14, '["power-outlet", "privacy-screen"]'),
('DD-201', 'dedicated_desk', 2, 'Dedicated Row A', 'occupied', 2, '["dual-monitor", "lockable-drawer", "ergonomic-chair"]'),
('DD-202', 'dedicated_desk', 2, 'Dedicated Row A', 'occupied', 4, '["dual-monitor", "lockable-drawer", "ergonomic-chair"]'),
('DD-203', 'dedicated_desk', 2, 'Dedicated Row A', 'occupied', 5, '["dual-monitor", "lockable-drawer"]'),
('DD-204', 'dedicated_desk', 2, 'Dedicated Row B', 'occupied', 7, '["ultrawide-monitor", "lockable-drawer", "ergonomic-chair"]'),
('DD-205', 'dedicated_desk', 2, 'Dedicated Row B', 'available', NULL, '["dual-monitor", "lockable-drawer"]'),
('DD-301', 'dedicated_desk', 3, 'Dedicated Row C', 'occupied', 9, '["dual-monitor", "lockable-drawer"]'),
('DD-302', 'dedicated_desk', 3, 'Dedicated Row C', 'occupied', 12, '["dual-monitor", "lockable-drawer", "ergonomic-chair"]'),
('SD-101', 'standing_desk', 1, 'Standing Area', 'available', NULL, '["adjustable-height", "anti-fatigue-mat", "monitor-arm"]'),
('SD-102', 'standing_desk', 1, 'Standing Area', 'occupied', 16, '["adjustable-height", "anti-fatigue-mat"]'),
('SD-201', 'standing_desk', 2, 'Standing Area', 'available', NULL, '["adjustable-height", "anti-fatigue-mat", "monitor-arm"]'),
('HD-301', 'hot_desk', 3, 'Open Area C', 'available', NULL, '["power-outlet"]'),
('HD-302', 'hot_desk', 3, 'Open Area C', 'available', NULL, '["power-outlet", "window-view"]'),
('HD-303', 'hot_desk', 3, 'Open Area C', 'occupied', 18, '["power-outlet", "window-view"]');

-- ============================================================
-- MEETING ROOMS (15 records)
-- ============================================================
INSERT INTO meeting_rooms (name, capacity, floor, amenities, hourly_rate, status) VALUES
('Sequoia', 4, 1, '["whiteboard", "tv-screen", "video-conferencing"]', 25.00, 'available'),
('Redwood', 6, 1, '["whiteboard", "tv-screen", "video-conferencing", "phone-speaker"]', 35.00, 'available'),
('Evergreen', 8, 1, '["whiteboard", "projector", "video-conferencing", "phone-speaker"]', 45.00, 'occupied'),
('Maple', 4, 2, '["whiteboard", "tv-screen"]', 20.00, 'available'),
('Birch', 6, 2, '["whiteboard", "tv-screen", "video-conferencing"]', 35.00, 'available'),
('Oak', 10, 2, '["whiteboard", "projector", "video-conferencing", "phone-speaker", "recording-setup"]', 60.00, 'available'),
('Cedar', 4, 2, '["whiteboard", "tv-screen"]', 20.00, 'maintenance'),
('Pine', 12, 3, '["whiteboard", "dual-projector", "video-conferencing", "surround-sound", "recording-setup"]', 80.00, 'available'),
('Willow', 3, 3, '["whiteboard", "tv-screen"]', 15.00, 'available'),
('Summit', 20, 3, '["stage", "projector", "microphone-system", "recording-setup", "video-conferencing"]', 150.00, 'available'),
('Bamboo', 4, 1, '["whiteboard", "tv-screen", "standing-table"]', 22.00, 'available'),
('Aspen', 6, 3, '["whiteboard", "tv-screen", "video-conferencing"]', 35.00, 'available'),
('Cypress', 8, 1, '["whiteboard", "projector", "video-conferencing"]', 45.00, 'available'),
('Juniper', 2, 2, '["tv-screen"]', 15.00, 'available'),
('Magnolia', 16, 3, '["whiteboard", "projector", "video-conferencing", "catering-ready", "recording-setup"]', 100.00, 'available');

-- ============================================================
-- MEETING ROOM BOOKINGS (18 records)
-- ============================================================
INSERT INTO meeting_room_bookings (room_id, user_id, title, start_time, end_time, attendees, status) VALUES
(1, 2, 'ML Model Review', '2026-03-23 09:00:00', '2026-03-23 10:00:00', 3, 'confirmed'),
(2, 4, 'Sprint Planning', '2026-03-23 10:00:00', '2026-03-23 11:30:00', 5, 'confirmed'),
(3, 5, 'Investor Pitch Prep', '2026-03-23 13:00:00', '2026-03-23 15:00:00', 6, 'confirmed'),
(6, 10, 'Startup Mentorship Session', '2026-03-23 14:00:00', '2026-03-23 16:00:00', 8, 'confirmed'),
(8, 1, 'All-Hands Meeting', '2026-03-24 09:00:00', '2026-03-24 10:30:00', 12, 'confirmed'),
(10, 19, 'Community Workshop Setup', '2026-03-24 13:00:00', '2026-03-24 17:00:00', 18, 'confirmed'),
(4, 3, 'Design Review', '2026-03-24 11:00:00', '2026-03-24 12:00:00', 3, 'confirmed'),
(5, 7, 'AI Research Sync', '2026-03-25 09:00:00', '2026-03-25 10:00:00', 4, 'confirmed'),
(1, 11, 'Legal Consultation', '2026-03-25 14:00:00', '2026-03-25 15:00:00', 2, 'confirmed'),
(9, 6, 'Content Planning', '2026-03-25 10:00:00', '2026-03-25 11:00:00', 2, 'confirmed'),
(2, 12, 'Cloud Migration Planning', '2026-03-25 13:00:00', '2026-03-25 15:00:00', 5, 'confirmed'),
(6, 13, 'Financial Review Q1', '2026-03-26 09:00:00', '2026-03-26 11:00:00', 6, 'confirmed'),
(15, 1, 'Town Hall Meeting', '2026-03-26 15:00:00', '2026-03-26 17:00:00', 14, 'confirmed'),
(3, 4, 'Client Demo', '2026-03-26 11:00:00', '2026-03-26 12:00:00', 7, 'confirmed'),
(4, 17, 'Brand Workshop', '2026-03-27 09:00:00', '2026-03-27 12:00:00', 4, 'confirmed'),
(1, 20, 'Web3 Brainstorm', '2026-03-22 10:00:00', '2026-03-22 11:30:00', 3, 'completed'),
(8, 10, 'Pitch Night Rehearsal', '2026-03-21 16:00:00', '2026-03-21 18:00:00', 10, 'completed'),
(5, 2, 'Data Pipeline Architecture', '2026-03-20 14:00:00', '2026-03-20 16:00:00', 5, 'completed');

-- ============================================================
-- PHONE BOOTHS (15 records)
-- ============================================================
INSERT INTO phone_booths (name, floor, status) VALUES
('Booth A1', 1, 'available'),
('Booth A2', 1, 'occupied'),
('Booth A3', 1, 'available'),
('Booth A4', 1, 'maintenance'),
('Booth B1', 2, 'available'),
('Booth B2', 2, 'available'),
('Booth B3', 2, 'occupied'),
('Booth B4', 2, 'available'),
('Booth B5', 2, 'available'),
('Booth C1', 3, 'available'),
('Booth C2', 3, 'available'),
('Booth C3', 3, 'occupied'),
('Booth C4', 3, 'available'),
('Booth C5', 3, 'available'),
('Booth C6', 3, 'available');

-- ============================================================
-- PHONE BOOTH BOOKINGS (16 records)
-- ============================================================
INSERT INTO phone_booth_bookings (booth_id, user_id, start_time, end_time, status) VALUES
(2, 2, '2026-03-23 09:00:00', '2026-03-23 09:30:00', 'confirmed'),
(7, 5, '2026-03-23 10:00:00', '2026-03-23 10:30:00', 'confirmed'),
(12, 10, '2026-03-23 11:00:00', '2026-03-23 11:45:00', 'confirmed'),
(1, 4, '2026-03-23 14:00:00', '2026-03-23 14:30:00', 'confirmed'),
(5, 7, '2026-03-23 15:00:00', '2026-03-23 15:30:00', 'confirmed'),
(3, 11, '2026-03-24 09:00:00', '2026-03-24 10:00:00', 'confirmed'),
(8, 13, '2026-03-24 10:00:00', '2026-03-24 10:30:00', 'confirmed'),
(10, 6, '2026-03-24 13:00:00', '2026-03-24 13:30:00', 'confirmed'),
(6, 14, '2026-03-24 14:00:00', '2026-03-24 14:45:00', 'confirmed'),
(1, 12, '2026-03-25 09:00:00', '2026-03-25 09:30:00', 'confirmed'),
(9, 3, '2026-03-25 11:00:00', '2026-03-25 11:30:00', 'confirmed'),
(2, 16, '2026-03-22 10:00:00', '2026-03-22 10:30:00', 'completed'),
(5, 9, '2026-03-22 14:00:00', '2026-03-22 14:30:00', 'completed'),
(11, 20, '2026-03-21 09:00:00', '2026-03-21 09:30:00', 'completed'),
(3, 17, '2026-03-21 15:00:00', '2026-03-21 15:30:00', 'completed'),
(7, 18, '2026-03-20 11:00:00', '2026-03-20 11:30:00', 'completed');

-- ============================================================
-- CHECKINS (20 records)
-- ============================================================
INSERT INTO checkins (user_id, check_in_time, check_out_time, desk_id) VALUES
(2, '2026-03-23 08:15:00', NULL, 8),
(4, '2026-03-23 08:30:00', NULL, 9),
(5, '2026-03-23 08:45:00', NULL, 10),
(6, '2026-03-23 09:00:00', NULL, 2),
(7, '2026-03-23 08:00:00', NULL, 11),
(9, '2026-03-23 09:15:00', NULL, 13),
(12, '2026-03-23 07:45:00', NULL, 14),
(14, '2026-03-23 09:30:00', NULL, 7),
(16, '2026-03-23 08:30:00', NULL, 16),
(18, '2026-03-23 09:00:00', NULL, 20),
(2, '2026-03-22 08:20:00', '2026-03-22 17:30:00', 8),
(4, '2026-03-22 09:00:00', '2026-03-22 18:00:00', 9),
(3, '2026-03-22 10:00:00', '2026-03-22 16:00:00', 1),
(5, '2026-03-22 08:30:00', '2026-03-22 17:00:00', 10),
(7, '2026-03-22 07:55:00', '2026-03-22 19:00:00', 11),
(10, '2026-03-21 09:00:00', '2026-03-21 17:00:00', 4),
(13, '2026-03-21 08:45:00', '2026-03-21 16:30:00', 1),
(6, '2026-03-21 10:00:00', '2026-03-21 15:00:00', 3),
(11, '2026-03-20 09:00:00', '2026-03-20 18:00:00', 6),
(15, '2026-03-20 08:00:00', '2026-03-20 14:00:00', 4);

-- ============================================================
-- INVOICES (20 records)
-- ============================================================
INSERT INTO invoices (user_id, amount, description, status, due_date, paid_date) VALUES
(2, 849.00, 'Dedicated Desk Pro - March 2026', 'paid', '2026-03-01', '2026-02-28'),
(3, 499.00, 'Unlimited Hot Desk - March 2026', 'paid', '2026-03-01', '2026-03-01'),
(4, 699.00, 'Dedicated Desk Basic - March 2026', 'paid', '2026-03-01', '2026-02-27'),
(5, 999.00, 'Dedicated Desk Premium - March 2026', 'paid', '2026-03-01', '2026-03-01'),
(6, 349.00, 'Flex Pass - March 2026', 'paid', '2026-03-01', '2026-03-02'),
(7, 849.00, 'Dedicated Desk Pro - March 2026', 'paid', '2026-03-01', '2026-02-28'),
(9, 699.00, 'Dedicated Desk Basic - March 2026', 'pending', '2026-04-01', NULL),
(10, 499.00, 'Unlimited Hot Desk - March 2026', 'paid', '2026-03-01', '2026-03-01'),
(11, 499.00, 'Unlimited Hot Desk - March 2026', 'paid', '2026-03-01', '2026-02-28'),
(12, 849.00, 'Dedicated Desk Pro - March 2026', 'paid', '2026-03-01', '2026-03-01'),
(13, 349.00, 'Flex Pass - March 2026', 'overdue', '2026-03-01', NULL),
(14, 199.00, 'Explorer - March 2026', 'paid', '2026-03-01', '2026-03-03'),
(15, 129.00, 'Student Plan - March 2026', 'paid', '2026-03-01', '2026-02-28'),
(16, 699.00, 'Dedicated Desk Basic - March 2026', 'paid', '2026-03-01', '2026-03-01'),
(17, 499.00, 'Unlimited Hot Desk - March 2026', 'pending', '2026-04-01', NULL),
(18, 849.00, 'Dedicated Desk Pro - March 2026', 'paid', '2026-03-01', '2026-02-28'),
(20, 499.00, 'Unlimited Hot Desk - March 2026', 'paid', '2026-03-01', '2026-03-01'),
(2, 45.00, 'Meeting Room: Oak - 2 hours', 'paid', '2026-03-15', '2026-03-15'),
(5, 60.00, 'Meeting Room: Evergreen - 2 hours', 'paid', '2026-03-15', '2026-03-14'),
(10, 80.00, 'Meeting Room: Pine - 2 hours', 'pending', '2026-04-01', NULL);

-- ============================================================
-- VISITORS (18 records)
-- ============================================================
INSERT INTO visitors (host_user_id, visitor_name, visitor_email, visitor_company, purpose, check_in_time, check_out_time, badge_number, status) VALUES
(2, 'Dr. Sarah Lin', 'sarah.lin@stanford.edu', 'Stanford University', 'Research collaboration meeting', '2026-03-23 09:00:00', NULL, 'V-101', 'checked_in'),
(5, 'Michael Torres', 'mtorres@venturecap.com', 'VentureCap Partners', 'Investment pitch', '2026-03-23 13:00:00', NULL, 'V-102', 'expected'),
(10, 'Amanda Brooks', 'abrooks@techstars.com', 'Techstars', 'Startup mentorship', '2026-03-23 14:00:00', NULL, 'V-103', 'expected'),
(4, 'Jason Wu', 'jwu@clientcorp.com', 'ClientCorp', 'Product demo', '2026-03-23 10:30:00', NULL, 'V-104', 'checked_in'),
(11, 'Patricia Hernandez', 'phernandez@lawfirm.com', 'Morrison & Associates', 'Legal consultation', '2026-03-24 09:00:00', NULL, NULL, 'expected'),
(7, 'Dr. Robert Chang', 'rchang@mit.edu', 'MIT CSAIL', 'AI research discussion', '2026-03-24 10:00:00', NULL, NULL, 'expected'),
(3, 'Laura Kim', 'lkim@clientdesign.com', 'DesignFlow', 'Design review', '2026-03-22 11:00:00', '2026-03-22 13:00:00', 'V-098', 'checked_out'),
(5, 'David Park', 'dpark@greeninvest.com', 'Green Investments', 'Funding discussion', '2026-03-22 14:00:00', '2026-03-22 16:30:00', 'V-099', 'checked_out'),
(2, 'Jennifer Adams', 'jadams@healthtech.io', 'HealthTech Solutions', 'Partnership meeting', '2026-03-21 09:00:00', '2026-03-21 11:00:00', 'V-095', 'checked_out'),
(12, 'Tom Reynolds', 'treynolds@awsconsult.com', 'AWS Consulting', 'Cloud migration review', '2026-03-21 13:00:00', '2026-03-21 15:00:00', 'V-096', 'checked_out'),
(10, 'Samantha Gold', 'sgold@angellist.com', 'AngelList', 'Startup evaluation', '2026-03-20 10:00:00', '2026-03-20 12:00:00', 'V-090', 'checked_out'),
(4, 'Chris Martinez', 'cmartinez@qa.com', 'QA Solutions', 'Code review session', '2026-03-25 09:00:00', NULL, NULL, 'expected'),
(6, 'Nina Patel', 'npatel@publisher.com', 'TechPublish Media', 'Content partnership', '2026-03-25 11:00:00', NULL, NULL, 'expected'),
(17, 'George Liu', 'gliu@printshop.com', 'CreativePrint', 'Branding materials review', '2026-03-25 14:00:00', NULL, NULL, 'expected'),
(20, 'Alice Nakamura', 'anakamura@ethereum.org', 'Ethereum Foundation', 'Web3 collaboration', '2026-03-26 10:00:00', NULL, NULL, 'expected'),
(13, 'Brian Foster', 'bfoster@bankpartner.com', 'First National Bank', 'Financial review', '2026-03-20 14:00:00', '2026-03-20 16:00:00', 'V-091', 'checked_out'),
(15, 'Karen Williams', 'kwilliams@yogaco.com', 'YogaCo', 'Wellness program planning', '2026-03-19 09:00:00', '2026-03-19 10:30:00', 'V-087', 'checked_out'),
(9, 'Derek Stone', 'dstone@filmstudio.com', 'Indie Film Studio', 'Animation project kickoff', '2026-03-22 09:00:00', '2026-03-22 12:00:00', 'V-097', 'checked_out');

-- ============================================================
-- EVENTS (16 records)
-- ============================================================
INSERT INTO events (title, description, event_date, start_time, end_time, location, capacity, attendees_count, organizer_id, type, status) VALUES
('AI & Machine Learning Meetup', 'Monthly meetup discussing latest trends in AI/ML. This month: Large Language Models in Production.', '2026-03-25', '2026-03-25 18:00:00', '2026-03-25 20:00:00', 'Summit Room (3rd Floor)', 20, 14, 7, 'meetup', 'upcoming'),
('Startup Pitch Night', 'Five early-stage startups pitch to a panel of investors. Networking reception follows.', '2026-03-27', '2026-03-27 17:00:00', '2026-03-27 20:00:00', 'Summit Room (3rd Floor)', 50, 38, 10, 'networking', 'upcoming'),
('Design Thinking Workshop', 'Hands-on workshop covering design thinking methodology. Bring your current project challenges.', '2026-03-28', '2026-03-28 10:00:00', '2026-03-28 13:00:00', 'Magnolia Room (3rd Floor)', 16, 12, 3, 'workshop', 'upcoming'),
('Friday Social: Rooftop Happy Hour', 'Casual networking with drinks and snacks on the rooftop terrace. All members welcome!', '2026-03-28', '2026-03-28 17:00:00', '2026-03-28 19:00:00', 'Rooftop Terrace', 40, 22, 19, 'social', 'upcoming'),
('Cloud Architecture Seminar', 'Deep dive into cloud-native architecture patterns with hands-on AWS/GCP examples.', '2026-03-30', '2026-03-30 14:00:00', '2026-03-30 17:00:00', 'Pine Room (3rd Floor)', 12, 8, 12, 'seminar', 'upcoming'),
('Wellness Wednesday: Meditation & Yoga', 'Take a break with guided meditation and gentle yoga. Mats provided.', '2026-03-25', '2026-03-25 12:00:00', '2026-03-25 13:00:00', 'Wellness Room (1st Floor)', 15, 9, 15, 'social', 'upcoming'),
('Web3 Hackathon', 'Build a decentralized app in 48 hours. Teams of 2-4. Prizes for top 3.', '2026-04-05', '2026-04-05 09:00:00', '2026-04-06 18:00:00', 'Full 3rd Floor', 60, 32, 20, 'hackathon', 'upcoming'),
('Legal Clinic: Startup Essentials', 'Free 15-min consultations on incorporation, IP, and contracts.', '2026-04-02', '2026-04-02 10:00:00', '2026-04-02 14:00:00', 'Sequoia Room (1st Floor)', 8, 6, 11, 'workshop', 'upcoming'),
('Data Engineering Best Practices', 'Talk and Q&A on building reliable data pipelines at scale.', '2026-03-22', '2026-03-22 15:00:00', '2026-03-22 17:00:00', 'Oak Room (2nd Floor)', 10, 10, 18, 'seminar', 'completed'),
('Marketing Masterclass', 'Learn growth hacking techniques and social media strategies for B2B SaaS.', '2026-03-20', '2026-03-20 14:00:00', '2026-03-20 16:00:00', 'Birch Room (2nd Floor)', 12, 11, 14, 'workshop', 'completed'),
('New Member Orientation', 'Welcome session for new members. Tour the space and meet the community.', '2026-03-18', '2026-03-18 10:00:00', '2026-03-18 11:30:00', 'Redwood Room (1st Floor)', 10, 5, 1, 'meetup', 'completed'),
('Founders Breakfast', 'Monthly breakfast for founders. Share wins, challenges, and ask for help.', '2026-04-01', '2026-04-01 08:00:00', '2026-04-01 09:30:00', 'Cafe Area (1st Floor)', 20, 11, 10, 'networking', 'upcoming'),
('iOS Development Workshop', 'Building SwiftUI apps from scratch. Bring your MacBook.', '2026-04-03', '2026-04-03 10:00:00', '2026-04-03 13:00:00', 'Maple Room (2nd Floor)', 8, 5, 16, 'workshop', 'upcoming'),
('Photography for Brands', 'Learn product and brand photography with your smartphone.', '2026-04-04', '2026-04-04 14:00:00', '2026-04-04 16:00:00', 'Creative Studio (1st Floor)', 10, 7, 17, 'workshop', 'upcoming'),
('Financial Planning for Freelancers', 'Tax planning, retirement accounts, and budgeting for independent workers.', '2026-03-19', '2026-03-19 11:00:00', '2026-03-19 12:30:00', 'Birch Room (2nd Floor)', 12, 12, 13, 'seminar', 'completed'),
('Community Town Hall - March', 'Monthly community meeting. Share feedback and hear about upcoming changes.', '2026-03-17', '2026-03-17 17:00:00', '2026-03-17 18:00:00', 'Summit Room (3rd Floor)', 30, 24, 1, 'meetup', 'completed');

-- ============================================================
-- MEMBER PROFILES (15 records)
-- ============================================================
INSERT INTO member_profiles (user_id, skills, interests, availability, linkedin, website) VALUES
(2, ARRAY['python', 'tensorflow', 'nlp', 'data-science'], ARRAY['ai-research', 'hiking', 'chess'], 'Full-time weekdays', 'https://linkedin.com/in/jameschen', 'https://jameschen.dev'),
(3, ARRAY['ui-design', 'figma', 'sketch', 'user-research', 'prototyping'], ARRAY['design-systems', 'art', 'travel'], 'Mon-Thu', 'https://linkedin.com/in/oliviamartinez', 'https://oliviamartinez.design'),
(4, ARRAY['react', 'node.js', 'typescript', 'graphql', 'postgresql'], ARRAY['open-source', 'gaming', 'coffee'], 'Full-time weekdays', 'https://linkedin.com/in/danielkim', 'https://danielkim.dev'),
(5, ARRAY['sustainability', 'business-strategy', 'fundraising', 'pitch-decks'], ARRAY['climate-tech', 'running', 'podcasts'], 'Flexible', 'https://linkedin.com/in/priyasharma', 'https://greenleaf.eco'),
(6, ARRAY['copywriting', 'content-strategy', 'seo', 'email-marketing'], ARRAY['writing', 'philosophy', 'board-games'], 'Mornings preferred', 'https://linkedin.com/in/marcusjohnson', NULL),
(7, ARRAY['deep-learning', 'computer-vision', 'pytorch', 'research'], ARRAY['ai-ethics', 'painting', 'rock-climbing'], 'Full-time weekdays', 'https://linkedin.com/in/emilywatson', 'https://bytecraft.ai/emily'),
(9, ARRAY['video-production', 'animation', 'after-effects', 'premiere-pro'], ARRAY['filmmaking', 'music', 'cycling'], 'Flexible', 'https://linkedin.com/in/rachelnguyen', 'https://pixelworks.studio'),
(10, ARRAY['venture-capital', 'pitch-coaching', 'networking', 'due-diligence'], ARRAY['startups', 'golf', 'wine-tasting'], 'Afternoons', 'https://linkedin.com/in/alexrivera', 'https://alexrivera.vc'),
(11, ARRAY['contract-law', 'ip-law', 'startup-legal', 'compliance'], ARRAY['legal-tech', 'yoga', 'cooking'], 'Mon-Wed-Fri', 'https://linkedin.com/in/sofiapetrov', 'https://legaledge.law'),
(12, ARRAY['aws', 'kubernetes', 'terraform', 'docker', 'ci-cd'], ARRAY['devops', 'automation', 'mountain-biking'], 'Full-time weekdays', 'https://linkedin.com/in/noahwilliams', 'https://cloudnine.dev'),
(13, ARRAY['financial-modeling', 'excel', 'data-analysis', 'forecasting'], ARRAY['fintech', 'tennis', 'reading'], 'Full-time weekdays', 'https://linkedin.com/in/lisachang', 'https://finpro.io'),
(16, ARRAY['ios', 'swift', 'swiftui', 'mobile-development'], ARRAY['health-tech', 'fitness', 'photography'], 'Full-time weekdays', 'https://linkedin.com/in/carlosmendez', 'https://appforge.dev'),
(17, ARRAY['branding', 'graphic-design', 'photography', 'illustration'], ARRAY['visual-storytelling', 'galleries', 'travel'], 'Flexible', 'https://linkedin.com/in/mayathompson', 'https://brandstory.agency'),
(18, ARRAY['big-data', 'spark', 'scala', 'kafka', 'data-pipelines'], ARRAY['data-engineering', 'basketball', 'cooking'], 'Full-time weekdays', 'https://linkedin.com/in/kevinpatel', 'https://datastream.io'),
(20, ARRAY['blockchain', 'solidity', 'web3', 'smart-contracts', 'defi'], ARRAY['decentralization', 'crypto', 'surfing'], 'Flexible', 'https://linkedin.com/in/ryanfoster', 'https://quantumleap.tech');

-- ============================================================
-- MAINTENANCE REQUESTS (16 records)
-- ============================================================
INSERT INTO maintenance_requests (user_id, title, description, location, priority, status, assigned_to, created_at, resolved_at) VALUES
(2, 'Monitor flickering', 'The external monitor at DD-201 has intermittent flickering. Makes it hard to work after lunch.', 'Desk DD-201, Floor 2', 'medium', 'open', 'IT Support', '2026-03-23 08:30:00', NULL),
(4, 'Chair squeaking', 'Office chair at DD-202 squeaks loudly when leaning back.', 'Desk DD-202, Floor 2', 'low', 'open', NULL, '2026-03-22 14:00:00', NULL),
(6, 'AC too cold in Open Area B', 'The temperature in Open Area B on Floor 1 is uncomfortably cold. Multiple members have complained.', 'Open Area B, Floor 1', 'medium', 'in_progress', 'Facilities Team', '2026-03-21 10:00:00', NULL),
(9, 'Light bulb out', 'Overhead light at DD-301 is burnt out.', 'Desk DD-301, Floor 3', 'low', 'resolved', 'Maintenance Staff', '2026-03-19 09:00:00', '2026-03-19 14:00:00'),
(12, 'Ethernet port not working', 'Ethernet port at DD-302 does not detect cable. Need wired connection for deployments.', 'Desk DD-302, Floor 3', 'high', 'in_progress', 'IT Support', '2026-03-22 11:00:00', NULL),
(3, 'Whiteboard markers dried out', 'All markers in the Maple room are dried out. Need replacements.', 'Maple Room, Floor 2', 'low', 'resolved', 'Tom Anderson', '2026-03-20 10:00:00', '2026-03-20 11:30:00'),
(7, 'Projector not connecting', 'Projector in Evergreen room fails to connect via HDMI. Only works with USB-C sometimes.', 'Evergreen Room, Floor 1', 'high', 'open', 'IT Support', '2026-03-23 07:45:00', NULL),
(5, 'Water leak near kitchen', 'Small water leak under the kitchen sink on Floor 2. Getting worse.', 'Kitchen, Floor 2', 'urgent', 'in_progress', 'Plumbing Services', '2026-03-22 16:00:00', NULL),
(10, 'Door lock sticking', 'The key card reader on the 3rd floor entrance is slow to respond. Sometimes need 3-4 taps.', '3rd Floor Main Entrance', 'medium', 'open', 'Security Team', '2026-03-23 09:15:00', NULL),
(14, 'Printer paper jam', 'Floor 2 printer has recurring paper jams. Cleared it twice today.', 'Print Station, Floor 2', 'medium', 'resolved', 'IT Support', '2026-03-21 13:00:00', '2026-03-21 15:00:00'),
(16, 'Standing desk won''t lower', 'Electric standing desk SD-102 is stuck in the up position. Motor makes noise but desk won''t move.', 'Desk SD-102, Floor 1', 'high', 'open', 'Furniture Vendor', '2026-03-23 08:00:00', NULL),
(18, 'WiFi dead zone', 'WiFi signal is very weak in the corner of Open Area C near the windows.', 'Open Area C, Floor 3', 'medium', 'in_progress', 'IT Support', '2026-03-20 09:00:00', NULL),
(11, 'Bathroom soap dispenser empty', 'Men''s restroom on Floor 2, soap dispenser is empty.', 'Men''s Restroom, Floor 2', 'low', 'resolved', 'Cleaning Staff', '2026-03-22 08:00:00', '2026-03-22 09:00:00'),
(20, 'Power outlet sparking', 'Power outlet near HD-303 briefly sparked when plugging in charger. Safety concern.', 'Desk HD-303, Floor 3', 'urgent', 'in_progress', 'Electrician', '2026-03-22 15:00:00', NULL),
(15, 'Coffee machine error', 'The espresso machine on Floor 1 shows E04 error and won''t brew.', 'Kitchen, Floor 1', 'medium', 'resolved', 'Tom Anderson', '2026-03-21 07:30:00', '2026-03-21 10:00:00'),
(13, 'Ceiling tile damaged', 'Ceiling tile above Desk HD-201 has water stain and is sagging slightly.', 'Open Area, Floor 2', 'high', 'open', 'Building Management', '2026-03-23 10:00:00', NULL);

-- ============================================================
-- DAY PASSES (16 records)
-- ============================================================
INSERT INTO day_passes (guest_name, guest_email, guest_phone, date, desk_id, status, price) VALUES
('Angela Torres', 'atorres@gmail.com', '+1-555-0201', '2026-03-23', 1, 'active', 35.00),
('Raj Kapoor', 'rkapoor@outlook.com', '+1-555-0202', '2026-03-23', 4, 'active', 35.00),
('Michelle Lee', 'mlee@yahoo.com', '+1-555-0203', '2026-03-23', 15, 'active', 35.00),
('Steven Brooks', 'sbrooks@proton.me', '+1-555-0204', '2026-03-23', 18, 'active', 35.00),
('Diana Cruz', 'dcruz@gmail.com', '+1-555-0205', '2026-03-22', 1, 'used', 35.00),
('Frank Zhao', 'fzhao@outlook.com', '+1-555-0206', '2026-03-22', 4, 'used', 35.00),
('Grace Hopper', 'ghopper@email.com', '+1-555-0207', '2026-03-21', 15, 'used', 35.00),
('Ivan Petrov', 'ipetrov@gmail.com', '+1-555-0208', '2026-03-21', 18, 'used', 35.00),
('Jackie Chan', 'jchan@outlook.com', '+1-555-0209', '2026-03-20', 1, 'used', 35.00),
('Ken Watanabe', 'kwatanabe@gmail.com', '+1-555-0210', '2026-03-20', 3, 'used', 35.00),
('Lucy Hernandez', 'lhernandez@yahoo.com', '+1-555-0211', '2026-03-19', 6, 'used', 35.00),
('Nathan Scott', 'nscott@proton.me', '+1-555-0212', '2026-03-24', NULL, 'active', 35.00),
('Olivia Grant', 'ogrant@gmail.com', '+1-555-0213', '2026-03-24', NULL, 'active', 35.00),
('Paul Newman', 'pnewman@email.com', '+1-555-0214', '2026-03-18', 3, 'expired', 35.00),
('Quinn Foster', 'qfoster@outlook.com', '+1-555-0215', '2026-03-17', 4, 'expired', 35.00),
('Rosa Martinez', 'rmartinez@gmail.com', '+1-555-0216', '2026-03-25', NULL, 'active', 35.00);

-- ============================================================
-- TEAMS (15 records)
-- ============================================================
INSERT INTO teams (name, company, plan_id, member_count, primary_contact_id, billing_email) VALUES
('TechForge Core', 'TechForge', 5, 2, 2, 'billing@techforge.io'),
('NexLabs Engineering', 'NexLabs', 4, 1, 4, 'finance@nexlabs.dev'),
('GreenLeaf Founders', 'GreenLeaf Ventures', 6, 1, 5, 'accounts@greenleaf.eco'),
('ByteCraft AI Research', 'ByteCraft AI', 8, 2, 7, 'billing@bytecraft.ai'),
('PixelWorks Creative', 'PixelWorks Studio', 7, 1, 9, 'admin@pixelworks.studio'),
('CloudNine Ops', 'CloudNine DevOps', 5, 1, 12, 'billing@cloudnine.dev'),
('FinPro Analysts', 'FinPro Analytics', 4, 1, 13, 'ap@finpro.io'),
('SocialBoost Growth', 'SocialBoost', 3, 1, 14, 'finance@socialboost.co'),
('AppForge Mobile', 'AppForge', 5, 1, 16, 'billing@appforge.dev'),
('BrandStory Creative', 'BrandStory Agency', 7, 1, 17, 'accounts@brandstory.agency'),
('DataStream Engineering', 'DataStream', 5, 1, 18, 'billing@datastream.io'),
('QuantumLeap Dev', 'QuantumLeap Tech', 3, 1, 20, 'finance@quantumleap.tech'),
('DesignPulse Team', 'DesignPulse', 4, 1, 3, 'billing@designpulse.co'),
('LegalEdge Practice', 'LegalEdge', 3, 1, 11, 'billing@legaledge.law'),
('WellnessWorks Team', 'WellnessWorks', 12, 1, 15, 'billing@wellnessworks.co');

-- ============================================================
-- TEAM MEMBERS (20 records)
-- ============================================================
INSERT INTO team_members (team_id, user_id, role) VALUES
(1, 2, 'owner'),
(1, 18, 'member'),
(2, 4, 'owner'),
(3, 5, 'owner'),
(4, 7, 'owner'),
(4, 2, 'member'),
(5, 9, 'owner'),
(6, 12, 'owner'),
(7, 13, 'owner'),
(8, 14, 'owner'),
(9, 16, 'owner'),
(10, 17, 'owner'),
(11, 18, 'owner'),
(12, 20, 'owner'),
(13, 3, 'owner'),
(14, 11, 'owner'),
(15, 15, 'owner'),
(1, 7, 'member'),
(3, 15, 'member'),
(6, 4, 'member');

-- ============================================================
-- PARKING SPOTS (16 records)
-- ============================================================
INSERT INTO parking_spots (spot_number, floor, type, status, assigned_to, vehicle_info) VALUES
('P1-01', -1, 'car', 'assigned', 2, '{"make": "Tesla", "model": "Model 3", "color": "White", "plate": "ABC-1234"}'),
('P1-02', -1, 'car', 'assigned', 5, '{"make": "Toyota", "model": "Camry", "color": "Silver", "plate": "DEF-5678"}'),
('P1-03', -1, 'car', 'available', NULL, NULL),
('P1-04', -1, 'car', 'assigned', 12, '{"make": "BMW", "model": "X3", "color": "Black", "plate": "GHI-9012"}'),
('P1-05', -1, 'car', 'available', NULL, NULL),
('P1-06', -1, 'car', 'maintenance', NULL, NULL),
('P1-07', -1, 'car', 'assigned', 10, '{"make": "Audi", "model": "A4", "color": "Gray", "plate": "JKL-3456"}'),
('P1-08', -1, 'car', 'available', NULL, NULL),
('P1-M1', -1, 'motorcycle', 'assigned', 4, '{"make": "Honda", "model": "CB500F", "color": "Red", "plate": "MNO-7890"}'),
('P1-M2', -1, 'motorcycle', 'available', NULL, NULL),
('P1-M3', -1, 'motorcycle', 'available', NULL, NULL),
('P1-B1', -1, 'bicycle', 'assigned', 7, '{"type": "Road bike", "color": "Blue", "brand": "Trek"}'),
('P1-B2', -1, 'bicycle', 'assigned', 16, '{"type": "Mountain bike", "color": "Green", "brand": "Specialized"}'),
('P1-B3', -1, 'bicycle', 'available', NULL, NULL),
('P1-B4', -1, 'bicycle', 'available', NULL, NULL),
('P1-B5', -1, 'bicycle', 'assigned', 3, '{"type": "Electric bike", "color": "Black", "brand": "VanMoof"}');

-- ============================================================
-- STORAGE LOCKERS (16 records)
-- ============================================================
INSERT INTO storage_lockers (locker_number, size, floor, status, assigned_to, monthly_rate) VALUES
('L1-S01', 'small', 1, 'assigned', 2, 25.00),
('L1-S02', 'small', 1, 'assigned', 4, 25.00),
('L1-S03', 'small', 1, 'available', NULL, 25.00),
('L1-S04', 'small', 1, 'assigned', 6, 25.00),
('L1-M01', 'medium', 1, 'assigned', 5, 45.00),
('L1-M02', 'medium', 1, 'assigned', 7, 45.00),
('L1-M03', 'medium', 1, 'available', NULL, 45.00),
('L1-M04', 'medium', 1, 'maintenance', NULL, 45.00),
('L2-S01', 'small', 2, 'assigned', 9, 25.00),
('L2-S02', 'small', 2, 'available', NULL, 25.00),
('L2-M01', 'medium', 2, 'assigned', 12, 45.00),
('L2-M02', 'medium', 2, 'available', NULL, 45.00),
('L2-L01', 'large', 2, 'assigned', 10, 75.00),
('L2-L02', 'large', 2, 'available', NULL, 75.00),
('L3-L01', 'large', 3, 'assigned', 17, 75.00),
('L3-L02', 'large', 3, 'available', NULL, 75.00);

-- ============================================================
-- MAIL & PACKAGES (18 records)
-- ============================================================
INSERT INTO mail_packages (user_id, type, sender, tracking_number, received_date, picked_up_date, status, notes) VALUES
(2, 'package', 'Amazon', '1Z999AA10123456784', '2026-03-23 09:30:00', NULL, 'received', 'Medium box - electronics'),
(4, 'mail', 'IRS', NULL, '2026-03-23 10:00:00', NULL, 'notified', 'Official letter'),
(5, 'package', 'Apple Store', '1Z999AA10123456785', '2026-03-23 09:45:00', NULL, 'received', 'Small box - accessories'),
(7, 'package', 'Newegg', '9400111899223100001234', '2026-03-22 14:00:00', NULL, 'notified', 'Large box - computer parts'),
(10, 'mail', 'Bank of America', NULL, '2026-03-22 10:00:00', '2026-03-22 16:00:00', 'picked_up', NULL),
(12, 'package', 'Dell Technologies', '1Z999BB20234567890', '2026-03-22 11:00:00', '2026-03-22 17:30:00', 'picked_up', 'Server components'),
(3, 'mail', 'Adobe Systems', NULL, '2026-03-21 09:30:00', '2026-03-21 12:00:00', 'picked_up', 'Subscription renewal notice'),
(9, 'package', 'B&H Photo', '1Z999CC30345678901', '2026-03-21 14:00:00', '2026-03-22 09:00:00', 'picked_up', 'Camera lens'),
(11, 'mail', 'State Bar Association', NULL, '2026-03-21 10:00:00', '2026-03-21 11:00:00', 'picked_up', 'License renewal'),
(14, 'package', 'Amazon', '1Z999DD40456789012', '2026-03-23 11:00:00', NULL, 'received', 'Small box'),
(16, 'mail', 'Apple Developer', NULL, '2026-03-20 09:00:00', '2026-03-20 12:00:00', 'picked_up', 'Developer account docs'),
(17, 'package', 'Shutterstock', '9400111899223100005678', '2026-03-20 13:00:00', '2026-03-21 10:00:00', 'picked_up', 'Print samples'),
(18, 'package', 'DataBricks', '1Z999EE50567890123', '2026-03-23 08:30:00', NULL, 'notified', 'Training materials'),
(20, 'mail', 'Ethereum Foundation', NULL, '2026-03-22 09:00:00', '2026-03-22 14:00:00', 'picked_up', 'Conference invitation'),
(6, 'package', 'Amazon', '1Z999FF60678901234', '2026-03-22 15:00:00', NULL, 'notified', 'Books - content strategy'),
(13, 'mail', 'CFA Institute', NULL, '2026-03-23 10:30:00', NULL, 'received', 'Exam results letter'),
(5, 'package', 'FedEx', '7489376234857', '2026-03-19 11:00:00', '2026-03-19 16:00:00', 'picked_up', 'Prototype device'),
(15, 'mail', 'Yoga Alliance', NULL, '2026-03-19 09:00:00', '2026-03-20 10:00:00', 'picked_up', 'Certification renewal');

-- ============================================================
-- AMENITIES (16 records)
-- ============================================================
INSERT INTO amenities (name, type, description, status, location, usage_count) VALUES
('Espresso Machine', 'kitchen', 'La Marzocca Linea Mini - premium espresso machine', 'available', 'Kitchen, Floor 1', 1245),
('Color Laser Printer', 'office', 'HP Color LaserJet Pro MFP - print/scan/copy', 'available', 'Print Station, Floor 2', 3567),
('3D Printer', 'maker', 'Prusa i3 MK3S+ for prototyping', 'available', 'Maker Space, Floor 1', 89),
('Podcast Studio', 'media', 'Soundproofed room with professional microphones and mixer', 'available', 'Media Room, Floor 3', 156),
('Nap Pods', 'wellness', '4 nap pods for power naps (30 min max)', 'available', 'Wellness Room, Floor 1', 892),
('Bike Storage', 'facilities', 'Secure indoor bicycle storage with repair station', 'available', 'Basement Level', 234),
('Shower Facilities', 'facilities', '4 showers with towel service', 'available', 'Locker Room, Floor 1', 1876),
('Game Room', 'recreation', 'Ping pong, foosball, PS5, board games', 'available', 'Recreation Area, Floor 1', 2341),
('Mother''s Room', 'wellness', 'Private room with comfortable seating and refrigerator', 'available', 'Floor 2', 67),
('Rooftop Terrace', 'outdoor', 'Open-air workspace with seating and Wi-Fi', 'available', 'Rooftop, Floor 4', 4521),
('Photo Studio', 'media', 'Backdrop, lighting kit, and tripods for headshots and product photos', 'available', 'Creative Studio, Floor 1', 178),
('Lockers', 'storage', '120 lockers in small, medium, and large sizes', 'available', 'Locker Area, Floor 1', 3200),
('Mail Room', 'office', 'Package receiving and mailbox service', 'available', 'Reception, Floor 1', 5670),
('EV Charging Stations', 'facilities', '4 Level 2 EV chargers in parking garage', 'available', 'Parking Garage, B1', 567),
('Whiteboard Wall', 'office', 'Full wall whiteboard for brainstorming', 'available', 'Collaboration Zone, Floor 2', 1890),
('Kombucha Tap', 'kitchen', 'Rotating selection of draft kombucha flavors', 'maintenance', 'Kitchen, Floor 1', 3456);

-- ============================================================
-- ACCESS LOGS (20 records)
-- ============================================================
INSERT INTO access_logs (user_id, access_point, access_type, method, timestamp) VALUES
(2, 'Main Entrance', 'entry', 'key_card', '2026-03-23 08:12:00'),
(4, 'Main Entrance', 'entry', 'key_card', '2026-03-23 08:28:00'),
(5, 'Main Entrance', 'entry', 'app', '2026-03-23 08:42:00'),
(7, 'Side Entrance', 'entry', 'key_card', '2026-03-23 07:58:00'),
(12, 'Main Entrance', 'entry', 'key_card', '2026-03-23 07:43:00'),
(6, 'Main Entrance', 'entry', 'app', '2026-03-23 08:55:00'),
(9, 'Main Entrance', 'entry', 'key_card', '2026-03-23 09:12:00'),
(14, 'Side Entrance', 'entry', 'app', '2026-03-23 09:28:00'),
(16, 'Main Entrance', 'entry', 'key_card', '2026-03-23 08:27:00'),
(18, 'Main Entrance', 'entry', 'key_card', '2026-03-23 08:58:00'),
(2, 'Main Entrance', 'exit', 'key_card', '2026-03-22 17:28:00'),
(4, 'Main Entrance', 'exit', 'key_card', '2026-03-22 17:58:00'),
(5, 'Main Entrance', 'exit', 'app', '2026-03-22 16:55:00'),
(7, 'Side Entrance', 'exit', 'key_card', '2026-03-22 18:58:00'),
(3, 'Main Entrance', 'entry', 'app', '2026-03-22 09:58:00'),
(3, 'Main Entrance', 'exit', 'app', '2026-03-22 15:58:00'),
(10, 'Main Entrance', 'entry', 'key_card', '2026-03-22 13:05:00'),
(10, 'Main Entrance', 'exit', 'key_card', '2026-03-22 18:30:00'),
(1, 'Admin Entrance', 'entry', 'key_card', '2026-03-23 07:30:00'),
(8, 'Staff Entrance', 'entry', 'key_card', '2026-03-23 07:45:00');

-- ============================================================
-- COMMUNITY POSTS (16 records)
-- ============================================================
INSERT INTO community_posts (user_id, title, content, category, likes, comments_count, pinned) VALUES
(1, 'Welcome to March! New amenities update', 'Excited to announce we''ve added 2 new phone booths on the 3rd floor and upgraded our espresso machine. Also, the rooftop terrace is now open for the season!', 'announcement', 24, 8, true),
(2, 'Looking for ML engineers for hackathon team', 'Forming a team for the upcoming Web3 hackathon. Need 1-2 ML engineers who want to build something combining AI and blockchain. DM me!', 'collaboration', 12, 5, false),
(5, 'Carbon tracking app beta testers needed', 'GreenLeaf is launching a carbon footprint tracker for businesses. Looking for 10 beta testers from the community. Free premium for 6 months!', 'collaboration', 18, 11, false),
(10, 'Pitch Night recap and winners', 'Great turnout at last week''s pitch night! Congrats to the winners. Recording link in the comments.', 'event', 31, 14, true),
(3, 'Free Figma workshop next week', 'I''ll be running a free Figma workshop for beginners on Wednesday 2pm. Bring your laptops! Sign up in comments.', 'event', 15, 7, false),
(6, 'Best coffee shops near the space?', 'The espresso machine was down yesterday and I discovered some great nearby options. Thread of recommendations below!', 'general', 22, 16, false),
(7, 'AI ethics reading group - who''s in?', 'Starting a bi-weekly reading group on AI ethics and responsible AI. First book: "Atlas of AI" by Kate Crawford.', 'collaboration', 9, 6, false),
(15, 'Lunchtime yoga starting next week', 'Starting free guided yoga sessions every Tuesday and Thursday at 12:30pm in the wellness room. All levels welcome!', 'wellness', 27, 9, false),
(12, 'Anyone need help with AWS setup?', 'Happy to do free 30-min consultations this week for anyone struggling with cloud infrastructure. Drop a comment or DM.', 'collaboration', 14, 8, false),
(17, 'Looking for photographer for team headshots', 'BrandStory is offering discounted professional headshots for coworking members this Friday. $50 per person. DM for details.', 'services', 11, 4, false),
(4, 'Lost: Blue water bottle', 'Left my blue Hydro Flask in the kitchen on Floor 2 yesterday. Has stickers on it. Please let me know if you find it!', 'lost-and-found', 3, 2, false),
(14, 'Marketing metrics that actually matter', 'Wrote a blog post about vanity metrics vs. actionable metrics for startups. Link in comments. Would love feedback from founders here.', 'knowledge', 16, 7, false),
(20, 'Web3 study group forming', 'Weekly study group to learn Solidity and smart contract development. Thursdays at 6pm. Beginners welcome!', 'collaboration', 8, 5, false),
(11, 'Legal office hours - free startup advice', 'Offering 20-min free legal consultations every other Friday. Topics: incorporation, IP, contractor agreements.', 'services', 19, 12, true),
(16, 'Running group: 7am Tuesday and Thursday', 'Who wants to start the day with a 5K run before work? Meeting at the main entrance at 7am.', 'wellness', 7, 4, false),
(9, 'Short film premiere at the space!', 'Screening my team''s short film "Digital Horizons" in the Summit room this Friday at 6pm. Popcorn provided!', 'event', 21, 9, false);

-- ============================================================
-- REFERRALS (15 records)
-- ============================================================
INSERT INTO referrals (referrer_id, referee_name, referee_email, status, reward_amount) VALUES
(2, 'Tom Bradley', 'tbradley@techmail.com', 'active', 100.00),
(5, 'Anita Desai', 'adesai@greenmail.com', 'rewarded', 100.00),
(10, 'Jake Morrison', 'jmorrison@startupmail.com', 'signed_up', 0.00),
(4, 'Sarah Park', 'spark@devmail.com', 'active', 100.00),
(7, 'Chris Lee', 'clee@aimail.com', 'pending', 0.00),
(3, 'Diana Foster', 'dfoster@designmail.com', 'rewarded', 100.00),
(12, 'Mike Johnson', 'mjohnson@cloudmail.com', 'active', 100.00),
(6, 'Lisa Wang', 'lwang@writermail.com', 'signed_up', 0.00),
(11, 'Robert Chen', 'rchen@legalmail.com', 'pending', 0.00),
(14, 'Amy Torres', 'atorres@marketmail.com', 'rewarded', 100.00),
(17, 'Greg Kim', 'gkim@creativemail.com', 'pending', 0.00),
(20, 'Emma Davis', 'edavis@web3mail.com', 'signed_up', 0.00),
(9, 'Tyler Brown', 'tbrown@mediamail.com', 'active', 100.00),
(16, 'Natalie Gomez', 'ngomez@appmail.com', 'pending', 0.00),
(13, 'David Liu', 'dliu@financemail.com', 'rewarded', 100.00);

-- ============================================================
-- USAGE ANALYTICS (20 records - various days and areas)
-- ============================================================
INSERT INTO usage_analytics (date, area, hour, occupancy_count) VALUES
('2026-03-23', 'Floor 1 - Open Area', 9, 18),
('2026-03-23', 'Floor 1 - Open Area', 10, 24),
('2026-03-23', 'Floor 1 - Open Area', 14, 22),
('2026-03-23', 'Floor 2 - Dedicated Desks', 9, 12),
('2026-03-23', 'Floor 2 - Dedicated Desks', 10, 15),
('2026-03-23', 'Floor 2 - Quiet Zone', 9, 5),
('2026-03-23', 'Floor 2 - Quiet Zone', 14, 8),
('2026-03-23', 'Floor 3 - Open Area', 9, 10),
('2026-03-23', 'Floor 3 - Open Area', 14, 14),
('2026-03-23', 'Meeting Rooms', 10, 4),
('2026-03-23', 'Meeting Rooms', 14, 6),
('2026-03-22', 'Floor 1 - Open Area', 9, 20),
('2026-03-22', 'Floor 1 - Open Area', 14, 26),
('2026-03-22', 'Floor 2 - Dedicated Desks', 10, 14),
('2026-03-22', 'Floor 3 - Open Area', 10, 12),
('2026-03-21', 'Floor 1 - Open Area', 9, 16),
('2026-03-21', 'Floor 1 - Open Area', 14, 21),
('2026-03-21', 'Floor 2 - Dedicated Desks', 10, 13),
('2026-03-20', 'Floor 1 - Open Area', 10, 19),
('2026-03-20', 'Floor 2 - Quiet Zone', 14, 7);

-- ============================================================
-- CLEANING SCHEDULES (16 records)
-- ============================================================
INSERT INTO cleaning_schedules (area, scheduled_time, status, assigned_to, notes) VALUES
('Floor 1 - Open Area', '2026-03-23 07:00:00', 'completed', 'Maria Garcia', 'Morning deep clean before opening'),
('Floor 1 - Kitchen', '2026-03-23 07:30:00', 'completed', 'Maria Garcia', 'Restock supplies, clean appliances'),
('Floor 1 - Restrooms', '2026-03-23 08:00:00', 'completed', 'Carlos Ruiz', 'Full sanitization'),
('Floor 2 - Dedicated Desks', '2026-03-23 07:00:00', 'completed', 'Carlos Ruiz', 'Vacuum and dust'),
('Floor 2 - Kitchen', '2026-03-23 12:00:00', 'in_progress', 'Maria Garcia', 'Midday kitchen cleanup'),
('Floor 2 - Restrooms', '2026-03-23 12:00:00', 'pending', 'Carlos Ruiz', 'Midday refresh'),
('Floor 3 - Open Area', '2026-03-23 07:00:00', 'completed', 'Ana Martinez', 'Morning clean'),
('Floor 3 - Meeting Rooms', '2026-03-23 12:30:00', 'pending', 'Ana Martinez', 'Post-morning meetings cleanup'),
('Floor 1 - Restrooms', '2026-03-23 17:00:00', 'pending', 'Carlos Ruiz', 'End of day sanitization'),
('Floor 2 - Restrooms', '2026-03-23 17:00:00', 'pending', 'Carlos Ruiz', 'End of day sanitization'),
('Floor 3 - Restrooms', '2026-03-23 17:00:00', 'pending', 'Ana Martinez', 'End of day sanitization'),
('All Floors - Trash Collection', '2026-03-23 18:00:00', 'pending', 'Evening Crew', 'Empty all bins and replace liners'),
('Floor 1 - Open Area', '2026-03-24 07:00:00', 'pending', 'Maria Garcia', 'Morning deep clean'),
('Rooftop Terrace', '2026-03-23 06:30:00', 'completed', 'Ana Martinez', 'Sweep and arrange furniture'),
('Parking Garage', '2026-03-23 06:00:00', 'completed', 'Evening Crew', 'Weekly garage sweep'),
('Phone Booths - All Floors', '2026-03-23 13:00:00', 'pending', 'Maria Garcia', 'Wipe down surfaces, empty bins');

-- ============================================================
-- GUEST WIFI (16 records)
-- ============================================================
INSERT INTO guest_wifi (guest_name, access_code, created_at, expires_at, status) VALUES
('Angela Torres', 'GUEST-7X9K2M', '2026-03-23 08:00:00', '2026-03-23 20:00:00', 'active'),
('Raj Kapoor', 'GUEST-4P8N3L', '2026-03-23 08:15:00', '2026-03-23 20:00:00', 'active'),
('Michelle Lee', 'GUEST-6R2W5Q', '2026-03-23 09:00:00', '2026-03-23 20:00:00', 'active'),
('Dr. Sarah Lin', 'GUEST-8T4Y7V', '2026-03-23 09:00:00', '2026-03-23 18:00:00', 'active'),
('Michael Torres', 'GUEST-1A5B9C', '2026-03-23 12:45:00', '2026-03-23 18:00:00', 'active'),
('Diana Cruz', 'GUEST-3D7F2G', '2026-03-22 08:00:00', '2026-03-22 20:00:00', 'expired'),
('Frank Zhao', 'GUEST-5H9J4K', '2026-03-22 08:30:00', '2026-03-22 20:00:00', 'expired'),
('Grace Hopper', 'GUEST-7L1M6N', '2026-03-21 08:00:00', '2026-03-21 20:00:00', 'expired'),
('Ivan Petrov', 'GUEST-9P3Q8R', '2026-03-21 08:15:00', '2026-03-21 20:00:00', 'expired'),
('Jackie Chan', 'GUEST-2S5T1U', '2026-03-20 08:00:00', '2026-03-20 20:00:00', 'expired'),
('Laura Kim', 'GUEST-4V7W3X', '2026-03-22 10:45:00', '2026-03-22 18:00:00', 'expired'),
('Steven Brooks', 'GUEST-6Y9Z5A', '2026-03-23 08:30:00', '2026-03-23 20:00:00', 'active'),
('Jason Wu', 'GUEST-8B2C7D', '2026-03-23 10:15:00', '2026-03-23 18:00:00', 'active'),
('Conference Room Guest', 'CONF-3E6F1G', '2026-03-23 08:00:00', '2026-03-24 08:00:00', 'active'),
('Event Pass March', 'EVENT-5H8J2K', '2026-03-25 06:00:00', '2026-03-26 00:00:00', 'active'),
('Paul Newman', 'GUEST-7L0M4N', '2026-03-18 08:00:00', '2026-03-18 20:00:00', 'expired');
