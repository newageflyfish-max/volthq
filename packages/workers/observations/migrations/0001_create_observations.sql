-- Volt HQ — Observations table
-- Stores latency and success/failure data reported by MCP clients.

CREATE TABLE observations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id TEXT    NOT NULL,
  model       TEXT    NOT NULL,
  latency_ms  INTEGER NOT NULL,
  success     BOOLEAN NOT NULL,
  error_type  TEXT,
  ip_hash     TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_observations_provider_created
  ON observations (provider_id, created_at);

CREATE INDEX idx_observations_model_created
  ON observations (model, created_at);
