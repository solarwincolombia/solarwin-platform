"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PaymentsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("installer_id", user!.id)
        .order("created_at", { ascending: false });
      setProjects(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const fmt = (n: number) => `$${(n / 1_000_000).toFixed(0)}M`;
  const paid = projects.filter(p => p.installer_paid);
  const pending = projects.filter(p => !p.installer_paid);
  const totalPaid = paid.reduce((s: number, p: any) => s + p.installer_payment_cop, 0);
  const totalPending = pending.reduce((s: number, p: any) => s + p.installer_payment_cop, 0);

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1A2A3A] mb-6">Pagos</h2>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: "✅", label: "Pagado", value: fmt(totalPaid), color: "#22C55E" },
          { icon: "⏳", label: "Pendiente", value: fmt(totalPending), sub: `${pending.length} proyecto(s)`, color: "#FFC107" },
          { icon: "📊", label: "Total 2026", value: fmt(totalPaid + totalPending), color: "#3B82F6" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-6 shadow-sm border-t-4" style={{ borderColor: s.color }}>
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-slate-500 text-sm mb-1">{s.label}</div>
            <div className="text-[#1A2A3A] text-2xl font-bold">{s.value}</div>
            {"sub" in s && s.sub && <div className="text-slate-400 text-xs mt-1">{s.sub}</div>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-[#1A2A3A]">Historial de pagos por proyecto</h3>
        </div>
        {loading ? (
          <div className="p-12 text-center text-slate-400">Cargando...</div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">💰</div>
            <p className="text-slate-500 text-sm">Aún no tienes proyectos con pagos registrados.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Proyecto", "Ciudad", "kWp", "Valor total", "Tu pago", "Estado"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3.5 font-semibold text-[#1A2A3A]">{p.client_name}</td>
                  <td className="px-4 py-3.5 text-slate-500">{p.city}</td>
                  <td className="px-4 py-3.5">{p.kwp} kWp</td>
                  <td className="px-4 py-3.5 font-semibold">{fmt(p.total_value_cop)}</td>
                  <td className="px-4 py-3.5 font-bold text-[#1A2A3A]">{fmt(p.installer_payment_cop)}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      p.installer_paid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {p.installer_paid ? "✓ Pagado" : "⏳ Pendiente"}
                    </span>
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
