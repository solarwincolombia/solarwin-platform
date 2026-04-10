"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STATUS_OPTIONS = [
  { key: "borrador",       label: "📝 Borrador"           },
  { key: "enviada",        label: "📤 Enviada al cliente"  },
  { key: "en_negociacion", label: "🤝 En negociación"     },
  { key: "aceptada",       label: "✅ Aceptada"            },
  { key: "negativa",       label: "❌ Negativa"            },
  { key: "instalacion",    label: "🔧 En instalación"      },
  { key: "cerrada",        label: "🏁 Cerrada"             },
];

const STATUS_STYLE: Record<string, string> = {
  borrador: "bg-slate-100 text-slate-600",
  draft: "bg-slate-100 text-slate-600",
  enviada: "bg-blue-100 text-blue-700",
  en_negociacion: "bg-yellow-100 text-yellow-700",
  aceptada: "bg-green-100 text-green-700",
  approved: "bg-green-100 text-green-700",
  negativa: "bg-red-100 text-red-700",
  rejected: "bg-red-100 text-red-700",
  instalacion: "bg-orange-100 text-orange-700",
  cerrada: "bg-teal-100 text-teal-700",
  closed: "bg-teal-100 text-teal-700",
  pending: "bg-yellow-100 text-yellow-700",
};

type QuoteItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  unit_price_cop: number;
};

type QuoteData = {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  city: string;
  property_address: string | null;
  system_type: string;
  monthly_consumption_kwh: number;
  monthly_bill_cop: number;
  kwp: number;
  num_panels: number;
  project_value_cop: number;
  costo_proyecto_cop: number;
  status: string;
  created_at: string;
  items: QuoteItem[];
  broker_name: string;
  broker_commission_rate: number;
  broker_email: string;
  broker_phone: string | null;
  broker_trade_name: string | null;
  broker_company_name: string | null;
  broker_logo_url: string | null;
  broker_avatar_url: string | null;
};

const IVA_EXEMPT = ["panel", "estructura"];

const SYSTEM_LABELS: Record<string, string> = {
  onGrid: "OnGrid",
  offGrid: "OffGrid",
  hybrid: "Híbrido",
};

