export const MIGRATION_ID = "0001_init";

export const MIGRATION_SQL = `
CREATE TABLE emirates (
  id text PRIMARY KEY,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  sort_order integer NOT NULL
);

CREATE TABLE branches (
  id text PRIMARY KEY,
  emirate_id text NOT NULL REFERENCES emirates(id),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  phones jsonb NOT NULL DEFAULT '[]',
  published_location_en text,
  published_location_ar text,
  location_precision text NOT NULL,
  address_conflict_note_en text,
  address_conflict_note_ar text,
  latitude double precision,
  longitude double precision,
  is_active boolean NOT NULL DEFAULT true,
  delivery_mode text NOT NULL,
  delivery_fee_minor integer,
  pickup_mode text NOT NULL,
  hours_status text NOT NULL,
  hours_note_en text,
  hours_note_ar text,
  source_url text,
  source_note_en text,
  source_note_ar text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT branches_location_precision_check CHECK (location_precision IN ('none', 'street_only', 'published_partial', 'conflict', 'verified')),
  CONSTRAINT branches_delivery_mode_check CHECK (delivery_mode IN ('not_configured', 'printed_free_unconfirmed', 'printed_fee_unknown', 'enabled')),
  CONSTRAINT branches_pickup_mode_check CHECK (pickup_mode IN ('not_configured', 'enabled')),
  CONSTRAINT branches_hours_status_check CHECK (hours_status IN ('unknown', 'printed_unconfirmed', 'confirmed'))
);

CREATE TABLE menus (
  id text PRIMARY KEY,
  branch_id text NOT NULL REFERENCES branches(id),
  source_filename text NOT NULL,
  source_title text,
  source_created_at text,
  currency text NOT NULL DEFAULT 'AED',
  vat_note_en text,
  vat_note_ar text,
  review_status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT menus_review_status_check CHECK (review_status IN ('pending_review', 'approved'))
);

CREATE TABLE menu_categories (
  id text PRIMARY KEY,
  menu_id text NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  branch_id text NOT NULL REFERENCES branches(id),
  name_en text NOT NULL,
  name_ar text NOT NULL,
  sort_order integer NOT NULL,
  source_page integer
);

CREATE TABLE menu_items (
  id text PRIMARY KEY,
  category_id text NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  menu_id text NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  branch_id text NOT NULL REFERENCES branches(id),
  name_en text NOT NULL,
  name_ar text NOT NULL,
  description_en text,
  description_ar text,
  price_minor integer,
  currency text NOT NULL DEFAULT 'AED',
  is_available boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL,
  source_page integer,
  review_status text NOT NULL,
  extraction_note text,
  CONSTRAINT menu_items_review_status_check CHECK (review_status IN ('pending_review', 'approved', 'needs_clarification'))
);

CREATE TABLE modifier_groups (
  id text PRIMARY KEY,
  item_id text NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  required boolean NOT NULL,
  min_select integer NOT NULL,
  max_select integer NOT NULL,
  sort_order integer NOT NULL
);

CREATE TABLE modifier_choices (
  id text PRIMARY KEY,
  group_id text NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  price_delta_minor integer NOT NULL DEFAULT 0,
  absolute_price_minor integer,
  sort_order integer NOT NULL
);

CREATE TABLE users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  phone text,
  password_hash text NOT NULL,
  role text NOT NULL,
  locale text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz,
  CONSTRAINT users_role_check CHECK (role IN ('business_admin', 'branch_admin', 'employee', 'driver', 'customer'))
);

CREATE TABLE user_branches (
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id text NOT NULL REFERENCES branches(id),
  PRIMARY KEY (user_id, branch_id)
);

CREATE TABLE sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE addresses (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label text,
  emirate_id text REFERENCES emirates(id),
  line1 text NOT NULL,
  line2 text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE number_counters (
  name text PRIMARY KEY,
  last_value bigint NOT NULL
);

INSERT INTO number_counters (name, last_value) VALUES ('order', 0), ('invoice', 0);

CREATE TABLE orders (
  id text PRIMARY KEY,
  public_number bigint NOT NULL UNIQUE,
  client_request_id text NOT NULL UNIQUE,
  branch_id text NOT NULL REFERENCES branches(id),
  customer_user_id text REFERENCES users(id),
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  contact_email text,
  locale text NOT NULL,
  fulfillment_type text NOT NULL,
  fulfillment_policy_status text NOT NULL,
  address_snapshot jsonb,
  delivery_notes text,
  currency text NOT NULL,
  subtotal_minor integer NOT NULL,
  discount_minor integer NOT NULL DEFAULT 0,
  delivery_fee_minor integer NOT NULL DEFAULT 0,
  included_vat_minor integer,
  vat_note text,
  total_minor integer NOT NULL,
  payment_status text NOT NULL,
  fulfillment_status text NOT NULL,
  access_token_hash text NOT NULL UNIQUE,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_fulfillment_type_check CHECK (fulfillment_type IN ('delivery', 'pickup')),
  CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
  CONSTRAINT orders_fulfillment_status_check CHECK (fulfillment_status IN ('pending_payment', 'confirmed', 'accepted', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'))
);

CREATE TABLE order_lines (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id text,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  quantity integer NOT NULL,
  unit_price_minor integer NOT NULL,
  modifiers_snapshot jsonb NOT NULL,
  line_total_minor integer NOT NULL,
  CONSTRAINT order_lines_quantity_check CHECK (quantity > 0)
);

CREATE TABLE order_status_history (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  actor_user_id text,
  actor_role text NOT NULL,
  from_status text,
  to_status text NOT NULL,
  kind text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE invoices (
  id text PRIMARY KEY,
  invoice_number bigint NOT NULL UNIQUE,
  order_id text NOT NULL UNIQUE REFERENCES orders(id),
  snapshot jsonb NOT NULL,
  currency text NOT NULL,
  total_minor integer NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payments (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES orders(id),
  provider text NOT NULL,
  provider_ref text,
  amount_minor integer NOT NULL,
  currency text NOT NULL,
  status text NOT NULL,
  idempotency_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX payments_provider_ref_unique ON payments(provider, provider_ref) WHERE provider_ref IS NOT NULL;

CREATE TABLE payment_events (
  id text PRIMARY KEY,
  provider text NOT NULL,
  provider_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE shifts (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id),
  branch_id text NOT NULL REFERENCES branches(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

CREATE TABLE driver_assignments (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES orders(id),
  driver_user_id text NOT NULL REFERENCES users(id),
  assigned_by text,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  unassigned_at timestamptz,
  active boolean NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX driver_assignments_one_active ON driver_assignments(order_id) WHERE active;

CREATE TABLE driver_locations (
  id text PRIMARY KEY,
  assignment_id text NOT NULL REFERENCES driver_assignments(id) ON DELETE CASCADE,
  driver_user_id text NOT NULL REFERENCES users(id),
  order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  accuracy_meters double precision,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id text PRIMARY KEY,
  actor_user_id text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  branch_id text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE business_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

INSERT INTO business_settings (key, value) VALUES
  ('show_unreviewed_menu', 'true'::jsonb),
  ('location_retention_days', '7'::jsonb);

CREATE INDEX orders_branch_created_idx ON orders(branch_id, created_at);
CREATE INDEX orders_customer_idx ON orders(customer_user_id);
CREATE INDEX menu_items_branch_idx ON menu_items(branch_id);
CREATE INDEX driver_locations_order_idx ON driver_locations(order_id, recorded_at);
CREATE INDEX audit_logs_created_idx ON audit_logs(created_at);
CREATE INDEX shifts_user_open_idx ON shifts(user_id) WHERE ended_at IS NULL;
`;
