"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Quote = {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  city: string;
  kwp: number;
  project_value_cop: number;
  costo_proyecto_cop: number;
  commission_month1: number;
  status: string;
  created_at: string;
  system_type?: string;
  nota_seguimiento: string | null;
};

// ── Status config ────────────────────────────────────────────
const STATUSES = [
  { key: "borrador",       label: "Borrador",       emoji: "📝", color: "bg-slate-100 text-slate-600",   dot: "bg-slate-400"   },
  { key: "enviada",        label: "Enviada",         emoji: "📤", color: "bg-blue-100 text-blue-700",     dot: "bg-blue-500"    },
  { key: "en_negociacion", label: "Negociando",      emoji: "🤝", color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500"  },
  { key: "aceptada",       label: "Aceptada",        emoji: "✅", color: "bg-green-100 text-green-700",   dot: "bg-green-500"   },
  { key: "negativa",       label: "Negativa",        emoji: "❌", color: "bg-red-100 text-red-700",       dot: "bg-red-400"     },
  { key: "instalacion",    label: "En instalación",  emoji: "🔧", color: "bg-orange-100 text-orange-700", dot: "bg-orange-500"  },
  { key: "cerrada",        label: "Cerrada",         emoji: "🏁", color: "bg-teal-100 text-teal-700",     dot: "bg-teal-500"    },
  // legacy values
  { key: "draft",          label: "Borrador",        emoji: "📝", color: "bg-slate-100 text-slate-600",   dot: "bg-slate-400"   },
  { key: "pending",        label: "En revisión",     emoji: "⏳", color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-400"  },
  { key: "approved",       label: "Aprobada",        emoji: "✅", color: "bg-green-100 text-green-700",   dot: "bg-green-500"   },
  { key: "rejected",       label: "Rechazada",       emoji: "❌", color: "bg-red-100 text-red-700",       dot: "bg-red-400"     },
  { key: "closed",         label: "Cerrada",         emoji: "🏁", color: "bg-teal-100 text-teal-700",     dot: "bg-teal-500"    },
];

function getStatus(key: string) {
  return STATUSES.find((s) => s.key === key) ?? STATUSES[0];
}

// Pipeline stages shown in the summary bar (main statuses only)
const PIPELINE = [
  { key: "borrador",       label: "Borradores"  },
  { key: "enviada",        label: "Enviadas"    },
  { key: "en_negociacion", label: "Negociando"  },
  { key: "aceptada",       label: "Aceptadas"   },
  { key: "negativa",       label: "Negativas"   },
  { key: "instalacion",    label: "Instalación" },
  { key: "cerrada",        label: "Cerradas"    },
];

const TRANSITION_OPTIONS = [
  { key: "borrador",       label: "📝 Borrador"        },
  { key: "enviada",        label: "📤 Enviada al cliente" },
  { key: "en_negociacion", label: "🤝 En negociación"  },
  { key: "aceptada",       label: "✅ Aceptada"         },
  { key: "negativa",       label: "❌ Negativa"         },
  { key: "instalacion",    label: "🔧 En instalación"   },
  { key: "cerrada",        label: "🏁 Cerrada"          },
];

const SYSTEM_LABELS: Record<string, string> = {
  onGrid: "OnGrid", offGrid: "OffGrid", hybrid: "Híbrido",
};

// ── StatusDropdown ───────────────────────────────────────────
function StatusDropdown({
  quoteId,
  current,
  onChanged,
}: {
  quoteId: string;
  current: string;
  onChanged: (id: string, status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const s = getStatus(current);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function pick(newStatus: string) {
    if (newStatus === current) { setOpen(false); return; }
    setSaving(true);
    const supabase = createClient();
    await (supabase as any).from("quotes").update({ status: newStatus }).eq("id", quoteId);
    onChanged(quoteId, newStatus);
    setSaving(false);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={saving}
        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition ${s.color} hover:opacity-80`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {saving ? "…" : s.label}
        <span className="opacity-60 text-[10px]">▼</span>
      </button>
      {open && (
        <div className="absolute left-0 top-8 z-50 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 min-w-[200px]">
          {TRANSITION_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => pick(opt.key)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition ${
                opt.key === current ? "font-bold text-[#1A2A3A]" : "text-slate-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── NotePopover ──────────────────────────────────────────────
function NotePopover({
  quoteId,
  note,
  onSaved,
}: {
  quoteId: string;
  note: string | null;
  onSaved: (id: string, note: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(note ?? "");
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(note ?? "");
  }, [note]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await (supabase as any)
      .from("quotes")
      .update({ nota_seguimiento: text || null })
      .eq("id", quoteId);
    onSaved(quoteId, text);
    setSaving(false);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title={note ?? "Agregar nota"}
        className={`text-sm px-2 py-1 rounded-lg transition ${
          note ? "text-[#FFC107] hover:text-yellow-500" : "text-slate-300 hover:text-slate-500"
        }`}
      >
        {note ? "📌" : "📝"}
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 bg-white rounded-xl shadow-xl border border-slate-100 p-4 w-72">
          <p className="text-xs font-semibold text-[#1A2A3A] mb-2">Nota de seguimiento</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Ej: Cliente pidió recontactar el lunes, tiene reunión de junta primero..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107] resize-none"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={save}
              disabled={saving}
              className="bg-[#1A2A3A] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#243447] transition disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 text-xs px-3 py-1.5 hover:text-slate-600 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await (supabase as any)
        .from("quotes")
        .select("*")
        .eq("broker_id", user!.id)
        .order("created_at", { ascending: false });
      setQuotes(data || []);
      setLoading(false);
    }
    load();
  }, []);

  function handleStatusChange(id: string, status: string) {
    setQuotes((q) => q.map((x) => (x.id === id ? { ...x, status } : x)));
  }
  function handleNoteChange(id: string, nota: string) {
    setQuotes((q) => q.map((x) => (x.id === id ? { ...x, nota_seguimiento: nota } : x)));
  }

  const pipelineKeys = PIPELINE.map((p) => p.key);
  const filtered =
    filter === "all"
      ? quotes
      : filter === "activas"
      ? quotes.filter((q) => !["negativa", "cerrada", "rejected"].includes(q.status))
      : quotes.filter((q) => q.status === filter);

  const fmt = (n: number) => `$${(n / 1_000_000).toFixed(1)}M`;
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("es-CO", { day: "numeric", month: "short" });

  // Pipeline count (only canonical statuses)
  const pipelineCounts = PIPELINE.map((p) => ({
    ...p,
    count: quotes.filter((q) => {
      if (p.key === "borrador") return ["borrador", "draft"].includes(q.status);
      return q.status === p.key;
    }).length,
    value: quotes
      .filter((q) => {
        if (p.key === "borrador") return ["borrador", "draft"].includes(q.status);
        return q.status === p.key;
      })
      .reduce((s, q) => s + q.project_value_cop, 0),
  }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#1A2A3A]">Pipeline de ventas</h2>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">{quotes.length} cotizaciones</p>
        </div>
        <Link
          href="/broker/quoter"
          className="bg-[#FFC107] text-[#1A2A3A] font-bold px-3 md:px-5 py-2 md:py-2.5 rounded-lg hover:bg-yellow-400 transition text-xs md:text-sm whitespace-nowrap"
        >
          ⚡ <span className="hidden sm:inline">Nueva cotización</span><span className="sm:hidden">Nueva</span>
        </Link>
      </div>

      {/* Pipeline summary bar */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-7">
        {pipelineCounts.map((p) => {
          const s = getStatus(p.key);
          return (
            <button
              key={p.key}
              onClick={() => setFilter(filter === p.key ? "all" : p.key)}
              className={`rounded-xl p-3 text-left transition border-2 flex-shrink-0 w-[100px] md:w-auto ${
                filter === p.key
                  ? "border-[#1A2A3A] bg-white shadow-md"
                  : "border-transparent bg-white shadow-sm hover:shadow-md"
              }`}
            >
              <div className="text-lg mb-1">{s.emoji}</div>
              <div className="font-black text-[#1A2A3A] text-xl leading-none">{p.count}</div>
              <div className="text-slate-500 text-xs mt-0.5 leading-tight">{p.label}</div>
              {p.value > 0 && (
                <div className="text-[10px] font-semibold text-slate-400 mt-1">{fmt(p.value)}</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {([["all", "Todas"], ["activas", "Activas"]] as [string, string][]).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
              filter === val
                ? "bg-[#1A2A3A] text-white border-[#1A2A3A]"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            }`}
          >
            {label} ({val === "all" ? quotes.length : quotes.filter((q) => !["negativa", "cerrada", "rejected"].includes(q.status)).length})
          </button>
        ))}
      </div>

      {/* Table / Cards */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-slate-500 text-sm">No hay cotizaciones en esta etapa.</p>
            <Link href="/broker/quoter" className="text-blue-500 text-sm underline mt-2 block">
              Crear una →
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden md:table w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Cliente", "Ciudad", "Sistema", "kWp", "Valor", "Estado", "Nota", "Fecha", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-[#1A2A3A]">{q.client_name}</p>
                      {q.client_phone && <p className="text-xs text-slate-400">{q.client_phone}</p>}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{q.city}</td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs">{SYSTEM_LABELS[q.system_type ?? "onGrid"] ?? "OnGrid"}</td>
                    <td className="px-4 py-3.5 font-medium text-[#1A2A3A]">{q.kwp} kWp</td>
                    <td className="px-4 py-3.5 font-bold text-[#1A2A3A]">{fmt(q.project_value_cop)}</td>
                    <td className="px-4 py-3.5">
                      <StatusDropdown quoteId={q.id} current={q.status} onChanged={handleStatusChange} />
                    </td>
                    <td className="px-4 py-3.5">
                      <NotePopover quoteId={q.id} note={q.nota_seguimiento} onSaved={handleNoteChange} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs">{fmtDate(q.created_at)}</td>
                    <td className="px-4 py-3.5">
                      <Link href={`/broker/quotes/${q.id}`}
                        className="bg-[#1A2A3A] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#243447] transition font-semibold whitespace-nowrap">
                        Ver propuesta
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {filtered.map((q) => (
                <div key={q.id} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-[#1A2A3A]">{q.client_name}</p>
                      <p className="text-xs text-slate-400">{q.city} · {fmtDate(q.created_at)}</p>
                    </div>
                    <StatusDropdown quoteId={q.id} current={q.status} onChanged={handleStatusChange} />
                  </div>
                  <div className="flex items-center gap-3 text-sm mb-3">
                    <span className="font-bold text-[#1A2A3A]">{fmt(q.project_value_cop)}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">{q.kwp} kWp</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 text-xs">{SYSTEM_LABELS[q.system_type ?? "onGrid"] ?? "OnGrid"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/broker/quotes/${q.id}`}
                      className="flex-1 text-center bg-[#1A2A3A] text-white text-xs px-3 py-2 rounded-lg hover:bg-[#243447] transition font-semibold">
                      Ver propuesta →
                    </Link>
                    <NotePopover quoteId={q.id} note={q.nota_seguimiento} onSaved={handleNoteChange} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Totals */}
      {filtered.length > 0 && (
        <div className="mt-4 bg-white rounded-xl p-4 flex gap-8 shadow-sm flex-wrap">
          {(
            [
              ["Total proyectos", fmt(filtered.reduce((s, q) => s + q.project_value_cop, 0))],
              ["Proyectos en etapa", String(filtered.length)],
              ["Promedio por proyecto", fmt(filtered.reduce((s, q) => s + q.project_value_cop, 0) / filtered.length)],
            ] as [string, string][]
          ).map(([l, v]) => (
            <div key={l}>
              <div className="text-xs text-slate-400">{l}</div>
              <div className="font-bold text-[#1A2A3A] text-lg">{v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
