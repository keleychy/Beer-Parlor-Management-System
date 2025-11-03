-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'storekeeper', 'attendant');

-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT users_email_check CHECK (email ~* '^.+@.+\..+$')
);

-- Create products table
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  quantity_per_crate INTEGER NOT NULL,
  last_restocked TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create sales table
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  attendant_name TEXT NOT NULL,
);

-- Create inventory table
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity_in INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id)
);

-- Create assignments table
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  attendant_id UUID NOT NULL REFERENCES public.users(id),
  quantity_assigned INTEGER NOT NULL,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('crates', 'bottles')),
  quantity_per_crate INTEGER,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create health_check table for connection testing
CREATE TABLE public.health_check (
  id SERIAL PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'OK',
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
-- Enable Row Level Security on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_check ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users table policies
CREATE POLICY "Users viewable by authenticated users" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));
CREATE POLICY "Users updatable by admin" ON public.users
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- Products table policies
CREATE POLICY "Products viewable by authenticated users" ON public.products
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Products modifiable by admin and storekeeper" ON public.products
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.users 
      WHERE role IN ('admin', 'storekeeper')
  );

-- Sales table policies
CREATE POLICY "Sales viewable by authenticated users" ON public.sales
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Sales insertable by attendants" ON public.sales
    auth.uid() IN (
      SELECT id FROM public.users 
      WHERE role IN ('admin', 'attendant')
    )
  );
CREATE POLICY "Inventory viewable by authenticated users" ON public.inventory
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Inventory modifiable by admin and storekeeper" ON public.inventory
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.users 
      WHERE role IN ('admin', 'storekeeper')
    )

-- Assignments table policies
CREATE POLICY "Assignments viewable by authenticated users" ON public.assignments
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Assignments modifiable by admin and storekeeper" ON public.assignments
    auth.uid() IN (
      SELECT id FROM public.users 
      WHERE role IN ('admin', 'storekeeper')
    )
  FOR SELECT USING (auth.role() = 'authenticated');