-- Add 'landingpage' to the stores plan check constraint
-- Drop the existing constraint and recreate it with the new value

begin;

-- Drop existing constraint
alter table public.stores
  drop constraint if exists stores_plan_check;

-- Create new constraint with landingpage included
alter table public.stores
  add constraint stores_plan_check
    check (plan in ('presenca', 'landingpage', 'destaque', 'premium'));

commit;
