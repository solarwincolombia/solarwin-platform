import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Rutas protegidas
  const brokerRoutes = ["/broker"];
  const installerRoutes = ["/installer"];
  const authRoutes = ["/login", "/register"];

  const isBrokerRoute = brokerRoutes.some(r => request.nextUrl.pathname.startsWith(r));
  const isInstallerRoute = installerRoutes.some(r => request.nextUrl.pathname.startsWith(r));
  const isAuthRoute = authRoutes.some(r => request.nextUrl.pathname.startsWith(r));

  // Redirigir a login si no autenticado
  if ((isBrokerRoute || isInstallerRoute) && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirigir al dashboard si ya está autenticado
  if (isAuthRoute && user) {
    // Leer el rol del perfil
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const redirectTo = profile?.role === "installer" ? "/installer/dashboard" : "/broker/dashboard";
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
