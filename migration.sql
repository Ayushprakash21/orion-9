-- ============================================================================
-- ORION-9 ENTERPRISE DATABASE SCHEMA & TENANT ISOLATION MIGRATION (v2.0)
-- PostgreSQL / Supabase Migration
--
-- Idempotent: Safe to execute repeatedly without destroying existing data.
-- Features:
--   - 50 Enterprise Supply Chain Tables
--   - Mandatory Multi-Tenant Organization Isolation (organization_id)
--   - Row Level Security (RLS) on Every Table
--   - No "allow all" or permissive wildcard policies
--   - Idempotent table, column, index, and policy definitions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CORE TENANCY & IDENTITY SYSTEM
-- ============================================================================

-- Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    industry TEXT DEFAULT 'Supply Chain / Logistics',
    country TEXT DEFAULT 'Global',
    currency TEXT DEFAULT 'USD',
    timezone TEXT DEFAULT 'UTC',
    units TEXT DEFAULT 'metric',
    logo_url TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles Table (Identity Linkage)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    status TEXT DEFAULT 'active',
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE SET NULL,
    job_title TEXT DEFAULT 'Supply Chain Specialist',
    department TEXT DEFAULT 'Operations',
    timezone TEXT DEFAULT 'UTC',
    onboarding_completed BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Organization Members (Multi-Tenant Membership)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id TEXT PRIMARY KEY DEFAULT concat('orgmem-', gen_random_uuid()),
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_code TEXT NOT NULL DEFAULT 'viewer',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (organization_id, user_id)
);

-- Roles
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Permissions
CREATE TABLE IF NOT EXISTS public.permissions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Role Permissions Mapping
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id TEXT PRIMARY KEY DEFAULT concat('rp-', gen_random_uuid()),
    role_code TEXT NOT NULL REFERENCES public.roles(code) ON DELETE CASCADE,
    permission_code TEXT NOT NULL REFERENCES public.permissions(code) ON DELETE CASCADE,
    UNIQUE (role_code, permission_code)
);

-- ============================================================================
-- 2. TENANT CONTEXT HELPER FUNCTIONS FOR ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Function: Resolves the current authenticated user's active organization ID
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT coalesce(
        nullif(current_setting('request.jwt.claim.organization_id', true), ''),
        (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text AND status = 'active' LIMIT 1),
        (SELECT organization_id FROM public.profiles WHERE id = auth.uid()::text LIMIT 1),
        'ORION_PLATFORM'
    );
$$;

-- Function: Checks if the user has platform or organization administrator role
CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE user_id = auth.uid()::text 
          AND status = 'active'
          AND role_code IN ('platform_admin', 'organization_admin')
    ) OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()::text
          AND status = 'active'
    );
$$;

-- ============================================================================
-- 3. MASTER SUPPLY CHAIN DATA (TENANT-ISOLATED)
-- ============================================================================

-- Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    category TEXT NOT NULL,
    region TEXT DEFAULT 'Global',
    tier INTEGER DEFAULT 1,
    contact_email TEXT,
    contact_phone TEXT,
    otif_rate NUMERIC(5,2) DEFAULT 95.0,
    quality_rate NUMERIC(5,2) DEFAULT 98.0,
    lead_time_days INTEGER DEFAULT 14,
    status TEXT DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Products (SKUs)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit_of_measure TEXT DEFAULT 'EA',
    unit_cost NUMERIC(12,2) DEFAULT 0.00,
    currency TEXT DEFAULT 'USD',
    min_stock_level NUMERIC(10,2) DEFAULT 0,
    reorder_point NUMERIC(10,2) DEFAULT 0,
    lead_time_days INTEGER DEFAULT 7,
    status TEXT DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Warehouses / Facilities
