const RESOURCES = [
  { icon: "📊", name: "Pitch Deck Solarwin 2026", type: "PPTX", size: "4.2 MB", desc: "Presentación comercial lista para usar con clientes" },
  { icon: "📄", name: "Brochure Corporativo", type: "PDF", size: "2.1 MB", desc: "Resumen de servicios y proyectos ejecutados" },
  { icon: "💰", name: "Calculadora ROI Solar", type: "XLSX", size: "1.8 MB", desc: "Herramienta para demostrar el retorno al cliente" },
  { icon: "📋", name: "Propuesta tipo para cliente", type: "DOCX", size: "890 KB", desc: "Plantilla editable de propuesta de colaboración" },
  { icon: "🗺️", name: "Mapa de proyectos Solarwin", type: "PDF", size: "3.4 MB", desc: "Casos de éxito georeferenciados en Colombia" },
  { icon: "📸", name: "Fotos de proyectos ejecutados", type: "ZIP", size: "120 MB", desc: "Galería de instalaciones para mostrar a clientes" },
];

const TYPE_COLORS: Record<string, string> = {
  PPTX: "bg-orange-100 text-orange-700",
  PDF: "bg-red-100 text-red-700",
  XLSX: "bg-green-100 text-green-700",
  DOCX: "bg-blue-100 text-blue-700",
  ZIP: "bg-purple-100 text-purple-700",
  MP4: "bg-pink-100 text-pink-700",
};

export default function ResourcesPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1A2A3A] mb-2">Materiales de Ventas</h2>
      <p className="text-slate-500 text-sm mb-6">Recursos exclusivos para brokers Solarwin. No compartir públicamente.</p>

      <div className="grid grid-cols-3 gap-4">
        {RESOURCES.map(r => (
          <div key={r.name} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col">
            <div className="text-4xl mb-3">{r.icon}</div>
            <h3 className="font-semibold text-[#1A2A3A] text-sm mb-1">{r.name}</h3>
            <p className="text-slate-400 text-xs mb-4 flex-1">{r.desc}</p>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[r.type] || "bg-slate-100 text-slate-600"}`}>{r.type}</span>
                <span className="text-slate-400 text-xs">{r.size}</span>
              </div>
              <button className="bg-[#1A2A3A] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#243447] transition">
                ⬇ Descargar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-[#FFFBEB] border border-yellow-200 rounded-xl p-4 flex gap-3 items-start">
        <span className="text-xl">🔒</span>
        <p className="text-sm text-yellow-800">
          Estos materiales son <strong>confidenciales y exclusivos para aliados Solarwin</strong>.
          No están autorizados para distribución pública ni compartir en redes sociales sin previa autorización.
        </p>
      </div>
    </div>
  );
}
