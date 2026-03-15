-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Enum for Roles
create type user_role as enum ('student', 'faculty', 'management', 'controller');

-- Create Profiles Table
create table public.profiles (
  id uuid references auth.users not null primary key,
  role user_role not null default 'student',
  full_name text,
  enrollment_no text unique,
  branch text,
  semester int,
  phone_number text,
  email text,
  aadhaar_no text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Create Batches Table
create table public.batches (
  id uuid default uuid_generate_v4() primary key,
  branch text not null, -- e.g. "CSE", "ME"
  semester text not null, -- e.g. "3rd", "5th"
  batch_type text not null, -- "Regular" or "Ex"
  batch_group text not null default 'All', -- "A", "B", "All"
  subject text not null,
  date date not null,
  time time not null,
  faculty_id uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Batches
alter table public.batches enable row level security;

create policy "Batches are viewable by authenticated users" on public.batches
  for select using (auth.role() = 'authenticated');

create policy "Controller and Management can create batches" on public.batches
  for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('controller', 'management')
    )
  );

-- Create Faculty Assignments Table
create table public.faculty_assignments (
  id uuid default uuid_generate_v4() primary key,
  batch_id uuid references public.batches(id) not null,
  faculty_id uuid references public.profiles(id) not null,
  assigned_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(batch_id, faculty_id)
);

alter table public.faculty_assignments enable row level security;

create policy "Assignments viewable by authenticated users" on public.faculty_assignments
  for select using (auth.role() = 'authenticated');

create policy "Controller can assign faculty" on public.faculty_assignments
  for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'controller'
    )
  );

-- Create Attendance Sessions
create table public.attendance_sessions (
  id uuid default uuid_generate_v4() primary key,
  batch_id uuid references public.batches(id) not null,
  created_by uuid references public.profiles(id) not null, -- Faculty
  status text check (status in ('open', 'submitted', 'finalized')) default 'open',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.attendance_sessions enable row level security;

create policy "Sessions viewable by authenticated users" on public.attendance_sessions
  for select using (auth.role() = 'authenticated');

create policy "Faculty can create sessions for their batches" on public.attendance_sessions
  for insert with check (
    created_by = auth.uid()
    -- Add more strict check if needed to ensure they are assigned
  );

create policy "Faculty can update their sessions" on public.attendance_sessions
  for update using (created_by = auth.uid());

-- Create Attendance Records
create table public.attendance_records (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.attendance_sessions(id) not null,
  student_id uuid references public.profiles(id) not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  location_lat float,
  location_long float,
  status text default 'present',
  unique(session_id, student_id)
);

alter table public.attendance_records enable row level security;

create policy "Records viewable by authenticated users" on public.attendance_records
  for select using (auth.role() = 'authenticated');

create policy "Faculty can insert records" on public.attendance_records
  for insert with check (
    exists (
      select 1 from public.attendance_sessions
      where id = session_id and created_by = auth.uid()
    )
  );

-- Helper function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, email)
  values (new.id, new.raw_user_meta_data->>'full_name', 'student', new.email);
  return new;
end;
$$ language plpgsql security definer;
