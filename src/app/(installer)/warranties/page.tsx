"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function WarrantiesPage() {
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
        .eq("stage", "delivered")
        .order("end_date", { ascending: false });
      setProjects(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1A2A3A] mb-2">Garantías</h2>
      <p className="text-slate-500 text-sm mb-6">Proyectos entregados con garantías activas bajo la marca Solarwin</p>

      {/* Warranty types */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: "🌞", title: "Paneles solares", desc: "25 años de garantía de producción", detail: "Mínimo 80% de potencia nominal al año 25" },
          { icon: "⚡", title: "Inversores", desc: "10 años de garantía de fábrica", detail: "Cubre defectos de fabricación y fallas eléctricas" },
          { icon: "🏗️", title: "Estructura", desc: "15 años de garantía estructural", detail: "Resistencia a cargas de viento y sismo según NSR-10" },
        ].map(w => (
          <div key={w.title} className="bg-[#1A2A3A] rounded-xl p-5 text-white">
            <div className="text-3xl mb-2">{w.icon}</div>
            <h3 className="font-bold text-base mb-1">{w.title}</h3>
            <div className="text-[#FFC107] font-semibold text-sm mb-2">{w.desc}</div>
            <p className="text-slate-400 text-xs">{w.detail}</p>
          </div>
        ))}
      </div>

      {/* Projects with warranties */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center text-slate-400">Cargando...</div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">🛡️</div>
          <p className="text-slate-500 text-sm">Aún no tienes proyectos entregados con garantías activas.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {projects.map(p => {
            const deliveredDate = p.end_date ? new Date(p.end_date) : new Date();
            const warrantyEnd = new Date(deliveredDate);
            warrantyEnd.setFullYear(warrantyEnd.getFullYear() + 10);
            const yearsLeft = Math.max(0, Math.floor((warrantyEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365)));

            return (
              <div key={p.id} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-[#1A2A3A] text-lg">{p.client_name}</h3>
                    <p className="text-slate-400 text-sm">{p.city} · {p.kwp} kWp · Entregado {deliveredDate.toLocaleDateString("es-CO", { month: "short", year: "numeric" })}</p>
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">🛡️ Activa</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    ["🌞 Paneles", "25 años", `Vence ${new Date(deliveredDate.getFullYear() + 25, deliveredDate.getMonth()).toLocaleDateString("es-CO", { month: "short", year: "numeric" })}`],
                    ["⚡ Inversor", "10 años", `Vence ${new Date(deliveredDate.getFullYear() + 10, deliveredDate.getMonth()).toLocaleDateString("es-CO", { month: "short", year: "numeric" })}`],
                    ["🏗️ Estructura", "15 años", `Vence ${new Date(deliveredDate.getFullYear() + 15, deliveredDate.getMonth()).toLocaleDateString("es-CO", { month: "short", year: "numeric" })}`],
                  ].map(([l, v, s]) => (
                    <div key={l as string} className="bg-slate-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-slate-700">{l as string}</div>
                      <div className="text-[#1A2A3A] font-bold">{v as string}</div>
                      <div className="text-slate-400 text-xs">{s as string}</div>
                    </div>
                  ))}
                </div>
                <button className="text-sm text-blue-500 font-medium hover:underline">
                  + Reportar falla o reclamación de garantía
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
