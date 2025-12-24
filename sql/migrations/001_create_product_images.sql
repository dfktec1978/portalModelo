-- Migration: Create product_images table
-- Run this in your Supabase project's SQL editor or via psql using a service role key

-- Ensure extension for UUID generation
create extension if not exists pgcrypto;

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  store_id uuid references stores(id) on delete set null,
  path text not null,
  public_url text,
  legacy_url text,
  mime text,
  size bigint,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create unique index if not exists product_images_path_idx on product_images((path));

-- Optional: add a simple FK/index to speed queries
create index if not exists product_images_product_idx on product_images(product_id);
create index if not exists product_images_store_idx on product_images(store_id);

-- Notes:
-- - After running this migration, we'll update the upload flow to insert a row here
-- - We also keep `legacy_url` to support existing references during migration
