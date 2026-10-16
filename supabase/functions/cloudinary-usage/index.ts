// Supabase Edge Function: cloudinary-usage
// Devuelve el uso de cuota de Cloudinary para la barra de almacenamiento.
// Desplegar con: supabase functions deploy cloudinary-usage
// Configurar secretos: supabase secrets set CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=... CLOUDINARY_CLOUD_NAME=...
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    // Solo usuarios autenticados
    const auth = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "no autorizado" }), { status: 401, headers: cors });

    const cloud = Deno.env.get("CLOUDINARY_CLOUD_NAME")!;
    const key = Deno.env.get("CLOUDINARY_API_KEY")!;
    const secret = Deno.env.get("CLOUDINARY_API_SECRET")!;
    const auth64 = btoa(`${key}:${secret}`);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/usage`, {
      headers: { Authorization: `Basic ${auth64}` },
    });
    const usage = await res.json();
    const used = usage.storage?.usage ?? 0;              // bytes usados
    const limit = usage.storage?.limit ?? 26843545600;   // límite del plan (25 GB gratis)
    return new Response(
      JSON.stringify({ used_bytes: used, limit_bytes: limit, pct: Math.min(100, (used / limit) * 100), raw: usage }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
