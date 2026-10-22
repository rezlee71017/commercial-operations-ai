-- ==========================================
-- Commercial Operations AI - Initial Schema
-- ==========================================

create extension if not exists vector;

create table if not exists categories (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text unique not null,
    created_at timestamptz default now()
);

create table if not exists products (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text unique not null,
    description text,
    price integer not null,
    cost_price integer,
    stock integer not null default 0,
    category_id uuid references categories(id) on delete set null,
    is_synthetic boolean default true,
    embedding vector(1536),
    created_at timestamptz default now()
);

create table if not exists workflow_runs (
    id uuid primary key default gen_random_uuid(),
    agent_name text not null,
    status text not null default 'pending',
    input_payload jsonb,
    output_result jsonb,
    created_at timestamptz default now()
);

create table if not exists orders (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid,
    total_amount integer not null,
    status text not null default 'pending',
    shipping_address text,
    created_at timestamptz default now()
);

create table if not exists order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid references orders(id) on delete cascade,
    product_id uuid references products(id) on delete set null,
    quantity integer not null default 1,
    unit_price integer not null,
    created_at timestamptz default now()
);

create table if not exists proposals (
    id uuid primary key default gen_random_uuid(),
    workflow_run_id uuid references workflow_runs(id) on delete cascade,
    proposal_type text not null,
    payload jsonb not null,
    status text not null default 'pending_approval',
    merchant_notes text,
    decided_at timestamptz,
    created_at timestamptz default now()
);

create table if not exists audit_logs (
    id uuid primary key default gen_random_uuid(),
    action text not null,
    actor_type text not null,
    actor_id text,
    details jsonb,
    created_at timestamptz default now()
);

create table if not exists profiles (
    id uuid primary key default gen_random_uuid(),
    email text unique not null,
    full_name text,
    role text not null default 'customer',
    created_at timestamptz default now()
);

create table if not exists carts (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid references profiles(id) on delete cascade,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists cart_items (
    id uuid primary key default gen_random_uuid(),
    cart_id uuid references carts(id) on delete cascade,
    product_id uuid references products(id) on delete cascade,
    quantity integer not null default 1,
    created_at timestamptz default now()
);

create table if not exists product_relations (
    id uuid primary key default gen_random_uuid(),
    product_id uuid references products(id) on delete cascade,
    related_product_id uuid references products(id) on delete cascade,
    relation_type text not null,
    score float,
    created_at timestamptz default now()
);

create table if not exists ai_tool_executions (
    id uuid primary key default gen_random_uuid(),
    workflow_run_id uuid references workflow_runs(id) on delete cascade,
    tool_name text not null,
    arguments jsonb,
    result jsonb,
    status text not null default 'success',
    created_at timestamptz default now()
);

create table if not exists inventory_movements (
    id uuid primary key default gen_random_uuid(),
    product_id uuid references products(id) on delete cascade,
    change_amount integer not null,
    movement_type text not null,
    reference_id uuid,
    created_at timestamptz default now()
);

create table if not exists merchant_profiles (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid references profiles(id) on delete cascade,
    department text,
    permissions jsonb default '{}',
    created_at timestamptz default now()
);

create table if not exists knowledge_base (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    content text not null,
    category text,
    embedding vector(1536),
    created_at timestamptz default now()
);

create index if not exists products_embedding_idx on products using hnsw (embedding vector_cosine_ops);
create index if not exists knowledge_base_embedding_idx on knowledge_base using hnsw (embedding vector_cosine_ops);
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_slug on products(slug);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_cart_items_cart on cart_items(cart_id);

create or replace function match_products (
  query_embedding vector,
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  name text,
  description text,
  price integer,
  similarity float
)
language sql stable
as $$
  select
    products.id,
    products.name,
    products.description,
    products.price,
    1 - (products.embedding <=> query_embedding) as similarity
  from products
  where 1 - (products.embedding <=> query_embedding) > match_threshold
  order by products.embedding <=> query_embedding
  limit match_count;
$$;

create or replace function match_knowledge_base (
  query_embedding vector,
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  title text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    knowledge_base.id,
    knowledge_base.title,
    knowledge_base.content,
    1 - (knowledge_base.embedding <=> query_embedding) as similarity
  from knowledge_base
  where 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  order by knowledge_base.embedding <=> query_embedding
  limit match_count;
$$;
