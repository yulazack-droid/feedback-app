import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient(url || '', anon || '');

// --- Table helpers ----------------------------------------------------------
export async function insertLectureFeedback(row) {
  const { error } = await supabase.from('lecture_feedback').insert(row);
  if (error) throw error;
}

export async function insertFinalFeedback(row) {
  const { error } = await supabase.from('final_feedback').insert(row);
  if (error) throw error;
}

export async function insertProjectFeedback(row) {
  const { error } = await supabase.from('project_feedback').insert(row);
  if (error) throw error;
}

export async function fetchLectureFeedback() {
  const { data, error } = await supabase
    .from('lecture_feedback')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
}

export async function fetchFinalFeedback() {
  const { data, error } = await supabase
    .from('final_feedback')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
}

export async function fetchProjectFeedback() {
  const { data, error } = await supabase
    .from('project_feedback')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
}
