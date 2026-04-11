"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type CatalogItem = {
  id: string;
  name: string;
  spec: string;
  unit: string;
  public_price_cop: number;
  category: string;
  wattage_wp: number | null;
  system_type: string | null;
};

type CartItem = {
  id: string;
  catalog_item_id: string | null;
  name: string;
  description: string;
  category: string;
  quantity: number;
  unit_price_cop: number;
  wattage_wp: number | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  panel: "☀️ Paneles Solares",
  inverter: "⚡ Inversores",
  bateria: "🔋 Baterías",
  estructura: "🔩 Estructura",
  cableado: "🔌 Cableado",
  certificacion: "📋 Certificación",
  mano_obra: "🔧 Mano de Obra",
  transporte: "🚚 Transporte",
  otro: "📦 Otros",
};

const CATEGORY_ORDER = [
  "panel", "inverter", "bateria", "estructura",
  "cableado", "certificacion", "mano_obra", "transporte", "otro",
];

// Ley 1715: panels and structures are IVA-exempt
const IVA_EXEMPT = ["panel", "estructura"];

export default function QuoterPage() {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    city: "",
    propertyAddress: "",
    systemType: "onGrid",
  });

  const [consumption, setConsumption] = useState({
    monthlyKwh: "",
    monthlyBill: "",
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [fletePrice, setFletePrice] = useState("");

  useEffect(() => {
    if (step === 3) loadCatalog();
  }, [step]);

  async function loadCatalog() {
    if (catalog.length > 0) return;
    setLoadingCatalog(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("equipment_catalog")
      .select("*")
      .eq("active", true)
      .order("name");
    setCatalog(
      ((data as any[]) || []).map((item) => ({
        id: item.id,
        name: item.name,
        spec: item.spec,
        unit: item.unit,
        public_price_cop: item.public_price_cop,
        category: item.category || "otro",
        wattage_wp: item.wattage_wp || null,
        system_type: item.system_type || null,
      }))
    );
    setLoadingCatalog(false);
  }

  // ── Computed values ──────────────────────────────────────────
  const kwp = parseFloat(
    cart
      .filter((i) => i.category === "panel" && i.wattage_wp)
      .reduce((s, i) => s + (i.wattage_wp! * i.quantity) / 1000, 0)
      .toFixed(2)
  );

  const numPanels = cart
    .filter((i) => i.category === "panel")
    .reduce((s, i) => s + i.quantity, 0);

  const subtotal = cart.reduce((s, i) => s + i.unit_price_cop * i.quantity, 0);

  const iva = cart
    .filter((i) => !IVA_EXEMPT.includes(i.category))
    .reduce((s, i) => s + i.unit_price_cop * i.quantity * 0.19, 0);

  const total = subtotal + iva;
  const commission1 = Math.round(subtotal * 0.04); // 4% sobre FC antes de IVA
   const commission2 = 0;
   const commission3 = 0;

  // Suggested panels (630W baseline, 1440 kWh/kWp/yr)
  const suggestedPanels = consumption.monthlyKwh
    ? Math.ceil(+consumption.monthlyKwh / ((630 * 1440) / 12 / 1000))
    : 0;

  // ── Cart helpers ─────────────────────────────────────────────
  function addToCart(item: CatalogItem) {
    const existing = cart.find((c) => c.catalog_item_id === item.id);
    if (existing) {
      setCart(
        cart.map((c) =>
          c.catalog_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: item.id,
          catalog_item_id: item.id,
          name: item.name,
          description: item.spec,
          category: item.category,
          quantity: 1,
          unit_price_cop: item.public_price_cop,
          wattage_wp: item.wattage_wp,
            system_type: item.system_type || null,
        },
      ]);
    }
  }

  function updateQty(cartId: string, qty: number) {
    if (qty <= 0) {
      setCart(cart.filter((c) => c.id !== cartId));
    } else {
      setCart(cart.map((c) => (c.id === cartId ? { ...c, quantity: qty } : c)));
    }
  }

  function updatePrice(cartId: string, price: number) {
    setCart(cart.map((c) => (c.id === cartId ? { ...c, unit_price_cop: price } : c)));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: quote, error: qErr } = await (supabase as any)
        .from("quotes")
        .insert({
          broker_id: user.id,
          client_name: form.clientName,
          client_email: form.clientEmail || null,
          client_phone: form.clientPhone || null,
          city: form.city,
          property_address: form.propertyAddress || null,
          system_type: form.systemType,
          monthly_consumption_kwh: +consumption.monthlyKwh || 0,
          monthly_bill_cop: +consumption.monthlyBill || 0,
          num_panels: numPanels,
          kwp,
          roof_type: "plana",
          project_value_cop: Math.round(total),
          commission_month1: commission1,
          commission_month2: commission2,
          commission_month3: commission3,
          status: "draft",
        })
        .select()
        .single();

      if (qErr) throw qErr;

      if (cart.length > 0) {
        await (supabase as any).from("quote_items").insert(
          cart.map((item) => ({
            quote_id: quote.id,
            catalog_item_id: item.catalog_item_id,
            name: item.name,
            description: item.description,
            category: item.category,
            quantity: item.quantity,
            unit_price_cop: item.unit_price_cop,
          }))
        );
      }

      window.location.href = `/installer/quotes/${quote.id}`;
    } catch (err) {
      console.error(err);
      alert("Error guardando cotización. Intenta de nuevo.");
      setSaving(false);
    }
  }

  // ── Formatters ───────────────────────────────────────────────
  const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-CO")}`;
  const fmtM = (n: number) => `$${(n / 1_000_000).toFixed(1)}M`;

  const steps = ["Cliente", "Consumo", "Equipos", "Resumen"];

  // Group catalog by category for display
  const catalogByCategory: Record<string, CatalogItem[]> = {};
  for (const cat of CATEGORY_ORDER) {
    let items = catalog.filter((i) => i.category === cat);
      if (cat === "inverter" || cat === "mano_obra") {
        items = items.filter((i) => !i.system_type || i.system_type === form.systemType);
      }
    if (items.length > 0) catalogByCategory[cat] = items;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1A2A3A] mb-1">Nueva Cotización</h2>
      <p className="text-slate-500 text-sm mb-6">Crea una propuesta profesional para tu cliente</p>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8 flex-wrap">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step > i + 1
                  ? "bg-green-500 text-white"
                  : step === i + 1
                  ? "bg-[#FFC107] text-[#1A2A3A]"
                  : "bg-slate-200 text-slate-400"
              }`}
            >
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span
              className={`text-sm ${
                step === i + 1 ? "font-semibold text-[#1A2A3A]" : "text-slate-400"
              }`}
            >
              {s}
            </span>
            {i < steps.length - 1 && <span className="text-slate-300 mx-2">›</span>}
          </div>
        ))}
      </div>

      {/* ── STEP 1: CLIENT ─────────────────────────────────────── */}
      {step === 1 && (
        <div className="bg-white rounded-xl p-8 shadow-sm max-w-xl">
          <h3 className="font-semibold text-[#1A2A3A] mb-5">Datos del cliente</h3>
          <div className="space-y-4">
            {(
              [
                ["Nombre / Razón Social *", "clientName", "text", "Ecohotel Rosario del Mar"],
                ["Correo electrónico", "clientEmail", "email", "contacto@empresa.com"],
                ["Teléfono", "clientPhone", "tel", "+57 300 000 0000"],
                ["Ciudad *", "city", "text", "Cartagena"],
                ["Dirección del predio", "propertyAddress", "text", "Cra 1 #23-45"],
              ] as [string, keyof typeof form, string, string][]
            ).map(([label, key, type, ph]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={ph}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de sistema</label>
              <div className="flex gap-2">
                {(
                  [
                    ["onGrid", "☀️ OnGrid"],
                    ["offGrid", "🔋 OffGrid"],
                    ["hybrid", "⚡ Híbrido"],
                  ] as [string, string][]
                ).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setForm({ ...form, systemType: val })}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium border-2 transition ${
                      form.systemType === val
                        ? "border-[#FFC107] bg-yellow-50 text-[#1A2A3A]"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!form.clientName || !form.city}
              className="w-full bg-[#1A2A3A] text-white font-semibold px-6 py-2.5 rounded-lg disabled:opacity-40 hover:bg-[#243447] transition"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: CONSUMPTION ────────────────────────────────── */}
      {step === 2 && (
        <div className="bg-white rounded-xl p-8 shadow-sm max-w-xl">
          <h3 className="font-semibold text-[#1A2A3A] mb-5">Consumo eléctrico</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Consumo mensual promedio (kWh)
              </label>
              <input
                type="number"
                value={consumption.monthlyKwh}
                onChange={(e) => setConsumption({ ...consumption, monthlyKwh: e.target.value })}
                placeholder="Ej: 15000"
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Factura mensual promedio (COP)
              </label>
              <input
                type="number"
                value={consumption.monthlyBill}
                onChange={(e) => setConsumption({ ...consumption, monthlyBill: e.target.value })}
                placeholder="Ej: 4500000"
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
              />
              {consumption.monthlyKwh && consumption.monthlyBill && +consumption.monthlyKwh > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  Tarifa implícita:{" "}
                  <strong>
                    ${Math.round(+consumption.monthlyBill / +consumption.monthlyKwh).toLocaleString("es-CO")}
                    /kWh
                  </strong>
                </p>
              )}
            </div>

            {suggestedPanels > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-semibold mb-1">
                  💡 Para cubrir {(+consumption.monthlyKwh).toLocaleString("es-CO")} kWh/mes:
                </p>
                <p>
                  Se necesitan ~<strong>{suggestedPanels} paneles</strong> de 630W (
                  {((suggestedPanels * 630) / 1000).toFixed(1)} kWp)
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Generación anual estimada:{" "}
                  {Math.round((suggestedPanels * 630 * 1440) / 1000).toLocaleString("es-CO")} kWh
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="bg-slate-100 text-slate-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-200 transition"
              >
                ← Atrás
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-[#1A2A3A] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#243447] transition"
              >
                Seleccionar equipos →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: CATALOG ────────────────────────────────────── */}
      {step === 3 && (
        <div className="flex gap-6 flex-wrap xl:flex-nowrap">
          {/* Left: catalog */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#1A2A3A]">Catálogo de equipos</h3>
              <button
                onClick={() => setStep(2)}
                className="text-sm text-slate-400 hover:text-slate-600 transition"
              >
                ← Atrás
              </button>
            </div>

            {loadingCatalog ? (
              <div className="bg-white rounded-xl p-10 text-center text-slate-400 animate-pulse">
                Cargando catálogo…
              </div>
            ) : catalog.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6 text-center">
                <p className="text-yellow-800 font-semibold">⚠️ Catálogo vacío</p>
                <p className="text-yellow-600 text-sm mt-1">
                  Ejecuta la migración SQL en Supabase para cargar los productos
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(catalogByCategory).map(([cat, items]) => (
                  <div key={cat} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5">
                      <h4 className="font-semibold text-[#1A2A3A] text-sm">
                        {CATEGORY_LABELS[cat] || cat}
                      </h4>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {items.map((item) => {
                        const inCart = cart.find((c) => c.catalog_item_id === item.id);
                        return (
                          <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-[#1A2A3A] leading-snug">
                                {item.name}
                              </p>
                              <p className="text-xs text-slate-400 truncate mt-0.5">{item.spec}</p>
                            </div>
                            {item.public_price_cop !== 0 && (
                            <div className="text-right shrink-0 mr-2">
                              <p className="text-sm font-bold text-[#1A2A3A]">
                                {fmt(item.public_price_cop)}
                              </p>
                              <p className="text-xs text-slate-400">/{item.unit}</p>
                            </div>
                            )}
                            {item.public_price_cop === 0 ? (
                              <div className="flex items-center gap-1 shrink-0">
                                <input
                                  type="number"
                                  placeholder="Valor COP"
                                  value={inCart ? inCart.unit_price_cop || "" : fletePrice}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    if (inCart) {
                                      updatePrice(item.id, val);
                                    } else {
                                      setFletePrice(e.target.value);
                                    }
                                  }}
                                  className="w-28 text-sm border border-slate-200 rounded px-2 py-1.5 text-right"
                                />
                                {inCart ? (
                                  <button
                                    onClick={() => updateQty(item.id, 0)}
                                    className="text-red-400 hover:text-red-600 text-sm font-bold px-2"
                                  >
                                    ✕
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const price = parseInt(fletePrice) || 0;
                                      setCart([...cart, { id: item.id, catalog_item_id: item.id, name: item.name, description: item.spec, category: item.category, quantity: 1, unit_price_cop: price, wattage_wp: null }]);
                                      setFletePrice("");
                                    }}
                                    className="shrink-0 bg-[#1A2A3A] hover:bg-[#243447] text-white text-xs px-3 py-1.5 rounded-lg transition font-semibold"
                                  >
                                    + Agregar
                                  </button>
                                )}
                              </div>
                            ) : inCart ? (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => updateQty(item.id, inCart.quantity - 1)}
                                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center"
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  value={inCart.quantity}
                                  onChange={(e) => updateQty(item.id, parseInt(e.target.value) || 0)}
                                  className="w-14 text-center text-sm font-bold text-[#1A2A3A] border border-slate-200 rounded"
                                />
                                <button
                                  onClick={() => updateQty(item.id, inCart.quantity + 1)}
                                  className="w-7 h-7 rounded-lg bg-[#FFC107] hover:bg-yellow-400 text-[#1A2A3A] font-bold flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                className="shrink-0 bg-[#1A2A3A] hover:bg-[#243447] text-white text-xs px-3 py-1.5 rounded-lg transition font-semibold"
                              >
                                + Agregar
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: cart */}
          <div className="w-full xl:w-80 shrink-0">
            <div className="bg-white rounded-xl shadow-sm sticky top-4 overflow-hidden">
              <div className="bg-[#1A2A3A] px-4 py-3">
                <h3 className="font-semibold text-white text-sm">🛒 Cotización actual</h3>
                {kwp > 0 && (
                  <p className="text-[#FFC107] text-xs mt-0.5">
                    {kwp} kWp · {numPanels} paneles
                  </p>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Agrega equipos del catálogo
                </div>
              ) : (
                <>
                  <div className="max-h-[380px] overflow-y-auto">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-2 px-3 py-2.5 border-b border-slate-50 hover:bg-slate-50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#1A2A3A] leading-snug">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {fmt(item.unit_price_cop)} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-[#1A2A3A]">
                            {fmtM(item.unit_price_cop * item.quantity)}
                          </p>
                          <button
                            onClick={() => updateQty(item.id, 0)}
                            className="text-red-400 hover:text-red-600 text-xs mt-0.5 transition"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-3 py-2 border-t border-slate-100 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span>{fmtM(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>IVA (servicios)</span>
                      <span>{fmtM(iva)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-[#1A2A3A] text-sm pt-1 border-t border-slate-100">
                      <span>Total</span>
                      <span>{fmtM(total)}</span>
                    </div>
                  </div>

                  <div className="px-3 pb-3">
                    <button
                      onClick={() => setStep(4)}
                      className="w-full bg-[#FFC107] hover:bg-yellow-400 text-[#1A2A3A] font-bold py-2.5 rounded-lg transition text-sm"
                    >
                      Ver resumen →
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 4: SUMMARY ────────────────────────────────────── */}
      {step === 4 && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="font-bold text-[#1A2A3A] text-xl">Propuesta lista</h3>
              <p className="text-slate-500 text-sm">Revisa y guarda para ver la propuesta profesional</p>
            </div>

            {/* Client summary */}
            <div className="bg-slate-50 rounded-xl p-4 mb-4 grid grid-cols-2 gap-x-4 gap-y-2">
              {(
                [
                  ["Cliente", form.clientName],
                  ["Ciudad", form.city],
                  ...(form.clientEmail ? [["Email", form.clientEmail]] : []),
                  ...(form.clientPhone ? [["Teléfono", form.clientPhone]] : []),
                  ["Sistema", form.systemType === "onGrid" ? "☀️ OnGrid" : form.systemType === "offGrid" ? "🔋 OffGrid" : "⚡ Híbrido"],
                  ...(consumption.monthlyKwh ? [["Consumo mensual", `${(+consumption.monthlyKwh).toLocaleString("es-CO")} kWh`]] : []),
                  ...(consumption.monthlyBill ? [["Factura mensual", fmt(+consumption.monthlyBill)]] : []),
                ] as [string, string][]
              ).map(([l, v]) => (
                <div key={l}>
                  <p className="text-xs text-slate-400">{l}</p>
                  <p className="font-medium text-[#1A2A3A] text-sm">{v}</p>
                </div>
              ))}
            </div>

            {/* Items table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
                      Componente
                    </th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
                      Cant.
                    </th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.id} className="border-t border-slate-50">
                      <td className="px-3 py-2 font-medium text-[#1A2A3A]">{item.name}</td>
                      <td className="px-3 py-2 text-center text-slate-500">{item.quantity}</td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {fmt(item.unit_price_cop * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td colSpan={2} className="px-3 py-2 text-xs text-slate-500 text-right">
                      Subtotal
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-sm">{fmt(subtotal)}</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td colSpan={2} className="px-3 py-2 text-xs text-slate-400 text-right">
                      IVA (servicios 19%)
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-slate-500">{fmt(iva)}</td>
                  </tr>
                  <tr className="bg-yellow-50">
                    <td colSpan={2} className="px-3 py-3 font-black text-[#1A2A3A]">
                      TOTAL
                    </td>
                    <td className="px-3 py-3 text-right font-black text-[#1A2A3A] text-base">
                      {fmt(total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* System stats */}
            {kwp > 0 && (
              <div className="grid grid-cols-3 gap-3 bg-blue-50 rounded-xl p-4 mb-5 text-center">
                {(
                  [
                    ["Potencia", `${kwp} kWp`],
                    ["Generación anual", `${Math.round(kwp * 1440).toLocaleString("es-CO")} kWh`],
                    ["Tu comisión mes 1", fmtM(commission1)],
                  ] as [string, string][]
                ).map(([l, v]) => (
                  <div key={l}>
                    <p className="text-xs text-slate-400">{l}</p>
                    <p className="font-bold text-[#1A2A3A]">{v}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-200 transition"
              >
                ← Editar equipos
              </button>
              <button
                onClick={handleSave}
                disabled={saving || cart.length === 0}
                className="flex-1 bg-[#FFC107] hover:bg-yellow-400 text-[#1A2A3A] font-bold py-2.5 rounded-lg transition disabled:opacity-50 text-sm"
              >
                {saving ? "Guardando…" : "💾 Guardar y ver propuesta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
