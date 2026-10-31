import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The owner's record editing.
 *
 * The behaviour worth pinning is what reaches the server: a date field left
 * blank must not go as "", and every write must re-read rather than patch
 * the list in place, because the server normalises what it stores.
 */

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
const del = vi.fn();

vi.mock('@/utils/authenticatedFetch', () => ({
  authenticatedGet: (...a: unknown[]) => get(...a),
  authenticatedPost: (...a: unknown[]) => post(...a),
  authenticatedPatch: (...a: unknown[]) => patch(...a),
  authenticatedDelete: (...a: unknown[]) => del(...a),
}));
vi.mock('@/utils/apiConfig', () => ({ buildApiUrl: (p: string) => `http://test${p}` }));

const { useRecords, blankRecord, forApi } = await import('./useRecords');

const page = (records: unknown[], total = records.length) => ({
  ok: true, status: 200, json: async () => ({ records, total, limit: 50, offset: 0 }),
});

const FIELDS = [
  { name: 'company', type: 'string', required: true },
  { name: 'applied_on', type: 'date', required: false },
  { name: 'score', type: 'integer', required: false },
  { name: 'shortlisted', type: 'boolean', required: false },
  { name: 'status', type: 'enum', required: true, enum_values: ['applied', 'offer'] },
];

beforeEach(() => {
  [get, post, patch, del].forEach(m => m.mockReset());
  get.mockResolvedValue(page([{ id: 'r1', company: 'Acme' }]));
});

describe('useRecords', () => {
  it('loads a page of records', async () => {
    const { result } = renderHook(() => useRecords('app-1', 'application'));
    await waitFor(() => expect(result.current.rows.length).toBe(1));
    expect(get.mock.calls[0][0]).toContain('/api/v1/apps/app-1/records/application');
  });

  it('fetches nothing without an app or a model', async () => {
    renderHook(() => useRecords(null, 'application'));
    renderHook(() => useRecords('app-1', null));
    await new Promise(r => setTimeout(r, 10));
    expect(get).not.toHaveBeenCalled();
  });

  it('searching resets to the first page', async () => {
    const { result } = renderHook(() => useRecords('app-1', 'application'));
    await waitFor(() => expect(get).toHaveBeenCalled());
    act(() => result.current.pages.next());
    await waitFor(() => expect(get.mock.calls.at(-1)![0]).toContain('offset=50'));
    act(() => result.current.searchFor('acme'));
    await waitFor(() => expect(get.mock.calls.at(-1)![0]).toContain('q=acme'));
    expect(get.mock.calls.at(-1)![0]).toContain('offset=0');
  });

  it('sorting the same column twice flips direction', async () => {
    const { result } = renderHook(() => useRecords('app-1', 'application'));
    await waitFor(() => expect(get).toHaveBeenCalled());
    act(() => result.current.sortBy('company'));
    await waitFor(() => expect(get.mock.calls.at(-1)![0]).toContain('desc=false'));
    act(() => result.current.sortBy('company'));
    await waitFor(() => expect(get.mock.calls.at(-1)![0]).toContain('desc=true'));
  });

  it('re-reads after a write instead of patching the list', async () => {
    // The server normalises on the way in — dates parsed, references
    // checked — so what comes back is not always what was sent.
    post.mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 'r2' }) });
    const { result } = renderHook(() => useRecords('app-1', 'application'));
    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    await act(() => result.current.create({ company: 'Globex' }).then(() => {}));
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("surfaces the server's own words when a write is refused", async () => {
    patch.mockResolvedValue({
      ok: false, status: 400,
      json: async () => ({ detail: 'status must be one of applied, offer, not ghosted' }),
    });
    const { result } = renderHook(() => useRecords('app-1', 'application'));
    await waitFor(() => expect(result.current.rows.length).toBe(1));
    await act(() => result.current.update('r1', { status: 'ghosted' }).then(() => {}));
    await waitFor(() => expect(result.current.error).toContain('must be one of'));
  });

  it('a 204 delete counts as success', async () => {
    del.mockResolvedValue({ ok: false, status: 204, json: async () => ({}) });
    const { result } = renderHook(() => useRecords('app-1', 'application'));
    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    await act(() => result.current.remove('r1').then(() => {}));
    expect(result.current.error).toBeNull();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('carries the search into the export link', async () => {
    const { result } = renderHook(() => useRecords('app-1', 'application'));
    await waitFor(() => expect(get).toHaveBeenCalled());
    act(() => result.current.searchFor('acme'));
    await waitFor(() => expect(result.current.exportUrl).toContain('q=acme'));
    expect(result.current.exportUrl).toContain('.csv');
  });
});

describe('shaping values for the API', () => {
  it('starts a new record from the schema', () => {
    const blank = blankRecord(FIELDS as never);
    expect(blank.shortlisted).toBe(false);
    expect(blank.status).toBe('applied');   // the first allowed value
    expect(blank.company).toBe('');
  });

  it('sends a blank optional field as null, not an empty string', () => {
    // "" is not a valid date or integer. The server coerces by type and
    // would reject it — for a field the user simply left alone.
    const out = forApi({ company: 'Acme', applied_on: '', score: '', status: 'applied' }, FIELDS as never);
    expect(out.applied_on).toBeNull();
    expect(out.score).toBeNull();
  });

  it('leaves a blank required field empty so the server explains why', () => {
    const out = forApi({ company: '', status: 'applied' }, FIELDS as never);
    expect(out.company).toBe('');
  });

  it('sends numbers as numbers and booleans as booleans', () => {
    const out = forApi(
      { company: 'A', score: '42', shortlisted: 'yes', status: 'offer' },
      FIELDS as never
    );
    expect(out.score).toBe(42);
    expect(out.shortlisted).toBe(true);
  });
});