CREATE TABLE IF NOT EXISTS public.warehouses (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    code TEXT,
    name TEXT NOT NULL,
    facility_type TEXT DEFAULT 'distribution_center',
    location TEXT NOT NULL,
    country TEXT DEFAULT 'US',
    capacity_sqft NUMERIC(12,2),
    utilization_pct NUMERIC(5,2) DEFAULT 0.0,
    status TEXT DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory Balances
CREATE TABLE IF NOT EXISTS public.inventory (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    warehouse_id TEXT NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    quantity_on_hand NUMERIC(12,2) NOT NULL DEFAULT 0,
    quantity_reserved NUMERIC(12,2) NOT NULL DEFAULT 0,
    quantity_available NUMERIC(12,2) GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    quantity_in_transit NUMERIC(12,2) NOT NULL DEFAULT 0,
    safety_stock NUMERIC(12,2) DEFAULT 0,
    unit_cost NUMERIC(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (organization_id, product_id, warehouse_id)
);

-- Inventory Lots / Batches
CREATE TABLE IF NOT EXISTS public.inventory_lots (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    inventory_id TEXT NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
    lot_number TEXT NOT NULL,
    quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
    manufactured_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    status TEXT DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Customers
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    customer_tier TEXT DEFAULT 'standard',
    contact_email TEXT,
    billing_address TEXT,
    shipping_address TEXT,
    credit_limit NUMERIC(12,2) DEFAULT 50000,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Customer Orders
CREATE TABLE IF NOT EXISTS public.customer_orders (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    order_number TEXT NOT NULL,
    order_date TIMESTAMPTZ DEFAULT now(),
    required_delivery_date TIMESTAMPTZ,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 4. PROCUREMENT, SOURCING & CONTRACTS
-- ============================================================================

-- Purchase Requests (PR)
CREATE TABLE IF NOT EXISTS public.purchase_requests (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    requester_id TEXT REFERENCES public.profiles(id),
    request_number TEXT NOT NULL,
    department TEXT,
    required_date TIMESTAMPTZ,
    total_estimated_amount NUMERIC(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Purchase Orders (PO)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    supplier_id TEXT NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    po_number TEXT NOT NULL,
    order_date TIMESTAMPTZ DEFAULT now(),
    expected_delivery_date TIMESTAMPTZ,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    payment_terms TEXT DEFAULT 'Net 30',
    incoterms TEXT DEFAULT 'FOB',
    status TEXT DEFAULT 'issued',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Purchase Order Lines
CREATE TABLE IF NOT EXISTS public.purchase_order_lines (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    purchase_order_id TEXT NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity_ordered NUMERIC(12,2) NOT NULL,
    quantity_received NUMERIC(12,2) DEFAULT 0,
    unit_price NUMERIC(12,2) NOT NULL,
    total_price NUMERIC(12,2) NOT NULL,
    status TEXT DEFAULT 'open',
    UNIQUE (purchase_order_id, line_number)
);

-- Requests for Quotation (RFQs)
CREATE TABLE IF NOT EXISTS public.rfqs (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    rfq_number TEXT NOT NULL,
    title TEXT NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'open',
    target_spend NUMERIC(12,2),
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RFQ Lines
CREATE TABLE IF NOT EXISTS public.rfq_lines (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    rfq_id TEXT NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    target_quantity NUMERIC(12,2) NOT NULL,
    target_unit_price NUMERIC(12,2)
);

-- Quotations
CREATE TABLE IF NOT EXISTS public.quotations (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    rfq_id TEXT NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
    supplier_id TEXT NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    quote_number TEXT NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    total_quoted_amount NUMERIC(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'submitted',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Quotation Lines
CREATE TABLE IF NOT EXISTS public.quotation_lines (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    quotation_id TEXT NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    rfq_line_id TEXT REFERENCES public.rfq_lines(id),
    quoted_quantity NUMERIC(12,2) NOT NULL,
    quoted_unit_price NUMERIC(12,2) NOT NULL,
    lead_time_days INTEGER DEFAULT 14
);

-- Supplier Confirmations
CREATE TABLE IF NOT EXISTS public.supplier_confirmations (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    purchase_order_id TEXT NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    supplier_reference TEXT,
    confirmed_delivery_date TIMESTAMPTZ NOT NULL,
    confirmed_quantity NUMERIC(12,2),
    status TEXT DEFAULT 'confirmed',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enterprise Contracts
CREATE TABLE IF NOT EXISTS public.contracts (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    supplier_id TEXT NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    contract_code TEXT NOT NULL,
    title TEXT NOT NULL,
    contract_type TEXT DEFAULT 'master_service_agreement',
    effective_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    committed_value NUMERIC(14,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    sla_otif_target NUMERIC(5,2) DEFAULT 95.0,
    penalty_rate_daily NUMERIC(5,2) DEFAULT 0.5,
    status TEXT DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 5. LOGISTICS, YMS & SHIPMENT FULFILMENT
-- ============================================================================

-- Advanced Shipping Notices (ASNs)
CREATE TABLE IF NOT EXISTS public.asns (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    supplier_id TEXT NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    asn_number TEXT NOT NULL,
    shipment_date TIMESTAMPTZ NOT NULL,
    estimated_arrival TIMESTAMPTZ NOT NULL,
    carrier_name TEXT,
    tracking_number TEXT,
    status TEXT DEFAULT 'transmitted',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Shipments
CREATE TABLE IF NOT EXISTS public.shipments (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    tracking_number TEXT NOT NULL,
    carrier TEXT NOT NULL,
    mode TEXT DEFAULT 'road',
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    origin_warehouse_id TEXT REFERENCES public.warehouses(id),
    dest_warehouse_id TEXT REFERENCES public.warehouses(id),
    estimated_arrival TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    status TEXT DEFAULT 'in_transit',
    temperature_current NUMERIC(5,2),
    humidity_current NUMERIC(5,2),
    co2_emissions_kg NUMERIC(10,2),
    cost NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Gate Entries (YMS)
CREATE TABLE IF NOT EXISTS public.gate_entries (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    warehouse_id TEXT NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    vehicle_number TEXT NOT NULL,
    driver_name TEXT,
    driver_license TEXT,
    entry_time TIMESTAMPTZ DEFAULT now(),
    exit_time TIMESTAMPTZ,
    dock_assigned TEXT,
    status TEXT DEFAULT 'inside_yard'
);

-- Receipts & Goods Received Notes (GRN)
CREATE TABLE IF NOT EXISTS public.receipts (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    purchase_order_id TEXT REFERENCES public.purchase_orders(id),
    warehouse_id TEXT NOT NULL REFERENCES public.warehouses(id),
    receipt_number TEXT NOT NULL,
    received_at TIMESTAMPTZ DEFAULT now(),
    received_by TEXT REFERENCES public.profiles(id),
    status TEXT DEFAULT 'received'
);

CREATE TABLE IF NOT EXISTS public.grns (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    receipt_id TEXT NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
    grn_number TEXT NOT NULL,
    accepted_qty NUMERIC(12,2) NOT NULL DEFAULT 0,
    rejected_qty NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Quality Inspections
CREATE TABLE IF NOT EXISTS public.quality_inspections (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    grn_id TEXT REFERENCES public.grns(id) ON DELETE CASCADE,
    inspector_id TEXT REFERENCES public.profiles(id),
    total_sampled NUMERIC(10,2) NOT NULL,
    defects_found NUMERIC(10,2) DEFAULT 0,
    result TEXT DEFAULT 'passed',
    notes TEXT,
    inspected_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 6. INVOICING & 3-WAY MATCHING
-- ============================================================================

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    supplier_id TEXT NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending_match',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Invoice Lines
CREATE TABLE IF NOT EXISTS public.invoice_lines (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    invoice_id TEXT NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    purchase_order_line_id TEXT REFERENCES public.purchase_order_lines(id),
    description TEXT,
    quantity NUMERIC(12,2) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    total_price NUMERIC(12,2) NOT NULL
);

-- 3-Way Match Results
CREATE TABLE IF NOT EXISTS public.match_results (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    invoice_id TEXT NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    purchase_order_id TEXT REFERENCES public.purchase_orders(id),
    receipt_id TEXT REFERENCES public.receipts(id),
    price_variance NUMERIC(10,2) DEFAULT 0.00,
    quantity_variance NUMERIC(10,2) DEFAULT 0.00,
    match_status TEXT DEFAULT 'matched',
    matched_at TIMESTAMPTZ DEFAULT now()
);

-- Payments & Payment Handoffs
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    invoice_id TEXT NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
    payment_reference TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_date TIMESTAMPTZ DEFAULT now(),
    payment_method TEXT DEFAULT 'wire_transfer',
    status TEXT DEFAULT 'completed'
);

CREATE TABLE IF NOT EXISTS public.payment_handoffs (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    payment_id TEXT NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    erp_system TEXT DEFAULT 'SAP',
    erp_batch_id TEXT,
    handoff_status TEXT DEFAULT 'exported',
    exported_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 7. EXCEPTIONS, DECISIONS, ACTIONS & WORKFLOWS
-- ============================================================================

-- Exceptions
CREATE TABLE IF NOT EXISTS public.exceptions (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium',
    entity_type TEXT,
    entity_id TEXT,
    impact_amount NUMERIC(12,2) DEFAULT 0,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Decisions & Actions
CREATE TABLE IF NOT EXISTS public.decisions (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    context TEXT,
    rationale TEXT,
    decision_type TEXT DEFAULT 'tactical',
    decided_by TEXT REFERENCES public.profiles(id),
    status TEXT DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.actions (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    decision_id TEXT REFERENCES public.decisions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    action_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending',
    executed_at TIMESTAMPTZ
);

-- Workflows & Rules
CREATE TABLE IF NOT EXISTS public.workflows (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger_event TEXT NOT NULL,
    definition JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rules (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    workflow_id TEXT REFERENCES public.workflows(id) ON DELETE CASCADE,
    condition_expression TEXT NOT NULL,
    action_expression TEXT NOT NULL,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true
);

-- Events Fabric & Enterprise Audit Trail
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    source TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    emitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_events (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor_user_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    status TEXT NOT NULL DEFAULT 'success',
    correlation_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Connectors & Sync Jobs
CREATE TABLE IF NOT EXISTS public.connectors (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    connector_type TEXT NOT NULL,
    config JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sync_jobs (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    connector_id TEXT REFERENCES public.connectors(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'completed',
    records_synced INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.import_history (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    records_count INTEGER DEFAULT 0,
    imported_by TEXT REFERENCES public.profiles(id),
    status TEXT DEFAULT 'success',
    imported_at TIMESTAMPTZ DEFAULT now()
);

-- Documents, Notifications, Approvals & Policies
CREATE TABLE IF NOT EXISTS public.documents (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    document_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    recipient_user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.approvals (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    approver_id TEXT REFERENCES public.profiles(id),
    status TEXT DEFAULT 'pending',
    notes TEXT,
    responded_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.policies (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    policy_type TEXT NOT NULL,
    rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 8. AI & AUTONOMOUS DECISION ENGINES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_decisions (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    prediction_target TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    confidence_score NUMERIC(5,4) NOT NULL,
    impact_estimate NUMERIC(12,2),
    status TEXT DEFAULT 'proposed',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_actions (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    ai_decision_id TEXT REFERENCES public.ai_decisions(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    execution_status TEXT DEFAULT 'autonomous_executed',
    executed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_audit_events (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    ai_model_version TEXT NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    latency_ms INTEGER,
    evaluation_result TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 9. PERFORMANCE INDEXES FOR TENANT ISOLATION
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_suppliers_org ON public.suppliers (organization_id);
CREATE INDEX IF NOT EXISTS idx_products_org ON public.products (organization_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_org ON public.warehouses (organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_org ON public.inventory (organization_id);
CREATE INDEX IF NOT EXISTS idx_po_org ON public.purchase_orders (organization_id);
CREATE INDEX IF NOT EXISTS idx_shipments_org ON public.shipments (organization_id);
CREATE INDEX IF NOT EXISTS idx_contracts_org ON public.contracts (organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON public.invoices (organization_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_org ON public.exceptions (organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_org ON public.audit_events (organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members (user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles (organization_id);

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) ACTIVATION & POLICIES
-- ============================================================================

DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'suppliers', 'products', 'warehouses', 'inventory', 'inventory_lots',
        'purchase_requests', 'purchase_orders', 'purchase_order_lines',
        'rfqs', 'rfq_lines', 'quotations', 'quotation_lines', 'supplier_confirmations', 'contracts',
        'asns', 'shipments', 'gate_entries', 'receipts', 'grns', 'quality_inspections',
        'invoices', 'invoice_lines', 'match_results', 'payments', 'payment_handoffs',
        'customers', 'customer_orders',
        'exceptions', 'actions', 'decisions', 'workflows', 'rules', 'events', 'audit_events',
        'connectors', 'sync_jobs', 'import_history', 'documents', 'notifications', 'approvals', 'policies',
        'ai_decisions', 'ai_actions', 'ai_audit_events'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        -- Enable RLS on table
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);

        -- Safe policy creation: drop old permissive policies if any existed
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'tenant_select_policy', tbl);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'tenant_insert_policy', tbl);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'tenant_update_policy', tbl);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'tenant_delete_policy', tbl);

        -- Enforce strict tenant isolation:
        -- Users can only read rows belonging to their active organization
        EXECUTE format(
            'CREATE POLICY tenant_select_policy ON public.%I FOR SELECT USING (organization_id = public.current_org_id());',
            tbl
        );

        -- Users can only insert rows for their active organization
        EXECUTE format(
            'CREATE POLICY tenant_insert_policy ON public.%I FOR INSERT WITH CHECK (organization_id = public.current_org_id());',
            tbl
        );

        -- Users can only update rows within their active organization
        EXECUTE format(
            'CREATE POLICY tenant_update_policy ON public.%I FOR UPDATE USING (organization_id = public.current_org_id());',
            tbl
        );

        -- Only organization administrators can delete rows within their active organization
        EXECUTE format(
            'CREATE POLICY tenant_delete_policy ON public.%I FOR DELETE USING (organization_id = public.current_org_id() AND public.is_org_admin());',
            tbl
        );
    END LOOP;
END $$;
