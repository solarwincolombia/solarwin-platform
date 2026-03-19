export default function SupportPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1A2A3A] mb-6">Soporte Técnico</h2>
      <div className="grid grid-cols-2 gap-5 mb-6">
        {[
          { icon: "📞", title: "Línea directa", desc: "Soporte en tiempo real Lun-Vie 8am-6pm", action: "Llamar ahora", color: "#22C55E", href: "tel:+573001234567" },
          { icon: "💬", title: "Chat técnico WhatsApp", desc: "Resuelve dudas con nuestro equipo técnico", action: "Abrir WhatsApp", color: "#25D366", href: "https://wa.me/573001234567" },
          { icon: "📚", title: "Base de conocimiento", desc: "Fichas técnicas, manuales y guías de instalación", action: "Ver documentos", color: "#3B82F6", href: "#" },
          { icon: "🎓", title: "Capacitaciones", desc: "Programa de certificación Solarwin para instaladores", action: "Ver cursos", color: "#FFC107", href: "#" },
        ].map(s => (
          <div key={s.title} className="bg-white rounded-xl p-6 shadow-sm" style={{ borderLeft: `4px solid ${s.color}` }}>
            <div className="text-4xl mb-3">{s.icon}</div>
            <h3 className="text-[#1A2A3A] font-bold text-lg mb-1">{s.title}</h3>
            <p className="text-slate-500 text-sm mb-4">{s.desc}</p>
            <a href={s.href} className="inline-block text-sm font-semibold px-4 py-2 rounded-lg border-2 transition hover:opacity-80"
              style={{ borderColor: s.color, color: s.color }}>
              {s.action}
            </a>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-[#1A2A3A] mb-4">Crear ticket de soporte</h3>
        <div className="space-y-3 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Proyecto relacionado</label>
            <select className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]">
              <option>Selecciona un proyecto...</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de consulta</label>
            <select className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]">
              <option>Problema técnico en instalación</option>
              <option>Consulta sobre equipos</option>
              <option>Garantía / falla de equipo</option>
              <option>Documentación / trámites</option>
              <option>Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <textarea rows={4} placeholder="Describe tu consulta con el mayor detalle posible..."
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107] resize-none" />
          </div>
          <button className="bg-[#1A2A3A] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#243447] transition text-sm">
            Enviar ticket →
          </button>
        </div>
      </div>
    </div>
  );
}
