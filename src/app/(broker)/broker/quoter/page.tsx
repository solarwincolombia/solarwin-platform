"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PRICE_PER_KWP = 3_200_000;
const PANELS_PER_KWH = 1 / 180; // 180 kWh/panel/mes estimado

export default function QuoterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    city: "",
    consumption: "",
    numPanels: "",
    roofType: "plana" as "plana" | "inclinada" | "carport",
  });

  const kwp = form.numPanels ? +(+form.numPanels * 0.635).toFixed(1) : 0;
  const projectValue = Math.round(kwp * PRICE_PER_KWP);
  const commission1 = Math.round(projectValue * 0.5 * 0.25);
  const commission2 = Math.round(projectValue * 0.5 * 0.20);
  const commission3 = Math.round(projectValue * 0.5 * 0.15);
  const suggestedPanels = form.consumption ? Math.ceil(+form.consumption * PANELS_PER_KWH) : 0;
  const fmt = (n: number) => `$${(n / 1_000_000).toFixed(1)}M`;

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("quotes").insert({
      broker_id: user!.id,
      client_name: form.clientName,
      client_email: form.clientEmail || null,
      city: form.city,
      monthly_consumption_kwh: +form.consumption,
      num_panels: +form.numPanels,
      roof_type: form.roofType,
      project_value_cop: projectValue,
      status: "draft",
    });

    router.push("/broker/quotes");
  }

  const steps = ["Datos del cliente", "Consumo eléctrico", "Sistema solar", "Resumen"];

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1A2A3A] mb-2">Nueva Cotización</h2>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step > i + 1 ? "bg-green-500 text-white" :
              step === i + 1 ? "bg-[#FFC107] text-[#1A2A3A]" : "bg-slate-200 text-slate-500"
            }`}>
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span className={`text-sm ${step === i + 1 ? "font-semibold text-[#1A2A3A]" : "text-slate-400"}`}>{s}</span>
            {i < 3 && <span className="text-slate-300 mx-1">›</span>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-8 shadow-sm max-w-xl">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-[#1A2A3A]">Datos del cliente</h3>
            {[
              ["Nombre / Razón Social *", "clientName", "text", "Ecohotel Rosario del Mar"],
              ["Correo electrónico", "clientEmail", "email", "contacto@empresa.com"],
              ["Ciudad *", "city", "text", "Cartagena"],
            ].map(([label, key, type, ph]) => (
              <div key={key as string}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label as string}</label>
                <input type={type as string} value={(form as any)[key as string]}
                  onChange={e => setForm({ ...form, [key as string]: e.target.value })}
                  placeholder={ph as string}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]" />
              </div>
            ))}
            <button onClick={() => setStep(2)} disabled={!form.clientName || !form.city}
              className="bg-[#1A2A3A] text-white font-semibold px-6 py-2.5 rounded-lg disabled:opacity-50 hover:bg-[#243447] transition">
              Siguiente →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-[#1A2A3A]">Consumo eléctrico mensual</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Consumo mensual promedio (kWh)</label>
              <input type="number" value={form.consumption} onChange={e => setForm({ ...form, consumption: e.target.value })}
                placeholder="Ej: 15000"
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]" />
            </div>
            {suggestedPanels > 0 && (
              <div className="bg-green-50 rounded-lg p-4 text-sm text-green-800">
                💡 Para cubrir <strong>{form.consumption} kWh/mes</strong> se estiman{" "}
                <strong>{suggestedPanels} paneles</strong> (~{(suggestedPanels * 0.635).toFixed(1)} kWp).{" "}
                <button onClick={() => setForm({ ...form, numPanels: String(suggestedPanels) })}
                  className="underline font-semibold">Usar esta cantidad</button>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="bg-slate-100 text-slate-700 px-6 py-2.5 rounded-lg font-semibold">← Atrás</button>
              <button onClick={() => setStep(3)} className="bg-[#1A2A3A] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#243447] transition">Siguiente →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-[#1A2A3A]">Configuración del sistema</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Número de paneles (635W Tier 1)</label>
              <input type="number" value={form.numPanels} onChange={e => setForm({ ...form, numPanels: e.target.value })}
                placeholder="Ej: 160"
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de techo</label>
              <div className="flex gap-3">
                {(["plana", "inclinada", "carport"] as const).map(t => (
                  <button key={t} onClick={() => setForm({ ...form, roofType: t })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition ${
                      form.roofType === t ? "border-[#FFC107] bg-yellow-50 text-[#1A2A3A]" : "border-slate-200 text-slate-500"
                    }`}>{t}</button>
                ))}
              </div>
            </div>
            {kwp > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 grid grid-cols-3 gap-4 text-sm">
                {[["Potencia", `${kwp} kWp`], ["Valor proyecto", fmt(projectValue)], ["Comisión mes 1", fmt(commission1)]].map(([l, v]) => (
                  <div key={l as string}>
                    <div className="text-slate-500 text-xs">{l as string}</div>
                    <div className="font-bold text-[#1A2A3A] text-base">{v as string}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="bg-slate-100 text-slate-700 px-6 py-2.5 rounded-lg font-semibold">← Atrás</button>
              <button onClick={() => setStep(4)} disabled={!form.numPanels}
                className="bg-[#1A2A3A] text-white font-semibold px-6 py-2.5 rounded-lg disabled:opacity-50 hover:bg-[#243447] transition">Ver resumen →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <div className="text-5xl mb-2">🎉</div>
              <h3 className="font-bold text-[#1A2A3A] text-lg">Cotización lista</h3>
              <p className="text-slate-500 text-sm">Revisa y guarda para enviar al cliente</p>
            </div>
            <div className="bg-slate-50 rounded-lg divide-y divide-slate-100">
              {[
                ["Cliente", form.clientName],
                ["Ciudad", form.city],
                ["Consumo", `${form.consumption} kWh/mes`],
                ["Sistema", `${form.numPanels} paneles × 635W = ${kwp} kWp`],
                ["Techo", form.roofType],
                ["Valor del proyecto", fmt(projectValue)],
                ["Tu comisión mes 1 (25%)", fmt(commission1)],
                ["Tu comisión mes 2 (20%)", fmt(commission2)],
                ["Tu comisión mes 3 (15%)", fmt(commission3)],
              ].map(([l, v]) => (
                <div key={l as string} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-500">{l as string}</span>
                  <span className="font-semibold text-[#1A2A3A]">{v as string}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-lg font-semibold text-sm">← Editar</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-[#FFC107] text-[#1A2A3A] font-bold py-2.5 rounded-lg hover:bg-yellow-400 transition disabled:opacity-60 text-sm">
                {saving ? "Guardando..." : "💾 Guardar cotización"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
