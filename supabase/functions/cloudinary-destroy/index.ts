// Supabase Edge Function: cloudinary-destroy
// Borra una foto de Cloudinary de forma SEGURA (firmada con las credenciales
// del servidor, nunca expuestas en el teléfono).
// Desplegar con: supabase functions deploy cloudinary-destroy
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SHA-1 helper para firmar la petición de Cloudinary
async function sha1(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-1", data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    // Solo usuarios autenticados pueden borrar
    const auth = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "no autorizado" }), { status: 401, headers: cors });

    const { public_id } = await req.json();
    if (!public_id) return new Response(JSON.stringify({ error: "falta public_id" }), { status: 400, headers: cors });

    const cloud = Deno.env.get("CLOUDINARY_CLOUD_NAME")!;
    const apiKey = Deno.env.get("CLOUDINARY_API_KEY")!;
    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET")!;
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await sha1(`public_id=${public_id}&timestamp=${timestamp}${apiSecret}`);

    const body = new FormData();
    body.append("public_id", public_id);
    body.append("api_key", apiKey);
    body.append("timestamp", String(timestamp));
    body.append("signature", signature);
    body.append("invalidate", "true");

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, { method: "POST", body });
    const j = await res.json();
    return new Response(JSON.stringify(j), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
