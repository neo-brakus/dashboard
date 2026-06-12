-- db/init.sql

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;  -- For tracking Querries per Second

CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  role       TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO users (name, email, role) VALUES
  ('Alice Martin',  'alice@example.com',  'admin'),
  ('Bob Chen',      'bob@example.com',    'user'),
  ('Carol White',   'carol@example.com',  'user'),
  ('David Kim',     'david@example.com',  'user'),
  ('Eva Rossi',     'eva@example.com',    'moderator'),
  ('Frank Müller',  'frank@example.com',  'user'),
  ('Grace Okafor',  'grace@example.com',  'user'),
  ('Henry Tanaka',  'henry@example.com',  'user'),
  ('Iris Novak',    'iris@example.com',   'user'),
  ('Jack Patel',    'jack@example.com',   'admin');