"use client";
import { useState, useEffect, useCallback, useMemo } from "react";

/* ââ Types ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
interface StationLive {
  id: string;
  name: string;
  generationPower: number;   // kW instantÃ¡neo
  consumptionPower: number;
  gridPower: number;         // inyecciÃ³n a red
  purchasePower: number;     // compra de red
  wirePower: number;
  batteryPower: number;
  batterySOC: number;
  chargePower: number;
  dischargePower: number;
  irradiateIntensity: number;
  lastUpdateTime: string;
  installedCapacity: number; // kWp
  createdDate: number;
  locationAddress: string;
}

interface DeviceInfo {
  deviceSn: string;
  deviceType: string;
  deviceState: number;
  lastCollectionTime: string;
}

interface HistoryPoint {
  dateStr: string;
  generation: number; // kWh
  consumption: number;
  gridExport: number;
  gridImport: number;
}

interface AlertInfo {
  deviceSn: string;
  alertType: string;
  alertMessage: string;
  alertTime: string;
}

/* ââ Constants ââââââââââââââââââââââââââââââââââââââââââââââââââââ */
const CO2_KG_PER_KWH = 0.126;      // Colombia grid emission factor
const COP_PER_KWH_SAVED = 850;     // avg residential tariff COP/kWh
const TREES_PER_TON_CO2 = 45;      // trees equivalent per ton CO2

/* ââ API helper âââââââââââââââââââââââââââââââââââââââââââââââââââ */
async function deyeAPI(action: string, params: Record<string, any> = {}) {
  const res = await fetch("/api/monitoring/deye", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...params }),
  });
  return res.json();
}

/* ââ Utilities ââââââââââââââââââââââââââââââââââââââââââââââââââââ */
function fmtKw(v: number) {
  if (v >= 1000) return (v / 1000).toFixed(1) + " MW";
  return v.toFixed(1) + " kW";
}
function fmtKwh(v: number) {
  if (v >= 1000) return (v / 1000).toFixed(1) + " MWh";
  return v.toFixed(1) + " kWh";
}
function fmtCOP(v: number) {
  return "$" + Math.round(v).toLocaleString("es-CO");
}
function fmtDate(ts: number | string) {
  if (!ts) return "â";
  const d = typeof ts === "number" ? new Date(ts * 1000) : new Date(ts);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(ts: string) {
  if (!ts) return "â";
  return new Date(ts).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}
function getTimeRanges() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return {
    week: { start: fmt(startOfWeek), end: fmt(now) },
    month: { start: fmt(startOfMonth), end: fmt(now) },
    year: { start: fmt(startOfYear), end: fmt(now) },
  };
}

/* ââ Sub-components âââââââââââââââââââââââââââââââââââââââââââââââ */

function StateIndicator({ state }: { state: number }) {
  const map: Record<number, { color: string; label: string }> = {
    1: { color: "bg-green-500", label: "Online" },
    2: { color: "bg-yellow-500", label: "Alerta" },
    3: { color: "bg-red-500", label: "Offline" },
  };
  const s = map[state] || { color: "bg-gray-400", label: "Desconocido" };
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className={`w-2 h-2 rounded-full ${s.color}`} />
      {s.label}
    </span>
  );
}

/* ââ KPI Card âââââââââââââââââââââââââââââââââââââââââââââââââââââ */
function KPICard({ icon, label, value, sub, color = "text-gray-900" }: {
  icon: string; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  );
}

