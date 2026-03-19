import Link from "next/link";

const STATS = [
  { value: "$50B+", label: "en proyectos gestionados" },
  { value: "120+", label: "aliados activos en Colombia" },
  { value: "50%", label: "utilidad compartida con aliados" },
  { value: "15 años", label: "de garantía en equipos" },
];

const BROKER_FEATURES = [
  "Cotizador con precios reales de Solarwin",
  "50/50 de la utilidad neta por proyecto",
  "Material de ventas y pitch deck profesional",
  "Soporte técnico y comercial en cada propuesta",
  "Dashboard de seguimiento de tus proyectos",
];

const INSTALLER_FEATURES = [
  "Acceso a equipos Tier 1 a precio de fábrica",
  "Vende bajo la marca y garantías Solarwin",
  "Financiamiento para tus clientes incluido",
  "Soporte técnico y asistencia en obra",
  "Dashboard de proyectos y pagos en tiempo real",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans">
      {/* Navbar */}
      <nav className="bg-[#1A2A3A] px-8 py-4 flex items-center justify-between">
        <span className="text-2xl font-extrabold tracking-wide">
          <span className="text-[#FFC107]">SOLAR</span>
          <span className="text-white">WIN</span>
        </span>
        <div className="flex gap-4">
          <Link href="/login" className="text-slate-300 hover:text-white text-sm px-4 py-2 rounded-lg transition">
            Iniciar sesión
          </Link>
          <Link href="/register" className="bg-[#FFC107] text-[#1A2A3A] text-sm font-bold px-4 py-2 rounded-lg hover:bg-yellow-400 transition">
            Registrarme
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-[#1A2A3A] px-8 pt-20 pb-24 text-center">
        <h1 className="text-5xl font-extrabold text-white leading-tight mb-4">
          Vende solar.<br />
          <span className="text-[#FFC107]">Nosotros ponemos todo lo demás.</span>
        </h1>
        <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-10">
          Únete a la red de aliados Solarwin. Haz cotizaciones profesionales, accede a precios de fábrica,
          respaldo técnico y gana hasta el 50% de la utilidad.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/register?role=broker"
            className="bg-[#FFC107] text-[#1A2A3A] font-bold text-lg px-8 py-4 rounded-xl hover:bg-yellow-400 transition">
            🤝 Soy Broker / Vendedor
          </Link>
          <Link href="/register?role=installer"
            className="border-2 border-[#FFC107] text-white font-bold text-lg px-8 py-4 rounded-xl hover:bg-[#FFC107] hover:text-[#1A2A3A] transition">
            🔧 Soy Instalador
          </Link>
        </div>
      </div>

      {/* Value cards */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Broker */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border-2 border-[#FFC107]">
            <div className="text-5xl mb-4">🤝</div>
            <h2 className="text-2xl font-bold text-[#1A2A3A] mb-2">Para Brokers</h2>
            <p className="text-slate-500 text-sm mb-6">No necesitas invertir en empresa solar. Usa la nuestra.</p>
            {BROKER_FEATURES.map(f => (
              <div key={f} className="flex gap-2 items-start mb-3">
                <span className="text-[#FFC107] font-bold mt-0.5">✓</span>
                <span className="text-slate-700 text-sm">{f}</span>
              </div>
            ))}
            <Link href="/register?role=broker"
              className="mt-6 block text-center bg-[#1A2A3A] text-white font-semibold py-3 rounded-lg hover:bg-[#243447] transition">
              Registrarme como Broker →
            </Link>
          </div>

          {/* Installer */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="text-5xl mb-4">🔧</div>
            <h2 className="text-2xl font-bold text-[#1A2A3A] mb-2">Para Instaladores</h2>
            <p className="text-slate-500 text-sm mb-6">Instala bajo la marca Solarwin. Mayor confianza del cliente.</p>
            {INSTALLER_FEATURES.map(f => (
              <div key={f} className="flex gap-2 items-start mb-3">
                <span className="text-[#FFC107] font-bold mt-0.5">✓</span>
                <span className="text-slate-700 text-sm">{f}</span>
              </div>
            ))}
            <Link href="/register?role=installer"
              className="mt-6 block text-center bg-[#1A2A3A] text-white font-semibold py-3 rounded-lg hover:bg-[#243447] transition">
              Registrarme como Instalador →
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12 bg-[#1A2A3A] rounded-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(s => (
            <div key={s.value} className="text-center">
              <div className="text-[#FFC107] text-3xl font-extrabold">{s.value}</div>
              <div className="text-slate-400 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
