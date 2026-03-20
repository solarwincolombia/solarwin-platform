import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/ui/TopBar";
import SideNav from "@/components/ui/SideNav";
import BottomNav from "@/components/ui/BottomNav";

const NAV_ITEMS = [
  { href: "/installer/dashboard", icon: "🏠", label: "Inicio" },
  { href: "/installer/projects", icon: "🔧", label: "Mis Proyectos" },
  { href: "/installer/support", icon: "🛠️", label: "Soporte Técnico" },
  { href: "/installer/warranties", icon: "🛡️", label: "Garantías" },
  { href: "/installer/payments", icon: "💰", label: "Pagos" },
  { href: "/installer/equipment", icon: "📦", label: "Equipos" },
  { href: "/installer/settings", icon: "⚙️", label: "Perfil y marca" },
];

export default async function InstallerLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "installer") redirect("/broker/dashboard");

  return (
    <div className="font-sans">
      <TopBar userName={profile.full_name} role="installer" />
      <div className="flex">
        <SideNav items={NAV_ITEMS} />
        <main className="flex-1 bg-[#F5F7FA] min-h-[calc(100vh-56px)] p-4 md:p-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>
      <BottomNav items={NAV_ITEMS} />
    </div>
  );
}
