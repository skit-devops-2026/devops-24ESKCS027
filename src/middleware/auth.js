
const crypto = require('node:crypto');

function parseCookies(req) {
  const cookies = {};
  const header = req.headers.cookie || '';

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;

    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();

    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      // Ignore malformed cookies.
    }
  }

  return cookies;
}

function getSessionSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with a strong secret.');
  }

  return secret;
}

function createAdminToken(email) {
  const payload = Buffer.from(JSON.stringify({
    email,
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60
  })).toString('base64url');

  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');

  return `${payload}.${signature}`;
}

function verifyAdminToken(token) {
  if (typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, suppliedSignature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest();

  let actualSignature;
  try {
    actualSignature = Buffer.from(suppliedSignature, 'base64url');
  } catch {
    return null;
  }

  if (
    actualSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(actualSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));

    if (
      typeof data.email !== 'string' ||
      !data.email ||
      !Number.isFinite(data.exp) ||
      data.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    const configuredEmail = process.env.ADMIN_EMAIL;
    if (
      !configuredEmail ||
      data.email.toLowerCase() !== configuredEmail.toLowerCase()
    ) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

function requireAdmin(req, res, next) {
  let session;

  try {
    session = verifyAdminToken(parseCookies(req).eh_admin_session);
  } catch (error) {
    console.error('Admin session configuration error:', error.message);
    return res.status(503).send('Admin authentication is not configured.');
  }

  if (session) {
    req.admin = {
      id: 'ADM-01',
      name: process.env.ADMIN_NAME || 'EventHive Administrator',
      email: session.email,
      role: 'Administrator'
    };

    res.locals.adminUser = req.admin;
    return next();
  }

  if (req.xhr || req.headers.accept?.includes('json')) {
    return res.status(401).json({
      error: 'Unauthorized. Admin session required.'
    });
  }

  return res.redirect(
    '/admin/login?redirect=' + encodeURIComponent(req.originalUrl)
  );
}

function redirectIfAuthenticated(req, res, next) {
  try {
    if (verifyAdminToken(parseCookies(req).eh_admin_session)) {
      return res.redirect('/admin/dashboard');
    }
  } catch {
    // Continue to login when authentication is not configured.
  }

  return next();
}

module.exports = {
  requireAdmin,
  redirectIfAuthenticated,
  createAdminToken,
  verifyAdminToken
};
