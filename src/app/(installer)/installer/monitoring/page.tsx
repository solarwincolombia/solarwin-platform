"use client";
import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type StationLive = {
  generationPower: number;
  consumptionPower: number;
  gridPower: number;
  purchasePower: number;
  wirePower: number;
  batteryPower: number;
  batterySOC: number;
  chargePower: number;
  dischargePower: number;
  irradiateIntensity: number;
  lastUpdateTime: string;
};

type DeviceInfo = {
  deviceSn: string;
  deviceType: string;
  deviceState: number;
  collectionTime: number;
  dataList: { key: string; unit: string; value: string }[];
};

async function deyeAPI(action: string, params: any = {}) {
  const res = await fetch("/api/monitoring/deye", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...params }),
  });
  return res.json();
}

function kw(watts: number | undefined) {
  if (!watts && watts !== 0) return "\u2014";
  if (Math.abs(watts) >= 1000) return (watts / 1000).toFixed(1) + " kW";
  return watts.toFixed(0) + " W";
}

function StateIndicator({ state }: { state: number }) {
  const map: Record<number, { color: string; label: string }> = {
    1: { color: "bg-green-500", label: "Online" },
    2: { color: "bg-yellow-500", label: "Alerta" },
    3: { color: "bg-red-500", label: "Offline" },
  };
  const s = map[state] || { color: "bg-gray-400", label: "Desconocido" };
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span className={`w-2 h-2 rounded-full ${s.color}`} />
      {s.label}
    </span>
  );
}

/* Setup Form */
function SetupForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ app_id: "", app_secret: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(form.password));
      const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const { error: dbError } = await supabase.from("monitoring_integrations").upsert(
        {
          user_id: user.id,
          platform: "deyecloud",
          app_id: form.app_id,
          app_secret: form.app_secret,
          email: form.email,
          password_hash: hashHex,
          active: true,
        },
        { onConflict: "user_id,platform" }
      );
      if (dbError) throw dbError;
      onDone();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-xl p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">\u2600\uFE0F</div>
          <h2 className="text-xl font-bold text-[#1A2A3A]">Conectar DeyeCloud</h2>
          <p className="text-slate-500 text-sm mt-1">
            Ingresa tus credenciales del portal developer.deyecloud.com
          </p>
        </div>
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">App ID</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FFC107] focus:border-transparent outline-none"
              placeholder="Ej: 201911067156002"
              value={form.app_id}
              onChange={(e) => setForm({ ...form, app_id: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">App Secret</label>
            <input
              type="password"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FFC107] focus:border-transparent outline-none"
              value={form.app_secret}
              onChange={(e) => setForm({ ...form, app_secret: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email DeyeCloud</label>
            <input
              type="email"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FFC107] focus:border-transparent outline-none"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contrase\u00F1a DeyeCloud</label>
            <input
              type="password"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FFC107] focus:border-transparent outline-none"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button
            onClick={save}
            disabled={loading || !form.app_id || !form.app_secret || !form.email || !form.password}
            className="w-full bg-[#FFC107] text-[#1A2A3A] font-semibold py-2.5 rounded-lg hover:bg-yellow-400 transition disabled:opacity-50"
          >
            {loading ? "Conectando..." : "Conectar plataforma"}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-4 text-center">
          Obt\u00E9n tus credenciales en{" "}
          <a href="https://developer.deyecloud.com" target="_blank" className="underline">
            developer.deyecloud.com
          </a>
          {" "}\u2192 Application
        </p>
      </div>
    </div>
  );
}

/* Power Flow Card */
function PowerFlowCard({ live }: { live: StationLive | null }) {
  if (!live) return null;
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm col-span-full">
      <h3 className="font-semibold text-[#1A2A3A] mb-4">Flujo de energ\u00EDa en tiempo real</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="text-center p-4 bg-yellow-50 rounded-xl">
          <div className="text-3xl mb-1">\u2600\uFE0F</div>
          <div className="text-xs text-slate-500 mb-1">Generaci\u00F3n Solar</div>
          <div className="text-xl font-bold text-yellow-600">{kw(live.generationPower)}</div>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-xl">
          <div className="text-3xl mb-1">\uD83C\uDFE0</div>
          <div className="text-xs text-slate-500 mb-1">Consumo</div>
          <div className="text-xl font-bold text-blue-600">{kw(live.consumptionPower)}</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-xl">
          <div className="text-3xl mb-1">\u26A1</div>
          <div className="text-xs text-slate-500 mb-1">Inyecci\u00F3n a Red</div>
          <div className="text-xl font-bold text-green-600">{kw(live.wirePower)}</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-xl">
          <div className="text-3xl mb-1">\uD83D\uDD0B</div>
          <div className="text-xs text-slate-500 mb-1">Bater\u00EDa SOC</div>
          <div className="text-xl font-bold text-purple-600">
            {live.batterySOC != null ? live.batterySOC.toFixed(0) + "%" : "\u2014"}
          </div>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-xl">
          <div className="text-3xl mb-1">\uD83D\uDD0C</div>
          <div className="text-xs text-slate-500 mb-1">Compra de Red</div>
          <div className="text-xl font-bold text-orange-600">{kw(live.purchasePower)}</div>
        </div>
      </div>
      {live.lastUpdateTime && (
        <p className="text-xs text-slate-400 mt-3 text-right">
          \u00DAltima actualizaci\u00F3n: {new Date(live.lastUpdateTime).toLocaleString("es-CO")}
        </p>
      )}
    </div>
  );
}

