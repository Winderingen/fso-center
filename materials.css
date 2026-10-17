import { seed } from '../supabase/functions/_shared/seed.mjs';
import { codeHash } from '../supabase/functions/_shared/domain.mjs';
import { writeFile } from 'node:fs/promises';
// Pepper arrives through the environment; never printed or included in SQL.
if (!process.env.FSO_CODE_PEPPER || !process.env.FSO_EXAM_CODE) throw new Error('Set FSO_CODE_PEPPER and FSO_EXAM_CODE first');
const data = seed(); data.assessments.find(a => a.type === 'exam').accessHash = await codeHash(process.env.FSO_EXAM_CODE, process.env.FSO_CODE_PEPPER);
const sql = `-- Run once after the migration. Existing data is preserved.\ninsert into public.fso_state(id,data) values (1,'${JSON.stringify(data).replaceAll("'", "''")}'::jsonb) on conflict (id) do nothing;\n`;
await writeFile('supabase/seed.sql', sql); console.log('Created supabase/seed.sql');