export default function QuoteViewPage() {
  const params = useParams();
  const id = params.id as string;
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [costoInput, setCostoInput] = useState("");
  const [savingCosto, setSavingCosto] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    loadQuote();
  }, [id]);

  async function loadQuote() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("No autenticado");
      setLoading(false);
      return;
    }

    const { data: quoteData, error: qErr } = await (supabase as any)
      .from("quotes")
      .select("*")
      .eq("id", id)
      .single();

    if (qErr || !quoteData) {
      setError("Cotización no encontrada");
      setLoading(false);
      return;
    }

    // Fetch items (may not exist if migration not run)
    let items: QuoteItem[] = [];
    try {
      const { data: itemsData } = await (supabase as any)
        .from("quote_items")
        .select("*")
        .eq("quote_id", id)
        .order("created_at");
      items = itemsData || [];
    } catch {
      // quote_items table may not exist yet
    }

    // Broker profile
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("full_name, email, phone, trade_name, company_name, logo_url, avatar_url, commission_rate")
      .eq("id", user.id)
      .single();

    const costo = quoteData.costo_proyecto_cop ?? 0;
    setQuote({
      ...quoteData,
      client_phone: quoteData.client_phone ?? null,
      property_address: quoteData.property_address ?? null,
      system_type: quoteData.system_type ?? "onGrid",
      monthly_bill_cop: quoteData.monthly_bill_cop ?? 0,
      costo_proyecto_cop: costo,
      items,
      broker_name: profile?.full_name ?? user.email ?? "",
      broker_email: profile?.email ?? user.email ?? "",
      broker_phone: profile?.phone ?? null,
      broker_trade_name: profile?.trade_name ?? null,
      broker_company_name: profile?.company_name ?? null,
      broker_logo_url: profile?.logo_url ?? null,
      broker_avatar_url: profile?.avatar_url ?? null,
      broker_commission_rate: profile?.commission_rate ?? 10,
    });
    setCostoInput(costo > 0 ? String(costo) : "");
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-sm">Cargando propuesta…</div>
      </div>
    );
  }
  if (error || !quote) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400 text-sm">{error ?? "Error cargando propuesta"}</div>
      </div>
    );
  }

  // ── Helpers ──────────────────────────────────────────────────
  async function handleStatusChange(newStatus: string) {
    if (!quote) return;
    setSavingStatus(true);
    const supabase = createClient();
    await (supabase as any).from("quotes").update({ status: newStatus }).eq("id", quote.id);
    setQuote((q) => q ? { ...q, status: newStatus } : q);
    setSavingStatus(false);
  }

  async function handleSaveCosto() {
    if (!quote) return;
    setSavingCosto(true);
    const costo = parseInt(costoInput.replace(/\D/g, "")) || 0;
    const supabase = createClient();
    await (supabase as any).from("quotes").update({ costo_proyecto_cop: costo }).eq("id", quote.id);
    setQuote((q) => q ? { ...q, costo_proyecto_cop: costo } : q);
    setSavingCosto(false);
  }

  // ── Calculations ─────────────────────────────────────────────
  const kwp = quote.kwp;
  const kwhYear = Math.round(kwp * 1440);
  const co2Tons = parseFloat((kwhYear * 0.00028).toFixed(1));
  const equivCars = Math.round(co2Tons / 0.156);
  const equivTrees = Math.round(co2Tons / 0.0189);

  const subtotal = quote.items.reduce((s, i) => s + i.unit_price_cop * i.quantity, 0);
  const iva = quote.items
    .filter((i) => !IVA_EXEMPT.includes(i.category))
    .reduce((s, i) => s + i.unit_price_cop * i.quantity * 0.19, 0);
  const total = subtotal + iva || quote.project_value_cop;

  const monthlyGen = kwp * 120;
  const monthlyConsumption = quote.monthly_consumption_kwh || monthlyGen;
  const coverage = Math.min((monthlyGen / monthlyConsumption) * 100, 100);
  const monthlyBill = quote.monthly_bill_cop;
  const monthlySavings = Math.round((coverage / 100) * monthlyBill);
  const annualSavings = monthlySavings * 12;
  const simplePayback =
    annualSavings > 0 ? (total / annualSavings).toFixed(1) : "—";
  const paybackLey =
    annualSavings > 0 ? ((total * 0.5) / annualSavings).toFixed(1) : "—";

  const quoteDate = new Date(quote.created_at).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const systemLabel = SYSTEM_LABELS[quote.system_type] ?? quote.system_type;

  const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-CO")}`;
  const fmtM = (n: number) => `$${(n / 1_000_000).toFixed(1)}M`;

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #quote-doc, #quote-doc * { visibility: visible; }
          #quote-doc { position: fixed; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Action bar */}
      <div className="no-print flex items-center gap-3 mb-4">
        <button
          onClick={() => window.history.back()}
          className="text-slate-500 hover:text-slate-700 text-sm transition"
        >
          ← Volver
        </button>
        <div className="flex-1" />
        {/* Status selector */}
        <select
          value={quote.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={savingStatus}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFC107] ${STATUS_STYLE[quote.status] ?? "bg-slate-100 text-slate-600"}`}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        <button
          onClick={() => window.print()}
          className="bg-[#1A2A3A] text-white font-semibold px-5 py-2 rounded-lg hover:bg-[#243447] transition text-sm flex items-center gap-2"
        >
          🖨️ Descargar PDF
        </button>
      </div>

      {/* Commission panel */}
      <div className="no-print bg-white rounded-xl shadow-sm p-5 mb-6 border-l-4 border-[#FFC107]">
        <h3 className="font-bold text-[#1A2A3A] text-sm mb-4 uppercase tracking-wide">
          💰 Análisis de comisión (interno)
        </h3>
        <div className="grid grid-cols-4 gap-4 items-end">
          {/* Costo del proyecto */}
          <div>
            <label className="text-xs text-slate-500 font-medium block mb-1">
              Costo del proyecto (COP)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={costoInput}
                onChange={(e) => setCostoInput(e.target.value)}
                placeholder="Ej: 155000000"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
              />
              <button
                onClick={handleSaveCosto}
                disabled={savingCosto}
                className="bg-[#1A2A3A] text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-[#243447] transition disabled:opacity-60 whitespace-nowrap"
              >
                {savingCosto ? "…" : "Guardar"}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Solo visible para vos, no aparece en la propuesta</p>
          </div>

          {/* Valor venta */}
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-400 mb-1">Valor de venta</p>
            <p className="font-black text-[#1A2A3A] text-xl">
              ${Math.round(total / 1_000_000).toLocaleString("es-CO")}M
            </p>
          </div>

          {/* Margen */}
          <div className={`rounded-xl p-3 text-center ${
            total - (parseInt(costoInput.replace(/\D/g, "")) || quote.costo_proyecto_cop) > 0
              ? "bg-green-50"
              : "bg-red-50"
          }`}>
            <p className="text-xs text-slate-400 mb-1">Margen / Utilidad</p>
            {(() => {
              const costo = parseInt(costoInput.replace(/\D/g, "")) || quote.costo_proyecto_cop;
              const margen = total - costo;
              const pct = costo > 0 ? ((margen / total) * 100).toFixed(0) : "—";
              return (
                <>
                  <p className={`font-black text-xl ${margen > 0 ? "text-green-600" : "text-red-500"}`}>
                    ${Math.round(margen / 1_000_000).toLocaleString("es-CO")}M
                  </p>
                  <p className="text-xs text-slate-400">{pct}% del proyecto</p>
                </>
              );
            })()}
          </div>

          {/* Comisión */}
          <div className="bg-[#1A2A3A] rounded-xl p-3 text-center">
            <p className="text-xs text-slate-400 mb-1">
              Tu comisión ({quote.broker_commission_rate}%)
            </p>
            {(() => {
              const costo = parseInt(costoInput.replace(/\D/g, "")) || quote.costo_proyecto_cop;
              const margen = total - costo;
              const comision = margen > 0 ? margen * (quote.broker_commission_rate / 100) : 0;
              return (
                <p className="font-black text-[#FFC107] text-2xl">
                  ${Math.round(comision / 1_000_000).toLocaleString("es-CO")}M
                </p>
              );
            })()}
            <p className="text-xs text-slate-500 mt-0.5">sobre la utilidad</p>
          </div>
        </div>
      </div>

      {/* ── QUOTE DOCUMENT ──────────────────────────────────────── */}
      <div
        id="quote-doc"
        className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl mx-auto"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        {/* HEADER */}
        <div className="bg-[#1A2A3A] px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFC107] rounded-full flex items-center justify-center text-xl font-bold text-[#1A2A3A]">
              ☀
            </div>
            <div>
              <p className="text-white font-black text-lg tracking-wide leading-none">SOLARWIN SAS</p>
              <p className="text-slate-400 text-xs mt-0.5">Energías Solares</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-xs uppercase tracking-wide">Propuesta técnica</p>
            <p className="text-white font-semibold text-sm mt-0.5">{quoteDate}</p>
          </div>
        </div>

        {/* HERO */}
        <div className="bg-[#1A2A3A] px-8 pb-8 pt-4">
          <div className="w-full h-44 rounded-xl overflow-hidden mb-5 bg-gradient-to-br from-[#1e3a55] to-[#0d1f2d] flex items-center justify-center relative">
            {/* Solar illustration */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <svg width="320" height="160" viewBox="0 0 320 160" fill="none">
                <rect x="20" y="40" width="60" height="40" rx="2" fill="#FFC107" />
                <rect x="90" y="40" width="60" height="40" rx="2" fill="#FFC107" />
                <rect x="160" y="40" width="60" height="40" rx="2" fill="#FFC107" />
                <rect x="230" y="40" width="60" height="40" rx="2" fill="#FFC107" />
                <rect x="20" y="88" width="60" height="40" rx="2" fill="#FFC107" />
                <rect x="90" y="88" width="60" height="40" rx="2" fill="#FFC107" />
                <rect x="160" y="88" width="60" height="40" rx="2" fill="#FFC107" />
                <rect x="230" y="88" width="60" height="40" rx="2" fill="#FFC107" />
              </svg>
            </div>
            <div className="text-center relative z-10">
              <p className="text-white/40 text-sm">Imagen del proyecto</p>
              <p className="text-white/20 text-xs mt-1">{quote.city}</p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[#FFC107] text-xs font-bold uppercase tracking-widest mb-1">
                Propuesta para
              </p>
              <h1 className="text-white text-3xl font-black leading-none">
                {quote.client_name}
              </h1>
              <p className="text-slate-400 text-sm mt-2">
                📍 {quote.city}
                {quote.property_address ? ` · ${quote.property_address}` : ""}
              </p>
            </div>
            <div className="bg-[#FFC107] text-[#1A2A3A] font-black px-4 py-2 rounded-lg text-sm shrink-0">
              Sistema {systemLabel} · {kwp.toFixed(2)} kWp
            </div>
          </div>
        </div>

        {/* YELLOW STATS BAR */}
        <div className="bg-[#FFC107] px-8 py-5 grid grid-cols-4 gap-4">
          {(
            [
              ["☀️", kwp.toFixed(2), "kWp instalados"],
              ["⚡", kwhYear.toLocaleString("es-CO"), "kWh/año generados"],
              ["🌱", co2Tons.toFixed(1), "ton CO₂/año evitadas"],
              ["🌳", equivTrees.toLocaleString("es-CO"), "árboles equivalentes"],
            ] as [string, string, string][]
          ).map(([icon, val, label]) => (
            <div key={label} className="text-center">
              <div className="text-2xl mb-0.5">{icon}</div>
              <div className="text-[#1A2A3A] font-black text-2xl leading-none">{val}</div>
              <div className="text-[#1A2A3A]/60 text-xs font-medium mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* DESCRIPTION SECTION */}
        <div className="px-8 py-7 grid grid-cols-3 gap-6">
          {/* Client card */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h3 className="font-black text-[#1A2A3A] text-xs uppercase tracking-wide mb-3">
              Información del proyecto
            </h3>
            {(
              [
                ["Cliente", quote.client_name],
                ["Ciudad", quote.city],
                ...(quote.client_email ? [["Email", quote.client_email]] : []),
                ...(quote.client_phone ? [["Teléfono", quote.client_phone]] : []),
                ["Fecha", quoteDate],
                ["Validez", "15 días"],
                ["Tipo sistema", systemLabel],
                ...(quote.monthly_consumption_kwh
                  ? [
                      [
                        "Consumo mensual",
                        `${quote.monthly_consumption_kwh.toLocaleString("es-CO")} kWh`,
                      ],
                    ]
                  : []),
              ] as [string, string][]
            ).map(([l, v]) => (
              <div key={l} className="py-1.5 border-b border-slate-100 last:border-0">
                <p className="text-xs text-slate-400 leading-none">{l}</p>
                <p className="text-sm font-semibold text-[#1A2A3A] mt-0.5 break-all">{v}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="col-span-2">
            <h3 className="font-black text-[#1A2A3A] text-xs uppercase tracking-wide mb-3">
              La solución propuesta
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Solarwin presenta esta propuesta de sistema fotovoltaico{" "}
              <strong>{systemLabel}</strong> de{" "}
              <strong>{kwp.toFixed(2)} kWp</strong> diseñada para las necesidades
              energéticas de <strong>{quote.client_name}</strong> en{" "}
              <strong>{quote.city}</strong>. El sistema generará aproximadamente{" "}
              <strong>{kwhYear.toLocaleString("es-CO")} kWh al año</strong>,
              contribuyendo a la reducción de emisiones de CO₂ y al ahorro en la
              factura energética.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["🔆", "Tecnología Tier 1", "Paneles de primera calidad con máxima eficiencia"],
                  [
                    "📊",
                    "Monitoreo 24/7",
                    "Control en tiempo real desde celular o computadora",
                  ],
                  ["🛡️", "Garantías premium", "25 años paneles · 10 años inversores"],
                  [
                    "⚡",
                    "Instalación certificada",
                    "Equipo Retie certificado con experiencia comprobada",
                  ],
                ] as [string, string, string][]
              ).map(([icon, title, desc]) => (
                <div key={title} className="flex gap-2 bg-slate-50 rounded-lg p-3">
                  <span className="text-lg shrink-0">{icon}</span>
                  <div>
                    <p className="font-bold text-xs text-[#1A2A3A]">{title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-tight">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COMPONENTS TABLE */}
        {quote.items.length > 0 && (
          <div className="px-8 pb-7">
            <h3 className="font-black text-[#1A2A3A] text-xs uppercase tracking-wide mb-3">
              Equipos y materiales
            </h3>
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1A2A3A]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-8">
                      #
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white uppercase tracking-wide">
                      Componente
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-16">
                      Cant.
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Precio unit.
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-white uppercase tracking-wide">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item, i) => (
                    <tr
                      key={item.id}
                      className={`border-b border-slate-100 ${
                        i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      }`}
                    >
                      <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                        {String(i + 1).padStart(2, "0")}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#1A2A3A]">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-[#1A2A3A]">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {fmt(item.unit_price_cop)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#1A2A3A]">
                        {fmt(item.unit_price_cop * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td colSpan={4} className="px-4 py-2.5 text-right text-sm text-slate-500">
                      Subtotal
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-[#1A2A3A]">
                      {fmt(subtotal)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td colSpan={4} className="px-4 py-2 text-right text-xs text-slate-400">
                      IVA (servicios, según Ley 1715)
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-slate-500">
                      {fmt(iva)}
                    </td>
                  </tr>
                  <tr className="bg-[#FFC107]">
                    <td
                      colSpan={4}
                      className="px-4 py-3.5 text-right font-black text-[#1A2A3A] text-base"
                    >
                      TOTAL INVERSIÓN
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-[#1A2A3A] text-xl">
                      {fmt(total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* PAYMENT OPTIONS */}
        <div className="px-8 pb-7">
          <h3 className="font-black text-[#1A2A3A] text-xs uppercase tracking-wide mb-3">
            Opciones de pago
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Option 1: Cash */}
            <div className="border-2 border-[#FFC107] rounded-xl p-5 bg-yellow-50">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-[#FFC107] text-[#1A2A3A] font-black text-xs px-2.5 py-0.5 rounded-full">
                  OPCIÓN 1
                </span>
                <span className="font-bold text-[#1A2A3A]">Contado</span>
              </div>
              <p className="text-4xl font-black text-[#1A2A3A] mb-0.5">
                {fmtM(total * 0.95)}
              </p>
              <p className="text-sm text-green-600 font-semibold mb-3">
                🎁 5% descuento por pago de contado
              </p>
              <div className="space-y-1.5 text-sm border-t border-yellow-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">60% anticipo</span>
                  <span className="font-bold text-[#1A2A3A]">
                    {fmt(Math.round(total * 0.95 * 0.6))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">40% contra entrega</span>
                  <span className="font-bold text-[#1A2A3A]">
                    {fmt(Math.round(total * 0.95 * 0.4))}
                  </span>
                </div>
              </div>
            </div>

            {/* Option 2: Leasing */}
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-slate-200 text-slate-600 font-black text-xs px-2.5 py-0.5 rounded-full">
                  OPCIÓN 2
                </span>
                <span className="font-bold text-[#1A2A3A]">Leasing / Crédito</span>
              </div>
              <p className="text-4xl font-black text-[#1A2A3A] mb-0.5">
                {fmt(Math.round(total / 60))}
                <span className="text-base font-semibold text-slate-400">/mes</span>
              </p>
              <p className="text-sm text-slate-500 mb-3">Financiamiento a 60 meses</p>
              <div className="space-y-1.5 text-sm border-t border-slate-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Cuota inicial (20%)</span>
                  <span className="font-bold text-[#1A2A3A]">
                    {fmt(Math.round(total * 0.2))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Plazo</span>
                  <span className="font-bold text-[#1A2A3A]">60 meses</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROI ANALYSIS */}
        {quote.monthly_consumption_kwh > 0 && (
          <div className="px-8 pb-7">
            <h3 className="font-black text-[#1A2A3A] text-xs uppercase tracking-wide mb-3">
              Análisis de retorno de inversión
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Energy table */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-semibold text-xs text-slate-500 uppercase tracking-wide mb-3">
                  Análisis energético
                </h4>
                {(
                  [
                    [
                      "Consumo mensual actual",
                      `${quote.monthly_consumption_kwh.toLocaleString("es-CO")} kWh`,
                    ],
                    [
                      "Generación mensual estimada",
                      `${Math.round(monthlyGen).toLocaleString("es-CO")} kWh`,
                    ],
                    ["Cobertura del sistema", `${coverage.toFixed(0)}%`],
                    ...(monthlyBill > 0
                      ? [
                          ["Factura mensual actual", fmt(monthlyBill)],
                          ["Ahorro mensual estimado", fmt(monthlySavings)],
                          ["Ahorro anual estimado", fmt(annualSavings)],
                        ]
                      : []),
                  ] as [string, string][]
                ).map(([l, v]) => (
                  <div
                    key={l}
                    className="flex justify-between py-1.5 border-b border-slate-100 last:border-0 text-sm"
                  >
                    <span className="text-slate-500">{l}</span>
                    <span className="font-semibold text-[#1A2A3A]">{v}</span>
                  </div>
                ))}
              </div>

              {/* Payback cards */}
              <div className="space-y-3">
                <div className="bg-[#1A2A3A] rounded-xl p-4 text-white">
                  <p className="text-xs text-slate-400 mb-1">Retorno de inversión simple</p>
                  <p className="text-4xl font-black text-[#FFC107]">
                    {simplePayback}
                    <span className="text-base font-normal text-slate-400 ml-1">años</span>
                  </p>
                </div>
                <div className="bg-green-600 rounded-xl p-4 text-white">
                  <p className="text-xs text-green-200 mb-1">
                    Con incentivos Ley 1715 (50% deducción renta)
                  </p>
                  <p className="text-4xl font-black">
                    {paybackLey}
                    <span className="text-base font-normal text-green-200 ml-1">años</span>
                  </p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
                  <p className="font-bold mb-1">⚖️ Ley 1715 de 2014</p>
                  <p>Deducción del 50% en renta · Exclusión de IVA en equipos · Exención de aranceles de importación</p>
                </div>
              </div>
            </div>

            {/* 25-year projection */}
            {annualSavings > 0 && (
              <div className="mt-4 bg-gradient-to-r from-[#1A2A3A] to-[#243447] rounded-xl p-5 text-white">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">
                  Proyección a 25 años
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {(
                    [
                      [
                        "Ahorro total",
                        fmt(annualSavings * 25),
                        "En factura eléctrica",
                      ],
                      [
                        "CO₂ evitado",
                        `${(co2Tons * 25).toFixed(0)} ton`,
                        "Impacto ambiental",
                      ],
                      [
                        "ROI",
                        `${(((annualSavings * 25 - total) / total) * 100).toFixed(0)}%`,
                        "Retorno sobre inversión",
                      ],
                    ] as [string, string, string][]
                  ).map(([title, val, sub]) => (
                    <div key={title}>
                      <p className="text-xs text-slate-400">{title}</p>
                      <p className="font-black text-[#FFC107] text-xl">{val}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* GUARANTEES */}
        <div className="px-8 pb-7">
          <h3 className="font-black text-[#1A2A3A] text-xs uppercase tracking-wide mb-3">
            Garantías
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                ["🔆", "25 años", "Garantía de producción en paneles solares (80% potencia mínima)"],
                ["⚡", "10 años", "Garantía en inversores y microinversores"],
                ["🔧", "5 años", "Garantía en instalación, estructura y mano de obra"],
              ] as [string, string, string][]
            ).map(([icon, years, desc]) => (
              <div key={years} className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-3xl mb-1.5">{icon}</p>
                <p className="font-black text-[#1A2A3A] text-2xl">{years}</p>
                <p className="text-xs text-slate-500 mt-1 leading-tight">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-[#1A2A3A] px-8 py-5 grid grid-cols-2 gap-4 items-center">
          {/* Left: company brand */}
          <div className="flex items-center gap-3">
            {quote.broker_logo_url ? (
              <img
                src={quote.broker_logo_url}
                alt="Logo"
                className="h-10 w-auto object-contain rounded"
              />
            ) : (
              <div className="w-10 h-10 bg-[#FFC107] rounded-full flex items-center justify-center text-xl font-bold text-[#1A2A3A] shrink-0">
                ☀
              </div>
            )}
            <div>
              <p className="text-[#FFC107] font-black text-sm tracking-wide leading-tight">
                {quote.broker_trade_name ||
                  quote.broker_company_name ||
                  "SOLARWIN SAS"}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                {quote.broker_company_name &&
                quote.broker_trade_name &&
                quote.broker_company_name !== quote.broker_trade_name
                  ? quote.broker_company_name
                  : "Especialistas en soluciones fotovoltaicas para Colombia"}
              </p>
            </div>
          </div>
          {/* Right: broker contact with avatar */}
          <div className="flex items-center justify-end gap-3">
            <div className="text-right">
              <p className="text-white font-semibold text-sm">{quote.broker_name}</p>
              <p className="text-slate-400 text-xs mt-0.5">Asesor comercial</p>
              <p className="text-slate-300 text-xs mt-1">{quote.broker_email}</p>
              {quote.broker_phone && (
                <p className="text-slate-300 text-xs">{quote.broker_phone}</p>
              )}
              <p className="text-slate-500 text-xs mt-2">
                Propuesta válida por 15 días · {quoteDate}
              </p>
            </div>
            {quote.broker_avatar_url ? (
              <img
                src={quote.broker_avatar_url}
                alt={quote.broker_name}
                className="w-14 h-14 rounded-full object-cover border-2 border-[#FFC107] shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
                {quote.broker_name[0]?.toUpperCase() ?? "A"}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
