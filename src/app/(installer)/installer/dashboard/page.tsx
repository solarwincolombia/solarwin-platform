import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function InstallerDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: projects }, { data: profile }] = await Promise.all([
    supabase.from("projects").select("*").eq("installer_id", user!.id).order("created_at", { ascending: false }),
    supabase.from("profiles").select("full_name, company_name").eq("id", user!.id).single(),
  ]);

  const activeProjects = projects?.filter(p => p.stage !== "delivered").length ?? 0;
  const completedProjects = projects?.filter(p => p.stage === "delivered").length ?? 0;
  const pendingPayment = projects?.filter(p => !p.installer_paid).reduce((s, p) => s + p.installer_payment_cop, 0) ?? 0;
  const fmt = (n: number) => `$${(n / 1_000_000).toFixed(0)}M`;

  const stageLabel: Record<string, string> = {
    design: "Diseño", equipment: "Equipos", installation: "Instalación", delivered: "Entregado"
  };
  const stageColor: Record<string, string> = {
    design: "bg-purple-100 text-purple-700", equipment: "bg-blue-100 text-blue-700",
    installation: "bg-yellow-100 text-yellow-700", delivered: "bg-green-100 text-green-700"
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1A2A3A] mb-1">
        Bienvenido, {profile?.full_name?.split(" ")[0]} 👋
      </h2>
      <p className="text-slate-500 mb-8">
        {profile?.company_name && <span className="font-medium">{profile.company_name} · </span>}
        Instalador certificado Solarwin
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: "🔧", label: "Proyectos activos", value: String(activeProjects), color: "#FFC107" },
          { icon: "✅", label: "Proyectos entregados", value: String(completedProjects), color: "#22C55E" },
          { icon: "💰", label: "Pago pendiente", value: fmt(pendingPayment), color: "#3B82F6" },
          { icon: "🛡️", label: "Garantías activas", value: String(completedProjects), color: "#8B5CF6" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-6 shadow-sm border-t-4" style={{ borderColor: s.color }}>
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-slate-500 text-sm mb-1">{s.label}</div>
            <div className="text-[#1A2A3A] text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-[#1A2A3A] mb-4">Proyectos en curso</h3>
          {projects?.length === 0 ? (
            <p className="text-slate-400 text-sm">Aún no tienes proyectos asignados.</p>
          ) : (
            <div className="space-y-3">
              {projects?.slice(0, 5).map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-sm text-[#1A2A3A]">{p.client_name}</div>
                    <div className="text-xs text-slate-400">{p.city} · {p.kwp} kWp</div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stageColor[p.stage]}`}>
                    {stageLabel[p.stage]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#1A2A3A] rounded-xl p-6 text-white">
          <h3 className="font-semibold mb-4">Soporte rápido</h3>
          <p className="text-slate-400 text-xs mb-4">Equipo técnico disponible Lun-Vie 8am-6pm</p>
          {[
            { icon: "📦", label: "Solicitar equipos", href: "/installer/equipment" },
            { icon: "🛡️", label: "Activar garantía", href: "/installer/warranties" },
            { icon: "💰", label: "Ver pagos", href: "/installer/payments" },
            { icon: "🛠️", label: "Soporte técnico", href: "/installer/support" },
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
