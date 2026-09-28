-- Esquema de tablas para Pollos de Engorde en Supabase
-- Ejecutar en SQL Editor de https://kwvknzlhgwmvgdzqhoxn.supabase.co

CREATE TABLE IF NOT EXISTS pollos_lotes (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    fecha_inicio DATE NOT NULL,
    cantidad_inicial INTEGER NOT NULL DEFAULT 0,
    cantidad_actual INTEGER NOT NULL DEFAULT 0,
    raza TEXT NOT NULL DEFAULT 'Ross 308',
    costo_pollito_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0,
    peso_promedio_actual_kg NUMERIC(6, 3) DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pollos_mortalidad (
    id TEXT PRIMARY KEY,
    lote_id TEXT NOT NULL REFERENCES pollos_lotes(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 0,
    causa TEXT,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pollos_alimento (
    id TEXT PRIMARY KEY,
    lote_id TEXT NOT NULL REFERENCES pollos_lotes(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    tipo_alimento TEXT NOT NULL,
    cantidad_kg NUMERIC(8, 2) NOT NULL DEFAULT 0,
    costo_total_cop NUMERIC(12, 2) NOT NULL DEFAULT 0,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pollos_clientes (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT,
    direccion TEXT,
    saldo_pendiente NUMERIC(12, 2) NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pollos_ventas (
    id TEXT PRIMARY KEY,
    lote_id TEXT NOT NULL,
    fecha DATE NOT NULL,
    modalidad TEXT NOT NULL DEFAULT 'en_pie',
    cantidad_aves INTEGER NOT NULL DEFAULT 0,
    peso_total_kg NUMERIC(8, 2) NOT NULL DEFAULT 0,
    precio_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_cop NUMERIC(12, 2) NOT NULL DEFAULT 0,
    metodo_pago TEXT NOT NULL DEFAULT 'efectivo',
    cliente_id TEXT,
    nombre_cliente TEXT,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pollos_gastos (
    id TEXT PRIMARY KEY,
    lote_id TEXT,
    fecha DATE NOT NULL,
    categoria TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    monto_cop NUMERIC(12, 2) NOT NULL DEFAULT 0,
    metodo_pago TEXT NOT NULL DEFAULT 'efectivo',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pollos_abonos (
    id TEXT PRIMARY KEY,
    cliente_id TEXT NOT NULL,
    fecha DATE NOT NULL,
    monto_cop NUMERIC(12, 2) NOT NULL DEFAULT 0,
    metodo_pago TEXT NOT NULL DEFAULT 'efectivo',
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pollos_lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pollos_mortalidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE pollos_alimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE pollos_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pollos_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pollos_gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pollos_abonos ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Permitir todo pollos_lotes" ON pollos_lotes;
    CREATE POLICY "Permitir todo pollos_lotes" ON pollos_lotes FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir todo pollos_mortalidad" ON pollos_mortalidad;
    CREATE POLICY "Permitir todo pollos_mortalidad" ON pollos_mortalidad FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir todo pollos_alimento" ON pollos_alimento;
    CREATE POLICY "Permitir todo pollos_alimento" ON pollos_alimento FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir todo pollos_clientes" ON pollos_clientes;
    CREATE POLICY "Permitir todo pollos_clientes" ON pollos_clientes FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir todo pollos_ventas" ON pollos_ventas;
    CREATE POLICY "Permitir todo pollos_ventas" ON pollos_ventas FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir todo pollos_gastos" ON pollos_gastos;
    CREATE POLICY "Permitir todo pollos_gastos" ON pollos_gastos FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir todo pollos_abonos" ON pollos_abonos;
    CREATE POLICY "Permitir todo pollos_abonos" ON pollos_abonos FOR ALL USING (true) WITH CHECK (true);
END $$;
