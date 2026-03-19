"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Project = {
  id: string;
  client_name: string;
  city: string;
  kwp: number;
  stage: "design" | "equipment" | "installation" | "delivered";
  start_date: string | null;
  total_value_cop: number;
  installer_payment_cop: number;
  installer_paid: boolean;
};

const STAGES = [
  { key: "design", label: "Diseño", icon: "📐", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { key: "equipment", label: "Equipos", icon: "📦", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { key: "installation", label: "Instalación", icon: "🔧", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { key: "delivered", label: "Entregado", icon: "✅", color: "bg-green-100 text-green-700 border-green-200" },
];

export default function InstallerProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Project | null>(null);

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

  const filtered = filter === "all" ? projects : projects.filter(p => p.stage === filter);
  const fmt = (n: number) => `$${(n / 1_000_000).toFixed(0)}M`;

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1A2A3A] mb-6">Mis Proyectos</h2>

      {/* Stage summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {STAGES.map(s => {
          const count = projects.filter(p => p.stage === s.key).length;
          return (
            <button key={s.key} onClick={() => setFilter(filter === s.key ? "all" : s.key)}
              className={`bg-white rounded-xl p-4 shadow-sm border-2 transition text-left ${
                filter === s.key ? "border-[#FFC107]" : "border-transparent"
              }`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-[#1A2A3A] font-bold text-xl">{count}</div>
              <div className="text-slate-500 text-xs">{s.label}</div>
            </button>
          );
        })}
      </div>

      {/* Project cards */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center text-slate-400">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">🔧</div>
          <p className="text-slate-500 text-sm">No hay proyectos en esta etapa.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(p => {
            const stage = STAGES.find(s => s.key === p.stage)!;
            const stageIdx = STAGES.findIndex(s => s.key === p.stage);
            return (
              <div key={p.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={() => setSelected(selected?.id === p.id ? null : p)}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-[#1A2A3A] text-lg">{p.client_name}</h3>
                    <p className="text-slate-400 text-sm">{p.city} · {p.kwp} kWp{p.start_date ? ` · Inicio ${new Date(p.start_date).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}` : ""}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${stage.color}`}>
                    {stage.icon} {stage.label}
                  </span>
                </div>

                {/* Pipeline */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {STAGES.map((s, i) => (
                    <div key={s.key} className={`rounded-lg p-2.5 text-center text-xs font-medium border ${
                      i < stageIdx ? "bg-green-50 text-green-700 border-green-100" :
                      i === stageIdx ? `${stage.color}` :
                      "bg-slate-50 text-slate-400 border-slate-100"
                    }`}>
                      {s.icon} {s.label}
                      {i < stageIdx && <div className="text-green-500 text-xs mt-0.5">✓</div>}
                      {i === stageIdx && <div className="text-xs mt-0.5">En curso</div>}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex gap-6">
                    <div>
                      <span className="text-slate-400 text-xs">Valor total</span>
                      <div className="font-bold text-[#1A2A3A]">{fmt(p.total_value_cop)}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs">Tu pago</span>
                      <div className={`font-bold ${p.installer_paid ? "text-green-600" : "text-[#1A2A3A]"}`}>
                        {fmt(p.installer_payment_cop)} {p.installer_paid ? "✓" : ""}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    p.installer_paid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {p.installer_paid ? "✓ Pagado" : "⏳ Pago pendiente"}
                  </span>
                </div>

                {/* Expanded actions */}
                {selected?.id === p.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2">
                    {[
                      { icon: "📋", label: "Ver planos" },
                      { icon: "📦", label: "Solicitar equipos" },
                      { icon: "📸", label: "Subir fotos de avance" },
                      { icon: "📄", label: "Subir acta de entrega" },
                      { icon: "🛡️", label: "Activar garantía" },
                      { icon: "💬", label: "Contactar soporte" },
                    ].map(a => (
                      <button key={a.label}
                        className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-600 transition">
                        <span>{a.icon}</span> {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
