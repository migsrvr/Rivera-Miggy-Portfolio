-- PostgreSQL is accessed exclusively by the server; nothing is exposed through
-- public schemas, browser credentials, or a database HTTP API.
CREATE SCHEMA IF NOT EXISTS portfolio;
REVOKE ALL ON SCHEMA portfolio FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA portfolio REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA portfolio REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

CREATE TABLE portfolio.owner (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE portfolio.sessions (
  token_hash text PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES portfolio.owner(id) ON DELETE CASCADE,
  csrf text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_expiry ON portfolio.sessions (expires_at);

CREATE TABLE portfolio.content_entries (
  collection text NOT NULL CHECK (collection IN ('profile', 'projects', 'experiences', 'credentials', 'community', 'gallery')),
  id text NOT NULL CHECK (length(id) <= 80 AND id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  position integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  sample boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collection, id),
  CHECK (collection <> 'profile' OR id = 'profile')
);

CREATE TABLE portfolio.project_experiences (
  project_id text NOT NULL,
  experience_id text NOT NULL,
  sample boolean NOT NULL DEFAULT false,
  project_collection text GENERATED ALWAYS AS ('projects'::text) STORED,
  experience_collection text GENERATED ALWAYS AS ('experiences'::text) STORED,
  PRIMARY KEY (project_id, experience_id),
  FOREIGN KEY (project_collection, project_id) REFERENCES portfolio.content_entries(collection, id) ON DELETE CASCADE,
  FOREIGN KEY (experience_collection, experience_id) REFERENCES portfolio.content_entries(collection, id) ON DELETE CASCADE
);

CREATE TABLE portfolio.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL UNIQUE CHECK (storage_path <> '' AND storage_path !~ '(^/|(^|/)\.\.(/|$)|\\)'),
  original_name text NOT NULL,
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  size bigint NOT NULL CHECK (size > 0 AND size <= CASE WHEN mime_type = 'application/pdf' THEN 20971520 ELSE 10485760 END),
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE portfolio.releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text NOT NULL DEFAULT 'building' CHECK (state IN ('building', 'ready', 'failed')),
  snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE FUNCTION portfolio.protect_content_identity()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.collection IS DISTINCT FROM OLD.collection OR NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Entry collection and id are immutable';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER content_identity BEFORE UPDATE ON portfolio.content_entries
FOR EACH ROW EXECUTE FUNCTION portfolio.protect_content_identity();

CREATE FUNCTION portfolio.protect_release_snapshot()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.snapshot IS DISTINCT FROM OLD.snapshot OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Release id, snapshot, and creation time are immutable';
  END IF;
  IF OLD.state <> 'building' AND NEW.state IS DISTINCT FROM OLD.state THEN
    RAISE EXCEPTION 'A completed release cannot change state';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER release_snapshot BEFORE UPDATE ON portfolio.releases
FOR EACH ROW EXECUTE FUNCTION portfolio.protect_release_snapshot();

REVOKE ALL ON ALL TABLES IN SCHEMA portfolio FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA portfolio FROM PUBLIC;
