create extension if not exists "pgcrypto";

-- 1) Categorías
drop table if exists categorias cascade;
create table categorias (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  descripcion text,
  activa      boolean not null default true,
  creado_en   timestamptz not null default now()
);

create index ix_categorias_activa on categorias(activa);

-- 2) Productos (catálogo + stock)
drop table if exists productos cascade;
create table productos (
  id             uuid primary key default gen_random_uuid(),
  sku            text unique,
  nombre         text not null,
  descripcion    text,
  categoria_id   uuid references categorias(id) on delete set null,
  precio_compra  numeric(12,0) check (precio_compra is null or precio_compra >= 0),
  precio_venta   numeric(12,0) not null check (precio_venta >= 0),
  costo_promedio numeric(14,4),                  -- para márgenes/valorización futura
  stock          integer not null default 0 check (stock >= 0),
  stock_minimo   integer default 0 check (stock_minimo >= 0),
  foto_url       text,
  activo         boolean not null default true,
  creado_en      timestamptz not null default now()
);

create index ix_productos_activo on productos(activo);
create index ix_productos_nombre on productos((lower(nombre)));

-- 3) Movimientos de inventario (historial de entradas/salidas/ajustes)
drop table if exists movimientos_inventario cascade;
create table movimientos_inventario (
  id             uuid primary key default gen_random_uuid(),
  producto_id    uuid not null references productos(id) on delete cascade,
  -- mantenemos simple: TEXT + CHECK
  tipo           text not null check (tipo in ('ENTRADA','SALIDA','AJUSTE')),
  cantidad       integer not null check (cantidad <> 0),   -- positiva o negativa según convención
  costo_unitario numeric(14,4),                            -- útil en ENTRADA/AJUSTE
  motivo         text,
  creado_en      timestamptz not null default now()
);

create index ix_mov_prod_fecha on movimientos_inventario(producto_id, creado_en desc);
create index ix_mov_tipo on movimientos_inventario(tipo);

-- 4) Ventas semanales (encabezado del periodo)
-- Registra la semana (por fechas) y una nota general si quieres.
drop table if exists ventas_semanales cascade;
create table ventas_semanales (
  id            uuid primary key default gen_random_uuid(),
  semana_inicio date not null,   -- lunes de la semana, por ejemplo
  semana_fin    date not null,   -- domingo de la semana, por ejemplo
  nota_general  text,            -- comentarios generales de la semana (opcional)
  creado_en     timestamptz not null default now(),
  unique (semana_inicio, semana_fin)
);

create index ix_ventas_semana_fechas on ventas_semanales(semana_inicio, semana_fin);

-- 5) Ventas semanales (detalle por producto)
-- Aquí guardas lo que vendiste esa semana por producto:
-- cantidades, totales y la "justificación" del descuento (2x1, promo, etc.)
drop table if exists ventas_semanales_detalle cascade;
create table ventas_semanales_detalle (
  id                 uuid primary key default gen_random_uuid(),
  venta_semanal_id   uuid not null references ventas_semanales(id) on delete cascade,
  producto_id        uuid not null references productos(id) on delete restrict,
  cantidad           integer not null check (cantidad > 0),
  total_bruto        numeric(12,0) not null check (total_bruto >= 0), -- sin descuento
  descuento_total    numeric(12,0) not null default 0 check (descuento_total >= 0),
  total_neto         numeric(12,0) not null check (total_neto >= 0),  -- con descuento
  motivo_descuento   text,                                            -- "2x1", "promo", etc.
  nota               text,                                            -- observación específica del ítem
  creado_en          timestamptz not null default now()
);

create index ix_vsd_por_semana on ventas_semanales_detalle(venta_semanal_id);
create index ix_vsd_por_producto on ventas_semanales_detalle(producto_id);



--trgers
-- Check: semana_inicio <= semana_fin (creación segura)
do $$
begin
  if not exists (
    select 1
    from   pg_constraint
    where  conname = 'chk_semana_rango'
    and    conrelid = 'ventas_semanales'::regclass
  ) then
    alter table ventas_semanales
      add constraint chk_semana_rango
      check (semana_inicio <= semana_fin);
  end if;
end$$;

-- Evita duplicar el mismo producto en la misma semana
create unique index if not exists uq_vsd_semana_producto
  on ventas_semanales_detalle(venta_semanal_id, producto_id);

create unique index if not exists uq_vsd_semana_producto
on ventas_semanales_detalle(venta_semanal_id, producto_id);


-- Función
create or replace function aplicar_movimiento_inventario()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    if new.tipo = 'ENTRADA' then
      update productos p
      set costo_promedio = case
        when (p.stock + new.cantidad) > 0 and new.costo_unitario is not null
          then round((
              (p.stock * coalesce(p.costo_promedio, new.costo_unitario))
            + (new.cantidad * new.costo_unitario)
          )::numeric / (p.stock + new.cantidad), 4)
        else p.costo_promedio
      end,
      stock = p.stock + new.cantidad
      where p.id = new.producto_id;

    elsif new.tipo in ('SALIDA','AJUSTE') then
      update productos p
      set stock = p.stock + new.cantidad   -- SALIDA debe venir negativa
      where p.id = new.producto_id;
    end if;
  end if;

  return new;
end
$$;

-- Trigger
drop trigger if exists trg_aplicar_mov_inventario on movimientos_inventario;
create trigger trg_aplicar_mov_inventario
after insert on movimientos_inventario
for each row execute function aplicar_movimiento_inventario();


-----------------------

-- Función
create or replace function al_insertar_venta_semanal_detalle()
returns trigger
language plpgsql
as $$
declare
  _total_neto numeric(12,0);
  _costo      numeric(14,4);
begin
  -- Completar/asegurar total_neto
  _total_neto := greatest(
    coalesce(new.total_neto, new.total_bruto - coalesce(new.descuento_total, 0)),
    0
  );
  new.total_neto := _total_neto;

  -- Tomar costo_promedio vigente
  select costo_promedio into _costo
  from productos
  where id = new.producto_id;

  -- Crear SALIDA automática (cantidad NEGATIVA)
  insert into movimientos_inventario (producto_id, tipo, cantidad, costo_unitario, motivo)
  values (new.producto_id, 'SALIDA', -new.cantidad, _costo, 'Venta semanal');

  return new;
end
$$;

-- Trigger
drop trigger if exists trg_vsd_insert on ventas_semanales_detalle;
create trigger trg_vsd_insert
before insert on ventas_semanales_detalle
for each row execute function al_insertar_venta_semanal_detalle();
unction al_insertar_venta_semanal_detalle();

---------------------------------



