const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SCHEMA = `
CREATE TABLE IF NOT EXISTS events (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  starts_at   TIMESTAMP,
  ends_at     TIMESTAMP,
  status      VARCHAR(20) DEFAULT 'scheduled',
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prizes (
  id            SERIAL PRIMARY KEY,
  event_id      INTEGER REFERENCES events(id) ON DELETE CASCADE,
  name          VARCHAR(200) NOT NULL,
  image_url     TEXT,
  stock         INTEGER DEFAULT -1,
  stock_initial INTEGER DEFAULT -1,
  weight        INTEGER DEFAULT 10,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS participants (
  id               SERIAL PRIMARY KEY,
  event_id         INTEGER REFERENCES events(id),
  cpf              VARCHAR(14) NOT NULL,
  name             VARCHAR(200),
  phone            VARCHAR(20),
  address          TEXT,
  type             VARCHAR(10) DEFAULT 'visitor',
  ixc_client_id    INTEGER,
  ixc_contract_id  INTEGER,
  played_at        TIMESTAMP,
  won              BOOLEAN DEFAULT FALSE,
  prize_id         INTEGER REFERENCES prizes(id),
  win_code         VARCHAR(10) UNIQUE,
  win_delivered    BOOLEAN DEFAULT FALSE,
  win_delivered_at TIMESTAMP,
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_participant_event_cpf
  ON participants(event_id, cpf);

CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key   VARCHAR(100) PRIMARY KEY,
  value TEXT
);
`;

async function init() {
  await pool.query(SCHEMA);

  // Usuário admin padrão
  const adminPassword = process.env.ADMIN_PASSWORD || 'ilnet@2026';
  const { rows } = await pool.query(
    'SELECT id, password_hash FROM admin_users WHERE username = $1', ['admin']
  );
  if (rows.length === 0) {
    const hash = await bcrypt.hash(adminPassword, 10);
    await pool.query(
      'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
      ['admin', hash]
    );
    console.log('Admin criado: admin');
  } else {
    const matchesEnvPassword = await bcrypt.compare(adminPassword, rows[0].password_hash);
    if (!matchesEnvPassword) {
      const hash = await bcrypt.hash(adminPassword, 10);
      await pool.query(
        'UPDATE admin_users SET password_hash = $1 WHERE username = $2',
        [hash, 'admin']
      );
      console.log('Senha do admin sincronizada com ADMIN_PASSWORD');
    }
  }

  // Configurações padrão
  await pool.query(`
    INSERT INTO settings (key, value) VALUES
      ('win_chance', '40'),
      ('idle_timeout', '30'),
      ('sound_video', 'true'),
      ('sound_effects', 'true')
    ON CONFLICT (key) DO NOTHING
  `);

  console.log('Banco de dados pronto');
}

module.exports = {
  pool,
  init,
  query: (...args) => pool.query(...args),
};
