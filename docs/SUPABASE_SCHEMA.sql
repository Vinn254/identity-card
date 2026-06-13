-- UEAB IMS - Supabase SQL Schema
-- Run this in Supabase SQL Editor to create the tables

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS table
create table if not exists users (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  registration_number text unique,
  email text unique not null,
  phone text,
  password_hash text not null,
  role text not null default 'student' check (role in ('student','staff','security','admin')),
  is_active boolean not null default true,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- LOST DOCUMENTS table
create table if not exists lost_documents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null,
  document_type text not null,
  document_number text not null,
  date_lost date not null,
  location_lost text,
  description text,
  status text not null default 'pending' check (status in ('pending','matched','recovered','closed')),
  matched_with_id uuid,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- FOUND DOCUMENTS table
create table if not exists found_documents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null,
  document_type text not null,
  document_number text not null,
  date_found date not null,
  location_found text not null,
  finder_contact text,
  image_path text,
  description text,
  status text not null default 'pending' check (status in ('pending','matched','claimed','closed')),
  matched_with_id uuid,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- NOTIFICATIONS table
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null,
  title text not null,
  message text not null,
  type text not null default 'info' check (type in ('info','success','warning','match','system')),
  is_read boolean not null default false,
  related_lost_id uuid,
  related_found_id uuid,
  created_at timestamp default now()
);

-- ACTIVITY LOG table
create table if not exists activity_log (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid,
  action text not null,
  entity_type text,
  entity_id uuid,
  details text,
  created_at timestamp default now()
);

-- Create all indexes first
create index if not exists idx_lost_doc_number on lost_documents(document_number);
create index if not exists idx_lost_doc_status on lost_documents(status);
create index if not exists idx_found_doc_number on found_documents(document_number);
create index if not exists idx_found_doc_status on found_documents(status);
create index if not exists idx_notif_user on notifications(user_id, is_read);

-- For development: disable RLS completely to allow anonymous access
alter table users disable row level security;
alter table lost_documents disable row level security;
alter table found_documents disable row level security;
alter table notifications disable row level security;
alter table activity_log disable row level security;