import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/ui/TopBar";
import SideNav from "@/components/ui/SideNav";
import BottomNav from "@/components/ui/BottomNav";

const NAV_ITEMS = [
  { href: "/installer/dashboard", icon: "🏠", label: "Inicio" },
  { href: "/installer/projects", icon: "🔧", label: "Mis Proyectos" },
  { href: "/installer/quotes", icon: "📋", label: "Mis Cotizaciones" },
  { href: "/installer/quoter", icon: "⚡", label: "Nueva Cotización" },
  { href: "/installer/support", icon: "🛠️", label: "Soporte Técnico" },
  { href: "/installer/warranties", icon: "🛡️", label: "Garantías" },
  { href: "/installer/payments", icon: "💰", label: "Pagos" },
  { href: "/installer/equipment", icon: "📦", label: "Equipos" },
  { href: "/installer/settings", icon: "⚙️", label: "Perfil y marca" },
];

export default async function InstallerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "installer") redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar userName={profile?.full_name || ""} role="Instalador" />
      <div className="flex flex-1 overflow-hidden">
        <SideNav items={NAV_ITEMS} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">{children}</main>
      </div>
      <BottomNav items={NAV_ITEMS} />
    </div>
  );
}