/* ââ Bar Chart (pure CSS, no deps) ââââââââââââââââââââââââââââââââ */
function SimpleBarChart({ data, labelKey, bars, height = 200 }: {
  data: any[];
  labelKey: string;
  bars: { key: string; color: string; label: string }[];
  height?: number;
}) {
  const maxVal = Math.max(...data.flatMap((d) => bars.map((b) => d[b.key] || 0)), 1);
  return (
    <div className="w-full">
      <div className="flex items-end gap-1 justify-between" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex items-end gap-0.5 justify-center" style={{ height: "100%" }}>
            {bars.map((b) => {
              const pct = ((d[b.key] || 0) / maxVal) * 100;
              return (
                <div
                  key={b.key}
                  className="rounded-t-sm min-w-[8px] max-w-[24px] flex-1 transition-all relative group"
                  style={{ height: `${Math.max(pct, 2)}%`, backgroundColor: b.color }}
                  title={`${b.label}: ${(d[b.key] || 0).toFixed(1)} kWh`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-gray-500 truncate">{d[labelKey]}</div>
        ))}
      </div>
      <div className="flex gap-4 justify-center mt-2">
        {bars.map((b) => (
          <div key={b.key} className="flex items-center gap-1 text-xs text-gray-600">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: b.color }} />
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ââ Setup Form âââââââââââââââââââââââââââââââââââââââââââââââââââ */
function SetupForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ appId: "", appSecret: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const enc = new TextEncoder();
      const hashBuf = await crypto.subtle.digest("SHA-256", enc.encode(form.password));
      const hashHex = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
      const res = await fetch("/api/monitoring/deye/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: form.appId, appSecret: form.appSecret, email: form.email, passwordHash: hashHex }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      onDone();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-xl font-bold mb-2">Configurar DeyeCloud</h2>
      <p className="text-gray-500 text-sm mb-6">Ingresa tus credenciales del portal developer de DeyeCloud.</p>
      {["appId", "appSecret", "email", "password"].map((f) => (
        <div key={f} className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{f === "appId" ? "App ID" : f === "appSecret" ? "App Secret" : f === "email" ? "Email" : "ContraseÃ±a"}</label>
          <input
            type={f === "password" ? "password" : "text"}
            value={(form as any)[f]}
            onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      ))}
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      <button
        onClick={handleSave}
        disabled={saving || !form.appId || !form.appSecret || !form.email || !form.password}
        className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Conectar DeyeCloud"}
      </button>
    </div>
  );
}

/* ââ Power Flow Visualization âââââââââââââââââââââââââââââââââââââ */
function PowerFlowCard({ station }: { station: StationLive }) {
  const flows = [
    { icon: "âï¸", label: "GeneraciÃ³n", value: station.generationPower, color: "text-yellow-600" },
    { icon: "ð ", label: "Consumo", value: station.consumptionPower, color: "text-blue-600" },
    { icon: "ð", label: "InyecciÃ³n Red", value: station.wirePower, color: "text-green-600" },
    { icon: "â¡", label: "Compra Red", value: station.purchasePower, color: "text-red-600" },
  ];
  if (station.batterySOC > 0) {
    flows.push({ icon: "ð", label: `BaterÃ­a (${station.batterySOC}%)`, value: station.batteryPower, color: "text-purple-600" });
  }
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <h3 className="font-semibold text-gray-700 mb-4">Flujo de EnergÃ­a en Tiempo Real</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {flows.map((f) => (
          <div key={f.label} className="text-center">
            <div className="text-2xl mb-1">{f.icon}</div>
            <div className={`text-lg font-bold ${f.color}`}>{fmtKw(f.value)}</div>
            <div className="text-xs text-gray-500">{f.label}</div>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-400 mt-3 text-right">
        Ãltima actualizaciÃ³n: {fmtTime(station.lastUpdateTime)}
      </div>
    </div>
  );
}

/* ââ Alerts Panel âââââââââââââââââââââââââââââââââââââââââââââââââ */
function AlertsPanel({ alerts, loading }: { alerts: AlertInfo[]; loading: boolean }) {
  if (loading) return <div className="bg-white rounded-xl shadow-sm border p-5 animate-pulse h-32" />;
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
        ð¨ Alertas Activas
        {alerts.length > 0 && (
          <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">{alerts.length}</span>
        )}
      </h3>
      {alerts.length === 0 ? (
        <p className="text-gray-400 text-sm">Sin alertas activas. Todo funcionando correctamente.</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {alerts.map((a, i) => (
            <div key={i} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg text-sm">
              <span className="text-red-500 mt-0.5">â ï¸</span>
              <div>
                <div className="font-medium text-red-800">{a.alertMessage || a.alertType}</div>
                <div className="text-xs text-red-500">{a.deviceSn} Â· {fmtTime(a.alertTime)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   GLOBAL VIEW â Aggregated across all SolarWin plants
   ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
function GlobalView({ stations, history, alerts, loading }: {
  stations: StationLive[];
  history: { week: HistoryPoint[]; month: HistoryPoint[]; year: HistoryPoint[] };
  alerts: AlertInfo[];
  loading: boolean;
}) {
  const [histPeriod, setHistPeriod] = useState<"week" | "month" | "year">("month");

  // Aggregate real-time totals
  const totals = useMemo(() => {
    const t = { generation: 0, consumption: 0, gridExport: 0, gridImport: 0, capacity: 0 };
    stations.forEach((s) => {
      t.generation += s.generationPower;
      t.consumption += s.consumptionPower;
      t.gridExport += s.wirePower;
      t.gridImport += s.purchasePower;
      t.capacity += s.installedCapacity;
    });
    return t;
  }, [stations]);

  // Aggregate historical totals for selected period
  const histData = history[histPeriod] || [];
  const histTotals = useMemo(() => {
    const t = { generation: 0, consumption: 0, gridExport: 0, gridImport: 0 };
    histData.forEach((h) => {
      t.generation += h.generation;
      t.consumption += h.consumption;
      t.gridExport += h.gridExport;
      t.gridImport += h.gridImport;
    });
    return t;
  }, [histData]);

  const co2Saved = histTotals.generation * CO2_KG_PER_KWH;
  const moneySaved = histTotals.generation * COP_PER_KWH_SAVED;
  const treesEquiv = (co2Saved / 1000) * TREES_PER_TON_CO2;

  const periodLabels = { week: "Esta Semana", month: "Este Mes", year: "Este AÃ±o" };

  const onlineCount = stations.filter((s) => s.generationPower > 0).length;
  const alertCount = alerts.length;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border p-6 animate-pulse h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon="âï¸" label="GeneraciÃ³n Total" value={fmtKw(totals.generation)} sub="Tiempo real" color="text-yellow-600" />
        <KPICard icon="ð " label="Consumo Total" value={fmtKw(totals.consumption)} sub="Tiempo real" color="text-blue-600" />
        <KPICard icon="ð" label="InyecciÃ³n a Red" value={fmtKw(totals.gridExport)} sub="Excedente" color="text-green-600" />
        <KPICard icon="ð¡" label="Plantas Activas" value={`${onlineCount}/${stations.length}`} sub={alertCount > 0 ? `${alertCount} alertas` : "Sin alertas"} color={alertCount > 0 ? "text-orange-600" : "text-green-600"} />
      </div>

      {/* Capacity & status bar */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-700">Capacidad Instalada SolarWin</h3>
          <span className="text-2xl font-bold text-yellow-600">{totals.capacity.toFixed(1)} kWp</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-3 rounded-full transition-all"
            style={{ width: `${Math.min((totals.generation / Math.max(totals.capacity, 1)) * 100, 100)}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Rendimiento actual: {((totals.generation / Math.max(totals.capacity, 1)) * 100).toFixed(0)}% de capacidad
        </div>
      </div>

      {/* Period selector + historical KPIs */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">ProducciÃ³n HistÃ³rica</h3>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {(["week", "month", "year"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setHistPeriod(p)}
                className={`px-3 py-1 text-sm rounded-md transition-all ${histPeriod === p ? "bg-white shadow text-blue-600 font-medium" : "text-gray-500 hover:text-gray-700"}`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KPICard icon="â¡" label={`GeneraciÃ³n ${periodLabels[histPeriod]}`} value={fmtKwh(histTotals.generation)} color="text-yellow-600" />
          <KPICard icon="ð°" label="Ahorro Estimado" value={fmtCOP(moneySaved)} sub={`@ ${COP_PER_KWH_SAVED} COP/kWh`} color="text-green-600" />
          <KPICard icon="ð" label="COâ Evitado" value={`${co2Saved.toFixed(0)} kg`} sub={`â ${treesEquiv.toFixed(0)} Ã¡rboles`} color="text-emerald-600" />
          <KPICard icon="ð" label="EnergÃ­a de Red" value={fmtKwh(histTotals.gridImport)} sub="Comprada" color="text-red-500" />
        </div>

        {/* Bar chart */}
        {histData.length > 0 && (
          <SimpleBarChart
            data={histData}
            labelKey="dateStr"
            bars={[
              { key: "generation", color: "#f59e0b", label: "Solar" },
              { key: "gridImport", color: "#ef4444", label: "Red ElÃ©ctrica" },
            ]}
            height={180}
          />
        )}
      </div>

      {/* Plant status table */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Estado de Plantas</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 font-medium">Planta</th>
                <th className="pb-2 font-medium">UbicaciÃ³n</th>
                <th className="pb-2 font-medium text-right">Capacidad</th>
                <th className="pb-2 font-medium text-right">Generando</th>
                <th className="pb-2 font-medium text-right">Consumo</th>
                <th className="pb-2 font-medium text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2.5 font-medium">{s.name}</td>
                  <td className="py-2.5 text-gray-500 text-xs">{s.locationAddress || "â"}</td>
                  <td className="py-2.5 text-right">{s.installedCapacity} kWp</td>
                  <td className="py-2.5 text-right text-yellow-600 font-medium">{fmtKw(s.generationPower)}</td>
                  <td className="py-2.5 text-right text-blue-600">{fmtKw(s.consumptionPower)}</td>
                  <td className="py-2.5 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${s.generationPower > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.generationPower > 0 ? "bg-green-500" : "bg-gray-400"}`} />
                      {s.generationPower > 0 ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerts */}
      <AlertsPanel alerts={alerts} loading={false} />
    </div>
  );
}

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   PER-PLANT VIEW â Individual station dashboard
   ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
function PlantView({ station, history, alerts, devices, loading }: {
  station: StationLive;
  history: { week: HistoryPoint[]; month: HistoryPoint[]; year: HistoryPoint[] };
  alerts: AlertInfo[];
  devices: DeviceInfo[];
  loading: boolean;
}) {
  const [histPeriod, setHistPeriod] = useState<"week" | "month" | "year">("month");
  const histData = history[histPeriod] || [];
  const histTotals = useMemo(() => {
    const t = { generation: 0, consumption: 0, gridExport: 0, gridImport: 0 };
    histData.forEach((h) => {
      t.generation += h.generation;
      t.consumption += h.consumption;
      t.gridExport += h.gridExport;
      t.gridImport += h.gridImport;
    });
    return t;
  }, [histData]);

  const co2Saved = histTotals.generation * CO2_KG_PER_KWH;
  const moneySaved = histTotals.generation * COP_PER_KWH_SAVED;
  const periodLabels = { week: "Esta Semana", month: "Este Mes", year: "Este AÃ±o" };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border p-6 animate-pulse h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Station header */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{station.name}</h2>
            <p className="text-sm text-gray-500">{station.locationAddress || "Sin ubicaciÃ³n"} Â· {station.installedCapacity} kWp Â· Desde {fmtDate(station.createdDate)}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${station.generationPower > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {station.generationPower > 0 ? "âï¸ Generando" : "ð Inactiva"}
          </span>
        </div>
      </div>

      {/* Real-time KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon="âï¸" label="GeneraciÃ³n" value={fmtKw(station.generationPower)} sub="Ahora" color="text-yellow-600" />
        <KPICard icon="ð " label="Consumo" value={fmtKw(station.consumptionPower)} sub="Ahora" color="text-blue-600" />
        <KPICard icon="ð" label="InyecciÃ³n Red" value={fmtKw(station.wirePower)} color="text-green-600" />
        <KPICard icon="â¡" label="Compra Red" value={fmtKw(station.purchasePower)} color="text-red-500" />
      </div>

      {/* Power flow */}
      <PowerFlowCard station={station} />

      {/* Historical data */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">ProducciÃ³n HistÃ³rica</h3>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {(["week", "month", "year"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setHistPeriod(p)}
                className={`px-3 py-1 text-sm rounded-md transition-all ${histPeriod === p ? "bg-white shadow text-blue-600 font-medium" : "text-gray-500 hover:text-gray-700"}`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KPICard icon="â¡" label="GeneraciÃ³n" value={fmtKwh(histTotals.generation)} color="text-yellow-600" />
          <KPICard icon="ð°" label="Ahorro" value={fmtCOP(moneySaved)} color="text-green-600" />
          <KPICard icon="ð" label="COâ Evitado" value={`${co2Saved.toFixed(0)} kg`} color="text-emerald-600" />
          <KPICard icon="ð" label="Red ElÃ©ctrica" value={fmtKwh(histTotals.gridImport)} color="text-red-500" />
        </div>

        {histData.length > 0 && (
          <SimpleBarChart
            data={histData}
            labelKey="dateStr"
            bars={[
              { key: "generation", color: "#f59e0b", label: "Solar" },
              { key: "gridImport", color: "#ef4444", label: "Red" },
            ]}
            height={180}
          />
        )}
      </div>

      {/* Devices / Inverters */}
      {devices.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Inversores ({devices.length})</h3>
          <div className="space-y-2">
            {devices.map((d) => (
              <div key={d.deviceSn} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-sm">{d.deviceSn}</span>
                  <span className="text-xs text-gray-400 ml-2">{d.deviceType}</span>
                </div>
                <StateIndicator state={d.deviceState} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts */}
      <AlertsPanel alerts={alerts} loading={false} />
    </div>
  );
}

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   MAIN PAGE COMPONENT
   ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
export default function MonitoringPage() {
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"global" | "plant">("global");
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  // Data
  const [stations, setStations] = useState<StationLive[]>([]);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [alerts, setAlerts] = useState<AlertInfo[]>([]);
  const [globalHistory, setGlobalHistory] = useState<{ week: HistoryPoint[]; month: HistoryPoint[]; year: HistoryPoint[] }>({ week: [], month: [], year: [] });
  const [plantHistory, setPlantHistory] = useState<{ week: HistoryPoint[]; month: HistoryPoint[]; year: HistoryPoint[] }>({ week: [], month: [], year: [] });

  // Fetch all stations with live data
  const fetchStations = useCallback(async () => {
    const res = await deyeAPI("stations");
    if (res.needsSetup) {
      setNeedsSetup(true);
      setLoading(false);
      return [];
    }
    if (!res.stationList) return [];

    const stationLives: StationLive[] = [];
    for (const s of res.stationList) {
      const live = await deyeAPI("stationLatest", { stationId: s.id });
      stationLives.push({
        id: s.id,
        name: s.name,
        generationPower: live.generationPower || 0,
        consumptionPower: live.consumptionPower || 0,
        gridPower: live.gridPower || 0,
        purchasePower: live.purchasePower || 0,
        wirePower: live.wirePower || 0,
        batteryPower: live.batteryPower || 0,
        batterySOC: live.batterySOC || 0,
        chargePower: live.chargePower || 0,
        dischargePower: live.dischargePower || 0,
        irradiateIntensity: live.irradiateIntensity || 0,
        lastUpdateTime: live.lastUpdateTime || "",
        installedCapacity: s.installedCapacity || 0,
        createdDate: s.createdDate || 0,
        locationAddress: s.locationAddress || "",
      });
    }
    setStations(stationLives);
    return stationLives;
  }, []);

  // Fetch history for a station (or all stations aggregated)
  const fetchHistory = useCallback(async (stationIds: string[]) => {
    const ranges = getTimeRanges();
    const result: { week: HistoryPoint[]; month: HistoryPoint[]; year: HistoryPoint[] } = { week: [], month: [], year: [] };

    for (const [period, range] of Object.entries(ranges) as ["week" | "month" | "year", { start: string; end: string }][]) {
      const timeType = period === "year" ? 3 : 2; // 2=daily, 3=monthly
      const allPoints: Record<string, HistoryPoint> = {};

      for (const sid of stationIds) {
        const res = await deyeAPI("stationHistory", {
          stationId: sid,
          startTime: range.start,
          endTime: range.end,
          timeType,
        });
        if (res.stationDataItems) {
          for (const item of res.stationDataItems) {
            const key = item.dateStr || item.date;
            if (!allPoints[key]) {
              allPoints[key] = { dateStr: key, generation: 0, consumption: 0, gridExport: 0, gridImport: 0 };
            }
            allPoints[key].generation += item.generationValue || 0;
            allPoints[key].consumption += item.consumptionValue || 0;
            allPoints[key].gridExport += item.wireValue || 0;
            allPoints[key].gridImport += item.purchaseValue || 0;
          }
        }
      }
      result[period] = Object.values(allPoints).sort((a, b) => a.dateStr.localeCompare(b.dateStr));
    }
    return result;
  }, []);

  // Fetch alerts for all stations
  const fetchAlerts = useCallback(async (stationIds: string[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const res = await deyeAPI("stationAlerts", {
      stationIds: stationIds.join(","),
      startTime: weekAgo.toISOString().split("T")[0],
      endTime: now.toISOString().split("T")[0],
    });
    const alertList: AlertInfo[] = (res.alertList || []).map((a: any) => ({
      deviceSn: a.deviceSn || "",
      alertType: a.alertType || "",
      alertMessage: a.alertMessage || a.alertContent || "",
      alertTime: a.alertTime || a.createTime || "",
    }));
    setAlerts(alertList);
    return alertList;
  }, []);

  // Fetch devices for a station
  const fetchDevices = useCallback(async (stationId: string) => {
    const res = await deyeAPI("devices", { stationIds: stationId });
    const devList: DeviceInfo[] = (res.deviceListItems || []).map((d: any) => ({
      deviceSn: d.deviceSn || "",
      deviceType: d.deviceType || "",
      deviceState: d.deviceState || 3,
      lastCollectionTime: d.lastCollectionTime || "",
    }));
    setDevices(devList);
    return devList;
  }, []);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const stList = await fetchStations();
      if (cancelled || stList.length === 0) {
        setLoading(false);
        return;
      }
      const ids = stList.map((s) => s.id);
      const [hist, _alerts] = await Promise.all([
        fetchHistory(ids),
        fetchAlerts(ids),
      ]);
      if (!cancelled) {
        setGlobalHistory(hist);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [fetchStations, fetchHistory, fetchAlerts]);

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(async () => {
      const stList = await fetchStations();
      if (stList.length > 0) {
        const ids = stList.map((s) => s.id);
        fetchAlerts(ids);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchStations, fetchAlerts]);

  // When selecting a plant, load its specific data
  useEffect(() => {
    if (viewMode !== "plant" || !selectedStation) return;
    let cancelled = false;
    async function loadPlant() {
      const [hist, _devs] = await Promise.all([
        fetchHistory([selectedStation!]),
        fetchDevices(selectedStation!),
      ]);
      if (!cancelled) setPlantHistory(hist);
    }
    loadPlant();
    return () => { cancelled = true; };
  }, [viewMode, selectedStation, fetchHistory, fetchDevices]);

  // Setup needed
  if (needsSetup) {
    return <SetupForm onDone={() => { setNeedsSetup(false); setLoading(true); }} />;
  }

  const currentStation = stations.find((s) => s.id === selectedStation);
  const stationAlerts = selectedStation
    ? alerts.filter((a) => devices.some((d) => d.deviceSn === a.deviceSn))
    : alerts;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with view toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {viewMode === "global" ? "âï¸ Monitoreo Global SolarWin" : `ð¡ ${currentStation?.name || "Selecciona una planta"}`}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {viewMode === "global"
              ? `${stations.length} plantas Â· ${stations.reduce((a, s) => a + s.installedCapacity, 0).toFixed(1)} kWp instalados`
              : currentStation ? `${currentStation.installedCapacity} kWp Â· ${currentStation.locationAddress}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode tabs */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("global")}
              className={`px-4 py-2 text-sm rounded-md transition-all ${viewMode === "global" ? "bg-white shadow text-yellow-700 font-medium" : "text-gray-500 hover:text-gray-700"}`}
            >
              ð Global
            </button>
            <button
              onClick={() => {
                setViewMode("plant");
                if (!selectedStation && stations.length > 0) setSelectedStation(stations[0].id);
              }}
              className={`px-4 py-2 text-sm rounded-md transition-all ${viewMode === "plant" ? "bg-white shadow text-blue-700 font-medium" : "text-gray-500 hover:text-gray-700"}`}
            >
              ð­ Por Planta
            </button>
          </div>
        </div>
      </div>

      {/* Plant selector (only in plant view) */}
      {viewMode === "plant" && stations.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {stations.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStation(s.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm transition-all ${selectedStation === s.id
                ? "bg-blue-600 text-white shadow"
                : "bg-white border text-gray-600 hover:border-blue-300"}`}
            >
              {s.name}
              {s.generationPower > 0 && <span className="ml-2 text-xs opacity-75">{fmtKw(s.generationPower)}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {viewMode === "global" ? (
        <GlobalView stations={stations} history={globalHistory} alerts={alerts} loading={loading} />
      ) : currentStation ? (
        <PlantView station={currentStation} history={plantHistory} alerts={stationAlerts} devices={devices} loading={loading} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400">
          Selecciona una planta para ver el detalle
        </div>
      )}
    </div>
  );
}
