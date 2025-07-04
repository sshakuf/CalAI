-- Nail Salon Management System Database Schema
-- PostgreSQL with support for JSON fields and advanced indexing

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ===========================
-- CORE BUSINESS ENTITIES
-- ===========================

-- Business/Salon Information
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address JSONB, -- {street, city, state, zip, country}
    timezone VARCHAR(50) DEFAULT 'UTC',
    business_hours JSONB, -- {monday: {open: "09:00", close: "18:00", closed: false}, ...}
    settings JSONB DEFAULT '{}', -- booking rules, notifications, etc.
    subscription_tier VARCHAR(50) DEFAULT 'basic',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff/Employees
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200), -- How they appear to customers
    role VARCHAR(50) DEFAULT 'technician', -- admin, manager, technician, receptionist
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, on_leave
    hire_date DATE,
    
    -- Google Calendar Integration
    google_calendar_id VARCHAR(255), -- Primary calendar ID
    google_refresh_token TEXT, -- For calendar access
    calendar_sync_enabled BOOLEAN DEFAULT true,
    
    -- Working preferences
    default_working_hours JSONB, -- Override business hours if needed
    break_duration_minutes INTEGER DEFAULT 30,
    buffer_time_minutes INTEGER DEFAULT 15, -- Between appointments
    
    -- Skills and services
    specialties TEXT[], -- Array of service types they can perform
    skill_level VARCHAR(20) DEFAULT 'intermediate', -- beginner, intermediate, expert
    hourly_rate DECIMAL(10,2),
    commission_rate DECIMAL(5,2), -- Percentage
    
    -- Metadata
    notes TEXT,
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services offered by the salon
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- manicure, pedicure, nail_art, extensions, etc.
    duration_minutes INTEGER NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    
    -- Service constraints
    requires_specialist BOOLEAN DEFAULT false,
    max_daily_bookings INTEGER, -- Limit per day
    preparation_time_minutes INTEGER DEFAULT 0,
    cleanup_time_minutes INTEGER DEFAULT 0,
    
    -- Availability
    available_days INTEGER[], -- 0=Sunday, 1=Monday, etc.
    available_from TIME,
    available_until TIME,
    
    -- Metadata
    image_urls TEXT[],
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Which staff can perform which services
CREATE TABLE staff_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    custom_price DECIMAL(10,2), -- Override service base price
    is_preferred BOOLEAN DEFAULT false, -- Staff member's specialty
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(staff_id, service_id)
);

-- ===========================
-- CUSTOMER MANAGEMENT
-- ===========================

-- Customer information
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Contact information
    phone VARCHAR(20) NOT NULL, -- Primary identifier for WhatsApp
    email VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    
    -- Customer preferences
    preferred_staff_id UUID REFERENCES staff(id),
    preferred_services UUID[], -- Array of service IDs
    communication_preferences JSONB DEFAULT '{"whatsapp": true, "email": false, "sms": false}',
    
    -- Customer behavior
    total_appointments INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,
    customer_tier VARCHAR(20) DEFAULT 'regular', -- regular, vip, premium
    last_visit_date TIMESTAMP WITH TIME ZONE,
    
    -- Preferences and notes
    allergies TEXT[],
    nail_preferences JSONB, -- {shape: "oval", length: "medium", colors: ["red", "pink"]}
    special_notes TEXT,
    
    -- Customer status
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, blocked
    no_show_count INTEGER DEFAULT 0,
    cancellation_count INTEGER DEFAULT 0,
    
    -- Metadata
    whatsapp_name VARCHAR(255), -- Name from WhatsApp profile
    profile_image_url VARCHAR(500),
    source VARCHAR(50) DEFAULT 'whatsapp', -- whatsapp, website, referral, walk_in
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, phone)
);

-- ===========================
-- APPOINTMENT MANAGEMENT
-- ===========================

-- Main appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id),
    
    -- Appointment details
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    
    -- Status tracking
    status VARCHAR(30) DEFAULT 'scheduled', -- scheduled, confirmed, in_progress, completed, cancelled, no_show
    booking_source VARCHAR(50) DEFAULT 'whatsapp', -- whatsapp, website, phone, walk_in
    
    -- Google Calendar integration
    google_calendar_event_id VARCHAR(255),
    calendar_sync_status VARCHAR(20) DEFAULT 'pending', -- pending, synced, failed
    last_sync_at TIMESTAMP WITH TIME ZONE,
    
    -- Pricing and payment
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    deposit_amount DECIMAL(10,2) DEFAULT 0,
    deposit_paid BOOLEAN DEFAULT false,
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, partial, paid, refunded
    
    -- Customer notes and preferences
    customer_notes TEXT, -- Special requests from customer
    staff_notes TEXT, -- Internal notes
    
    -- Cancellation tracking
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by VARCHAR(50), -- customer, staff, system, no_show
    cancellation_reason TEXT,
    cancellation_fee DECIMAL(10,2) DEFAULT 0,
    
    -- Notification tracking
    reminder_sent_24h BOOLEAN DEFAULT false,
    reminder_sent_2h BOOLEAN DEFAULT false,
    confirmation_sent BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services included in each appointment
