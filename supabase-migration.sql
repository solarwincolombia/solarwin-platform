-- ============================================================
-- SOLARWIN: Quotation System v2 Migration
-- Run this ONCE in Supabase → SQL Editor
-- ============================================================

-- 1. Add category + wattage columns to equipment_catalog
ALTER TABLE public.equipment_catalog
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'otro',
  ADD COLUMN IF NOT EXISTS wattage_wp INTEGER;

-- 2. Add new columns to quotes
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS system_type TEXT DEFAULT 'onGrid',
  ADD COLUMN IF NOT EXISTS client_phone TEXT,
  ADD COLUMN IF NOT EXISTS property_address TEXT,
  ADD COLUMN IF NOT EXISTS monthly_bill_cop BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS energy_rate_kwh NUMERIC(10,2) DEFAULT 0;

-- 3. Create quote_items table
CREATE TABLE IF NOT EXISTS public.quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  catalog_item_id UUID REFERENCES public.equipment_catalog(id),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'otro',
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_cop BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS for quote_items
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brokers manage own quote items" ON public.quote_items;
CREATE POLICY "Brokers manage own quote items"
ON public.quote_items
FOR ALL
USING (
  quote_id IN (
    SELECT id FROM public.quotes WHERE broker_id = auth.uid()
  )
)
WITH CHECK (
  quote_id IN (
    SELECT id FROM public.quotes WHERE broker_id = auth.uid()
  )
);

-- 5. Seed equipment_catalog with real products
INSERT INTO public.equipment_catalog
  (name, spec, unit, public_price_cop, partner_price_cop, stock, active, category, wattage_wp)
VALUES
  ('Panel Solar 730W Tier 1',
   'Panel monocristalino 730W alta eficiencia, garantía de producción 25 años',
   'unidad', 650000, 550000, 1000, true, 'panel', 730),

  ('Panel Solar 630W Znshine',
   'Panel monocristalino 630W Znshine, garantía de producción 25 años',
   'unidad', 580000, 490000, 500, true, 'panel', 630),

  ('Panel Solar 550W Tier 1',
   'Panel monocristalino 550W alta eficiencia, garantía de producción 25 años',
   'unidad', 480000, 400000, 500, true, 'panel', 550),

  ('Inversor OnGrid Trifásico 20kW Growatt + Meter',
   'Inversor string OnGrid trifásico 20kW con monitor de energía incluido',
   'unidad', 9500000, 8000000, 20, true, 'inverter', NULL),

  ('Inversor OnGrid 10kW Growatt',
   'Inversor string OnGrid monofásico 10kW',
   'unidad', 6500000, 5500000, 20, true, 'inverter', NULL),

  ('Microinversor APSystem Q2 2kW',
   'Microinversor APSystem Q2 2kW, ideal para sistemas residenciales, garantía 10 años',
   'unidad', 1200000, 1000000, 100, true, 'inverter', NULL),

  ('Inversor Híbrido 5kW Growatt SPH',
   'Inversor híbrido 5kW con cargador de batería integrado',
   'unidad', 4500000, 3800000, 15, true, 'inverter', NULL),

  ('Estructura Solar Techo Plano',
   'Estructura aluminio anodizado para techo plano, tornillería y anclajes incluidos',
   'unidad', 250000, 210000, 5000, true, 'estructura', NULL),

  ('Estructura Solar Techo Inclinado',
   'Estructura aluminio anodizado para techo inclinado, rieles y ganchos incluidos',
   'unidad', 280000, 235000, 5000, true, 'estructura', NULL),

  ('Acometida DC',
   'Cable solar, protecciones DC, caja combiner y ductos',
   'global', 8000000, 6500000, 100, true, 'cableado', NULL),

  ('Acometida AC',
   'Cable THHW, breakers, tablero y conexión a red eléctrica',
   'global', 8000000, 6500000, 100, true, 'cableado', NULL),

  ('Certificación Retie y Trámites UPME',
   'Retie, registro UPME, firma profesional, planos eléctricos',
   'global', 8000000, 7000000, 100, true, 'certificacion', NULL),

  ('Mano de Obra',
   'Instalación completa por equipo certificado, pruebas y puesta en marcha',
   'global', 12000000, 10000000, 100, true, 'mano_obra', NULL),

  ('Transporte',
   'Flete de equipos hasta sitio de instalación',
   'global', 3000000, 2500000, 100, true, 'transporte', NULL),

  ('Batería LiFePO4 5kWh',
   'Batería litio 5kWh, 6000 ciclos, BMS integrado',
   'unidad', 8500000, 7000000, 30, true, 'bateria', NULL),

  ('Batería LiFePO4 10kWh',
   'Batería litio 10kWh, 6000 ciclos, BMS integrado',
   'unidad', 15000000, 12500000, 15, true, 'bateria', NULL)

ON CONFLICT DO NOTHING;
