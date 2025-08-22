-- Fix the set_updated_at function to have proper security settings
create or replace function public.set_updated_at()
returns trigger as $$
begin 
  new.updated_at = now(); 
  return new; 
end; 
$$ language plpgsql
security definer
set search_path = public;