CREATE TABLE appointment_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id),
    
    -- Service details
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    actual_duration_minutes INTEGER, -- How long it actually took
    
    -- Service status
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, skipped
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Notes specific to this service
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- WHATSAPP INTEGRATION
-- ===========================

-- WhatsApp conversation history
CREATE TABLE whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_phone VARCHAR(20) NOT NULL,
    customer_id UUID REFERENCES customers(id), -- Nullable for new customers
    
    -- Conversation metadata
    status VARCHAR(20) DEFAULT 'active', -- active, closed, archived
    context JSONB DEFAULT '{}', -- Current conversation context for AI
    last_message_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, customer_phone)
);

-- Individual WhatsApp messages
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    
    -- Message identification
    whatsapp_message_id VARCHAR(255) UNIQUE, -- WhatsApp's unique ID
    message_type VARCHAR(20) NOT NULL, -- text, image, audio, document, template
    direction VARCHAR(10) NOT NULL, -- inbound, outbound
    
    -- Message content
    content TEXT, -- Message text
    media_url VARCHAR(500), -- URL for media files
    media_mime_type VARCHAR(100),
    template_name VARCHAR(100), -- For template messages
    
    -- Message status
    status VARCHAR(20) DEFAULT 'sent', -- sent, delivered, read, failed
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- AI processing
    intent VARCHAR(100), -- booking, cancellation, inquiry, etc.
    entities JSONB, -- Extracted entities (dates, services, etc.)
    confidence_score DECIMAL(3,2), -- AI confidence (0.00-1.00)
    requires_human BOOLEAN DEFAULT false,
    
    -- Related data
    appointment_id UUID REFERENCES appointments(id), -- If message relates to specific appointment
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- STAFF SCHEDULING
-- ===========================

-- Staff working hours and availability
CREATE TABLE staff_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    
    -- Schedule period
    effective_date DATE NOT NULL,
    end_date DATE, -- NULL for ongoing
    
    -- Weekly schedule
    schedule_type VARCHAR(20) DEFAULT 'weekly', -- weekly, custom
    weekly_hours JSONB, -- {monday: {start: "09:00", end: "17:00", breaks: [{start: "12:00", end: "13:00"}]}}
    
    -- Override for specific dates
    date_overrides JSONB, -- {date: {available: false, reason: "vacation"}}
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time off requests and blocked periods
CREATE TABLE staff_time_off (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    
    -- Time off period
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME, -- NULL for all-day
    end_time TIME, -- NULL for all-day
    
    -- Request details
    type VARCHAR(30) NOT NULL, -- vacation, sick, personal, training, break
    status VARCHAR(20) DEFAULT 'approved', -- pending, approved, denied
    reason TEXT,
    
    -- Approval tracking
    requested_by UUID REFERENCES staff(id),
    approved_by UUID REFERENCES staff(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- NOTIFICATION SYSTEM
-- ===========================

-- Notification templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Template identification
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- appointment_reminder, booking_confirmation, etc.
    channel VARCHAR(20) NOT NULL, -- whatsapp, email, sms
    
    -- Template content
    subject VARCHAR(255), -- For email
    content TEXT NOT NULL, -- Template with variables like {{customer_name}}
    variables JSONB, -- Available variables and descriptions
    
    -- Template settings
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    send_timing JSONB, -- When to send (e.g., 24 hours before)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification queue and history
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Target information
    customer_id UUID REFERENCES customers(id),
    staff_id UUID REFERENCES staff(id),
    recipient_phone VARCHAR(20),
    recipient_email VARCHAR(255),
    
    -- Notification content
    type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, failed, cancelled
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Related data
    appointment_id UUID REFERENCES appointments(id),
    template_id UUID REFERENCES notification_templates(id),
    
    -- External IDs
    whatsapp_message_id VARCHAR(255),
    email_provider_id VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- PAYMENT AND BILLING
-- ===========================

-- Payment transactions
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_type VARCHAR(20) NOT NULL, -- deposit, full_payment, tip, fee
    payment_method VARCHAR(30), -- cash, card, online, bank_transfer
    
    -- Payment processing
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed, refunded
    processor VARCHAR(30), -- stripe, square, paypal, cash
    processor_transaction_id VARCHAR(255),
    processor_fee DECIMAL(10,2) DEFAULT 0,
    
    -- Payment timing
    processed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    refund_amount DECIMAL(10,2),
    refund_reason TEXT,
    
    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}', -- Additional processor-specific data
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- ANALYTICS AND REPORTING
-- ===========================

-- Business analytics snapshots
CREATE TABLE analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Snapshot metadata
    period_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Key metrics
    metrics JSONB NOT NULL, -- All calculated metrics
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, period_type, period_start)
);

