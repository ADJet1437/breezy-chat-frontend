import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  authenticatedDelete,
  authenticatedGet,
  authenticatedPatch,
  authenticatedPost,
} from '@/utils/authenticatedFetch';
import { buildApiUrl } from '@/utils/apiConfig';
import type { AppFieldShape } from './useApp';

export interface RecordRow {
  id: string;
  created_at?: string | null;
  updated_at?: string | null;
  [field: string]: unknown;
}

const PAGE_SIZE = 50;

/**
 * The owner's view of one model's records.
 *
 * Reads the admin route, not the app's own API: that one serves only the
 * endpoints the spec declared, so an app offering a list and nothing else
 * would leave no way to fix a typo or clear a test row.
 */
export function useRecords(slug: string | null, model: string | null) {
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState<{ field: string; desc: boolean }>({
    field: 'created_at',
    desc: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = slug && model ? `/api/v1/apps/${slug}/records/${model}` : null;

  const reload = useCallback(async () => {
    if (!base) {
      setRows([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
        order: order.field,
        desc: String(order.desc),
      });
      if (search.trim()) query.set('q', search.trim());
      const response = await authenticatedGet(buildApiUrl(`${base}?${query}`));
      if (!response.ok) {
        const problem = await response.json().catch(() => null);
        throw new Error(problem?.detail || `Could not load records (${response.status})`);
      }
      const page = await response.json();
      setRows(page.records ?? []);
      setTotal(page.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load records');
    } finally {
      setLoading(false);
    }
  }, [base, offset, search, order.field, order.desc]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Any write re-reads rather than patching the list in place. A record is
  // normalised on the way in — dates parsed, references checked — so what
  // comes back is not always what was sent.
  const mutate = useCallback(
    async (run: () => Promise<Response>) => {
      setError(null);
      const response = await run();
      if (!response.ok && response.status !== 204) {
        const problem = await response.json().catch(() => null);
        // The server's own words: "status must be one of applied, offer" is
        // something the person editing can act on.
        setError(problem?.detail || `That did not save (${response.status})`);
        return false;
      }
      await reload();
      return true;
    },
    [reload]
  );

  const create = useCallback(
    (values: Record<string, unknown>) =>
      mutate(() => authenticatedPost(buildApiUrl(base!), values)),
    [base, mutate]
  );

  const update = useCallback(
    (id: string, values: Record<string, unknown>) =>
      mutate(() => authenticatedPatch(buildApiUrl(`${base}/${id}`), values)),
    [base, mutate]
  );

  const remove = useCallback(
    (id: string) => mutate(() => authenticatedDelete(buildApiUrl(`${base}/${id}`))),
    [base, mutate]
  );

  const exportUrl = base ? buildApiUrl(`${base}.csv${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''}`) : null;

  const pages = useMemo(
    () => ({
      from: total === 0 ? 0 : offset + 1,
      to: Math.min(offset + rows.length, total),
      hasPrev: offset > 0,
      hasNext: offset + PAGE_SIZE < total,
      prev: () => setOffset(o => Math.max(0, o - PAGE_SIZE)),
      next: () => setOffset(o => o + PAGE_SIZE),
    }),
    [offset, rows.length, total]
  );

  const sortBy = useCallback((field: string) => {
    setOffset(0);
    setOrder(o => (o.field === field ? { field, desc: !o.desc } : { field, desc: false }));
  }, []);

  const searchFor = useCallback((term: string) => {
    setOffset(0);
    setSearch(term);
  }, []);

  return {
    rows, total, loading, error, reload,
    create, update, remove,
    search, searchFor, order, sortBy, pages, exportUrl,
  };
}

/** An empty record shaped by the schema, for the "add" form. */
export function blankRecord(fields: AppFieldShape[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.type === 'boolean') out[field.name] = false;
    else if (field.type === 'enum') out[field.name] = field.enum_values?.[0] ?? '';
    else out[field.name] = '';
  }
  return out;
}

/**
 * A value as the API wants it.
 *
 * Empty optional fields go as null, not "": the server coerces by type, and
 * an empty string is not a valid date or number. Required fields keep the
 * empty string so the server's own "x is required" is what the user sees,
 * rather than this guessing at the rule.
 */
export function forApi(
  values: Record<string, unknown>,
  fields: AppFieldShape[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    const value = values[field.name];
    if (field.type === 'boolean') {
      out[field.name] = Boolean(value);
    } else if (value === '' || value === undefined) {
      out[field.name] = field.required ? '' : null;
    } else if (field.type === 'integer') {
      out[field.name] = Number.parseInt(String(value), 10);
    } else if (field.type === 'number') {
      out[field.name] = Number(value);
    } else {
      out[field.name] = value;
    }
  }
  return out;
}
