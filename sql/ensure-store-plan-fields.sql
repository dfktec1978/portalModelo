-- Script manual para garantir campos de plano na tabela public.stores
-- Pode ser executado diretamente no SQL Editor do Supabase.

do $$
begin
	if exists (
		select 1
		from information_schema.tables
		where table_schema = 'public'
			and table_name = 'stores'
	) then
		alter table public.stores
			add column if not exists plan text,
			add column if not exists plan_status text,
			add column if not exists product_limit integer,
			add column if not exists photo_limit integer,
			add column if not exists priority_weight integer;

		update public.stores
		set
			plan = coalesce(plan, 'presenca'),
			plan_status = coalesce(plan_status, 'active'),
			product_limit = coalesce(
				product_limit,
				case coalesce(plan, 'presenca')
					when 'premium' then 300
					when 'destaque' then 70
					else 0
				end
			),
			photo_limit = coalesce(
				photo_limit,
				case coalesce(plan, 'presenca')
					when 'premium' then 5
					when 'destaque' then 5
					else 10
				end
			),
			priority_weight = coalesce(
				priority_weight,
				case coalesce(plan, 'presenca')
					when 'premium' then 3
					when 'destaque' then 2
					else 1
				end
			);

		alter table public.stores
			alter column plan set default 'presenca',
			alter column plan_status set default 'active',
			alter column product_limit set default 0,
			alter column photo_limit set default 10,
			alter column priority_weight set default 1;

		if not exists (
			select 1
			from pg_constraint
			where conname = 'stores_plan_check'
		) then
			alter table public.stores
				add constraint stores_plan_check
					check (plan in ('presenca', 'landingpage', 'destaque', 'premium'));
		end if;

		if not exists (
			select 1
			from pg_constraint
			where conname = 'stores_plan_status_check'
		) then
			alter table public.stores
				add constraint stores_plan_status_check
					check (plan_status in ('active', 'pending', 'canceled'));
		end if;

		if not exists (
			select 1
			from pg_constraint
			where conname = 'stores_product_limit_check'
		) then
			alter table public.stores
				add constraint stores_product_limit_check
					check (product_limit is null or product_limit >= 0);
		end if;

		if not exists (
			select 1
			from pg_constraint
			where conname = 'stores_photo_limit_check'
		) then
			alter table public.stores
				add constraint stores_photo_limit_check
					check (photo_limit is null or photo_limit >= 0);
		end if;

		if not exists (
			select 1
			from pg_constraint
			where conname = 'stores_priority_weight_check'
		) then
			alter table public.stores
				add constraint stores_priority_weight_check
					check (priority_weight is null or priority_weight >= 0);
		end if;
	else
		raise notice 'Tabela public.stores não encontrada. Crie a tabela antes de aplicar os campos de plano.';
	end if;
end $$;