-- ===========================
-- SYSTEM AND AUDIT
-- ===========================

-- System audit log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id),
    
    -- Action details
    entity_type VARCHAR(50) NOT NULL, -- appointment, customer, staff, etc.
    entity_id UUID,
    action VARCHAR(30) NOT NULL, -- create, update, delete, login, etc.
    
    -- Actor information
    actor_type VARCHAR(20) NOT NULL, -- staff, customer, system, ai_bot
    actor_id UUID,
    actor_identifier VARCHAR(255), -- email, phone, or system process
    
    -- Change details
    old_values JSONB,
    new_values JSONB,
    changes JSONB, -- Specific fields that changed
    
    -- Context
    source VARCHAR(30), -- whatsapp, dashboard, api, system
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API rate limiting and usage tracking
CREATE TABLE api_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id),
    
    -- Request details
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    
    -- Rate limiting
    client_ip INET,
    api_key_id UUID,
    requests_per_minute INTEGER DEFAULT 1,
    
    -- Usage tracking
    feature VARCHAR(50), -- whatsapp_bot, calendar_sync, etc.
    tokens_used INTEGER, -- For AI API calls
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- INDEXES FOR PERFORMANCE
-- ===========================

-- Core business entity indexes
CREATE INDEX idx_staff_business_id ON staff(business_id);
CREATE INDEX idx_services_business_id ON services(business_id);
CREATE INDEX idx_customers_business_id ON customers(business_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- Appointment indexes
CREATE INDEX idx_appointments_business_id ON appointments(business_id);
CREATE INDEX idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX idx_appointments_staff_id ON appointments(staff_id);
CREATE INDEX idx_appointments_scheduled_start ON appointments(scheduled_start);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date_range ON appointments(scheduled_start, scheduled_end);

-- WhatsApp message indexes
CREATE INDEX idx_whatsapp_conversations_business_phone ON whatsapp_conversations(business_id, customer_phone);
CREATE INDEX idx_whatsapp_messages_conversation_id ON whatsapp_messages(conversation_id);
CREATE INDEX idx_whatsapp_messages_created_at ON whatsapp_messages(created_at);
CREATE INDEX idx_whatsapp_messages_whatsapp_id ON whatsapp_messages(whatsapp_message_id);

-- Calendar and scheduling indexes
CREATE INDEX idx_staff_schedules_staff_date ON staff_schedules(staff_id, effective_date);
CREATE INDEX idx_staff_time_off_staff_dates ON staff_time_off(staff_id, start_date, end_date);

-- Notification indexes
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_notifications_appointment_id ON notifications(appointment_id);

-- Analytics indexes
CREATE INDEX idx_analytics_snapshots_business_period ON analytics_snapshots(business_id, period_type, period_start);

-- Audit and logging indexes
CREATE INDEX idx_audit_logs_business_created ON audit_logs(business_id, created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_api_usage_logs_created_at ON api_usage_logs(created_at);

-- Text search indexes
CREATE INDEX idx_customers_name_search ON customers USING gin((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX idx_services_name_search ON services USING gin(name gin_trgm_ops);

-- ===========================
-- FUNCTIONS AND TRIGGERS
-- ===========================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_conversations_updated_at BEFORE UPDATE ON whatsapp_conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate appointment totals
CREATE OR REPLACE FUNCTION calculate_appointment_total(appointment_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(total_price), 0)
    INTO total
    FROM appointment_services
    WHERE appointment_services.appointment_id = calculate_appointment_total.appointment_id;
    
    UPDATE appointments 
    SET subtotal = total, total_amount = total + tax_amount
    WHERE id = calculate_appointment_total.appointment_id;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate appointment totals
CREATE OR REPLACE FUNCTION update_appointment_total()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_appointment_total(
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.appointment_id
            ELSE NEW.appointment_id
        END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_appointment_total_trigger
    AFTER INSERT OR UPDATE OR DELETE ON appointment_services
    FOR EACH ROW EXECUTE FUNCTION update_appointment_total();

-- ===========================
-- VIEWS FOR COMMON QUERIES
-- ===========================

-- View for appointment details with related information
CREATE VIEW appointment_details AS
SELECT 
    a.id,
    a.scheduled_start,
    a.scheduled_end,
    a.status,
    a.total_amount,
    
    -- Customer information
    c.first_name as customer_first_name,
    c.last_name as customer_last_name,
    c.phone as customer_phone,
    c.email as customer_email,
    
    -- Staff information
    s.first_name as staff_first_name,
    s.last_name as staff_last_name,
    s.display_name as staff_display_name,
    
    -- Business information
    b.name as business_name,
    b.timezone,
    
    -- Services
    string_agg(srv.name, ', ') as services,
    sum(asrv.total_price) as services_total
    
FROM appointments a
JOIN customers c ON a.customer_id = c.id
JOIN staff s ON a.staff_id = s.id
JOIN businesses b ON a.business_id = b.id
LEFT JOIN appointment_services asrv ON a.id = asrv.appointment_id
LEFT JOIN services srv ON asrv.service_id = srv.id
GROUP BY a.id, c.id, s.id, b.id;

-- View for staff utilization
CREATE VIEW staff_utilization AS
SELECT 
    s.id as staff_id,
    s.first_name,
    s.last_name,
    s.business_id,
    
    -- Today's stats
    COUNT(CASE WHEN DATE(a.scheduled_start) = CURRENT_DATE THEN 1 END) as appointments_today,
    SUM(CASE WHEN DATE(a.scheduled_start) = CURRENT_DATE THEN 
        EXTRACT(EPOCH FROM (a.scheduled_end - a.scheduled_start))/3600 END) as hours_booked_today,
        
    -- This week's stats
    COUNT(CASE WHEN a.scheduled_start >= date_trunc('week', CURRENT_DATE) 
               AND a.scheduled_start < date_trunc('week', CURRENT_DATE) + interval '1 week' 
               THEN 1 END) as appointments_this_week,
               
    -- Revenue
    SUM(CASE WHEN a.status = 'completed' AND DATE(a.scheduled_start) = CURRENT_DATE 
        THEN a.total_amount END) as revenue_today
    
FROM staff s
LEFT JOIN appointments a ON s.id = a.staff_id AND a.status != 'cancelled'
GROUP BY s.id;

-- ===========================
-- INITIAL DATA SETUP
-- ===========================

-- Create default notification templates
INSERT INTO notification_templates (business_id, name, type, channel, subject, content, variables) VALUES
(NULL, 'Appointment Confirmation', 'booking_confirmation', 'whatsapp', NULL, 
 'Hi {{customer_name}}! Your {{service_name}} appointment is confirmed for {{appointment_date}} at {{appointment_time}} with {{staff_name}}. See you soon! 💅',
 '{"customer_name": "Customer first name", "service_name": "Primary service booked", "appointment_date": "Date in local format", "appointment_time": "Time in local format", "staff_name": "Staff member name"}'
),
(NULL, '24 Hour Reminder', 'appointment_reminder', 'whatsapp', NULL,
 'Reminder: You have a {{service_name}} appointment tomorrow at {{appointment_time}} with {{staff_name}}. Reply CONFIRM to confirm or RESCHEDULE if you need to change it.',
 '{"customer_name": "Customer first name", "service_name": "Primary service booked", "appointment_time": "Time in local format", "staff_name": "Staff member name"}'
),
(NULL, '2 Hour Reminder', 'appointment_reminder', 'whatsapp', NULL,
 'Your {{service_name}} appointment with {{staff_name}} is in 2 hours at {{appointment_time}}. We''re located at {{salon_address}}. See you soon! 💖',
 '{"service_name": "Primary service booked", "staff_name": "Staff member name", "appointment_time": "Time in local format", "salon_address": "Business address"}'
);

-- Add constraints for data integrity
ALTER TABLE appointments ADD CONSTRAINT check_appointment_times 
    CHECK (scheduled_end > scheduled_start);

ALTER TABLE appointments ADD CONSTRAINT check_actual_times 
    CHECK (actual_end IS NULL OR actual_start IS NULL OR actual_end >= actual_start);

ALTER TABLE staff_time_off ADD CONSTRAINT check_time_off_dates 
    CHECK (end_date >= start_date);

ALTER TABLE staff_time_off ADD CONSTRAINT check_time_off_times 
    CHECK (end_time IS NULL OR start_time IS NULL OR end_time > start_time);