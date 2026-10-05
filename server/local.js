import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.LOCAL_API_PORT || 10000);
const host = '127.0.0.1';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const dataFile = path.join(dataDir, 'local-db.json');
const distDir = path.join(rootDir, 'dist');
const allowedTables = new Set(['profiles', 'user_roles', 'transactions', 'transfer_requests', 'affiliated_bank_accounts']);
const now = () => new Date().toISOString();
const json = (res, status, body) => res.status(status).json(body);

app.disable('x-powered-by');
app.use(express.json({ limit: '20mb' }));

const safeEqual = (a, b) => {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};
const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => ({
  salt,
  hash: crypto.scryptSync(password, salt, 64).toString('hex'),
});
const appUser = (user) => ({
  id: user.id,
  email: user.email,
  created_at: user.created_at,
  user_metadata: { full_name: user.full_name },
});

let store;
let saveQueue = Promise.resolve();
const saveStore = () => {
  saveQueue = saveQueue.then(async () => {
    await fs.mkdir(dataDir, { recursive: true });
    const tempPath = `${dataFile}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(store, null, 2), 'utf8');
    await fs.rename(tempPath, dataFile);
  });
  return saveQueue;
};

const findRecord = (table, row) => store.records.find((item) => item.table === table && item.data.id === row.id);
const saveRecord = (table, input, ownerId) => {
  const record = { ...(input || {}) };
  record.user_id = record.user_id || ownerId;
  record.id = String(record.id || (table === 'profiles' ? record.user_id : crypto.randomUUID()));
  const existing = store.records.find((item) => item.table === table && (item.data.id === record.id || (table === 'profiles' && item.data.user_id === record.user_id)));
  if (existing) {
    record.id = existing.data.id;
    record.created_at = existing.data.created_at || record.created_at || now();
    Object.assign(existing.data, record, { updated_at: now() });
    existing.ownerId = String(existing.data.user_id || ownerId || '');
    return existing.data;
  }
  record.created_at = record.created_at || now();
  record.updated_at = now();
  store.records.push({ table, ownerId: String(record.user_id || ownerId || ''), data: record });
  return record;
};

const signToken = (user) => {
  const payload = Buffer.from(JSON.stringify({ sub: user.id, exp: Date.now() + 7 * 86400000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', store.tokenSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
};
const getUser = (req) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = crypto.createHmac('sha256', store.tokenSecret).update(payload).digest('base64url');
  if (!safeEqual(signature, expected)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded.exp < Date.now()) return null;
    return store.users.find((user) => user.id === decoded.sub) || null;
  } catch {
    return null;
  }
};
const requireUser = (req, res, next) => {
  const user = getUser(req);
  if (!user) return json(res, 401, { error: 'Sesión no válida. Inicia sesión de nuevo.' });
  req.user = user;
  next();
};
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return json(res, 403, { error: 'Acceso solo para administradores.' });
  next();
};

async function initializeStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    store = JSON.parse(await fs.readFile(dataFile, 'utf8'));
  } catch {
    store = { tokenSecret: crypto.randomBytes(48).toString('hex'), users: [], records: [], documents: [] };
  }
  store.tokenSecret ||= crypto.randomBytes(48).toString('hex');
  store.users ||= [];
  store.records ||= [];
  store.documents ||= [];

  const adminEmail = String(process.env.LOCAL_ADMIN_EMAIL || 'admin@quantumledger.local').trim().toLowerCase();
  const adminPassword = process.env.LOCAL_ADMIN_PASSWORD || 'Admin123!';
  let admin = store.users.find((user) => user.email === adminEmail);
  if (!admin) {
    const credentials = hashPassword(adminPassword);
    admin = { id: crypto.randomUUID(), email: adminEmail, full_name: 'Administrador local', ...credentials, role: 'admin', created_at: now() };
    store.users.push(admin);
    saveRecord('user_roles', { id: crypto.randomUUID(), user_id: admin.id, role: 'admin' }, admin.id);
    saveRecord('profiles', { id: admin.id, user_id: admin.id, email: admin.email, full_name: admin.full_name, status: 'active', verification_status: 'approved' }, admin.id);
  }
  await saveStore();
}

app.get('/api/health', (_req, res) => json(res, 200, { ok: true, storage: 'local-file' }));

app.post('/api/auth/signup', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = req.body?.password;
  const metadata = req.body?.options?.data || {};
  if (!/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string' || password.length < 8) return json(res, 400, { error: 'Correo o contraseña inválidos. La contraseña debe tener al menos 8 caracteres.' });
  if (store.users.some((user) => user.email === email)) return json(res, 409, { error: 'Este correo ya está registrado.' });

  const id = crypto.randomUUID();
  const fullName = String(metadata.full_name || email.split('@')[0]).slice(0, 160);
  const credentials = hashPassword(password);
  const user = { id, email, full_name: fullName, ...credentials, role: 'user', created_at: now() };
  store.users.push(user);
  saveRecord('user_roles', { id: crypto.randomUUID(), user_id: id, role: 'user' }, id);
  saveRecord('profiles', {
    id, user_id: id, email, full_name: fullName,
    phone: String(metadata.phone || ''), nationality: String(metadata.nationality || ''),
    country: String(metadata.country || ''), full_address: String(metadata.full_address || ''),
    birth_date: metadata.birth_date || null,
    proof_of_address_type: String(metadata.proof_of_address_type || ''),
    id_document_type: String(metadata.id_document_type || ''),
    account_type: String(metadata.account_type || 'personal'),
    status: 'pending', verification_status: 'pending', is_activated: false,
    show_activation_modal: true, usd: 0, btc: 0, eth: 0, usdt: 0, bnb: 0, ltc: 0,
  }, id);
  await saveStore();
  const token = signToken(user);
  json(res, 201, { user: appUser(user), session: { access_token: token, refresh_token: token, expires_in: 604800, expires_at: Math.floor(Date.now() / 1000) + 604800 } });
});

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = req.body?.password;
  const user = store.users.find((entry) => entry.email === email);
  if (!user || typeof password !== 'string' || !safeEqual(hashPassword(password, user.salt).hash, user.hash)) return json(res, 401, { error: 'Invalid login credentials' });
  const token = signToken(user);
  json(res, 200, { user: appUser(user), session: { access_token: token, refresh_token: token, expires_in: 604800, expires_at: Math.floor(Date.now() / 1000) + 604800 } });
});

app.get('/api/auth/me', requireUser, (req, res) => json(res, 200, { user: appUser(req.user) }));

app.post('/api/data/query', requireUser, async (req, res) => {
  const { table, action = 'select', filters = [], order, limit, fields, values, single } = req.body || {};
  if (!allowedTables.has(table)) return json(res, 400, { error: 'Tabla no permitida.' });
  if (!['select', 'insert', 'upsert', 'update', 'delete'].includes(action)) return json(res, 400, { error: 'Operación no permitida.' });
  const isAdmin = req.user.role === 'admin';
  const matching = (row) => filters.every(({ column, value }) => row?.[column] === value);
  let records = store.records.filter((item) => item.table === table && (isAdmin || item.ownerId === req.user.id));
  let rows = records.map((item) => item.data).filter(matching);
  if (order?.column) rows.sort((a, b) => (a[order.column] > b[order.column] ? 1 : a[order.column] < b[order.column] ? -1 : 0) * (order.ascending === false ? -1 : 1));
  if (Number.isInteger(limit) && limit >= 0) rows = rows.slice(0, limit);

  if (action === 'insert' || action === 'upsert') {
    const input = Array.isArray(values) ? values : [values];
    if (!isAdmin && input.some((row) => row?.user_id && row.user_id !== req.user.id)) return json(res, 403, { error: 'No puedes crear datos para otro usuario.' });
    if (!isAdmin && table === 'transactions') return json(res, 403, { error: 'Solo un administrador puede registrar transacciones.' });
    rows = input.map((item) => {
      const record = { ...(item || {}) };
      if (table !== 'user_roles') record.user_id = record.user_id || req.user.id;
      if (!isAdmin && table === 'user_roles') record.role = 'user';
      if (!isAdmin && table === 'affiliated_bank_accounts') record.is_verified = false;
      if (!isAdmin && table === 'transfer_requests') record.status = 'pending';
      if (!isAdmin && table === 'profiles') {
        const allowed = new Set(['full_name', 'phone', 'nationality', 'country', 'full_address', 'birth_date', 'proof_of_address_type', 'id_document_type', 'account_type', 'id_document_number', 'proof_of_address_url', 'id_document_url', 'selfie_url', 'verification_submitted_at', 'verification_status']);
        for (const key of Object.keys(record)) if (!['user_id', 'email', 'id', 'created_at', 'updated_at', ...allowed].includes(key)) delete record[key];
        if (record.verification_status && !['pending', 'submitted'].includes(record.verification_status)) record.verification_status = 'pending';
        record.user_id = req.user.id;
        record.email = req.user.email;
        record.id = req.user.id;
      }
      return saveRecord(table, record, req.user.id);
    });
    await saveStore();
  } else if (action === 'update') {
    if (!isAdmin && !['profiles', 'affiliated_bank_accounts'].includes(table)) return json(res, 403, { error: 'No tienes permiso para modificar estos datos.' });
    const patch = { ...(values || {}) };
    if (!isAdmin && table === 'affiliated_bank_accounts') {
      const allowed = new Set(['bank_name', 'account_number', 'account_holder_name', 'id_number', 'phone', 'address', 'country']);
      for (const key of Object.keys(patch)) if (!allowed.has(key)) delete patch[key];
    }
    if (!isAdmin && table === 'profiles') {
      const allowed = new Set(['full_name', 'phone', 'nationality', 'country', 'full_address', 'birth_date', 'proof_of_address_type', 'id_document_type', 'id_document_number', 'proof_of_address_url', 'id_document_url', 'selfie_url', 'verification_submitted_at', 'verification_status']);
      for (const key of Object.keys(patch)) if (!allowed.has(key)) delete patch[key];
      if (patch.verification_status && !['pending', 'submitted'].includes(patch.verification_status)) delete patch.verification_status;
    }
    rows = records.map((item) => item.data).filter(matching).map((row) => saveRecord(table, { ...row, ...patch }, req.user.id));
    await saveStore();
  } else if (action === 'delete') {
    if (!isAdmin) return json(res, 403, { error: 'Solo un administrador puede eliminar datos.' });
    const ids = new Set(rows.map((row) => String(row.id || row.user_id)));
    store.records = store.records.filter((item) => item.table !== table || !ids.has(String(item.data.id || item.data.user_id)));
    rows = [];
    await saveStore();
  }

  if (fields && fields !== '*') {
    const selected = Array.isArray(fields) ? fields : String(fields).split(',').map((field) => field.trim()).filter(Boolean);
    rows = rows.map((row) => Object.fromEntries(selected.filter((field) => field in row).map((field) => [field, row[field]])));
  }
  json(res, 200, { data: single ? (rows[0] || null) : rows, error: null });
});

app.post('/api/functions/:name', requireUser, async (req, res) => {
  const { name } = req.params;
  const body = req.body?.body || req.body || {};
  if (name === 'get-all-profiles') {
    if (req.user.role !== 'admin') return json(res, 403, { error: 'Acceso solo para administradores.' });
    const profiles = store.records
      .filter((item) => item.table === 'profiles')
      .map((item) => ({ ...item.data, role: store.users.find((user) => user.id === item.data.user_id)?.role || 'user' }))
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    return json(res, 200, { profiles });
  }
  if (name === 'update-user-balance') {
    if (req.user.role !== 'admin') return json(res, 403, { error: 'Acceso solo para administradores.' });
    const profile = store.records.find((item) => item.table === 'profiles' && item.data.user_id === String(body.userId))?.data;
    if (!profile) return json(res, 404, { error: 'Usuario no encontrado.' });
    const patch = { ...(body.balances || {}), ...(body.activation || {}) };
    for (const key of ['status', 'country', 'verification_status', 'verification_notes', 'verification_reviewed_at']) if (body[key] !== undefined) patch[key] = body[key];
    if (body.transfer_request_review?.status === 'approved' && Number(body.transfer_request_review.amount) > 0) {
      const currency = String(body.transfer_request_review.currency || 'usd').toLowerCase();
      const column = ['btc', 'eth', 'bnb', 'usdt', 'ltc', 'usd'].includes(currency) ? currency : 'usd';
      patch[column] = Math.max(0, Number(profile[column] || 0) - Number(body.transfer_request_review.amount));
    }
    if (body.transaction) saveRecord('transactions', { ...body.transaction, id: crypto.randomUUID(), user_id: String(body.userId) }, String(body.userId));
    Object.assign(profile, patch, { updated_at: now() });
    await saveStore();
    return json(res, 200, { success: true, profile });
  }
  if (name === 'check-trusted-device') return json(res, 200, { trusted: false });
  if (name === 'register-trusted-device') return json(res, 200, { deviceToken: crypto.randomBytes(32).toString('hex') });
  return json(res, 501, { error: `La función ${name} no está disponible en modo local.` });
});

app.post('/api/storage/upload', requireUser, async (req, res) => {
  const { bucket, path: objectPath, contentType = 'application/octet-stream', content } = req.body || {};
  if (bucket !== 'identity-documents' || typeof objectPath !== 'string' || !objectPath.startsWith(`${req.user.id}/`) || typeof content !== 'string') return json(res, 400, { error: 'Ruta o archivo no permitido.' });
  const existing = store.documents.find((item) => item.bucket === bucket && item.path === objectPath);
  const document = { bucket, path: objectPath, ownerId: req.user.id, contentType, content, updatedAt: now() };
  if (existing) Object.assign(existing, document);
  else store.documents.push(document);
  await saveStore();
  json(res, 200, { data: { path: objectPath }, error: null });
});

app.post('/api/storage/signed-url', requireUser, (req, res) => {
  const { bucket, path: objectPath, expiresIn = 3600 } = req.body || {};
  const doc = store.documents.find((item) => item.bucket === bucket && item.path === objectPath);
  if (!doc || (req.user.role !== 'admin' && doc.ownerId !== req.user.id)) return json(res, 404, { error: 'Documento no encontrado.' });
  const expires = Date.now() + Math.min(Number(expiresIn) || 3600, 3600) * 1000;
  const value = `${bucket}\n${objectPath}\n${expires}`;
  const signature = crypto.createHmac('sha256', store.tokenSecret).update(value).digest('base64url');
  json(res, 200, { signedUrl: `/api/storage/view?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(objectPath)}&expires=${expires}&sig=${signature}` });
});
app.get('/api/storage/view', (req, res) => {
  const { bucket, path: objectPath, expires, sig } = req.query;
  const expected = crypto.createHmac('sha256', store.tokenSecret).update(`${bucket}\n${objectPath}\n${expires}`).digest('base64url');
  if (!expires || Number(expires) < Date.now() || !safeEqual(sig, expected)) return json(res, 403, { error: 'Enlace expirado o inválido.' });
  const doc = store.documents.find((item) => item.bucket === bucket && item.path === objectPath);
  if (!doc) return json(res, 404, { error: 'Documento no encontrado.' });
  res.setHeader('Content-Type', doc.contentType);
  res.setHeader('Content-Disposition', 'inline');
  res.send(Buffer.from(doc.content, 'base64'));
});

app.use('/api', (_req, res) => json(res, 404, { error: 'Endpoint API no encontrado.' }));
app.use(express.static(distDir, { index: false, maxAge: '1h' }));
app.get(/.*/, (_req, res) => res.sendFile(path.join(distDir, 'index.html')));

initializeStore()
  .then(() => app.listen(port, host, () => {
    console.info(`Modo local activo: http://${host}:${port}`);
    console.info(`Base de datos local: ${dataFile}`);
    if (!process.env.LOCAL_ADMIN_PASSWORD) console.info('Admin local de prueba: admin@quantumledger.local / Admin123!');
  }))
  .catch((error) => {
    console.error('No se pudo iniciar la base local:', error);
    process.exit(1);
  });
