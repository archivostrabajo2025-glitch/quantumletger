// Compatibility client backed by the application's own Render API (PostgreSQL).
// No Supabase project, credentials, auth service, or storage bucket is used here.
/* eslint-disable @typescript-eslint/no-explicit-any -- keep the existing Supabase-shaped API contract at this adapter boundary. */
const SESSION_KEY = 'quantum-ledger-api-session';
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '';

type QueryState = {
  table: string;
  action: 'select' | 'insert' | 'upsert' | 'update' | 'delete';
  filters: Array<{ column: string; value: unknown }>;
  order?: { column: string; ascending: boolean };
  limit?: number;
  fields?: string | string[];
  values?: unknown;
  single: boolean;
};
type ChannelPayload = { new: unknown; old: unknown };
type ApiChannel = {
  on: (_event: string, _filter?: unknown, _callback?: (payload: ChannelPayload) => void) => ApiChannel;
  subscribe: () => { unsubscribe: () => void };
};

const getSession = () => {
  if (typeof window === 'undefined') return null;
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (session?.expires_at && session.expires_at * 1000 < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

const setSession = (session: any) => {
  if (typeof window === 'undefined') return;
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
};

const request = async (path: string, options: RequestInit = {}) => {
  const token = getSession()?.access_token;
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error || `API error (${response.status})`);
  return payload;
};

const authListeners = new Set<(event: string, session: any) => void>();
const notifyAuthListeners = (event: string, session: any) => authListeners.forEach((listener) => listener(event, session));

const buildQuery = (table: string) => {
  const state: QueryState = { table, action: 'select', filters: [], single: false };
  const execute = async () => {
    try {
      const payload = await request('/api/data/query', { method: 'POST', body: JSON.stringify(state) });
      return { data: payload?.data ?? null, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message || 'No se pudo completar la operación.' } };
    }
  };
  const api: any = {
    select(fields?: string | string[]) { state.fields = fields; if (state.action === 'select') state.action = 'select'; return api; },
    eq(column: string, value: unknown) { state.filters.push({ column, value }); return api; },
    order(column: string, options?: { ascending?: boolean }) { state.order = { column, ascending: options?.ascending ?? true }; return api; },
    limit(value: number) { state.limit = value; return api; },
    update(values: Record<string, unknown>) { state.action = 'update'; state.values = values; return api; },
    insert(values: Record<string, unknown> | Record<string, unknown>[]) { state.action = 'insert'; state.values = values; return api; },
    upsert(values: Record<string, unknown> | Record<string, unknown>[], _options?: unknown) { state.action = 'upsert'; state.values = values; return api; },
    delete() { state.action = 'delete'; return api; },
    maybeSingle() { state.single = true; return execute(); },
    single() { state.single = true; return execute(); },
    then(resolve: (value: any) => unknown, reject?: (reason: any) => unknown) { return execute().then(resolve, reject); },
  };
  return api;
};

const storageFrom = (bucket: string) => ({
  upload: async (path: string, file: File | Blob | string, _options?: { upsert?: boolean }) => {
    try {
      let bytes: ArrayBuffer;
      let contentType = 'application/octet-stream';
      if (typeof file === 'string') {
        bytes = new TextEncoder().encode(file).buffer;
        contentType = 'text/plain';
      } else {
        bytes = await file.arrayBuffer();
        contentType = file.type || contentType;
      }
      const binary = Array.from(new Uint8Array(bytes), (byte) => String.fromCharCode(byte)).join('');
      const content = btoa(binary);
      const result = await request('/api/storage/upload', { method: 'POST', body: JSON.stringify({ bucket, path, contentType, content }) });
      return { data: result.data, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  },
  createSignedUrl: async (path: string, expiresIn = 3600) => {
    try {
      const result = await request('/api/storage/signed-url', { method: 'POST', body: JSON.stringify({ bucket, path, expiresIn }) });
      return { data: { signedUrl: result.signedUrl.startsWith('http') ? result.signedUrl : `${window.location.origin}${result.signedUrl}` }, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  },
  getPublicUrl: (path: string) => ({ data: { publicUrl: `${API_BASE}/api/storage/view?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}` }, error: null }),
  remove: async (_paths: string[]) => ({ data: null, error: null }),
});

export const supabase = {
  auth: {
    async getUser() {
      try { return { data: { user: (await request('/api/auth/me')).user }, error: null }; }
      catch { setSession(null); return { data: { user: null }, error: null }; }
    },
    async getSession() { return { data: { session: getSession() }, error: null }; },
    async signUp({ email, password, options }: { email: string; password: string; options?: { data?: Record<string, unknown> } }) {
      try {
        const result = await request('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, options }) });
        setSession({ ...result.session, user: result.user });
        notifyAuthListeners('SIGNED_IN', getSession());
        return { data: { user: result.user, session: result.session }, error: null };
      } catch (error: any) { return { data: { user: null, session: null }, error: { message: error.message } }; }
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        const result = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        setSession({ ...result.session, user: result.user });
        notifyAuthListeners('SIGNED_IN', getSession());
        return { data: { user: result.user, session: result.session }, error: null };
      } catch (error: any) { return { data: { user: null, session: null }, error: { message: error.message } }; }
    },
    async signOut() { setSession(null); notifyAuthListeners('SIGNED_OUT', null); return { error: null }; },
    async resetPasswordForEmail(_email: string, _options?: unknown) { return { data: null, error: { message: 'La recuperación de contraseña por correo no está disponible.' } }; },
    async updateUser(_payload: unknown) { return { data: { user: null }, error: { message: 'Esta operación no está disponible.' } }; },
    onAuthStateChange(callback: (event: string, session: any) => void) {
      authListeners.add(callback);
      const session = getSession();
      if (session) callback('SIGNED_IN', session);
      return { data: { subscription: { unsubscribe: () => { authListeners.delete(callback); } } } };
    },
  },
  from: (table: string) => buildQuery(table),
  storage: { from: (bucket: string) => storageFrom(bucket) },
  functions: {
    async invoke(name: string, payload?: unknown) {
      const body = (payload as any)?.body || payload || {};
      const endpoint = `/api/functions/${encodeURIComponent(name)}`;
      try { return { data: await request(endpoint, { method: 'POST', body: JSON.stringify(body) }), error: null }; }
      catch (error: any) { return { data: null, error: { message: error.message } }; }
    },
  },
  channel: (_name: string): ApiChannel => {
    const channel: ApiChannel = {
      on: () => channel,
      subscribe: () => ({ unsubscribe: () => undefined }),
    };
    return channel;
  },
  removeChannel: (_channel: unknown) => undefined,
};

export type SupabaseClient = typeof supabase;
