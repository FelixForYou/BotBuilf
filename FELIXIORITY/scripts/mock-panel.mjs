// Panel Pterodactyl tiruan untuk pengujian lokal (Application API: users & servers).
// HANYA untuk pengembangan. Jalankan:
//   MOCK_USERS=237 MOCK_SERVERS=512 node scripts/mock-panel.mjs
// lalu jalankan aplikasi dengan FELIX_DEV_ALLOW_PRIVATE=1 npm run dev
// dan hubungkan ke http://127.0.0.1:4010 dengan key di bawah.
import http from "node:http";

const PORT = Number(process.env.MOCK_PORT ?? 4010);
export const FULL_KEY = "ptla_" + "Mock0FullAccessKey0000000000000000000000000".slice(0, 43);
export const NO_SERVERS_KEY = "ptla_" + "Mock0NoServersKey00000000000000000000000000".slice(0, 43);

const NAMES = ["felix", "aurora", "byte", "nova", "kiko", "raka", "sinta", "budi", "zeta", "luna", "orion", "dewi", "pixel", "nara", "yuki", "arka", "maya", "tara", "rio", "ilham"];
const SUFFIX = ["", "dev", "x", "gg", "mc", "id", "_01", "99", "craft", "host"];

let users = [];
let servers = [];
let nextUserId = 1;
let nextServerId = 1;
let failNext = 0;
let rateLimitNext = 0;
let requestLog = [];

