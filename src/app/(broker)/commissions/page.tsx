"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Commission = {
  id: string;
  month_number: number;
  amount_cop: number;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
  project_id: string;
};

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("commissions")
        .select("*")
        .eq("broker_id", user!.id)
        .order("created_at", { ascending: false });
      setCommissions(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const fmt = (n: number) => `$${(n / 1_000_000).toFixed(1)}M`;
  const paid = commissions.filter(c => c.paid);
  const pending = commissions.filter(c => !c.paid);
  const totalPaid = paid.reduce((s, c) => s + c.amount_cop, 0);
  const totalPending = pending.reduce((s, c) => s + c.amount_cop, 0);

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1A2A3A] mb-6">Mis Comisiones</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: "✅", label: "Cobrado", value: fmt(totalPaid), color: "#22C55E" },
          { icon: "⏳", label: "Pendiente de pago", value: fmt(totalPending), color: "#FFC107" },
          { icon: "📊", label: "Total acumulado", value: fmt(totalPaid + totalPending), color: "#3B82F6" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-6 shadow-sm border-t-4" style={{ borderColor: s.color }}>
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-slate-500 text-sm mb-1">{s.label}</div>
            <div className="text-[#1A2A3A] text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Scale reminder */}
      <div className="bg-[#1A2A3A] rounded-xl p-6 mb-6">
        <h3 className="text-white font-semibold mb-4">Tu escala de comisiones Solarwin</h3>
        <div className="grid grid-cols-3 gap-4">
          {[["Mes 1", "25%", "del primer pago del cliente"], ["Mes 2", "20%", "del segundo pago"], ["Mes 3", "15%", "del tercer pago"]].map(([m, p, s]) => (
            <div key={m} className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-slate-400 text-xs mb-1">{m}</div>
              <div className="text-[#FFC107] text-3xl font-extrabold">{p}</div>
              <div className="text-slate-400 text-xs mt-1">{s}</div>
            </div>
          ))}
        </div>
        <p className="text-slate-400 text-xs mt-4">
          Las comisiones se calculan sobre el <strong className="text-white">50% de la rentabilidad neta</strong> del proyecto
          y se pagan cuando el cliente realiza cada desembolso.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-[#1A2A3A]">Historial de comisiones</h3>
          <span className="text-xs text-slate-400">{commissions.length} registros</span>
        </div>
        {loading ? (
          <div className="p-12 text-center text-slate-400">Cargando...</div>
        ) : commissions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">💰</div>
            <p className="text-slate-500 text-sm">Aún no tienes comisiones registradas.</p>
            <p className="text-slate-400 text-xs mt-1">Cierra tu primera cotización para empezar a ganar.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Proyecto", "Cuota", "Monto", "Estado", "Fecha de pago"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commissions.map(c => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3.5 text-slate-500 font-mono text-xs">{c.project_id.slice(0, 8)}...</td>
                  <td className="px-4 py-3.5">
                    <span className="bg-[#1A2A3A] text-[#FFC107] text-xs font-bold px-2.5 py-1 rounded-full">
                      Mes {c.month_number} — {[25, 20, 15][c.month_number - 1]}%
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-[#1A2A3A] text-base">{fmt(c.amount_cop)}</td>
                  <td className="px-4 py-3.5">
                    {c.paid ? (
                      <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">✓ Pagado</span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full">⏳ Pendiente</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 text-xs">
                    {c.paid_at ? new Date(c.paid_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
