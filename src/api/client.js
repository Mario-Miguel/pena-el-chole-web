/**
 * Cliente HTTP del backend propio (Spring Boot).
 * El contrato de los endpoints está documentado en backend/API.md.
 *
 * En desarrollo Vite redirige /api a http://localhost:8080 (ver vite.config.js).
 * En producción se puede apuntar a otro host con VITE_API_URL.
 */

const API_URL = `${(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}/api`;

const TOKEN_KEY = "pena_token";
const SESION_KEY = "pena_sesion";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.append(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

async function request(method, path, { body, query, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${path}${buildQuery(query)}`, {
    method,
    headers,
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });

  if (res.status === 204) return null;
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    // Token caducado o inválido: cerrar sesión y volver al login
    if (res.status === 401 && path !== "/auth/login") {
      clearToken();
      localStorage.removeItem(SESION_KEY);
      if (!window.location.pathname.startsWith("/Acceso")) window.location.href = "/Acceso";
    }
    const message = (isJson && (data?.message || data?.error)) || data || `Error ${res.status}`;
    throw new ApiError(message, res.status, data);
  }
  return data;
}

// ─── Tiempo real (Server-Sent Events) ───────────────────────────────────────
// Una única conexión compartida; cada evento es { entity, type, id, data }.

const listeners = new Map(); // entity -> Set<callback>
let eventSource = null;

function openEventSource() {
  if (eventSource) return;
  eventSource = new EventSource(`${API_URL}/events${buildQuery({ token: getToken() })}`);
  eventSource.onmessage = (msg) => {
    let event;
    try { event = JSON.parse(msg.data); } catch { return; }
    listeners.get(event.entity)?.forEach(cb => cb(event));
  };
}

function closeEventSourceIfIdle() {
  if (eventSource && [...listeners.values()].every(set => set.size === 0)) {
    eventSource.close();
    eventSource = null;
  }
}

function subscribe(entity, callback) {
  if (!listeners.has(entity)) listeners.set(entity, new Set());
  listeners.get(entity).add(callback);
  openEventSource();
  return () => {
    listeners.get(entity)?.delete(callback);
    closeEventSourceIfIdle();
  };
}

// ─── Entidades ──────────────────────────────────────────────────────────────

function entityClient(name) {
  const base = `/entities/${encodeURIComponent(name)}`;
  return {
    list: (sort, limit, skip) =>
      request("GET", base, { query: { sort, limit, skip } }),
    filter: (query = {}, sort, limit, skip) =>
      request("GET", base, { query: { ...query, sort, limit, skip } }),
    get: (id) => request("GET", `${base}/${id}`),
    create: (data) => request("POST", base, { body: data }),
    bulkCreate: (items) => request("POST", `${base}/bulk`, { body: items }),
    update: (id, data) => request("PATCH", `${base}/${id}`, { body: data }),
    delete: (id) => request("DELETE", `${base}/${id}`),
    // Acepta un array de ids o el formato heredado { id: { $in: [...] } }
    deleteMany: (idsOrQuery) => {
      const ids = Array.isArray(idsOrQuery) ? idsOrQuery : idsOrQuery?.id?.$in || [];
      return request("POST", `${base}/delete-many`, { body: { ids } });
    },
    schema: () => request("GET", `${base}/schema`),
    subscribe: (callback) => subscribe(name, callback),
  };
}

const entityClients = {};

// api.entities.Integrante, api.entities[nombreDinamico], ...
const entities = new Proxy(entityClients, {
  get(target, name) {
    if (typeof name !== "string") return undefined;
    return (target[name] ??= entityClient(name));
  },
});

// ─── Auth ───────────────────────────────────────────────────────────────────

const auth = {
  async login(usuario, contrasena) {
    const { token, sesion } = await request("POST", "/auth/login", { body: { usuario, contrasena } });
    setToken(token);
    return sesion;
  },
  me: () => request("GET", "/auth/me"),
  // Público: [{ id, nombre, usuarioLogin }] para el selector rápido del login
  usuariosAcceso: () => request("GET", "/auth/usuarios"),
  logout() {
    clearToken();
    eventSource?.close();
    eventSource = null;
  },
  isAuthenticated: () => !!getToken(),
};

// ─── Archivos e IA ──────────────────────────────────────────────────────────

async function uploadFile({ file }) {
  const form = new FormData();
  form.append("file", file);
  return request("POST", "/files", { form }); // -> { file_url }
}

async function invokeLLM({ prompt, response_json_schema }) {
  const { result } = await request("POST", "/ai/llm", { body: { prompt, response_json_schema } });
  return result; // string, u objeto si se pasó response_json_schema
}

async function generateImage({ prompt }) {
  return request("POST", "/ai/image", { body: { prompt } }); // -> { url }
}

export const api = { entities, auth, uploadFile, invokeLLM, generateImage };
