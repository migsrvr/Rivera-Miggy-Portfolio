import { LocalOriginals } from './storage.mjs';

const ENTRY_FIELDS = ['id', 'data', 'position', 'visible', 'sample', 'archived'];
const ASSET_FIELDS = ['id', 'storage_path', 'original_name', 'mime_type', 'size', 'visibility', 'archived'];

function pick(record, fields) {
  return Object.fromEntries(fields.filter((field) => record[field] !== undefined).map((field) => [field, record[field]]));
}

function jsonRow(row) {
  const result = { ...row };
  for (const field of ['created_at', 'updated_at', 'published_at']) {
    if (result[field] != null) result[field] = new Date(result[field]).toISOString();
  }
  if (result.size !== undefined) result.size = Number(result.size);
  return result;
}

function required(result, operation) {
  if (!result.rows[0]) {
    const error = new Error(`${operation}: record not found`);
    error.status = 404;
    throw error;
  }
  return jsonRow(result.rows[0]);
}

// Table and column names come exclusively from constants in this module.
async function insert(database, table, record, suffix = '') {
  const fields = Object.keys(record);
  return database.query(`INSERT INTO portfolio.${table} (${fields.join(',')}) VALUES (${fields.map((_, index) => `$${index + 1}`).join(',')}) ${suffix} RETURNING *`, Object.values(record));
}

async function update(database, table, id, patch, operation) {
  const fields = Object.keys(patch);
  if (!fields.length) return required(await database.query(`SELECT * FROM portfolio.${table} WHERE id = $1`, [id]), operation);
  return required(await database.query(`UPDATE portfolio.${table} SET ${fields.map((field, index) => `${field} = $${index + 2}`).join(',')} WHERE id = $1 RETURNING *`, [id, ...Object.values(patch)]), operation);
}

export function createRepository(database, { originalsRoot } = {}) {
  if (!database?.query || !database?.transaction) throw new TypeError('A PostgreSQL database executor is required.');
  const originals = new LocalOriginals(originalsRoot);
  return {
    async getDraft() {
      // All three subqueries share one MVCC statement snapshot.
      const { rows } = await database.query(`SELECT jsonb_build_object(
        'entries', coalesce((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.position,e.collection,e.id) FROM portfolio.content_entries e), '[]'::jsonb),
        'relationships', coalesce((SELECT jsonb_agg(jsonb_build_object('project_id',p.project_id,'experience_id',p.experience_id,'sample',p.sample) ORDER BY p.project_id,p.experience_id) FROM portfolio.project_experiences p), '[]'::jsonb),
        'assets', coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.created_at DESC,a.id) FROM portfolio.assets a), '[]'::jsonb)
      ) AS draft`);
      const draft = rows[0].draft;
      return { entries: draft.entries.map(jsonRow), relationships: draft.relationships, assets: draft.assets.map(jsonRow) };
    },

    async saveEntry(collection, entry) {
      const record = { collection, ...pick(entry, ENTRY_FIELDS) };
      const changes = ENTRY_FIELDS.filter((field) => field !== 'id' && record[field] !== undefined);
      const suffix = `ON CONFLICT (collection,id) DO UPDATE SET ${changes.map((field) => `${field} = EXCLUDED.${field}`).join(',')}`;
      return required(await insert(database, 'content_entries', record, suffix), 'Save content entry');
    },

    async archiveEntry(collection, id, archived) {
      return required(await database.query('UPDATE portfolio.content_entries SET archived = $3 WHERE collection = $1 AND id = $2 RETURNING *', [collection, id, archived]), 'Archive content entry');
    },

    async setRelationships(links) {
      return database.transaction(async (executor) => {
        // Serializes concurrent complete replacements, including the empty set.
        await executor.query('LOCK TABLE portfolio.project_experiences IN EXCLUSIVE MODE');
        await executor.query('DELETE FROM portfolio.project_experiences');
        await executor.query(`INSERT INTO portfolio.project_experiences (project_id,experience_id,sample)
          SELECT project_id,experience_id,coalesce(sample,false) FROM jsonb_to_recordset($1::jsonb) AS r(project_id text,experience_id text,sample boolean)`, [JSON.stringify(links.map((link) => pick(link, ['project_id', 'experience_id', 'sample'])))]);
        return (await executor.query('SELECT project_id,experience_id,sample FROM portfolio.project_experiences ORDER BY project_id,experience_id')).rows;
      });
    },

    async listAssets() {
      return (await database.query('SELECT * FROM portfolio.assets ORDER BY created_at DESC,id')).rows.map(jsonRow);
    },

    async saveAsset(metadata) {
      return required(await insert(database, 'assets', pick(metadata, ASSET_FIELDS)), 'Save asset');
    },

    async updateAsset(id, patch) {
      return update(database, 'assets', id, pick(patch, ['visibility', 'archived']), 'Update asset');
    },

    async uploadAsset(path, bytes, mime) {
      await originals.put(path, bytes);
    },

    async downloadAsset(path) {
      return originals.get(path);
    },

    async listReleases() {
      return (await database.query('SELECT * FROM portfolio.releases ORDER BY created_at DESC,id')).rows.map(jsonRow);
    },

    async createRelease(snapshot) {
      return required(await insert(database, 'releases', { snapshot, state: 'building' }), 'Create release');
    },

    async updateRelease(id, patch) {
      return update(database, 'releases', id, pick(patch, ['state', 'error', 'published_at']), 'Update release');
    },

    async getRelease(id) {
      return required(await database.query('SELECT * FROM portfolio.releases WHERE id = $1', [id]), 'Read release');
    },
  };
}
