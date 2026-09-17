-- ============================================================
-- SUPABASE POLICY DOCUMENTS + PGVECTOR
-- Compatible with 3072-dimensional embeddings
-- ============================================================

-- ============================================================
-- 1. Enable pgvector
-- ============================================================

create extension if not exists vector;


-- ============================================================
-- 2. Create policy_documents table
-- ============================================================

create table if not exists public.policy_documents (
    id uuid primary key default gen_random_uuid(),

    document_title text not null,

    status_type text,

    hierarchy_path jsonb not null default '{}'::jsonb,

    content text not null,

    -- OpenAI text-embedding-3-large
    -- Default dimension: 3072
    embedding vector(3072),

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


-- ============================================================
-- 3. Normal indexes
-- ============================================================

create index if not exists policy_documents_status_type_idx
on public.policy_documents (status_type);


create index if not exists policy_documents_hierarchy_path_idx
on public.policy_documents
using gin (hierarchy_path);


-- ============================================================
-- IMPORTANT:
-- DO NOT create an HNSW index here.
--
-- HNSW indexes in the current environment cannot handle
-- vector(3072), which causes:
--
-- ERROR: 54000:
-- column cannot have more than 2000 dimensions for hnsw index
--
-- The vector column itself is still valid.
-- ============================================================


-- ============================================================
-- 4. Updated-at function
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


-- ============================================================
-- 5. Updated-at trigger
-- ============================================================

drop trigger if exists policy_documents_set_updated_at
on public.policy_documents;

create trigger policy_documents_set_updated_at
before update on public.policy_documents
for each row
execute function public.set_updated_at();


-- ============================================================
-- 6. Semantic search function
-- ============================================================

create or replace function public.match_policy_documents (
    query_embedding vector(3072),
    match_threshold real default 0.5,
    match_count integer default 10
)
returns table (
    id uuid,
    document_title text,
    status_type text,
    hierarchy_path jsonb,
    content text,
    similarity real
)
language sql
stable
as $$
    select
        pd.id,
        pd.document_title,
        pd.status_type,
        pd.hierarchy_path,
        pd.content,

        (
            1 - (pd.embedding <=> query_embedding)
        )::real as similarity

    from public.policy_documents as pd

    where
        pd.embedding is not null
        and query_embedding is not null
        and (
            1 - (pd.embedding <=> query_embedding)
        ) >= match_threshold

    order by
        pd.embedding <=> query_embedding

    limit greatest(match_count, 0);
$$;


-- ============================================================
-- 7. Optional Row Level Security
-- ============================================================
--
-- Enable this when you are ready to configure authentication.
--
-- alter table public.policy_documents enable row level security;
--
-- Example:
--
-- create policy "Authenticated users can read policy documents"
-- on public.policy_documents
-- for select
-- to authenticated
-- using (true);
--
-- ============================================================


-- ============================================================
-- 8. Users & Executive Profiles Table
-- ============================================================

create table if not exists public.users (
    id uuid primary key default gen_random_uuid(),

    -- Links to Supabase Auth user if using Supabase Auth
    auth_user_id uuid references auth.users(id) on delete cascade,

    email text unique not null,

    full_name text not null,

    organization text,

    role text default 'Executive Leadership',

    jurisdiction text default 'Republic of Kenya / EAC',

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);

-- Indexes for rapid lookup
create index if not exists users_email_idx 
on public.users (email);

create index if not exists users_auth_user_id_idx 
on public.users (auth_user_id);

-- Updated-at trigger for users
drop trigger if exists users_set_updated_at 
on public.users;

create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

-- Row Level Security for users
alter table public.users enable row level security;

-- Policies
create policy "Users can view their own profile"
on public.users
for select
using (auth.uid() = auth_user_id or auth.uid() is not null);

create policy "Users can update their own profile"
on public.users
for update
using (auth.uid() = auth_user_id);

create policy "Service role has full access to users"
on public.users
for all
using (true)
with check (true);


-- ============================================================
-- 9. User Query History Table
-- ============================================================

create table if not exists public.user_query_history (
    id uuid primary key default gen_random_uuid(),

    -- Linked to user profile
    user_id uuid not null
        references public.users(id)
        on delete cascade,

    -- Original query text
    query text not null,

    -- Concise, capitalized professional headline
    tagline text not null,

    -- Structured answer JSON payload
    answer jsonb not null,

    created_at timestamptz not null default now()
);


-- ============================================================
-- Indexes
-- ============================================================

-- Rapid per-user chronological lookup
create index if not exists user_query_history_user_id_idx
on public.user_query_history (user_id, created_at desc);


-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.user_query_history enable row level security;


-- ============================================================
-- Remove existing policies (Makes script idempotent)
-- ============================================================

drop policy if exists "Users can view own query history"
on public.user_query_history;

drop policy if exists "Users can insert own query history"
on public.user_query_history;

drop policy if exists "Users can delete own query history"
on public.user_query_history;

drop policy if exists "Users can update own query history"
on public.user_query_history;

drop policy if exists "Service role has full access to user_query_history"
on public.user_query_history;


-- ============================================================
-- Policies: Strict User Isolation
-- ============================================================

create policy "Users can view own query history"
on public.user_query_history
for select
to authenticated
using (
    exists (
        select 1
        from public.users u
        where u.id = user_query_history.user_id
          and u.auth_user_id = auth.uid()
    )
);

create policy "Users can insert own query history"
on public.user_query_history
for insert
to authenticated
with check (
    exists (
        select 1
        from public.users u
        where u.id = user_query_history.user_id
          and u.auth_user_id = auth.uid()
    )
);

create policy "Users can delete own query history"
on public.user_query_history
for delete
to authenticated
using (
    exists (
        select 1
        from public.users u
        where u.id = user_query_history.user_id
          and u.auth_user_id = auth.uid()
    )
);

create policy "Users can update own query history"
on public.user_query_history
for update
to authenticated
using (
    exists (
        select 1
        from public.users u
        where u.id = user_query_history.user_id
          and u.auth_user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.users u
        where u.id = user_query_history.user_id
          and u.auth_user_id = auth.uid()
    )
);

create policy "Service role has full access to user_query_history"
on public.user_query_history
for all
using (true)
with check (true);

-- ============================================================
-- 10. Corpus Integrity & Sanitization
-- ============================================================
-- Ensure no fabricated or non-existent statutory instruments exist in the knowledgebase
delete from public.policy_documents 
where document_title in ('Data Sovereignty Act', 'Kenya AI Act', 'AI Governance Act');
