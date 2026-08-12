import { isSupabaseConfigured } from '../supabase/server';
import { getMemoryStore } from './memory-store';
import { SupabaseStore } from './supabase-store';
import type { DataStore } from './store';

export type DataMode = 'supabase' | 'memory';

export function dataMode(): DataMode {
  return isSupabaseConfigured() ? 'supabase' : 'memory';
}

let supabaseStore: SupabaseStore | null = null;

/**
 * Returns the active DataStore: Supabase when credentials are configured,
 * otherwise the seeded in-memory fixture store (documented in the README).
 */
export function getStore(): DataStore {
  if (dataMode() === 'supabase') {
    if (!supabaseStore) supabaseStore = new SupabaseStore();
    return supabaseStore;
  }
  return getMemoryStore();
}
