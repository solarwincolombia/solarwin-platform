"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Quote = {
  id: string;
  client_name: string;
  city: string;
  kwp: number;
  project_value_cop: number;
  commission_month1: number;
  status: string;
  created_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador", pending: "En revisión", approved: "Aprobada",
  rejected: "Rechazada", closed: "Cerrada"
};
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  closed: "bg-blue-100 text-blue-700",
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("quotes")
        .select("*")
        .eq("broker_id", user!.id)
        .order("created_at", { ascending: false });
      setQuotes(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter === "all" ? quotes : quotes.filter(q => q.status === filter);
  const fmt = (n: number) => `$${(n / 1_000_000).toFixed(1)}M`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("es-CO", { day: "numeric", month: "short" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1A2A3A]">Mis Cotizaciones</h2>
          <p className="text-slate-500 text-sm mt-1">{quotes.length} cotizaciones en total</p>
        </div>
        <Link href="/broker/quoter"
          className="bg-[#FFC107] text-[#1A2A3A] font-bold px-5 py-2.5 rounded-lg hover:bg-yellow-400 transition text-sm">
          ⚡ Nueva cotización
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[["all", "Todas"], ["draft", "Borradores"], ["pending", "En revisión"], ["approved", "Aprobadas"], ["closed", "Cerradas"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
              filter === val ? "bg-[#1A2A3A] text-white border-[#1A2A3A]" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            }`}>
            {label} {val === "all" ? `(${quotes.length})` : `(${quotes.filter(q => q.status === val).length})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-slate-500 text-sm">No hay cotizaciones en esta categoría.</p>
            <Link href="/broker/quoter" className="text-blue-500 text-sm underline mt-2 block">Crear una →</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["#", "Cliente", "Ciudad", "kWp", "Valor proyecto", "Comisión mes 1", "Estado", "Fecha", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((q, i) => (
                <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="px-4 py-3.5 text-slate-400 text-xs font-mono">{String(i + 1).padStart(3, "0")}</td>
                  <td className="px-4 py-3.5 font-semibold text-[#1A2A3A]">{q.client_name}</td>
                  <td className="px-4 py-3.5 text-slate-500">{q.city}</td>
                  <td className="px-4 py-3.5">{q.kwp} kWp</td>
                  <td className="px-4 py-3.5 font-semibold">{fmt(q.project_value_cop)}</td>
                  <td className="px-4 py-3.5 text-green-600 font-bold">{fmt(q.commission_month1)}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[q.status]}`}>
                      {STATUS_LABELS[q.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 text-xs">{fmtDate(q.created_at)}</td>
                  <td className="px-4 py-3.5">
                    <button className="bg-[#1A2A3A] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#243447] transition">
                      Ver PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary row */}
      {filtered.length > 0 && (
        <div className="mt-4 bg-white rounded-xl p-4 flex gap-8 shadow-sm">
          {[
            ["Total proyectos", fmt(filtered.reduce((s, q) => s + q.project_value_cop, 0))],
            ["Comisiones potenciales (mes 1)", fmt(filtered.reduce((s, q) => s + q.commission_month1, 0))],
            ["Promedio por proyecto", fmt(filtered.reduce((s, q) => s + q.project_value_cop, 0) / filtered.length)],
          ].map(([l, v]) => (
            <div key={l as string}>
              <div className="text-xs text-slate-400">{l as string}</div>
              <div className="font-bold text-[#1A2A3A] text-lg">{v as string}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
