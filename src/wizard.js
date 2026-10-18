/* REN Wizard — standalone deploy wizard (WinterJS on Wasmer Edge).
 * Deploys the REN Gateway panel (package 166gkhdbn-boop/aidify-panel) to the
 * user's own Wasmer account and provisions their database automatically.
 * Stateless: user tokens are used transiently and never stored.
 */

const DEPLOY_HTML = __DEPLOY_HTML__;

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