function makeUser(id) {
  return {
    id,
    external_id: null,
    uuid: `00000000-0000-4000-8000-${String(id).padStart(12, "0")}`,
    username: `${NAMES[id % NAMES.length]}${SUFFIX[Math.floor(id / NAMES.length) % SUFFIX.length]}${id > 200 ? id : ""}`,
    email: `user${id}@example.test`,
    first_name: "User",
    last_name: String(id),
    language: "en",
    root_admin: id <= 3,
    "2fa": false,
    created_at: new Date(Date.UTC(2023, 0, 1) + id * 86400000 * 1.7).toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function makeServer(id, owner) {
  return {
    id,
    external_id: null,
    uuid: `11111111-0000-4000-8000-${String(id).padStart(12, "0")}`,
    identifier: id.toString(16).padStart(8, "a").slice(0, 8),
    name: `${["Survival", "Lobby", "Bot", "API", "Web", "Proxy", "Modded", "Discord"][id % 8]} ${id}`,
    description: "",
    status: id % 37 === 0 ? "suspended" : null,
    suspended: id % 37 === 0,
    limits: {
      memory: [1024, 2048, 4096, 0, 512][id % 5],
      swap: 0,
      disk: [5120, 10240, 20480, 0][id % 4],
      io: 500,
      cpu: [100, 200, 50, 0][id % 4],
      threads: null,
      oom_disabled: true,
    },
    feature_limits: { databases: 1, allocations: 1, backups: 1 },
    user: owner,
    node: 1 + (id % 3),
    allocation: id,
    nest: 1,
    egg: 1,
    container: {},
    updated_at: new Date().toISOString(),
    created_at: new Date(Date.UTC(2023, 5, 1) + id * 3600000 * 9).toISOString(),
  };
}

function reset(nUsers, nServers) {
  users = [];
  servers = [];
  nextUserId = 1;
  nextServerId = 1;
  for (let i = 0; i < nUsers; i++) users.push(makeUser(nextUserId++));
  // user dengan id kelipatan 5 tidak punya server
  const owners = users.filter((u) => u.id % 5 !== 0).map((u) => u.id);
  for (let i = 0; i < nServers; i++) {
    const owner = owners[(i * 7 + (i % 3)) % owners.length];
    servers.push(makeServer(nextServerId++, owner));
  }
}
reset(Number(process.env.MOCK_USERS ?? 237), Number(process.env.MOCK_SERVERS ?? 512));

function list(items, objectName, url) {
  const perPage = Math.max(1, Math.min(Number(url.searchParams.get("per_page") ?? 50), 500));
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const slice = items.slice((page - 1) * perPage, page * perPage);
  return {
    object: "list",
    data: slice.map((a) => ({ object: objectName, attributes: a })),
    meta: {
      pagination: {
        total: items.length,
        count: slice.length,
        per_page: perPage,
        current_page: page,
        total_pages: totalPages,
        links: {},
      },
    },
  };
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json", ...headers });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  // --- kontrol pengujian ---
  if (url.pathname.startsWith("/_mock/")) {
    const id = Number(url.searchParams.get("id"));
    switch (url.pathname) {
      case "/_mock/add-user": {
        const u = makeUser(nextUserId++);
        if (url.searchParams.get("name")) u.username = url.searchParams.get("name");
        users.push(u);
        return send(res, 200, { ok: true, user: u });
      }
      case "/_mock/delete-user":
        users = users.filter((u) => u.id !== id);
        servers = servers.filter((s) => s.user !== id);
        return send(res, 200, { ok: true });
      case "/_mock/rename":
        users = users.map((u) => (u.id === id ? { ...u, username: url.searchParams.get("name") } : u));
        return send(res, 200, { ok: true });
      case "/_mock/add-server": {
        const s = makeServer(nextServerId++, id);
        servers.push(s);
        return send(res, 200, { ok: true, server: s });
      }
      case "/_mock/fail":
        failNext = Number(url.searchParams.get("n") ?? 1);
        return send(res, 200, { ok: true, failNext });
      case "/_mock/ratelimit":
        rateLimitNext = Number(url.searchParams.get("n") ?? 1);
        return send(res, 200, { ok: true });
      case "/_mock/reset":
        reset(Number(url.searchParams.get("users") ?? 237), Number(url.searchParams.get("servers") ?? 512));
        return send(res, 200, { ok: true });
      case "/_mock/log":
        return send(res, 200, requestLog.slice(-200));
      case "/_mock/state":
        return send(res, 200, { users: users.length, servers: servers.length });
    }
  }
  requestLog.push(`${req.method} ${url.pathname}${url.search}`);
  if (url.pathname === "/redirect/api/application/users") {
    res.writeHead(302, { Location: "http://169.254.169.254/latest/meta-data" });
    return res.end();
  }
  const auth = req.headers.authorization ?? "";
  const key = auth.replace(/^Bearer\s+/i, "");
  if (!url.pathname.startsWith("/api/application/")) return send(res, 404, { errors: [{ code: "NotFoundHttpException" }] });
  if (key !== FULL_KEY && key !== NO_SERVERS_KEY) {
    return send(res, 401, { errors: [{ code: "AuthenticationException", status: "401", detail: "Unauthenticated." }] });
  }
  if (rateLimitNext > 0) {
    rateLimitNext--;
    return send(res, 429, { errors: [{ code: "TooManyRequestsHttpException", status: "429" }] }, { "Retry-After": "3" });
  }
  if (failNext > 0) {
    failNext--;
    return send(res, 500, { errors: [{ code: "HttpException", status: "500" }] });
  }
  if (url.pathname === "/api/application/users") return send(res, 200, list(users, "user", url));
  if (url.pathname === "/api/application/servers") {
    if (key === NO_SERVERS_KEY) {
      return send(res, 403, { errors: [{ code: "AccessDeniedHttpException", status: "403", detail: "This action is unauthorized." }] });
    }
    return send(res, 200, list(servers, "server", url));
  }
  return send(res, 404, { errors: [{ code: "NotFoundHttpException" }] });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Panel tiruan aktif di http://127.0.0.1:${PORT}`);
  console.log(`  ${users.length} user, ${servers.length} server`);
  console.log(`  Key akses penuh : ${FULL_KEY}`);
  console.log(`  Key tanpa izin Servers: ${NO_SERVERS_KEY}`);
});
