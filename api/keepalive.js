// Llamado a diario por Vercel Cron: una consulta liviana evita que Supabase (plan free) pause el proyecto por inactividad.
const SUPABASE_URL = 'https://nbyvtpiiyconbjqduyms.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ieXZ0cGlpeWNvbmJqcWR1eW1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1ODgxMDcsImV4cCI6MjEwNTE2NDEwN30.kS13oCNaxqHBjbVDUMFvceohQEE8Mqym0wpUjj8l6TQ';

module.exports = async (req, res) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/talents?select=id&limit=1`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  res.status(r.ok ? 200 : 502).json({ ok: r.ok, status: r.status, at: new Date().toISOString() });
};