/* Main Dashboard */
export default function MonitoringPage() {
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [live, setLive] = useState<StationLive | null>(null);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [error, setError] = useState("");

  const loadStations = useCallback(async () => {
    setLoading(true);
    setError("");
    const data = await deyeAPI("stationsWithDevices");
    if (data.needsSetup) { setNeedsSetup(true); setLoading(false); return; }
    if (data.error) { setError(data.error || data.msg); setLoading(false); return; }
    const list = data.stationList || [];
    setStations(list);
    if (list.length > 0 && !selectedStation) setSelectedStation(list[0].id);
    setLoading(false);
  }, [selectedStation]);

  const loadStationData = useCallback(async () => {
    if (!selectedStation) return;
    const [liveData, alertData] = await Promise.all([
      deyeAPI("stationLatest", { stationId: selectedStation }),
      deyeAPI("stationAlerts", {
        stationIds: [selectedStation],
        startTime: Math.floor(Date.now() / 1000) - 86400 * 7,
        endTime: Math.floor(Date.now() / 1000),
      }),
    ]);
    if (liveData.success !== false) setLive(liveData);
    if (alertData.alertList) setAlerts(alertData.alertList || []);
    const devData = await deyeAPI("devices", { stationIds: [selectedStation] });
    if (devData.deviceListItems) {
      const sns = devData.deviceListItems.map((d: any) => d.deviceSn);
      if (sns.length > 0) {
        const latest = await deyeAPI("deviceLatest", { deviceList: sns.slice(0, 10) });
        if (latest.deviceDataList) setDevices(latest.deviceDataList);
      }
    }
  }, [selectedStation]);

  useEffect(() => { loadStations(); }, [loadStations]);

  useEffect(() => {
    if (selectedStation) {
      loadStationData();
      const interval = setInterval(loadStationData, 60000);
      return () => clearInterval(interval);
    }
  }, [selectedStation, loadStationData]);

  if (needsSetup) return (
    <div>
      <h2 className="text-2xl font-bold text-[#1A2A3A] mb-6">Monitoreo Solar</h2>
      <SetupForm onDone={() => { setNeedsSetup(false); loadStations(); }} />
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="text-4xl mb-2 animate-pulse">\u2600\uFE0F</div>
        <p className="text-slate-500">Cargando monitoreo...</p>
      </div>
    </div>
  );

  if (error) return (
    <div>
      <h2 className="text-2xl font-bold text-[#1A2A3A] mb-6">Monitoreo Solar</h2>
      <div className="bg-red-50 text-red-600 p-6 rounded-xl">
        <p className="font-semibold mb-1">Error al conectar</p>
        <p className="text-sm">{error}</p>
        <button onClick={() => { setError(""); loadStations(); }}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition">
          Reintentar
        </button>
      </div>
    </div>
  );

  const currentStation = stations.find((s) => s.id === selectedStation);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1A2A3A]">Monitoreo Solar</h2>
          <p className="text-slate-500 text-sm">
            {stations.length} planta{stations.length !== 1 && "s"} conectada{stations.length !== 1 && "s"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedStation || ""}
            onChange={(e) => setSelectedStation(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#FFC107]"
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>{s.name || `Planta #${s.id}`}</option>
            ))}
          </select>
          <button onClick={loadStationData}
            className="bg-[#FFC107] text-[#1A2A3A] px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-400 transition">
            Actualizar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: "\u2600\uFE0F", label: "Generaci\u00F3n total", value: kw(live?.generationPower), color: "#FFC107" },
          { icon: "\uD83C\uDFE0", label: "Consumo actual", value: kw(live?.consumptionPower), color: "#3B82F6" },
          { icon: "\u26A1", label: "Inyecci\u00F3n a red", value: kw(live?.wirePower), color: "#22C55E" },
          { icon: "\uD83D\uDD0B", label: "Bater\u00EDa", value: live?.batterySOC != null ? live.batterySOC.toFixed(0) + "%" : "N/A", color: "#8B5CF6" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-6 shadow-sm border-t-4" style={{ borderColor: s.color }}>
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-slate-500 text-sm mb-1">{s.label}</div>
            <div className="text-[#1A2A3A] text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      <PowerFlowCard live={live} />

      {/* Devices + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-[#1A2A3A] mb-4">Inversores ({devices.length})</h3>
          {devices.length === 0 ? (
            <p className="text-slate-400 text-sm">Sin datos de dispositivos</p>
          ) : (
            <div className="space-y-3">
              {devices.map((d) => {
                const power = d.dataList?.find((x) =>
                  x.key.toLowerCase().includes("total power") ||
                  x.key.toLowerCase().includes("ac power") ||
                  x.key.toLowerCase().includes("output power")
                );
                const todayGen = d.dataList?.find((x) =>
                  x.key.toLowerCase().includes("daily") ||
                  x.key.toLowerCase().includes("today")
                );
                return (
                  <div key={d.deviceSn} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-sm text-[#1A2A3A]">{d.deviceSn}</div>
                      <div className="text-xs text-slate-400">
                        {d.deviceType} \u00B7 {power ? `${power.value} ${power.unit}` : "\u2014"}
                      </div>
                    </div>
                    <div className="text-right">
                      <StateIndicator state={d.deviceState} />
                      {todayGen && (
                        <div className="text-xs text-slate-500 mt-0.5">Hoy: {todayGen.value} {todayGen.unit}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-[#1A2A3A] mb-4">Alarmas recientes</h3>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">\u2705</div>
              <p className="text-slate-400 text-sm">Sin alarmas</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alerts.slice(0, 20).map((a, i) => (
                <div key={i} className="p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                  <div className="font-semibold text-xs text-red-700">{a.deviceSn || "Planta"}</div>
                  <div className="text-xs text-red-600 mt-0.5">{a.message || a.alertMsg || "Alarma"}</div>
                  <div className="text-xs text-red-400 mt-0.5">
                    {a.alertTime ? new Date(a.alertTime * 1000).toLocaleString("es-CO") : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Station info */}
      {currentStation && (
        <div className="mt-6 bg-[#1A2A3A] rounded-xl p-6 text-white">
          <h3 className="font-semibold mb-3">Informaci\u00F3n de la planta</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-slate-400 text-xs">Nombre</div>
              <div>{currentStation.name || "\u2014"}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Ubicaci\u00F3n</div>
              <div>{currentStation.locationAddress || "\u2014"}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Capacidad instalada</div>
              <div>{currentStation.installedCapacity ? (currentStation.installedCapacity / 1000).toFixed(1) + " kWp" : "\u2014"}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Fecha creaci\u00F3n</div>
              <div>{currentStation.createdDate || "\u2014"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
