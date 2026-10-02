// Local fallback implementation for demo mode when Supabase is not configured.
// This keeps the app working in the browser without a live Supabase account by
// persisting auth and app data in localStorage.

const STORAGE_KEY = 'quantum-ledger-local-db';
const BACKUP_KEY = 'quantum-ledger-local-db-backup';
const SESSION_KEY = 'quantum-ledger-session';
const DEVICE_TOKEN_KEY = 'qlb_device_token';

const demoAdmin = {
  id: 'admin-demo-user',
  email: 'admin@quantumledger.local',
  password: 'Admin123!',
  full_name: 'Administrador',
  phone: '+1234567890',
  nationality: 'Spain',
  country: 'Spain',
  full_address: 'Av. de la Tecnología 123',
  birth_date: '1990-01-01',
  proof_of_address_type: 'utility_bill',
  id_document_type: 'passport',
  account_type: 'business',
  role: 'admin',
  skip_login_otp: true,
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const demoUser = {
  id: 'demo-user',
  email: 'demo@quantumledger.local',
  password: 'Demo123!',
  full_name: 'Demo User',
  phone: '+3456789012',
  nationality: 'Spain',
  country: 'Spain',
  full_address: 'Calle Demo 456',
  birth_date: '1995-02-02',
  proof_of_address_type: 'bank_statement',
  id_document_type: 'dni',
  account_type: 'personal',
  role: 'user',
  skip_login_otp: false,
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const defaultProfiles = [
  {
    user_id: demoAdmin.id,
    email: demoAdmin.email,
    full_name: demoAdmin.full_name,
    phone: demoAdmin.phone,
    nationality: demoAdmin.nationality,
    country: demoAdmin.country,
    full_address: demoAdmin.full_address,
    birth_date: demoAdmin.birth_date,
    proof_of_address_type: demoAdmin.proof_of_address_type,
    id_document_type: demoAdmin.id_document_type,
    account_type: demoAdmin.account_type,
    is_activated: true,
    show_activation_modal: false,
    skip_login_otp: true,
    status: 'active',
    usd: 150000,
    btc: 1.25,
    eth: 2.4,
    usdt: 35000,
    bnb: 18,
    ltc: 42,
    fatca_amount: 1521,
    show_fatca: false,
    show_custom_notification: false,
    custom_notification_title: null,
    custom_notification_message: null,
    custom_notification_amount: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    account_number: 'US-001',
    routing_number: '01010101',
    usdt_address: 'TQw3xj...',
    verification_status: 'verified',
    verification_notes: 'Demo admin profile',
    id_document_number: 'ADMIN-0001',
    proof_of_address_url: null,
    selfie_url: null,
  },
  {
    user_id: demoUser.id,
    email: demoUser.email,
    full_name: demoUser.full_name,
    phone: demoUser.phone,
    nationality: demoUser.nationality,
    country: demoUser.country,
    full_address: demoUser.full_address,
    birth_date: demoUser.birth_date,
    proof_of_address_type: demoUser.proof_of_address_type,
    id_document_type: demoUser.id_document_type,
    account_type: demoUser.account_type,
    is_activated: false,
    show_activation_modal: true,
    skip_login_otp: false,
    status: 'pending',
    usd: 5000,
    btc: 0.32,
    eth: 0.8,
    usdt: 2300,
    bnb: 2.1,
    ltc: 5.5,
    fatca_amount: 2000,
    show_fatca: false,
    show_custom_notification: false,
    custom_notification_title: null,
    custom_notification_message: null,
    custom_notification_amount: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    account_number: 'US-002',
    routing_number: '02020202',
    usdt_address: 'TQw3xj...',
    verification_status: 'pending',
    verification_notes: 'Demo user profile',
    id_document_number: 'DEMO-0002',
    proof_of_address_url: null,
    selfie_url: null,
  },
];

const initialData = {
  users: [demoAdmin, demoUser],
  user_roles: [
    { id: 'role-admin', user_id: demoAdmin.id, role: 'admin' },
    { id: 'role-user', user_id: demoUser.id, role: 'user' },
  ],
  profiles: defaultProfiles,
  transactions: [
    {
      id: 'tx-demo-1',
      user_id: demoUser.id,
      type: 'deposit',
      crypto: 'USD',
      amount: 1500,
      usd_value: 1500,
      status: 'completed',
      description: 'Depósito inicial',
      transaction_hash: '0xDemoDeposit1',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx-demo-2',
      user_id: demoUser.id,
      type: 'withdrawal',
      crypto: 'BTC',
      amount: 0.1,
      usd_value: 4200,
      status: 'pending',
      description: 'Retiro solicitado',
      transaction_hash: '0xDemoWithdraw1',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
  affiliated_bank_accounts: [],
  transfer_requests: [],
  otp_codes: [],
  email_send_log: [],
};

const normalizeStore = (value: any) => ({
  ...initialData,
  ...value,
  users: Array.isArray(value?.users) ? value.users : initialData.users,
  profiles: Array.isArray(value?.profiles) ? value.profiles : initialData.profiles,
  transactions: Array.isArray(value?.transactions) ? value.transactions : initialData.transactions,
  user_roles: Array.isArray(value?.user_roles) ? value.user_roles : initialData.user_roles,
  affiliated_bank_accounts: Array.isArray(value?.affiliated_bank_accounts) ? value.affiliated_bank_accounts : initialData.affiliated_bank_accounts,
  transfer_requests: Array.isArray(value?.transfer_requests) ? value.transfer_requests : initialData.transfer_requests,
  otp_codes: Array.isArray(value?.otp_codes) ? value.otp_codes : initialData.otp_codes,
  email_send_log: Array.isArray(value?.email_send_log) ? value.email_send_log : initialData.email_send_log,
});

const getStore = () => {
  if (typeof window === 'undefined') return initialData;

  const raw = localStorage.getItem(STORAGE_KEY);
  const backup = localStorage.getItem(BACKUP_KEY);
  const candidate = raw || backup;

  if (!candidate) {
    const fresh = structuredClone(initialData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    localStorage.setItem(BACKUP_KEY, JSON.stringify(fresh));
    return fresh;
  }

  try {
    const parsed = JSON.parse(candidate);
    const normalized = normalizeStore(parsed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    localStorage.setItem(BACKUP_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    const fallback = backup ? JSON.parse(backup) : initialData;
    const normalized = normalizeStore(fallback);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    localStorage.setItem(BACKUP_KEY, JSON.stringify(normalized));
    return normalized;
  }
};

const persistStore = (store: any) => {
  if (typeof window === 'undefined') return;
  const normalized = normalizeStore(store);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  localStorage.setItem(BACKUP_KEY, JSON.stringify(normalized));
};

const getSession = () => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

const setSession = (session: any) => {
  if (typeof window === 'undefined') return;
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

const authListeners = new Set<(event: string, session: any) => void>();

const notifyAuthListeners = (event: string, session: any) => {
  authListeners.forEach((listener) => listener(event, session));
};

const selectFields = (row: any, fields: string | string[] | undefined) => {
  if (!fields || fields === '*') return row;
  const names = Array.isArray(fields) ? fields : String(fields).split(',').map((item) => item.trim()).filter(Boolean);
  if (!names.length) return row;

  const result: any = {};
  names.forEach((name) => {
    if (name in row) result[name] = row[name];
  });
  return result;
};

const applySimpleQuery = (rows: any[], filters: Array<{ column: string; value: any }>, order?: { column: string; ascending: boolean }, limit?: number, fields?: string | string[]) => {
  let filtered = [...rows];

  filters.forEach(({ column, value }) => {
    filtered = filtered.filter((row) => row?.[column] === value);
  });

  if (order) {
    filtered = [...filtered].sort((a, b) => {
      const av = a?.[order.column];
      const bv = b?.[order.column];
      const result = av > bv ? 1 : av < bv ? -1 : 0;
      return order.ascending ? result : -result;
    });
  }

  if (typeof limit === 'number') {
    filtered = filtered.slice(0, limit);
  }

  if (fields) {
    filtered = filtered.map((row) => selectFields(row, fields));
  }

  return filtered;
};

const ensureUserRecord = (user: any) => {
  const store = getStore();
  const existing = store.users.find((item: any) => item.email.toLowerCase() === user.email.toLowerCase());
  if (existing) return existing;

  const newUser = {
    id: user.id || crypto.randomUUID(),
    email: user.email,
    password: user.password || 'demo-pass',
    full_name: user.full_name || user.email.split('@')[0],
    phone: user.phone || '',
    nationality: user.nationality || '',
    country: user.country || '',
    full_address: user.full_address || '',
    birth_date: user.birth_date || null,
    proof_of_address_type: user.proof_of_address_type || '',
    id_document_type: user.id_document_type || '',
    account_type: user.account_type || 'personal',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.users.push(newUser);
  store.user_roles.push({ id: crypto.randomUUID(), user_id: newUser.id, role: 'user' });
  store.profiles.push({
    user_id: newUser.id,
    email: newUser.email,
    full_name: newUser.full_name,
    phone: newUser.phone,
    nationality: newUser.nationality,
    country: newUser.country,
    full_address: newUser.full_address,
    birth_date: newUser.birth_date,
    proof_of_address_type: newUser.proof_of_address_type,
    id_document_type: newUser.id_document_type,
    account_type: newUser.account_type,
    is_activated: false,
    show_activation_modal: true,
    skip_login_otp: false,
    status: 'pending',
    usd: 0,
    btc: 0,
    eth: 0,
    usdt: 0,
    bnb: 0,
    ltc: 0,
    fatca_amount: 1521,
    show_fatca: false,
    show_custom_notification: false,
    custom_notification_title: null,
    custom_notification_message: null,
    custom_notification_amount: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    account_number: null,
    routing_number: null,
    usdt_address: null,
    verification_status: 'pending',
    verification_notes: null,
    id_document_number: null,
    proof_of_address_url: null,
    selfie_url: null,
  });
  persistStore(store);
  return newUser;
};

const buildQuery = (table: string) => {
  const state: any = {
    table,
    filters: [],
    order: null,
    limit: undefined,
    fields: undefined,
    action: 'select',
    values: null,
    single: false,
  };

  const execute = () => {
    const store = getStore();
    const rows = (store as any)[table] || [];

    let result = applySimpleQuery(rows, state.filters, state.order, state.limit, state.fields);

    if (state.action === 'update') {
      const updatedRows = rows.map((row: any) => {
        if (state.filters.some(({ column, value }) => row?.[column] === value)) {
          return { ...row, ...state.values };
        }
        return row;
      });
      const nextStore = { ...store, [table]: updatedRows };
      persistStore(nextStore);
      result = applySimpleQuery(updatedRows, state.filters, state.order, state.limit, state.fields);
    }

    if (state.action === 'delete') {
      const remaining = rows.filter((row: any) => !state.filters.some(({ column, value }) => row?.[column] === value));
      persistStore({ ...store, [table]: remaining });
      result = [];
    }

    if (state.action === 'insert') {
      const valueList = Array.isArray(state.values) ? state.values : [state.values];
      const inserted = valueList.map((item: any) => ({ ...item, id: item.id || crypto.randomUUID(), created_at: item.created_at || new Date().toISOString(), updated_at: new Date().toISOString() }));
      const nextStore = { ...store, [table]: [...rows, ...inserted] };
      persistStore(nextStore);
      result = inserted;
    }

    if (state.action === 'upsert') {
      const valueList = Array.isArray(state.values) ? state.values : [state.values];
      const nextRows = [...rows];
      valueList.forEach((item: any) => {
        const idx = nextRows.findIndex((row: any) => row.id === item.id || row.user_id === item.user_id);
        if (idx >= 0) {
          nextRows[idx] = { ...nextRows[idx], ...item, updated_at: new Date().toISOString() };
        } else {
          nextRows.push({ ...item, id: item.id || crypto.randomUUID(), created_at: item.created_at || new Date().toISOString(), updated_at: new Date().toISOString() });
        }
      });
      persistStore({ ...store, [table]: nextRows });
      result = valueList;
    }

    if (state.single) {
      return { data: result[0] ?? null, error: null };
    }

    return { data: result, error: null };
  };

  const api: any = {
    select(fields: string | string[]) {
      state.fields = fields;
      state.action = 'select';
      return api;
    },
    eq(column: string, value: any) {
      state.filters.push({ column, value });
      return api;
    },
    order(column: string, options?: { ascending?: boolean }) {
      state.order = { column, ascending: options?.ascending ?? true };
      return api;
    },
    limit(value: number) {
      state.limit = value;
      return api;
    },
    update(values: Record<string, any>) {
      state.action = 'update';
      state.values = values;
      return api;
    },
    insert(values: Record<string, any> | Record<string, any>[]) {
      state.action = 'insert';
      state.values = values;
      return api;
    },
    upsert(values: Record<string, any> | Record<string, any>[]) {
      state.action = 'upsert';
      state.values = values;
      return api;
    },
    delete() {
      state.action = 'delete';
      return api;
    },
    maybeSingle() {
      state.single = true;
      return Promise.resolve(execute());
    },
    single() {
      state.single = true;
      return Promise.resolve(execute());
    },
    then(resolve: any, reject?: any) {
      return Promise.resolve(execute()).then(resolve, reject);
    },
  };

  return api;
};

const storageFrom = (bucket: string) => ({
  upload: async (path: string, file: File | Blob | string, options?: { upsert?: boolean }) => {
    const body = typeof file === 'string' ? file : file instanceof Blob ? await file.arrayBuffer() : await file.arrayBuffer();
    const content = typeof body === 'string' ? body : Array.from(new Uint8Array(body)).map((b) => String.fromCharCode(b)).join('');
    const key = `${bucket}:${path}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify({ bucket, path, content, upsert: options?.upsert ?? false }));
    }
    return { data: { path }, error: null };
  },
  getPublicUrl: (path: string) => ({
    data: { publicUrl: `https://local.demo/${bucket}/${path}` },
    error: null,
  }),
  remove: async (paths: string[]) => ({ data: paths, error: null }),
});

const invokeFunction = async (name: string, payload?: any) => {
  const store = getStore();

  if (name === 'get-all-profiles') {
    return {
      data: { profiles: store.profiles },
      error: null,
    };
  }

  if (name === 'update-user-balance') {
    const { userId, balances, activation, status, bank_account_review, transfer_request_review, transaction } = payload?.body || {};
    const profileIndex = store.profiles.findIndex((row: any) => row.user_id === userId);

    if (profileIndex >= 0) {
      const profile = { ...store.profiles[profileIndex] };
      if (balances) {
        Object.assign(profile, balances);
      }
      if (activation) {
        Object.assign(profile, activation);
      }
      if (status) {
        profile.status = status;
      }
      if (transaction) {
        const tx = { ...transaction, id: crypto.randomUUID(), user_id: userId, created_at: transaction.created_at || new Date().toISOString() };
        store.transactions.push(tx);
      }
      store.profiles[profileIndex] = { ...profile, updated_at: new Date().toISOString() };
      persistStore(store);
    }

    return { data: { success: true }, error: null };
  }

  if (name === 'check-trusted-device') {
    const storedToken = localStorage.getItem(DEVICE_TOKEN_KEY);
    const deviceToken = payload?.body?.deviceToken;
    return { data: { trusted: !!storedToken && storedToken === deviceToken }, error: null };
  }

  if (name === 'register-trusted-device') {
    const token = crypto.randomUUID();
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
    return { data: { deviceToken: token }, error: null };
  }

  if (name === 'send-otp') {
    const email = (payload?.body?.email || '').toLowerCase();
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const now = new Date().toISOString();
    const next = { id: crypto.randomUUID(), code, email, created_at: now, expires_at: new Date(Date.now() + 300000).toISOString(), type: payload?.body?.type || 'login', used: false };
    store.otp_codes = store.otp_codes.filter((item: any) => item.email !== email);
    store.otp_codes.push(next);
    persistStore(store);
    return { data: { success: true, code }, error: null };
  }

  if (name === 'verify-otp' || name === 'verify-login-otp') {
    const email = (payload?.body?.email || '').toLowerCase();
    const code = String(payload?.body?.code || '');
    const item = (store.otp_codes || []).find((entry: any) => entry.email === email && entry.code === code && !entry.used);
    if (!item) {
      return { data: { success: false, error: 'Código inválido o expirado.' }, error: null };
    }
    item.used = true;
    persistStore(store);
    return { data: { success: true }, error: null };
  }

  if (name === 'send-welcome-email' || name === 'send-document-email' || name === 'reset-password-with-otp') {
    return { data: { success: true }, error: null };
  }

  if (name === 'send-smtp-email' || name === 'auth-email-hook') {
    return { data: { success: true }, error: null };
  }

  return { data: { success: true }, error: null };
};

export const supabase = {
  auth: {
    async getUser() {
      const session = getSession();
      if (!session?.user) return { data: { user: null }, error: null };
      const store = getStore();
      const user = store.users.find((item: any) => item.id === session.user.id || item.email === session.user.email);
      return { data: { user: user ? { ...user, user_metadata: { full_name: user.full_name } } : null }, error: null };
    },
    async getSession() {
      return { data: { session: getSession() }, error: null };
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const user = getStore().users.find((item: any) => item.email.toLowerCase() === email.toLowerCase() && item.password === password);
      if (!user) {
        return { data: { user: null }, error: { message: 'Invalid login credentials' } };
      }

      const session = {
        access_token: `demo-access-${user.id}`,
        refresh_token: `demo-refresh-${user.id}`,
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: user.id, email: user.email, created_at: user.created_at, user_metadata: { full_name: user.full_name } },
      };

      setSession(session);
      notifyAuthListeners('SIGNED_IN', session);
      return { data: { user: session.user }, error: null };
    },
    async signUp({ email, password, options }: { email: string; password: string; options?: { data?: Record<string, any> } }) {
      const normalizedEmail = email.toLowerCase();
      const store = getStore();
      const existing = store.users.find((item: any) => item.email.toLowerCase() === normalizedEmail);
      if (existing) {
        return { data: { user: null }, error: { message: 'User already registered' } };
      }

      const newUser = {
        id: crypto.randomUUID(),
        email: normalizedEmail,
        password,
        full_name: options?.data?.full_name || normalizedEmail.split('@')[0],
        phone: options?.data?.phone || '',
        nationality: options?.data?.nationality || '',
        country: options?.data?.country || '',
        full_address: options?.data?.full_address || '',
        birth_date: options?.data?.birth_date || '',
        proof_of_address_type: options?.data?.proof_of_address_type || '',
        id_document_type: options?.data?.id_document_type || '',
        account_type: options?.data?.account_type || 'personal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const nextStore = {
        ...store,
        users: [...store.users, newUser],
        user_roles: [...store.user_roles, { id: crypto.randomUUID(), user_id: newUser.id, role: 'user' }],
        profiles: [...store.profiles, {
          user_id: newUser.id,
          email: normalizedEmail,
          full_name: newUser.full_name,
          phone: newUser.phone,
          nationality: newUser.nationality,
          country: newUser.country,
          full_address: newUser.full_address,
          birth_date: newUser.birth_date,
          proof_of_address_type: newUser.proof_of_address_type,
          id_document_type: newUser.id_document_type,
          account_type: newUser.account_type,
          is_activated: false,
          show_activation_modal: true,
          skip_login_otp: false,
          status: 'pending',
          usd: 0,
          btc: 0,
          eth: 0,
          usdt: 0,
          bnb: 0,
          ltc: 0,
          fatca_amount: 1521,
          show_fatca: false,
          show_custom_notification: false,
          custom_notification_title: null,
          custom_notification_message: null,
          custom_notification_amount: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          account_number: null,
          routing_number: null,
          usdt_address: null,
          verification_status: 'pending',
          verification_notes: null,
          id_document_number: null,
          proof_of_address_url: null,
          selfie_url: null,
        }],
      };
      persistStore(nextStore);

      return { data: { user: { id: newUser.id, email: normalizedEmail, created_at: newUser.created_at, user_metadata: { full_name: newUser.full_name } } }, error: null };
    },
    async signOut() {
      setSession(null);
      notifyAuthListeners('SIGNED_OUT', null);
      return { error: null };
    },
    async resetPasswordForEmail(email: string) {
      return { data: { }, error: null };
    },
    async updateUser(payload: { password?: string; email?: string; data?: Record<string, any> }) {
      const session = getSession();
      if (!session?.user) return { data: { user: null }, error: null };
      const store = getStore();
      const idx = store.users.findIndex((item: any) => item.id === session.user.id);
      if (idx >= 0) {
        store.users[idx] = { ...store.users[idx], ...payload.data, password: payload.password || store.users[idx].password, email: payload.email || store.users[idx].email, updated_at: new Date().toISOString() };
        persistStore(store);
      }
      return { data: { user: session.user }, error: null };
    },
    onAuthStateChange(callback: (event: string, session: any) => void) {
      authListeners.add(callback);
      const session = getSession();
      if (session) {
        callback('SIGNED_IN', session);
      }
      return { data: { subscription: { unsubscribe: () => authListeners.delete(callback) } } };
    },
  },
  from: (table: string) => buildQuery(table),
  storage: {
    from: (bucket: string) => storageFrom(bucket),
  },
  functions: {
    invoke: invokeFunction,
  },
  channel: (name: string) => ({
    on: () => ({ subscribe: () => ({ unsubscribe: () => undefined }) }),
    subscribe: () => ({ unsubscribe: () => undefined }),
  }),
  removeChannel: () => undefined,
};

export type SupabaseClient = typeof supabase;