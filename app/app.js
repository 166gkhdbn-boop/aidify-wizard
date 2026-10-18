/* REN Wizard — standalone deploy wizard (WinterJS on Wasmer Edge).
 * Deploys the REN Gateway panel (package 166gkhdbn-boop/aidify-panel) to the
 * user's own Wasmer account and provisions their database automatically.
 * Stateless: user tokens are used transiently and never stored.
 */

const DEPLOY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>REN — Deploy your own panel</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0c0c0f;--panel:#13131a;--panel2:#18181f;--border:#1c1c28;--border-hi:#2a2a3e;--text:#e2e2f0;--muted:#6b6b8a;--dim:#2e2e42;--accent:#6366f1;--accent-glow:rgba(99,102,241,0.18);--accent-dim:rgba(99,102,241,0.08);--green:#10b981;--green-dim:rgba(16,185,129,0.08);--red:#f43f5e;--red-dim:rgba(244,63,94,0.08);--yellow:#f59e0b;--yellow-dim:rgba(245,158,11,0.08)}
html,body{height:100%;background:var(--bg);font-family:'Inter',system-ui,sans-serif;color:var(--text)}
body{display:flex;align-items:center;justify-content:center;min-height:100vh;position:relative;overflow:hidden;padding:20px}
.bg-grid{position:fixed;inset:0;background-image:linear-gradient(rgba(99,102,241,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.03) 1px,transparent 1px);background-size:40px 40px;pointer-events:none}
.bg-glow{position:fixed;width:700px;height:700px;background:radial-gradient(circle,rgba(99,102,241,0.07) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none}
.wrap{position:relative;z-index:1;width:100%;max-width:520px;max-height:94vh;overflow-y:auto}
.logo{text-align:center;margin-bottom:22px}
.logo-mark{width:52px;height:52px;background:var(--accent);border-radius:15px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:#fff;margin-bottom:12px;box-shadow:0 0 44px var(--accent-glow)}
.logo h1{font-size:22px;font-weight:700;letter-spacing:-.5px}
.logo p{font-size:13px;color:var(--muted);margin-top:4px}
.card{background:var(--panel);border:1px solid var(--border);border-radius:18px;padding:28px 30px;box-shadow:0 20px 60px rgba(0,0,0,0.4);overflow:hidden}
.steps{display:flex;align-items:center;margin-bottom:24px}
.step-dot{width:28px;height:28px;border-radius:50%;background:var(--panel2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--muted);flex-shrink:0;transition:all .3s}
.step-dot.done{background:var(--green-dim);border-color:var(--green);color:var(--green)}
.step-dot.now{background:var(--accent);border-color:var(--accent);color:#fff;box-shadow:0 0 16px var(--accent-glow)}
.step-line{flex:1;height:1px;background:var(--border);margin:0 8px}
.step-line.done{background:var(--green)}
.step{display:none;animation:fadeUp .35s ease}
.step.on{display:block}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.step h2{font-size:17px;font-weight:700;margin-bottom:8px;letter-spacing:-.3px}
.step .desc{font-size:13px;color:var(--muted);line-height:1.65;margin-bottom:18px}
.step .desc a{color:var(--accent);text-decoration:none}
.step .desc a:hover{text-decoration:underline}
.step .desc ol{margin:8px 0 0 18px}
.step .desc ol li{margin-bottom:4px}
.field{margin-bottom:14px}
.field label{display:block;font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
.field input{width:100%;padding:11px 14px;background:#0a0a10;border:1px solid var(--border);border-radius:10px;color:var(--text);font-family:inherit;font-size:14px;outline:none;transition:border-color .2s,box-shadow .2s}
.field input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-dim)}
.field input::placeholder{color:var(--dim)}
.field input.mono{font-family:ui-monospace,monospace;font-size:12px}
.field .hint{font-size:11px;color:var(--muted);margin-top:6px;line-height:1.5}
.err{background:var(--red-dim);border:1px solid rgba(244,63,94,0.2);color:var(--red);border-radius:9px;padding:10px 14px;font-size:13px;margin-bottom:14px;display:none;align-items:center;gap:8px}
.err.show{display:flex}
.okmsg{background:var(--green-dim);border:1px solid rgba(16,185,129,0.25);color:var(--green);border-radius:9px;padding:10px 14px;font-size:13px;margin-bottom:14px;display:none;align-items:center;gap:8px}
.okmsg.show{display:flex}
.nav{display:flex;justify-content:space-between;gap:10px;margin-top:22px}
.btn{font-family:inherit;font-size:13px;font-weight:600;border-radius:10px;padding:11px 22px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;border:none;transition:all .15s}
.btn-primary{background:var(--accent);color:#fff}
.btn-primary:hover{filter:brightness(1.1);box-shadow:0 4px 18px var(--accent-glow)}
.btn-primary:disabled{opacity:.5;pointer-events:none}
.btn-ghost{background:transparent;color:var(--muted);border:1px solid var(--border)}
.btn-ghost:hover{border-color:var(--border-hi);color:var(--text)}
.prog{margin:8px 0 4px}
.prog-row{display:flex;align-items:center;gap:10px;padding:9px 0;font-size:13px;color:var(--muted)}
.prog-row .st{width:20px;height:20px;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.prog-row.doing{color:var(--text)}
.prog-row.done{color:var(--green)}
.prog-sub{font-size:11px;color:var(--dim);margin-left:30px;margin-top:-4px;margin-bottom:4px}
.spin{width:15px;height:15px;border:2px solid var(--border-hi);border-top-color:var(--accent);border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.done-ico{width:64px;height:64px;border-radius:50%;background:var(--green-dim);border:1px solid var(--green);color:var(--green);display:flex;align-items:center;justify-content:center;margin:6px auto 18px;animation:pop .5s cubic-bezier(.34,1.4,.64,1)}
@keyframes pop{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}
.center{text-align:center}
.big-url{display:inline-block;background:var(--panel2);border:1px solid var(--border-hi);border-radius:12px;padding:12px 20px;font-size:15px;font-weight:700;color:var(--accent);text-decoration:none;margin:14px 0;direction:ltr}
.big-url:hover{border-color:var(--accent)}
.note{font-size:11px;color:var(--muted);line-height:1.6;margin-top:14px;text-align:center}
.secure{display:flex;gap:8px;align-items:flex-start;background:var(--yellow-dim);border:1px solid rgba(245,158,11,.2);border-radius:10px;padding:10px 13px;font-size:12px;color:var(--yellow);margin-bottom:16px;line-height:1.55}
</style>
</head>
<body>
<div class="bg-grid"></div>
<div class="bg-glow"></div>
<div class="wrap">
  <div class="logo">
    <div class="logo-mark">R</div>
    <h1>Deploy your own panel</h1>
    <p>Two tokens in — your own REN Gateway comes out. Fully automatic.</p>
  </div>
  <div class="card">
    <div class="steps" id="steps"></div>
    <div class="err" id="err"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span id="err-msg"></span></div>
    <div class="okmsg" id="okmsg"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span id="ok-msg"></span></div>

    <!-- STEP 1: wasmer token -->
    <div class="step on" data-step="0">
      <h2>Wasmer token</h2>
      <p class="desc">Sign in at <a href="https://wasmer.io" target="_blank" rel="noopener">wasmer.io</a>, open your avatar → <b>Settings → Tokens</b>, create a token and paste it here. It's only used for this deployment and never stored.</p>
      <div class="secure"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span>Your token travels over HTTPS and is used once to create your app. We never save it.</span></div>
      <div class="field"><label>Wasmer personal token</label><input type="password" id="d-token" class="mono" placeholder="wam_…" dir="ltr" autocomplete="off"></div>
    </div>

    <!-- STEP 2: database token -->
    <div class="step" data-step="1">
      <h2>Database token</h2>
      <p class="desc">The panel needs a database to remember your users and settings. We'll create a <b>free database for you automatically</b> — just give us a token:
        <ol>
          <li>Sign in at <a href="https://supabase.com" target="_blank" rel="noopener">supabase.com</a></li>
          <li>Go to <a href="https://supabase.com/dashboard/account/tokens" target="_blank" rel="noopener">Account → Access Tokens</a></li>
          <li>Create a token with <b>full permissions</b> (it needs to create projects for you) and paste it here</li>
        </ol>
      </p>
      <div class="secure"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span>Used once to create your database. Never stored.</span></div>
      <div class="field"><label>Database access token</label><input type="password" id="d-sbtoken" class="mono" placeholder="sbp_…" dir="ltr" autocomplete="off"></div>
    </div>

    <!-- STEP 3: panel settings -->
    <div class="step" data-step="2">
      <h2>Panel settings</h2>
      <p class="desc">Name your panel and pick a password. That's all — the database and hosting are handled for you.</p>
      <div class="field"><label>App name</label><input type="text" id="d-app" placeholder="my-panel" dir="ltr" maxlength="40"><div class="hint">Lowercase letters, numbers and dashes. Your panel will live at <b id="app-preview" dir="ltr">my-panel.wasmer.app</b></div></div>
      <div class="field"><label>Panel password</label><input type="password" id="d-pass" placeholder="Choose an admin password" autocomplete="new-password"><div class="hint">Min 4 characters — you'll sign in with this.</div></div>
      <div class="field"><label>Proxy host <span style="text-transform:none;letter-spacing:0">(optional)</span></label><input type="text" id="d-proxy" placeholder="vless.example.com" dir="ltr"><div class="hint">Your VLESS server host. Can be set later in the Domain page.</div></div>
    </div>

    <!-- STEP 4: auto deploy -->
    <div class="step" data-step="3">
      <h2>Sit back — we're building everything</h2>
      <p class="desc">Creating your database, tables and panel automatically. This takes a few minutes.</p>
      <div class="prog" id="d-prog"></div>
    </div>

    <!-- STEP 5: done -->
    <div class="step" data-step="4">
      <div class="center">
        <div class="done-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></div>
        <h2>Your panel is live</h2>
        <p class="desc">Sign in with the password you chose and run the setup wizard.</p>
        <a class="big-url" id="d-url" href="#" target="_blank" rel="noopener">—</a>
        <p class="note">Tip: point your VLESS server's UUIDs at the users you create — new users need a proxy redeploy to take effect.</p>
      </div>
    </div>

    <div class="nav" id="d-nav">
      <button class="btn btn-ghost" id="btn-back" onclick="go(-1)" style="visibility:hidden">← Back</button>
      <button class="btn btn-primary" id="btn-next" onclick="go(1)"><span id="next-txt">Validate token →</span></button>
    </div>
  </div>
</div>
<script>
let cur = 0, D = {};
const N = 4;
document.getElementById('d-app').addEventListener('input', e=>{
  document.getElementById('app-preview').textContent = (e.target.value.trim()||'my-panel') + '.wasmer.app';
});
function renderSteps(){
  const w = document.getElementById('steps');
  let h = '';
  for(let i=0;i<N;i++){
    const cls = i<cur?'done':(i===cur?'now':'');
    const inner = i<cur
      ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
      : (i+1);
    h += \`<div class="step-dot \${cls}">\${inner}</div>\`;
    if(i<N-1) h += \`<div class="step-line \${i<cur?'done':''}"></div>\`;
  }
  w.innerHTML = h;
  document.querySelectorAll('.step').forEach(s=>s.classList.toggle('on',+s.dataset.step===cur));
  document.getElementById('btn-back').style.visibility = (cur===0||cur===N-1) ? 'hidden':'visible';
  const nx = document.getElementById('next-txt');
  nx.textContent = cur===0?'Validate token →':cur===1?'Validate token →':cur===2?'Deploy automatically →':'';
  document.getElementById('d-nav').style.display = cur>=3 ? 'none':'flex';
  hideErr(); hideOk();
}
function showErr(m){document.getElementById('err-msg').textContent=m;document.getElementById('err').classList.add('show');}
function hideErr(){document.getElementById('err').classList.remove('show');}
function showOk(m){document.getElementById('ok-msg').textContent=m;document.getElementById('okmsg').classList.add('show');}
function hideOk(){document.getElementById('okmsg').classList.remove('show');}
async function api(path, body){
  const r = await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const d = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d.detail||('HTTP '+r.status));
  return d;
}
async function validateWasmer(){
  const t = document.getElementById('d-token').value.trim();
  if(!t){showErr('Paste your Wasmer token first.');return false;}
  const btn=document.getElementById('btn-next');btn.disabled=true;hideErr();
  try{
    const d = await api('/api/deploy/validate-token',{wasmer_token:t});
    D.token=t; D.username=d.username;
    showOk('Signed in as '+d.username+' — token is valid.');
    return true;
  }catch(e){showErr(e.message);return false;}
  finally{btn.disabled=false;}
}
async function validateSb(){
  const t = document.getElementById('d-sbtoken').value.trim();
  if(!t){showErr('Paste your database token first.');return false;}
  const btn=document.getElementById('btn-next');btn.disabled=true;hideErr();
  try{
    const d = await api('/api/deploy/validate-sb-token',{supabase_token:t});
    D.sbToken=t; D.orgSlug=d.orgs[0].slug; D.orgName=d.orgs[0].name;
    showOk('Database connected'+(d.orgs.length>1?' — using organization "'+d.orgs[0].name+'"':'')+'. We\\'ll create your database automatically.');
    return true;
  }catch(e){showErr(e.message);return false;}
  finally{btn.disabled=false;}
}
function validConfig(){
  const app=document.getElementById('d-app').value.trim().toLowerCase();
  const pw=document.getElementById('d-pass').value;
  const proxy=document.getElementById('d-proxy').value.trim().toLowerCase().replace(/^https?:\\/\\//,'').replace(/\\/\$/,'');
  if(!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?\$/.test(app)){showErr('App name: lowercase letters, numbers and dashes only.');return false;}
  if(pw.length<4){showErr('Panel password must be at least 4 characters.');return false;}
  if(proxy && !/^[a-z0-9\\-_.]+\$/.test(proxy)){showErr('Invalid proxy host format.');return false;}
  Object.assign(D,{app,pw,proxy});
  document.getElementById('d-app').value=app;
  return true;
}
const PROG_STEPS=[
  {t:'Creating your database', s:'Free tier, set up automatically'},
  {t:'Waiting for the database to be ready', s:'Provisioning — usually 1–2 minutes'},
  {t:'Creating tables & reading API keys', s:'panel_users + panel_settings'},
  {t:'Deploying your panel to Wasmer Edge', s:'Publishing the app and saving secrets'},
];
function renderProg(activeIdx, sub){
  document.getElementById('d-prog').innerHTML = PROG_STEPS.map((p,i)=>{
    const cls = i<activeIdx?'done':(i===activeIdx?'doing':'');
    const ico = i<activeIdx
      ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
      : (i===activeIdx?'<div class="spin"></div>':'<div style="width:15px;height:15px;border-radius:50%;border:1px solid var(--border)"></div>');
    const subHtml = (i===activeIdx && sub) ? \`<div class="prog-sub">\${sub}</div>\` : '';
    return \`<div class="prog-row \${cls}"><span class="st">\${ico}</span>\${p.t}</div>\${subHtml}\`;
  }).join('');
}
const sleep = ms => new Promise(r=>setTimeout(r,ms));
async function doDeploy(){
  cur=3;renderSteps();
  try{
    // 1. create database project
    renderProg(0);
    const c = await api('/api/deploy/sb-create',{supabase_token:D.sbToken, org_slug:D.orgSlug, project_name:D.app+'-db'});
    const ref = c.ref;
    // 2. wait until ready
    renderProg(1);
    let ready=false, status='';
    for(let i=0;i<36;i++){
      await sleep(10000);
      try{
        const s = await api('/api/deploy/sb-status',{supabase_token:D.sbToken, ref});
        status=s.status;
        renderProg(1, 'Status: '+status);
        if(s.ready){ready=true;break;}
      }catch(e){ renderProg(1, 'Retrying…'); }
    }
    if(!ready) throw new Error('Database took too long to become ready (last status: '+status+'). Try again in a few minutes.');
    // 3. tables + keys
    renderProg(2);
    const sb = await api('/api/deploy/sb-setup',{supabase_token:D.sbToken, ref});
    // 4. wasmer deploy
    renderProg(3);
    const d = await api('/api/deploy/wasmer',{wasmer_token:D.token, app_name:D.app, supabase_url:sb.supabase_url, service_role_key:sb.service_role_key, panel_password:D.pw, proxy_host:D.proxy||''});
    renderProg(4);
    document.getElementById('d-url').textContent=d.url.replace('https://','');
    document.getElementById('d-url').href=d.url;
    setTimeout(()=>{cur=4;renderSteps();},700);
  }catch(e){
    renderProg(-1);
    showErr(e.message);
    document.getElementById('d-nav').style.display='flex';
    cur=2;renderSteps();
  }
}
async function go(d){
  if(d>0){
    if(cur===0){ if(!(await validateWasmer()))return; }
    if(cur===1){ if(!(await validateSb()))return; }
    if(cur===2){ if(!validConfig())return; await doDeploy(); return; }
  }
  cur=Math.min(N-1,Math.max(0,cur+d));
  renderSteps();
}
renderSteps();
</script>
</body>
</html>
`;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
const err = (detail, status = 400) => json({ detail }, status);
const html = (s, status = 200) =>
  new Response(s, { status, headers: { "content-type": "text/html;charset=utf-8" } });
function redir(to) {
  const h = new Headers();
  h.set("Location", to);
  return new Response("", { status: 302, headers: h });
}

/* ---------- Wasmer GraphQL ---------- */
const WASMER_GQL = process.env.WASMER_GRAPHQL_URL || "https://registry.wasmer.io/graphql";
async function wasmerGQL(token, query, variables, operationName) {
  const r = await fetch(WASMER_GQL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
    body: JSON.stringify({ query, variables: variables || null, operationName }),
  });
  const j = await r.json().catch(() => ({}));
  if (j.errors && j.errors.length) throw new Error(j.errors[0].message);
  if (!j.data) throw new Error("Wasmer API error");
  return j.data;
}

/* ---------- Supabase Management API ---------- */
const SB_MGMT = process.env.SUPABASE_MGMT_URL || "https://api.supabase.com";
async function sbMgmt(token, method, path, body) {
  const r = await fetch(SB_MGMT + path, {
    method,
    headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = (j && (j.msg || j.message || j.error_description || j.error)) || ("HTTP " + r.status);
    const e = new Error(String(msg).slice(0, 200));
    e.status = r.status;
    throw e;
  }
  return j;
}
function randomPassword(n) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const buf = new Uint8Array(n || 24);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => chars[b % chars.length]).join("");
}
const SETUP_SQL = "create table if not exists panel_users (id uuid primary key default gen_random_uuid(), name text not null, uuid text not null, trojan_password text, enabled boolean not null default true, created_at timestamptz not null default now(), last_seen timestamptz, total_up bigint not null default 0, total_down bigint not null default 0, data_limit bigint, expires_at timestamptz); create table if not exists panel_settings (key text primary key, value text);";

/* ---------- handler ---------- */
async function handler(req) {
  const url = new URL(req.url);
  const path = url.pathname;
  const m = req.method.toUpperCase();

  if (path === "/health") return json({ status: "ok" });

  // wizard UI
  if (path === "/") return redir("/deploy");
  if (path === "/deploy") return html(DEPLOY_HTML);

  // step 1: validate the user's Wasmer token
  if (path === "/api/deploy/validate-token" && m === "POST") {
    let body = {};
    try { body = await req.json(); } catch {}
    const token = String(body.wasmer_token || "").trim();
    if (!token) return err("Token is required");
    try {
      const d = await wasmerGQL(token, "query GetCurrentUser {\n  viewer {\n    id\n    username\n  }\n}\n", null, "GetCurrentUser");
      if (!d.viewer || !d.viewer.username) return err("Invalid Wasmer token", 401);
      return json({ ok: true, username: d.viewer.username });
    } catch (e) {
      return err("Invalid Wasmer token", 401);
    }
  }

  // step 2: validate the user's database token (Supabase PAT)
  if (path === "/api/deploy/validate-sb-token" && m === "POST") {
    let body = {};
    try { body = await req.json(); } catch {}
    const token = String(body.supabase_token || "").trim();
    if (!token) return err("Database token is required");
    try {
      const orgs = await sbMgmt(token, "GET", "/v1/organizations");
      if (!Array.isArray(orgs) || !orgs.length) return err("No organizations found — your token needs full permissions. Create a new token with all scopes enabled.", 401);
      return json({ ok: true, orgs: orgs.map((o) => ({ slug: o.slug || o.id, name: o.name })) });
    } catch (e) {
      if (e.status === 401 || e.status === 403) return err("Invalid database token — create one at supabase.com/dashboard/account/tokens", 401);
      return err("Database error: " + e.message, e.status || 500);
    }
  }

  // step 3a: create a free database project
  if (path === "/api/deploy/sb-create" && m === "POST") {
    let body = {};
    try { body = await req.json(); } catch {}
    const token = String(body.supabase_token || "").trim();
    const orgSlug = String(body.org_slug || "").trim();
    const name = String(body.project_name || "ren-panel-db").trim().slice(0, 40) || "ren-panel-db";
    if (!token || !orgSlug) return err("Missing parameters");
    try {
      const p = await sbMgmt(token, "POST", "/v1/projects", {
        name,
        organization_slug: orgSlug,
        db_pass: randomPassword(24),
        region: "eu-west-1",
      });
      const ref = p.id || p.ref;
      if (!ref) return err("Database provider did not return a project ref");
      return json({ ok: true, ref });
    } catch (e) {
      return err("Could not create database: " + e.message, e.status || 500);
    }
  }

  // step 3b: poll until the database is ready
  if (path === "/api/deploy/sb-status" && m === "POST") {
    let body = {};
    try { body = await req.json(); } catch {}
    const token = String(body.supabase_token || "").trim();
    const ref = String(body.ref || "").trim();
    if (!token || !ref) return err("Missing parameters");
    try {
      const p = await sbMgmt(token, "GET", "/v1/projects/" + encodeURIComponent(ref));
      const status = p.status || "UNKNOWN";
      return json({ ok: true, status, ready: status === "ACTIVE_HEALTHY" });
    } catch (e) {
      return err("Could not check project status: " + e.message, e.status || 500);
    }
  }

  // step 3c: create tables and read API keys
  if (path === "/api/deploy/sb-setup" && m === "POST") {
    let body = {};
    try { body = await req.json(); } catch {}
    const token = String(body.supabase_token || "").trim();
    const ref = String(body.ref || "").trim();
    if (!token || !ref) return err("Missing parameters");
    try {
      await sbMgmt(token, "POST", "/v1/projects/" + encodeURIComponent(ref) + "/query", { query: SETUP_SQL });
      const keys = await sbMgmt(token, "GET", "/v1/projects/" + encodeURIComponent(ref) + "/api-keys");
      let key = null;
      if (Array.isArray(keys)) {
        const k = keys.find((x) => x.name === "service_role") || keys.find((x) => x.name === "secret");
        key = k && (k.api_key || k.key);
      }
      if (!key) return err("Could not read API keys for the new project");
      return json({ ok: true, supabase_url: "https://" + ref + ".supabase.co", service_role_key: key });
    } catch (e) {
      return err("Database setup failed: " + e.message, e.status || 500);
    }
  }

  // step 4: deploy the panel to the user's Wasmer account
  if (path === "/api/deploy/wasmer" && m === "POST") {
    let body = {};
    try { body = await req.json(); } catch {}
    const token = String(body.wasmer_token || "").trim();
    const appName = String(body.app_name || "").trim().toLowerCase();
    const sbUrl = String(body.supabase_url || "").trim().replace(/\/$/, "");
    const sbKey = String(body.service_role_key || body.supabase_key || "").trim();
    const pw = String(body.panel_password || "");
    const proxyHost = String(body.proxy_host || "").trim().toLowerCase();
    if (!token) return err("Wasmer token is required");
    if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(appName)) return err("Invalid app name");
    if (!/^https:\/\//.test(sbUrl) || !sbKey) return err("Invalid database credentials");
    if (pw.length < 4) return err("Panel password must be at least 4 characters");
    try {
      // 1. who owns this token?
      const me = await wasmerGQL(token, "query GetCurrentUser {\n  viewer {\n    id\n    username\n  }\n}\n", null, "GetCurrentUser");
      const username = me.viewer && me.viewer.username;
      if (!username) return err("Invalid Wasmer token", 401);
      // 2. create + deploy the app (package already published)
      const cfgLines = [
        "kind: wasmer.io/App.v0",
        "name: " + appName,
        "owner: " + username,
        "package: 166gkhdbn-boop/aidify-panel",
        "env:",
        "  SUPABASE_URL: " + sbUrl,
      ];
      if (proxyHost) cfgLines.push("  PROXY_HOST: " + proxyHost);
      const cfg = cfgLines.join("\n") + "\n";
      const depQ = "mutation PublishDeployApp($config: String!, $name: ID!, $owner: ID, $makeDefault: Boolean) {\n  publishDeployApp(input: {config: {yamlConfig: $config}, name: $name, owner: $owner, makeDefault: $makeDefault}) {\n    deployAppVersion {\n      id\n      url\n      app { id }\n    }\n  }\n}\n";
      const depVars = { config: cfg, name: appName, owner: username, makeDefault: true };
      const d1 = await wasmerGQL(token, depQ, depVars, "PublishDeployApp");
      const appId = d1.publishDeployApp.deployAppVersion.app.id;
      // 3. secrets
      const secQ = "mutation UpsertAppSecrets($appId: ID!, $secrets: [SecretInput!]) {\n  upsertAppSecrets(input: {appId: $appId, secrets: $secrets}) {\n    success\n  }\n}\n";
      await wasmerGQL(token, secQ, {
        appId,
        secrets: [
          { name: "SUPABASE_SERVICE_ROLE_KEY", value: sbKey },
          { name: "PANEL_PASSWORD", value: pw },
        ],
      }, "UpsertAppSecrets");
      // 4. redeploy so secrets take effect
      const d2 = await wasmerGQL(token, depQ, depVars, "PublishDeployApp");
      const url = (d2.publishDeployApp.deployAppVersion.url || ("https://" + appName + ".wasmer.app")).replace(/\/$/, "");
      return json({ ok: true, url, username });
    } catch (e) {
      return err("Deploy failed: " + (e.message || e).slice(0, 200));
    }
  }

  return err("Not found", 404);
}

addEventListener("fetch", (e) => e.respondWith(handler(e.request).catch((ex) => {
  return html(`<div style="background:#0c0c0f;color:#e2e2f0;font-family:sans-serif;padding:40px"><h3>Error</h3><div>${String(ex && ex.message || ex)}</div></div>`, 500);
})));
