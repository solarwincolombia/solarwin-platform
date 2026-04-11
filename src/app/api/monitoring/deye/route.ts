import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

const DEYE_BASE = "https://us1-developer.deyecloud.com";

async function getDeyeToken(integration: any, supabase: any) {
  if (integration.access_token && integration.token_expires_at) {
    const expiresAt = new Date(integration.token_expires_at);
    if (expiresAt > new Date()) return integration.access_token;
  }
  const body: any = {
    appSecret: integration.app_secret,
    email: integration.email,
    password: integration.password_hash,
  };
  if (integration.company_id) body.companyId = integration.company_id;

  const res = await fetch(
    `${DEYE_BASE}/v1.0/account/token?appId=${integration.app_id}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json();
  if (!data.success) throw new Error(data.msg || "Failed to obtain DeyeCloud token");

  const expiresAt = new Date(Date.now() + (Number(data.expiresIn) || 5183999) * 1000);
  await supabase
    .from("monitoring_integrations")
    .update({
      access_token: data.accessToken,
      refresh_token: data.refreshToken || null,
      token_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", integration.id);

  return data.accessToken;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, ...params } = await req.json();

  const { data: integration } = await supabase
    .from("monitoring_integrations")
    .select("*")
    .eq("user_id", user.id)
    .eq("platform", "deyecloud")
    .eq("active", true)
    .single();

  if (!integration) {
    return NextResponse.json(
      { error: "No DeyeCloud integration configured", needsSetup: true },
      { status: 404 }
    );
  }

  try {
    const token = await getDeyeToken(integration, supabase);
    let endpoint = "";
    let body: any = {};

    switch (action) {
      case "stations":
        endpoint = "/v1.0/station/list";
        body = { page: params.page || 1, size: params.size || 50 };
        break;
      case "stationsWithDevices":
        endpoint = "/v1.0/station/listWithDevice";
        body = { page: params.page || 1, size: params.size || 50 };
        break;
      case "stationLatest":
        endpoint = "/v1.0/station/latest";
        body = { stationId: params.stationId };
        break;
      case "stationHistory":
        endpoint = "/v1.0/station/history";
        body = {
          stationId: params.stationId,
          startTime: params.startTime,
          endTime: params.endTime,
          timeType: params.timeType || 2,
        };
        break;
      case "devices":
        endpoint = "/v1.0/device/list";
        body = { stationIds: params.stationIds, page: params.page || 1, size: params.size || 200 };
        break;
      case "deviceLatest":
        endpoint = "/v1.0/device/latest";
        body = { deviceList: params.deviceList };
        break;
      case "alerts":
        endpoint = "/v1.0/device/alertList";
        body = {
          deviceSn: params.deviceSn,
          startTime: params.startTime,
          endTime: params.endTime,
        };
        break;
      case "stationAlerts":
        endpoint = "/v1.0/station/alertList";
        body = {
          stationIds: params.stationIds,
          startTime: params.startTime,
          endTime: params.endTime,
          page: params.page || 1,
          size: params.size || 50,
        };
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const res = await fetch(`${DEYE_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
