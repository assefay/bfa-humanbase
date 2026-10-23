// BFA HumanBase — proxy IA (Cloudflare Worker "bfa-humanbase-proxy")
// Sécurité (2026-10-23) :
//  - n'accepte que les appels venant du site (ALLOWED_ORIGINS)
//  - exige un jeton de session Supabase valide d'une adresse active de app_users (is_allowed())
//  - n'autorise que les modèles et longueurs utilisés par le site
//  - consigne chaque appel dans access_log (log_access)
// Secret attendu dans le Worker : ANTHROPIC_KEY (inchangé). Aucun autre secret :
// la clé Supabase ci-dessous est la clé publique (anon), déjà visible dans le site.

const SB = 'https://vshnatreclfntadwcyhy.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzaG5hdHJlY2xmbnRhZHdjeWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA4NzcsImV4cCI6MjA4OTg2Njg3N30.VOxHkUKvYKtsdc2iwmsDMP9w-BWh3LZ4ZFLD4-qzjd8';
const ALLOWED_ORIGINS = ['https://ocha-bfa.github.io'];
const ALLOWED_MODELS = new Set(['claude-haiku-4-5-20251001', 'claude-sonnet-4-5']);
const MAX_TOKENS = 8000;
const MAX_BODY_BYTES = 1_500_000;

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}
const reply = (status, obj, origin) => new Response(JSON.stringify(obj), {
  status, headers: { 'Content-Type': 'application/json', ...cors(origin) } });
const deny = (status, message, origin) => reply(status, { error: { type: 'forbidden', message } }, origin);

// Jeton valide + adresse autorisée ? (deux appels Supabase, ~100 ms)
async function checkSession(auth) {
  if (!auth || !auth.startsWith('Bearer ') || auth.slice(7) === SB_ANON) return null;
  const h = { apikey: SB_ANON, Authorization: auth };
  const u = await fetch(SB + '/auth/v1/user', { headers: h });
  if (!u.ok) return null;
  const user = await u.json();
  const a = await fetch(SB + '/rest/v1/rpc/is_allowed', {
    method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: '{}' });
  if (!a.ok || (await a.json()) !== true) return null;
  return user;
}

function logCall(auth, model, usage, detail) {
  return fetch(SB + '/rest/v1/rpc/log_access', {
    method: 'POST',
    headers: { apikey: SB_ANON, Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_kind: 'ai_call', p_detail: detail, p_model: model,
      p_in: usage ? usage.input_tokens : null, p_out: usage ? usage.output_tokens : null }),
  }).catch(() => {});
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    if (!ALLOWED_ORIGINS.includes(origin)) return new Response('Forbidden', { status: 403 });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method !== 'POST') return deny(405, 'POST only', origin);

    const auth = request.headers.get('Authorization') || '';
    const user = await checkSession(auth).catch(() => null);
    if (!user) return deny(401, 'Session requise : reconnectez-vous à BFA HumanBase.', origin);

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return deny(413, 'Requête trop volumineuse', origin);
    let body;
    try { body = JSON.parse(raw); } catch (e) { return deny(400, 'JSON invalide', origin); }
    if (!ALLOWED_MODELS.has(body.model)) return deny(400, 'Modèle non autorisé', origin);
    if (!Number.isInteger(body.max_tokens) || body.max_tokens < 1 || body.max_tokens > MAX_TOKENS)
      return deny(400, 'max_tokens hors limite', origin);
    // Seuls les champs utilisés par le site sont transmis
    const clean = { model: body.model, max_tokens: body.max_tokens, messages: body.messages };
    if (body.system !== undefined) clean.system = body.system;
    if (body.temperature !== undefined) clean.temperature = body.temperature;
    if (body.stream === true) clean.stream = true;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(clean),
    });

    if (clean.stream) {
      ctx.waitUntil(logCall(auth, clean.model, null, 'stream'));
      return new Response(response.body, { status: response.status,
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', ...cors(origin) } });
    }
    const data = await response.json();
    ctx.waitUntil(logCall(auth, clean.model, data.usage, null));
    return reply(response.status, data, origin);
  },
};
