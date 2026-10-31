import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The data admin, which is generated entirely from the schema.
 *
 * What is worth pinning is that each field TYPE reaches the screen as the
 * right thing — a boolean as a checkbox, an enum as a chip and a select, a
 * date formatted — because none of it is written per app. If the mapping
 * is wrong it is wrong for every app at once.
 */

const records = {
  rows: [] as Record<string, unknown>[],
  total: 0,
  loading: false,
  error: null as string | null,
  reload: vi.fn(),
  create: vi.fn(async () => true),
  update: vi.fn(async () => true),
  remove: vi.fn(async () => true),
  search: '',
  searchFor: vi.fn(),
  order: { field: 'created_at', desc: true },
  sortBy: vi.fn(),
  pages: { from: 0, to: 0, hasPrev: false, hasNext: false, prev: vi.fn(), next: vi.fn() },
  exportUrl: 'http://test/export.csv',
};

vi.mock('./useRecords', async () => {
  const actual = await vi.importActual<typeof import('./useRecords')>('./useRecords');
  return { ...actual, useRecords: () => records };
});

const { DataAdmin } = await import('./DataAdmin');

const SPEC = {
  models: [{
    name: 'application', display_name: 'Application', display_field: 'company',
    fields: [
      { name: 'company', type: 'string', required: true },
      { name: 'notes', type: 'text', required: false },
      { name: 'status', type: 'enum', required: true, enum_values: ['applied', 'offer'] },
      { name: 'applied_on', type: 'date', required: false },
      { name: 'salary', type: 'integer', required: false },
      { name: 'shortlisted', type: 'boolean', required: false },
      { name: 'agency_id', type: 'reference', required: false, references_model: 'agency' },
    ],
  }, {
    name: 'agency', display_name: 'Agency', display_field: 'name',
    fields: [{ name: 'name', type: 'string', required: true }],
  }],
};

const ROW = {
  id: 'r1', company: 'Acme', notes: null, status: 'offer',
  applied_on: '2026-09-30', salary: 120000, shortlisted: true,
  agency_id: '8f3b2c1d-4e5a-6b7c-8d9e-0f1a2b3c4d5e',
  created_at: '2026-10-01T10:00:00', updated_at: '2026-10-02T11:00:00',
};

beforeEach(() => {
  records.rows = [];
  records.total = 0;
  records.error = null;
  records.search = '';
  [records.create, records.update, records.remove, records.sortBy, records.searchFor]
    .forEach(m => (m as ReturnType<typeof vi.fn>).mockClear());
});

const show = () => render(<DataAdmin slug="demo" spec={SPEC as never} />);

describe('the table', () => {
  it('offers to add the first record when empty', () => {
    show();
    expect(screen.getByText(/no application records yet/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /add the first one/i })).toBeTruthy();
  });

  it('says so when a search matches nothing, and does not offer to add', () => {
    records.search = 'zzz';
    show();
    expect(screen.getByText(/nothing matches/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /add the first one/i })).toBeNull();
  });

  it('renders one column per declared field', () => {
    records.rows = [ROW];
    records.total = 1;
    show();
    for (const name of ['company', 'notes', 'status', 'applied_on', 'salary', 'shortlisted']) {
      expect(screen.getByText(name)).toBeTruthy();
    }
  });

  it('renders each field type as what it means', () => {
    records.rows = [ROW];
    records.total = 1;
    const { container } = show();
    const row = container.querySelector('tbody tr')!;

    // boolean -> a checkbox, not the word "true"
    expect(within(row as HTMLElement).getByRole('checkbox')).toBeTruthy();
    expect(row.textContent).not.toContain('true');
    // enum -> a chip
    expect(within(row as HTMLElement).getByText('offer')).toBeTruthy();
    // date -> formatted, not an ISO string
    expect(row.textContent).not.toContain('2026-09-30');
    // null -> an em dash rather than "null"
    expect(row.textContent).toContain('—');
    expect(row.textContent).not.toContain('null');
    // reference -> shortened, not a full uuid
    expect(row.textContent).not.toContain('8f3b2c1d-4e5a-6b7c-8d9e-0f1a2b3c4d5e');
  });

  it('sorts by the column that was clicked', () => {
    records.rows = [ROW];
    show();
    fireEvent.click(screen.getByText('company'));
    expect(records.sortBy).toHaveBeenCalledWith('company');
  });

  it('shows the model switcher only when there is a choice', () => {
    records.rows = [ROW];
    const { container, unmount } = show();
    expect(container.querySelector('select')).toBeTruthy();
    unmount();

    render(<DataAdmin slug="demo" spec={{ models: [SPEC.models[0]] } as never} />);
    expect(document.querySelectorAll('select').length).toBe(0);
  });

  it('surfaces a write failure', () => {
    records.error = 'status must be one of applied, offer';
    show();
    expect(screen.getByText(/must be one of/i)).toBeTruthy();
  });
});

describe('the edit drawer', () => {
  it('builds an input per field type', async () => {
    records.rows = [ROW];
    const { container } = show();
    fireEvent.click(container.querySelector('tbody tr')!);

    await waitFor(() => expect(screen.getByText(/edit application/i)).toBeTruthy());
    const drawer = screen.getByText(/edit application/i).closest('div')!.parentElement!;

    expect(drawer.querySelector('textarea')).toBeTruthy();                  // text
    expect(drawer.querySelector('input[type="date"]')).toBeTruthy();        // date
    expect(drawer.querySelector('input[type="number"]')).toBeTruthy();      // integer
    expect(drawer.querySelector('input[type="checkbox"]')).toBeTruthy();    // boolean
    // enum -> a select of its allowed values, so an invalid one cannot be typed
    const selects = [...drawer.querySelectorAll('select')];
    const statuses = selects.find(s => s.querySelector('option[value="offer"]'));
    expect(statuses).toBeTruthy();
    expect([...statuses!.options].map(o => o.value)).toEqual(['applied', 'offer']);
  });

  it('marks the required fields', async () => {
    records.rows = [ROW];
    const { container } = show();
    fireEvent.click(container.querySelector('tbody tr')!);
    await waitFor(() => expect(screen.getAllByText('required').length).toBe(2));
  });

  it('creating sends what was typed', async () => {
    show();
    fireEvent.click(screen.getByRole('button', { name: /add the first one/i }));
    await waitFor(() => expect(screen.getByText(/new application/i)).toBeTruthy());

    fireEvent.change(document.querySelector('input[type="text"]')!, {
      target: { value: 'Globex' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => expect(records.create).toHaveBeenCalled());
    const sent = (records.create.mock.calls as unknown[][])[0][0] as Record<string, unknown>;
    expect(sent.company).toBe('Globex');
    // An untouched optional date goes as null, never ""
    expect(sent.applied_on).toBeNull();
  });
});
