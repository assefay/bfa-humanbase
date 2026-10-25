// BFA HumanBase — connexion sécurisée (Supabase Auth, lien envoyé par e-mail)
// Chargé AVANT le script principal de index.html. Il pose window.AUTH :
//   AUTH.token  = jeton de session (JWT) de l'utilisateur connecté, ou null
//   AUTH.email  = adresse connectée
// Le script principal utilise AUTH.token à la place de la clé publique pour
// lire la base, et l'envoie au proxy IA (le Worker refuse tout appel sans jeton).
// Accès réservé aux adresses actives de la table app_users (fonction is_allowed()).
(function () {
  'use strict';
  const SB = 'https://vshnatreclfntadwcyhy.supabase.co';
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzaG5hdHJlY2xmbnRhZHdjeWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA4NzcsImV4cCI6MjA4OTg2Njg3N30.VOxHkUKvYKtsdc2iwmsDMP9w-BWh3LZ4ZFLD4-qzjd8';
  const LS = 'bfa_hb_session';
  const AUTH = (window.AUTH = { token: null, email: null, ready: null });
  // Une page peut choisir sa règle d'accès et son titre avant de charger ce fichier :
  //   window.AUTH_CHECK = 'is_media_user'; window.AUTH_TITLE = 'Monitoring médias';
  const CHECK = window.AUTH_CHECK || 'is_allowed';
  const TITLE = window.AUTH_TITLE || 'BFA HumanBase';

  // ---------- stockage de session ----------
  function jwtPayload(t) {
    try {
      const p = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(p))));
    } catch (e) { return {}; }
  }
  function load() { try { return JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { return null; } }
  function save(s) {
    const p = jwtPayload(s.access_token);
    const sess = { access_token: s.access_token, refresh_token: s.refresh_token,
                   expires_at: p.exp || Math.floor(Date.now() / 1000) + (s.expires_in || 3600),
                   email: (p.email || '').toLowerCase() };
    try { localStorage.setItem(LS, JSON.stringify(sess)); } catch (e) {}
    return sess;
  }
  function clear() { try { localStorage.removeItem(LS); } catch (e) {} }
  function apply(sess) {
    AUTH.token = sess ? sess.access_token : null;
    AUTH.email = sess ? sess.email : null;
    // H est l'en-tête global du script principal (const H={apikey, Authorization})
    if (typeof H !== 'undefined' && H) H.Authorization = 'Bearer ' + (AUTH.token || ANON);
  }
  const fresh = s => s && s.access_token && s.expires_at * 1000 > Date.now() + 120000;

  async function refresh(sess) {
    if (!sess || !sess.refresh_token) return null;
    const r = await fetch(SB + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: sess.refresh_token }) });
    if (!r.ok) return null;
    return save(await r.json());
  }

  // ---------- retour du lien de connexion (#access_token=…) ----------
  const hash = new URLSearchParams(location.hash.slice(1));
  let linkError = null;
  if (hash.get('access_token')) {
    save({ access_token: hash.get('access_token'), refresh_token: hash.get('refresh_token'),
           expires_in: +hash.get('expires_in') || 3600 });
    history.replaceState(null, '', location.pathname + location.search);
  } else if (hash.get('error_description')) {
    linkError = hash.get('error_description').replace(/\+/g, ' ');
    history.replaceState(null, '', location.pathname + location.search);
  }

  // Session valide → utilisée tout de suite par le script principal (synchrone)
  const stored = load();
  if (fresh(stored)) apply(stored);

  // ---------- écran de connexion ----------
  const inIframe = window.top !== window;   // qa.html charge index.html dans une iframe
  function overlay(html) {
    let el = document.getElementById('authGate');
    if (!el) {
      el = document.createElement('div');
      el.id = 'authGate';
      el.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#F7F9FC;display:flex;' +
        'align-items:center;justify-content:center;font-family:DM Sans,Segoe UI,sans-serif;color:#0F1923;padding:16px';
      (document.body || document.documentElement).appendChild(el);
    }
    el.innerHTML = '<div style="background:#fff;border:1px solid #E2E8F0;border-radius:14px;max-width:420px;width:100%;' +
      'padding:32px;box-shadow:0 8px 32px rgba(15,25,35,.12)"><div style="font-size:13px;color:#026CB6;font-weight:600;' +
      'letter-spacing:.04em">OCHA BURKINA FASO</div><h1 style="font-size:22px;margin:6px 0 4px">' + TITLE + '</h1>' + html + '</div>';
    return el;
  }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function showLogin(msg) {
    if (inIframe) return;
    const el = overlay(
      '<p style="color:#4A6070;font-size:14px;margin:0 0 20px">Accès réservé. Saisissez votre adresse e-mail autorisée ' +
      'pour recevoir un lien de connexion.</p>' +
      '<input id="authEmail" type="email" autocomplete="email" placeholder="prenom.nom@un.org" style="width:100%;box-sizing:border-box;' +
      'padding:11px 12px;border:1px solid #E2E8F0;border-radius:8px;font-size:15px">' +
      '<button id="authBtn" style="margin-top:12px;width:100%;padding:11px;border:0;border-radius:8px;background:#026CB6;' +
      'color:#fff;font-size:15px;font-weight:600;cursor:pointer">Recevoir le lien de connexion</button>' +
      '<p id="authMsg" style="font-size:13px;margin:14px 0 0;color:#4A6070">' + (msg ? esc(msg) : '') + '</p>');
    const btn = el.querySelector('#authBtn'), inp = el.querySelector('#authEmail'), out = el.querySelector('#authMsg');
    const go = async () => {
      const email = inp.value.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { out.textContent = 'Adresse e-mail invalide.'; return; }
      btn.disabled = true; btn.textContent = 'Envoi…';
      try {
        const back = location.origin + location.pathname;
        const r = await fetch(SB + '/auth/v1/otp?redirect_to=' + encodeURIComponent(back), {
          method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, create_user: false }) });
        // Même message que l'adresse soit autorisée ou non : on ne révèle pas la liste.
        if (r.ok || r.status === 400 || r.status === 422) {
          out.style.color = '#2E7D32';
          out.textContent = 'Si cette adresse est autorisée, un lien de connexion vient d\'être envoyé. Ouvrez-le sur cet appareil.';
        } else if (r.status === 429) {
          out.style.color = '#D0312D'; out.textContent = 'Trop de demandes. Réessayez dans quelques minutes.';
        } else { out.style.color = '#D0312D'; out.textContent = 'Erreur ' + r.status + '. Réessayez.'; }
      } catch (e) { out.style.color = '#D0312D'; out.textContent = 'Connexion impossible : ' + e.message; }
      btn.disabled = false; btn.textContent = 'Recevoir le lien de connexion';
    };
    btn.onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') go(); };
    setTimeout(() => inp.focus(), 50);
  }

  function showDenied() {
    if (inIframe) return;
    overlay('<p style="color:#D0312D;font-size:14px">L\'adresse <b>' + esc(AUTH.email || '') + '</b> n\'est pas autorisée.</p>' +
      '<button id="authOut" style="margin-top:8px;padding:10px 14px;border:1px solid #E2E8F0;border-radius:8px;background:#fff;cursor:pointer">' +
      'Changer d\'adresse</button>').querySelector('#authOut').onclick = logout;
  }

  function badge() {
    if (inIframe || document.getElementById('authBadge')) return;
    const b = document.createElement('div');
    b.id = 'authBadge';
    b.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:9999;background:#fff;border:1px solid #E2E8F0;' +
      'border-radius:20px;padding:6px 12px;font:12px DM Sans,Segoe UI,sans-serif;color:#4A6070;box-shadow:0 1px 3px rgba(0,0,0,.08)';
    b.innerHTML = esc(AUTH.email) + ' · <a href="#" style="color:#026CB6">Déconnexion</a>';
    b.querySelector('a').onclick = e => { e.preventDefault(); logout(); };
    document.body.appendChild(b);
  }

  async function logout() {
    try { if (AUTH.token) await fetch(SB + '/auth/v1/logout', { method: 'POST', headers: { apikey: ANON, Authorization: 'Bearer ' + AUTH.token } }); } catch (e) {}
    clear(); apply(null); location.reload();
  }
  AUTH.logout = logout;

  // Journal d'utilisation (table access_log, via log_access())
  AUTH.log = function (kind, detail) {
    if (!AUTH.token) return;
    fetch(SB + '/rest/v1/rpc/log_access', { method: 'POST',
      headers: { apikey: ANON, Authorization: 'Bearer ' + AUTH.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_kind: kind, p_detail: detail }) }).catch(() => {});
  };

  async function isAllowed() {
    const r = await fetch(SB + '/rest/v1/rpc/' + CHECK, { method: 'POST',
      headers: { apikey: ANON, Authorization: 'Bearer ' + AUTH.token, 'Content-Type': 'application/json' }, body: '{}' });
    return r.ok && (await r.json()) === true;
  }

  // ---------- démarrage ----------
  AUTH.ready = (async () => {
    await new Promise(r => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', r) : r());
    if (!AUTH.token) {
      const s = await refresh(stored).catch(() => null);
      if (s) { apply(s); location.reload(); return false; }      // session renouvelée : recharger avec le jeton
      clear(); showLogin(linkError ? 'Lien invalide ou expiré : ' + linkError : ''); return false;
    }
    if (!(await isAllowed().catch(() => false))) { showDenied(); return false; }
    badge();
    return true;
  })();

  // Renouvelle le jeton avant expiration (sessions longues, page ouverte toute la journée)
  setInterval(async () => {
    const s = load();
    if (s && s.expires_at * 1000 < Date.now() + 10 * 60000) {
      const n = await refresh(s).catch(() => null);
      if (n) apply(n);
    }
  }, 5 * 60000);
})();
