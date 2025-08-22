-- Enable RLS on missing tables
ALTER TABLE public.stripe_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_prices ENABLE ROW LEVEL SECURITY;

-- Create policies for stripe_products (read-only for authenticated users)
CREATE POLICY "Authenticated users can view stripe products" 
ON public.stripe_products 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create policies for stripe_prices (read-only for authenticated users)
CREATE POLICY "Authenticated users can view stripe prices" 
ON public.stripe_prices 
FOR SELECT 
USING (auth.role() = 'authenticated');