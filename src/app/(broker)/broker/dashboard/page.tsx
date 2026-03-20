import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border-t-4`} style={{ borderColor: color }}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-slate-500 text-sm mb-1">{label}</div>
      <div className="text-[#1A2A3A] text-2xl font-bold">{value}</div>
      {sub && <div className="text-slate-400 text-xs mt-1">{sub}</div>}
    </div>
  );
}

export default async function BrokerDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: quotes }, { data: commissions }, { data: profile }] = await Promise.all([
    supabase.from("quotes").select("*").eq("broker_id", user!.id).order("created_at", { ascending: false }),
    supabase.from("commissions").select("*").eq("broker_id", user!.id),
    (supabase as any).from("profiles").select("full_name, phone, trade_name, company_name, avatar_url").eq("id", user!.id).single(),
  ]);

  // Completeness: phone + (trade_name or company_name) + avatar_url
  const profileSteps = [
    { done: !!profile?.phone, label: "Teléfono de contacto" },
    { done: !!(profile?.trade_name || profile?.company_name), label: "Nombre de tu empresa" },
    { done: !!profile?.avatar_url, label: "Foto de perfil" },
  ];
  const profileComplete = profileSteps.every((s) => s.done);
  const completedCount = profileSteps.filter((s) => s.done).length;

  const totalCommissions = commissions?.filter(c => c.paid).reduce((sum, c) => sum + c.amount_cop, 0) ?? 0;
  const pendingCommissions = commissions?.filter(c => !c.paid).reduce((sum, c) => sum + c.amount_cop, 0) ?? 0;
  const closedQuotes = quotes?.filter(q => q.status === "closed").length ?? 0;
  const activeQuotes = quotes?.filter(q => ["draft", "pending", "approved"].includes(q.status)).length ?? 0;

  const fmt = (n: number) => `$${(n / 1_000_000).toFixed(1)}M`;

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1A2A3A] mb-1">
        Bienvenido, {profile?.full_name?.split(" ")[0]} 👋
      </h2>
      <p className="text-slate-500 mb-6">Aquí tienes un resumen de tu actividad</p>

      {/* Profile completion banner */}
      {!profileComplete && (
        <Link href="/broker/settings" className="block mb-8">
          <div className="bg-gradient-to-r from-[#1A2A3A] to-[#243447] rounded-xl px-6 py-4 flex items-center gap-5 hover:from-[#243447] hover:to-[#2e4057] transition group">
            <div className="w-12 h-12 bg-[#FFC107] rounded-full flex items-center justify-center text-2xl shrink-0">
              🪪
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">
                Completa tu perfil para personalizar tus propuestas
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                {completedCount}/3 pasos completos ·{" "}
                {profileSteps.filter((s) => !s.done).map((s) => s.label).join(", ")}
              </p>
              {/* progress bar */}
              <div className="mt-2 h-1.5 bg-slate-600 rounded-full w-48 overflow-hidden">
                <div
                  className="h-full bg-[#FFC107] rounded-full transition-all"
                  style={{ width: `${(completedCount / 3) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-[#FFC107] text-sm font-semibold group-hover:translate-x-0.5 transition-transform">
              Completar →
            </span>
          </div>
        </Link>
      )}


      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard icon="📋" label="Cotizaciones activas" value={String(activeQuotes)} color="#FFC107" />
        <StatCard icon="✅" label="Proyectos cerrados" value={String(closedQuotes)} color="#22C55E" />
        <StatCard icon="💰" label="Comisiones ganadas" value={fmt(totalCommissions)} color="#3B82F6" />
        <StatCard icon="⏳" label="Pendiente de pago" value={fmt(pendingCommissions)} color="#8B5CF6" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="md:col-span-2 bg-white rounded-xl p-4 md:p-6 shadow-sm overflow-x-auto">
          <h3 className="text-[#1A2A3A] font-semibold mb-4">Cotizaciones recientes</h3>
          {quotes?.length === 0 ? (
            <p className="text-slate-400 text-sm">Aún no tienes cotizaciones. <Link href="/broker/quoter" className="text-blue-500 underline">Crear una →</Link></p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  {["Cliente", "kWp", "Valor", "Comisión m1", "Estado"].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-slate-500 font-semibold text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quotes?.slice(0, 5).map(q => (
                  <tr key={q.id} className="border-b border-slate-50">
                    <td className="py-3 px-2 font-medium text-[#1A2A3A]">{q.client_name}</td>
                    <td className="py-3 px-2 text-slate-600">{q.kwp} kWp</td>
                    <td className="py-3 px-2 font-semibold">${(q.project_value_cop / 1_000_000).toFixed(0)}M</td>
                    <td className="py-3 px-2 text-green-600 font-semibold">${(q.commission_month1 / 1_000_000).toFixed(1)}M</td>
                    <td className="py-3 px-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        q.status === "approved" ? "bg-green-100 text-green-700" :
                        q.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>{q.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-[#1A2A3A] rounded-xl p-6 text-white">
          <h3 className="font-semibold mb-4">Acciones rápidas</h3>
          {[
            { icon: "⚡", label: "Nueva cotización", href: "/broker/quoter" },
            { icon: "📋", label: "Ver cotizaciones", href: "/broker/quotes" },
            { icon: "💰", label: "Ver comisiones", href: "/broker/commissions" },
            { icon: "📁", label: "Materiales de ventas", href: "/broker/resources" },
          ].map(a => (
            <Link key={a.label} href={a.href}
              className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-lg px-4 py-3 mb-2 text-sm transition">
              <span>{a.icon}</span> {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
