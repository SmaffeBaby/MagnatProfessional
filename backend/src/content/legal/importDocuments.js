// The import runs once per version; later editor changes are never overwritten.
export async function importLegalDocuments(client, seed) {
  await client.query('BEGIN')
  try {
    await client.query("SELECT pg_advisory_xact_lock(hashtext('magnat-legal-document-import'))")
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.legal_document_imports (
        version text PRIMARY KEY,
        sources jsonb NOT NULL,
        previous_blocks jsonb NOT NULL,
        imported_at timestamptz NOT NULL DEFAULT now()
      );
      ALTER TABLE public.legal_document_imports ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.privacy_blocks DROP CONSTRAINT IF EXISTS privacy_blocks_document_key_check;
      ALTER TABLE public.privacy_blocks ADD CONSTRAINT privacy_blocks_document_key_check
        CHECK (document_key IN ('privacy', 'user-agreement', 'policy', 'cookie-consent'));
    `)
    const { rows } = await client.query('SELECT version FROM public.legal_document_imports WHERE version = $1', [seed.version])
    if (rows.length) {
      await client.query('COMMIT')
      return false
    }
    const keys = Object.keys(seed.documents)
    await client.query(`INSERT INTO public.legal_document_imports (version, sources, previous_blocks)
      SELECT $1, $2::jsonb, COALESCE(jsonb_agg(to_jsonb(b)), '[]'::jsonb)
      FROM public.privacy_blocks b WHERE document_key = ANY($3::text[])`, [seed.version, JSON.stringify(seed.sources), keys])
    await client.query('DELETE FROM public.privacy_blocks WHERE document_key = ANY($1::text[])', [keys])
    for (const [key, blocks] of Object.entries(seed.documents)) {
      for (const block of blocks) {
        await client.query(`INSERT INTO public.privacy_blocks
          (id, document_key, block_type, sort_order, title, text, title_en, text_en, table_rows, table_rows_en)
          VALUES ($1, $2, 'text', $3, $4, $5, NULL, NULL, '[]'::jsonb, '[]'::jsonb)`,
        [block.id, key, block.sortOrder, block.title, block.text])
      }
    }
    await client.query("NOTIFY pgrst, 'reload schema'")
    await client.query('COMMIT')
    return true
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
}
