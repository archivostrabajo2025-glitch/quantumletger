import express from 'express';
import { Pool } from 'pg';
import nodemailer from 'nodemailer';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT || 10000);
const tokenSecret = process.env.APP_TOKEN_SECRET;
const databaseUrl = process.env.DATABASE_URL;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const allowedTables = new Set([
  'profiles',
  'user_roles',
  'transactions',
  'transfer_requests',
  'affiliated_bank_accounts',
]);

if (!databaseUrl) throw new Error('DATABASE_URL must be configured for the Render service.');
if (!tokenSecret || tokenSecret.length < 32) {
  throw new Error('APP_TOKEN_SECRET must be configured with at least 32 characters.');
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

app.disable('x-powered-by');
app.use(express.json({ limit: '20mb' }));

const now = () => new Date().toISOString();
const json = (res, status, body) => res.status(status).json(body);
const safeEqual = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};
const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => ({
  salt,
  hash: crypto.scryptSync(password, salt, 64).toString('hex'),
});
const passwordMatches = (password, user) => {
  const candidate = hashPassword(password, user.password_salt).hash;
  return safeEqual(candidate, user.password_hash);
};
const signToken = (user) => {
  const payload = Buffer.from(JSON.stringify({ sub: user.id, exp: Date.now() + 7 * 86400000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', tokenSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
};
const getTokenUser = async (req) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = crypto.createHmac('sha256', tokenSecret).update(payload).digest('base64url');
  if (!safeEqual(signature, expected)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded.exp < Date.now()) return null;
    const result = await pool.query('SELECT id, email, full_name, role FROM app_users WHERE id = $1', [decoded.sub]);
    return result.rows[0] || null;
  } catch {
    return null;
  }
};
const requireUser = async (req, res, next) => {
  const user = await getTokenUser(req);
  if (!user) return json(res, 401, { error: 'Sesión no válida. Inicia sesión de nuevo.' });
  req.user = user;
  next();
};
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return json(res, 403, { error: 'Acceso solo para administradores.' });
  next();
};
const appUser = (row) => ({
  id: row.id,
  email: row.email,
  created_at: row.created_at,
  user_metadata: { full_name: row.full_name },
});

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_users (
      id uuid PRIMARY KEY,
      email text NOT NULL UNIQUE,
      full_name text NOT NULL,
      password_salt text NOT NULL,
      password_hash text NOT NULL,
      role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS app_records (
      table_name text NOT NULL,
      record_id text NOT NULL,
      user_id text,
      data jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (table_name, record_id)
    );
    CREATE INDEX IF NOT EXISTS app_records_user_idx ON app_records (table_name, user_id);
    CREATE TABLE IF NOT EXISTS password_reset_otps (
      email text PRIMARY KEY,
      code_hash text NOT NULL,
      expires_at timestamptz NOT NULL,
      sent_at timestamptz NOT NULL DEFAULT now(),
      used boolean NOT NULL DEFAULT false
    );
    CREATE TABLE IF NOT EXISTS identity_documents (
      bucket text NOT NULL,
      path text NOT NULL,
      owner_user_id text NOT NULL,
      content_type text NOT NULL,
      content bytea NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (bucket, path)
    );
  `);

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
    const existing = await pool.query('SELECT id FROM app_users WHERE email = $1', [adminEmail]);
    if (!existing.rowCount) {
      const id = crypto.randomUUID();
      const password = hashPassword(adminPassword);
      await pool.query(
        'INSERT INTO app_users (id, email, full_name, password_salt, password_hash, role) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, adminEmail, process.env.ADMIN_NAME || 'Administrador', password.salt, password.hash, 'admin'],
      );
      await saveRecord('user_roles', { id: crypto.randomUUID(), user_id: id, role: 'admin' }, id);
      await saveRecord('profiles', { user_id: id, email: adminEmail, full_name: process.env.ADMIN_NAME || 'Administrador', status: 'active', verification_status: 'approved', created_at: now(), updated_at: now() }, id);
      console.info('Initial admin account created from Render environment variables.');
    }
  }
}

async function saveRecord(table, record, ownerId) {
  const id = String(record.id || record.user_id || crypto.randomUUID());
  const row = { ...record, id: record.id || id, user_id: record.user_id || ownerId };
  const existing = await pool.query('SELECT data FROM app_records WHERE table_name = $1 AND record_id = $2', [table, id]);
  const prior = existing.rows[0]?.data || {};
  const merged = { ...prior, ...row, created_at: prior.created_at || row.created_at || now(), updated_at: now() };
  await pool.query(
    `INSERT INTO app_records (table_name, record_id, user_id, data, created_at, updated_at)
     VALUES ($1, $2, $3, $4::jsonb, COALESCE(($4::jsonb->>'created_at')::timestamptz, now()), now())
     ON CONFLICT (table_name, record_id) DO UPDATE SET user_id = EXCLUDED.user_id, data = EXCLUDED.data, updated_at = now()`,
    [table, id, String(merged.user_id || ownerId || ''), JSON.stringify(merged)],
  );
  return merged;
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    json(res, 200, { ok: true });
  } catch {
    json(res, 503, { ok: false });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  const { email: rawEmail, password, options = {} } = req.body || {};
  const email = String(rawEmail || '').trim().toLowerCase();
  const metadata = options.data || {};
  if (!email || !/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string' || password.length < 8) {
    return json(res, 400, { error: 'Correo o contraseña inválidos. La contraseña debe tener al menos 8 caracteres.' });
  }
  try {
    const id = crypto.randomUUID();
    const fullName = String(metadata.full_name || email.split('@')[0]).slice(0, 160);
    const credentials = hashPassword(password);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await client.query(
        'INSERT INTO app_users (id, email, full_name, password_salt, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role, created_at',
        [id, email, fullName, credentials.salt, credentials.hash],
      );
      const profile = {
        id, user_id: id, email, full_name: fullName,
        phone: String(metadata.phone || ''), nationality: String(metadata.nationality || ''),
        country: String(metadata.country || ''), full_address: String(metadata.full_address || ''),
        birth_date: metadata.birth_date || null,
        proof_of_address_type: String(metadata.proof_of_address_type || ''),
        id_document_type: String(metadata.id_document_type || ''),
        account_type: String(metadata.account_type || 'personal'),
        status: 'pending', verification_status: 'pending',
        created_at: now(), updated_at: now(), is_activated: false, show_activation_modal: true,
        usd: 0, btc: 0, eth: 0, usdt: 0, bnb: 0, ltc: 0,
      };
      await client.query(
        `INSERT INTO app_records (table_name, record_id, user_id, data)
         VALUES ('profiles', $1, $1, $2::jsonb), ('user_roles', $1, $1, $3::jsonb)`,
        [id, JSON.stringify(profile), JSON.stringify({ id: crypto.randomUUID(), user_id: id, role: 'user' })],
      );
      await client.query('COMMIT');
      const user = inserted.rows[0];
      const token = signToken(user);
      json(res, 201, { user: appUser(user), session: { access_token: token, refresh_token: token, expires_in: 604800, expires_at: Math.floor(Date.now() / 1000) + 604800 } });
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23505') return json(res, 409, { error: 'Este correo ya está registrado.' });
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Signup failed:', error);
    json(res, 500, { error: 'No se pudo crear la cuenta.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = req.body?.password;
  const result = await pool.query('SELECT id, email, full_name, password_salt, password_hash, role, created_at FROM app_users WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user || typeof password !== 'string' || !passwordMatches(password, user)) {
    return json(res, 401, { error: 'Invalid login credentials' });
  }
  const token = signToken(user);
  json(res, 200, { user: appUser(user), session: { access_token: token, refresh_token: token, expires_in: 604800, expires_at: Math.floor(Date.now() / 1000) + 604800 } });
});

app.get('/api/auth/me', requireUser, async (req, res) => json(res, 200, { user: appUser(req.user) }));

app.post('/api/auth/password-reset/request', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return json(res, 400, { error: 'Ingresa un correo válido.' });
  const user = await pool.query('SELECT id FROM app_users WHERE email = $1', [email]);
  if (!user.rowCount) return json(res, 200, { success: true });

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM;
  if (!smtpHost || !smtpUser || !smtpPassword || !smtpFrom) {
    return json(res, 503, { error: 'La recuperación de contraseña no está configurada. Añade SMTP_HOST, SMTP_USER, SMTP_PASSWORD y SMTP_FROM en Render.' });
  }

  const previous = await pool.query('SELECT sent_at FROM password_reset_otps WHERE email = $1 AND used = false', [email]);
  if (previous.rowCount && Date.now() - new Date(previous.rows[0].sent_at).getTime() < 60000) {
    return json(res, 429, { error: 'Espera un minuto antes de solicitar otro código.' });
  }
  const code = String(crypto.randomInt(100000, 1000000));
  const codeHash = crypto.createHmac('sha256', tokenSecret).update(`${email}:${code}`).digest('hex');
  await pool.query(
    `INSERT INTO password_reset_otps (email, code_hash, expires_at, sent_at, used)
     VALUES ($1, $2, now() + interval '10 minutes', now(), false)
     ON CONFLICT (email) DO UPDATE SET code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at, sent_at = now(), used = false`,
    [email, codeHash],
  );
  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: smtpUser, pass: smtpPassword },
    });
    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: 'Código para restablecer tu contraseña',
      text: `Tu código de restablecimiento es ${code}. Caduca en 10 minutos.`,
      html: `<p>Tu código de restablecimiento es:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>Caduca en 10 minutos. Si no solicitaste este cambio, ignora este mensaje.</p>`,
    });
    json(res, 200, { success: true });
  } catch (error) {
    console.error('Password-reset email failed:', error);
    await pool.query('UPDATE password_reset_otps SET used = true WHERE email = $1', [email]);
    json(res, 502, { error: 'No se pudo enviar el correo. Revisa la configuración SMTP de Render.' });
  }
});

app.post('/api/auth/password-reset/confirm', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const code = String(req.body?.code || '');
  const password = req.body?.newPassword;
  if (!/^\S+@\S+\.\S+$/.test(email) || !/^\d{6}$/.test(code) || typeof password !== 'string' || password.length < 8) {
    return json(res, 400, { success: false, error: 'Los datos no son válidos. La contraseña debe tener al menos 8 caracteres.' });
  }
  const result = await pool.query('SELECT code_hash, expires_at, used FROM password_reset_otps WHERE email = $1', [email]);
  const otp = result.rows[0];
  const candidate = crypto.createHmac('sha256', tokenSecret).update(`${email}:${code}`).digest('hex');
  if (!otp || otp.used || new Date(otp.expires_at).getTime() < Date.now() || !safeEqual(candidate, otp.code_hash)) {
    return json(res, 400, { success: false, error: 'El código es inválido o ha caducado.' });
  }
  const userResult = await pool.query('SELECT id FROM app_users WHERE email = $1', [email]);
  if (!userResult.rowCount) return json(res, 400, { success: false, error: 'Usuario no encontrado.' });
  const credentials = hashPassword(password);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE app_users SET password_salt = $1, password_hash = $2 WHERE email = $3', [credentials.salt, credentials.hash, email]);
    await client.query('UPDATE password_reset_otps SET used = true WHERE email = $1', [email]);
    await client.query('COMMIT');
    json(res, 200, { success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Password reset failed:', error);
    json(res, 500, { success: false, error: 'No se pudo actualizar la contraseña.' });
  } finally {
    client.release();
  }
});

app.post('/api/data/query', requireUser, async (req, res) => {
  const { table, action = 'select', filters = [], order, limit, fields, values, single } = req.body || {};
  if (!allowedTables.has(table)) return json(res, 400, { error: 'Tabla no permitida.' });
  if (!['select', 'insert', 'upsert', 'update', 'delete'].includes(action)) return json(res, 400, { error: 'Operación no permitida.' });
  const isAdmin = req.user.role === 'admin';
  const whereMatches = (row) => filters.every(({ column, value }) => row?.[column] === value);
  try {
    let result = await pool.query('SELECT data FROM app_records WHERE table_name = $1' + (isAdmin ? '' : ' AND user_id = $2'), isAdmin ? [table] : [table, req.user.id]);
    let rows = result.rows.map(({ data }) => data).filter(whereMatches);
    if (!isAdmin && table === 'user_roles') rows = rows.filter((row) => row.user_id === req.user.id);
    if (order?.column) rows.sort((a, b) => (a[order.column] > b[order.column] ? 1 : a[order.column] < b[order.column] ? -1 : 0) * (order.ascending === false ? -1 : 1));
    if (Number.isInteger(limit) && limit >= 0) rows = rows.slice(0, limit);

    if (action === 'insert' || action === 'upsert') {
      const input = Array.isArray(values) ? values : [values];
      if (!isAdmin && input.some((row) => row.user_id && row.user_id !== req.user.id)) return json(res, 403, { error: 'No puedes crear datos para otro usuario.' });
      if (!isAdmin && table === 'transactions') return json(res, 403, { error: 'Solo un administrador puede registrar transacciones.' });
      const saved = [];
      for (const item of input) {
        const record = { ...(item || {}) };
        if (table !== 'user_roles') record.user_id = record.user_id || req.user.id;
        if (table === 'user_roles' && !isAdmin) record.role = 'user';
        if (!isAdmin && table === 'affiliated_bank_accounts') record.is_verified = false;
        if (!isAdmin && table === 'transfer_requests') record.status = 'pending';
        if (table === 'profiles' && !isAdmin) {
          const allowed = ['full_name', 'phone', 'nationality', 'country', 'full_address', 'birth_date', 'proof_of_address_type', 'id_document_type', 'account_type', 'id_document_number', 'proof_of_address_url', 'id_document_url', 'selfie_url', 'verification_submitted_at', 'verification_status'];
          for (const key of Object.keys(record)) if (!['user_id', 'email', 'id', 'created_at', 'updated_at', ...allowed].includes(key)) delete record[key];
          if (record.verification_status && !['pending', 'submitted'].includes(record.verification_status)) record.verification_status = 'pending';
          record.user_id = req.user.id;
          record.email = req.user.email;
          record.id = req.user.id;
        }
        if (action === 'upsert' && table === 'profiles') {
          const prior = await pool.query("SELECT data FROM app_records WHERE table_name = 'profiles' AND user_id = $1 LIMIT 1", [String(record.user_id)]);
          if (prior.rows[0]) record.id = prior.rows[0].data.id || record.user_id;
        }
        record.id = record.id || (table === 'profiles' ? record.user_id : crypto.randomUUID());
        saved.push(await saveRecord(table, record, req.user.id));
      }
      rows = saved;
    } else if (action === 'update') {
      if (!isAdmin && !['profiles', 'affiliated_bank_accounts'].includes(table)) return json(res, 403, { error: 'No tienes permiso para modificar estos datos.' });
      const patch = values || {};
      if (!isAdmin && table === 'affiliated_bank_accounts') {
        const allowed = new Set(['bank_name', 'account_number', 'account_holder_name', 'id_number', 'phone', 'address', 'country']);
        for (const key of Object.keys(patch)) if (!allowed.has(key)) delete patch[key];
      }
      if (!isAdmin && table === 'profiles') {
        const allowed = new Set(['full_name', 'phone', 'nationality', 'country', 'full_address', 'birth_date', 'proof_of_address_type', 'id_document_type', 'id_document_number', 'proof_of_address_url', 'id_document_url', 'selfie_url', 'verification_submitted_at', 'verification_status']);
        for (const key of Object.keys(patch)) if (!allowed.has(key)) delete patch[key];
        if (patch.verification_status && !['pending', 'submitted'].includes(patch.verification_status)) delete patch.verification_status;
      }
      rows = [];
      for (const row of (await pool.query('SELECT data FROM app_records WHERE table_name = $1' + (isAdmin ? '' : ' AND user_id = $2'), isAdmin ? [table] : [table, req.user.id])).rows.map((r) => r.data).filter(whereMatches)) {
        rows.push(await saveRecord(table, { ...row, ...patch }, req.user.id));
      }
    } else if (action === 'delete') {
      if (!isAdmin) return json(res, 403, { error: 'Solo un administrador puede eliminar datos.' });
      for (const row of rows) await pool.query('DELETE FROM app_records WHERE table_name = $1 AND record_id = $2', [table, String(row.id || row.user_id)]);
      rows = [];
    }

    if (fields && fields !== '*') {
      const selected = Array.isArray(fields) ? fields : String(fields).split(',').map((x) => x.trim()).filter(Boolean);
      rows = rows.map((row) => Object.fromEntries(selected.filter((key) => key in row).map((key) => [key, row[key]])));
    }
    json(res, 200, { data: single ? (rows[0] || null) : rows, error: null });
  } catch (error) {
    console.error('Data query failed:', error);
    json(res, 500, { data: null, error: { message: 'No se pudo acceder a los datos.' } });
  }
});

app.post('/api/functions/:name', requireUser, async (req, res) => {
  const { name } = req.params;
  const body = req.body?.body || req.body || {};
  if (name === 'get-all-profiles') {
    if (req.user.role !== 'admin') return json(res, 403, { error: 'Acceso solo para administradores.' });
    const result = await pool.query(
      `SELECT records.data, users.role
       FROM app_records AS records
       LEFT JOIN app_users AS users ON users.id::text = records.user_id
       WHERE records.table_name = 'profiles'
       ORDER BY records.created_at DESC`,
    );
    return json(res, 200, { profiles: result.rows.map((row) => ({ ...row.data, role: row.role || 'user' })) });
  }
  if (name === 'update-user-balance') {
    if (req.user.role !== 'admin') return json(res, 403, { error: 'Acceso solo para administradores.' });
    const target = String(body.userId || '');
    const result = await pool.query("SELECT data FROM app_records WHERE table_name = 'profiles' AND user_id = $1 LIMIT 1", [target]);
    if (!result.rows[0]) return json(res, 404, { error: 'Usuario no encontrado.' });
    const profile = result.rows[0].data;
    const patch = { ...(body.balances || {}), ...(body.activation || {}) };
    for (const key of ['status', 'country', 'verification_status', 'verification_notes', 'verification_reviewed_at']) if (body[key] !== undefined) patch[key] = body[key];
    if (body.transfer_request_review?.status === 'approved' && Number(body.transfer_request_review.amount) > 0) {
      const currency = String(body.transfer_request_review.currency || 'usd').toLowerCase();
      const balanceColumn = ['btc', 'eth', 'bnb', 'usdt', 'ltc', 'usd'].includes(currency) ? currency : 'usd';
      patch[balanceColumn] = Math.max(0, Number(profile[balanceColumn] || 0) - Number(body.transfer_request_review.amount));
    }
    if (body.transaction) await saveRecord('transactions', { ...body.transaction, id: crypto.randomUUID(), user_id: target }, target);
    const updated = await saveRecord('profiles', { ...profile, ...patch }, target);
    return json(res, 200, { success: true, profile: updated });
  }
  if (name === 'send-welcome-email' || name === 'send-document-email' || name === 'send-smtp-email') {
    if (name === 'send-document-email' && req.user.role !== 'admin') return json(res, 403, { error: 'Acceso solo para administradores.' });
    const recipient = String(body.to || body.email || '').trim().toLowerCase();
    if (name === 'send-welcome-email' && recipient !== req.user.email) return json(res, 403, { error: 'Solo puedes enviar un correo de bienvenida a tu cuenta.' });
    if (!recipient || !process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.SMTP_FROM) {
      return json(res, 503, { error: 'El envío de correos requiere configurar SMTP_HOST, SMTP_USER, SMTP_PASSWORD y SMTP_FROM en Render.' });
    }
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      });
      if (name === 'send-document-email') {
        const attachment = body.attachment;
        if (!attachment?.content || !attachment?.filename) return json(res, 400, { error: 'Falta el archivo adjunto.' });
        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: recipient,
          subject: String(body.subject || 'Documento de Quantum Ledger').slice(0, 200),
          html: String(body.html || ''),
          attachments: [{ filename: path.basename(attachment.filename), content: attachment.content, encoding: 'base64', contentType: attachment.type || 'application/pdf' }],
        });
      } else {
        const fullName = String(body.fullName || 'Usuario').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: recipient,
          subject: 'Bienvenido a Quantum Ledger',
          text: `Hola ${fullName}, tu cuenta ya está creada.`,
          html: `<p>Hola ${fullName}, tu cuenta ya está creada.</p>`,
        });
      }
      return json(res, 200, { success: true, delivered: true });
    } catch (error) {
      console.error('Transactional email failed:', error);
      return json(res, 502, { error: 'No se pudo entregar el correo. Verifica los datos SMTP.' });
    }
  }
  if (name === 'check-trusted-device') return json(res, 200, { trusted: false });
  if (name === 'register-trusted-device') return json(res, 200, { deviceToken: crypto.randomBytes(32).toString('hex') });
  return json(res, 501, { error: `La función ${name} no está disponible en el backend propio.` });
});

app.post('/api/storage/upload', requireUser, async (req, res) => {
  const { bucket, path: objectPath, contentType = 'application/octet-stream', content } = req.body || {};
  if (bucket !== 'identity-documents' || typeof objectPath !== 'string' || !objectPath.startsWith(`${req.user.id}/`) || typeof content !== 'string') {
    return json(res, 400, { error: 'Ruta o archivo no permitido.' });
  }
  try {
    await pool.query(
      `INSERT INTO identity_documents (bucket, path, owner_user_id, content_type, content)
       VALUES ($1, $2, $3, $4, decode($5, 'base64'))
       ON CONFLICT (bucket, path) DO UPDATE SET content_type = EXCLUDED.content_type, content = EXCLUDED.content, created_at = now()`,
      [bucket, objectPath, req.user.id, contentType, content],
    );
    json(res, 200, { data: { path: objectPath }, error: null });
  } catch (error) {
    console.error('Document upload failed:', error);
    json(res, 500, { error: 'No se pudo guardar el documento.' });
  }
});

app.post('/api/storage/signed-url', requireUser, async (req, res) => {
  const { bucket, path: objectPath, expiresIn = 3600 } = req.body || {};
  const file = await pool.query('SELECT owner_user_id FROM identity_documents WHERE bucket = $1 AND path = $2', [bucket, objectPath]);
  if (!file.rowCount || (req.user.role !== 'admin' && file.rows[0].owner_user_id !== req.user.id)) return json(res, 404, { error: 'Documento no encontrado.' });
  const expires = Date.now() + Math.min(Number(expiresIn) || 3600, 3600) * 1000;
  const value = `${bucket}\n${objectPath}\n${expires}`;
  const signature = crypto.createHmac('sha256', tokenSecret).update(value).digest('base64url');
  const url = `/api/storage/view?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(objectPath)}&expires=${expires}&sig=${signature}`;
  json(res, 200, { signedUrl: url });
});

app.get('/api/storage/view', async (req, res) => {
  const { bucket, path: objectPath, expires, sig } = req.query;
  const expected = crypto.createHmac('sha256', tokenSecret).update(`${bucket}\n${objectPath}\n${expires}`).digest('base64url');
  if (!expires || Number(expires) < Date.now() || !safeEqual(sig, expected)) return json(res, 403, { error: 'Enlace expirado o inválido.' });
  const result = await pool.query('SELECT content_type, content FROM identity_documents WHERE bucket = $1 AND path = $2', [bucket, objectPath]);
  if (!result.rowCount) return json(res, 404, { error: 'Documento no encontrado.' });
  res.setHeader('Content-Type', result.rows[0].content_type);
  res.setHeader('Content-Disposition', 'inline');
  res.send(result.rows[0].content);
});

app.use('/api', (_req, res) => json(res, 404, { error: 'Endpoint API no encontrado.' }));
app.use(express.static(distDir, { index: false, maxAge: '1h' }));
app.get(/.*/, (_req, res) => res.sendFile(path.join(distDir, 'index.html')));

initializeDatabase()
  .then(() => app.listen(port, () => console.info(`Quantum Ledger API listening on ${port}`)))
  .catch((error) => {
    console.error('Backend initialization failed:', error);
    process.exit(1);
  });
