const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const bearerToken = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const queryToken = typeof req.query?.token === 'string' ? req.query.token : null;
  const token = bearerToken || queryToken;

  if (!token) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET || 'change-me');
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};
