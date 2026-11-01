import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Loader2, Plus, Search, Trash2, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRecords, blankRecord, forApi, RecordRow } from './useRecords';
import type { AppFieldShape, AppSpecShape } from './useApp';

interface Props {
  slug: string;
  spec: AppSpecShape;
}

interface ModelShape {
  name: string;
  display_name: string;
  display_field: string;
  fields: AppFieldShape[];
}

/**
 * The owner's way into the app's data.
 *
 * Generated entirely from the schema — every field carries its type,
 * whether it is required, its allowed values and what it references, which
 * is enough to build both the table and the edit form with no per-app
 * code. The same property that lets the API client be generated.
 */
export function DataAdmin({ slug, spec }: Props) {
  const models = (spec.models ?? []) as ModelShape[];
  const [modelName, setModelName] = useState(models[0]?.name ?? '');
  const model = models.find(m => m.name === modelName) ?? models[0];

  const data = useRecords(slug, model?.name ?? null);
  const [editing, setEditing] = useState<RecordRow | 'new' | null>(null);

  if (!model) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        This app has no data models.
      </div>
    );
  }

  return (
    <div className="flex h-full w-full min-w-0 flex-col overflow-hidden">
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b px-4 py-2">
        {models.length > 1 && (
          <select
            value={model.name}
            onChange={e => setModelName(e.target.value)}
            className="h-7 min-w-0 shrink rounded border border-border bg-background px-2 text-xs"
          >
            {models.map(m => (
              <option key={m.name} value={m.name}>{m.display_name}</option>
            ))}
          </select>
        )}

        {/* Its own row in a narrow panel. An <input> has an intrinsic
            minimum width from its default size attribute, so it will not
            shrink into a 240px pane however small its container gets —
            giving it the full row is the only thing that actually fits. */}
        <div className="relative order-last w-full min-w-0 sm:order-none sm:w-auto sm:flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <input
            value={data.search}
            onChange={e => data.searchFor(e.target.value)}
            placeholder={`Search ${model.display_name.toLowerCase()}…`}
            size={1}
            className="h-7 w-full min-w-0 rounded border border-border bg-background pl-7 pr-2 text-xs"
          />
        </div>

        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
          {data.total} row{data.total === 1 ? '' : 's'}
        </span>

        <Button size="sm" className="h-7 shrink-0 gap-1 text-xs" onClick={() => setEditing('new')}>
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>

      {data.error && (
        <div className="shrink-0 border-b bg-destructive/10 px-4 py-1.5 text-[11px] text-destructive">
          {data.error}
        </div>
      )}

      <div className="min-h-0 w-full min-w-0 max-w-full flex-1 overflow-x-auto overflow-y-auto">
        {data.loading && !data.rows.length ? (
          <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : !data.rows.length ? (
          <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {data.search
                ? `Nothing matches “${data.search}”.`
                : `No ${model.display_name.toLowerCase()} records yet.`}
            </p>
            {!data.search && (
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setEditing('new')}>
                <Plus className="h-3 w-3" /> Add the first one
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b border-border">
                {model.fields.map(field => (
                  <th
                    key={field.name}
                    onClick={() => data.sortBy(field.name)}
                    className="cursor-pointer select-none whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground hover:text-foreground"
                  >
                    <span className="inline-flex items-center gap-1">
                      {field.name}
                      {data.order.field === field.name &&
                        (data.order.desc ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
                    </span>
                  </th>
                ))}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {data.rows.map(row => (
                <tr
                  key={row.id}
                  onClick={() => setEditing(row)}
                  className="group cursor-pointer border-b border-border/60 hover:bg-muted/40"
                >
                  {model.fields.map(field => (
                    <td key={field.name} className="max-w-[18rem] truncate px-3 py-1.5">
                      <Cell field={field} value={row[field.name]} models={models} />
                    </td>
                  ))}
                  <td className="px-2">
                    <button
                      type="button"
                      aria-label="Delete row"
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm('Delete this record?')) void data.remove(row.id);
                      }}
                      className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(data.pages.hasPrev || data.pages.hasNext) && (
        <div className="flex flex-shrink-0 items-center justify-between border-t px-4 py-1.5 text-[11px] text-muted-foreground">
          <span className="tabular-nums">
            {data.pages.from}–{data.pages.to} of {data.total}
          </span>
          <span className="flex gap-1">
            <button disabled={!data.pages.hasPrev} onClick={data.pages.prev}
                    className="rounded border border-border p-1 disabled:opacity-30">
              <ChevronLeft className="h-3 w-3" />
            </button>
            <button disabled={!data.pages.hasNext} onClick={data.pages.next}
                    className="rounded border border-border p-1 disabled:opacity-30">
              <ChevronRight className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

      {editing && (
        <RecordDrawer
          model={model}
          models={models}
          record={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={async values => {
            const ok =
              editing === 'new'
                ? await data.create(values)
                : await data.update(editing.id, values);
            if (ok) setEditing(null);
          }}
        />
      )}
    </div>
  );
}

/** One value, rendered by what its type means rather than as text. */
function Cell({ field, value, models }: { field: AppFieldShape; value: unknown; models: ModelShape[] }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground/50">—</span>;
  }
  if (field.type === 'boolean') {
    return <input type="checkbox" checked={Boolean(value)} readOnly className="pointer-events-none" />;
  }
  if (field.type === 'enum') {
    return (
      <span className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{String(value)}</span>
    );
  }
  if (field.type === 'reference') {
    const target = models.find(m => m.name === field.references_model);
    return (
      <span className="font-mono text-[11px] text-muted-foreground">
        {target ? `${target.display_name} ` : ''}{String(value).slice(0, 8)}
      </span>
    );
  }
  if (field.type === 'date' || field.type === 'datetime') {
    const when = new Date(String(value));
    return <span className="tabular-nums">{isNaN(+when) ? String(value) : when.toLocaleDateString()}</span>;
  }
  if (field.type === 'integer' || field.type === 'number') {
    return <span className="tabular-nums">{String(value)}</span>;
  }
  return <>{String(value)}</>;
}

function RecordDrawer({
  model, models, record, onClose, onSave,
}: {
  model: ModelShape;
  models: ModelShape[];
  record: RecordRow | null;
  onClose: () => void;
  onSave: (values: Record<string, unknown>) => Promise<void>;
}) {
  const initial = useMemo(() => {
    if (!record) return blankRecord(model.fields);
    const out: Record<string, unknown> = {};
    for (const field of model.fields) out[field.name] = record[field.name] ?? '';
    return out;
  }, [record, model]);

  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  useEffect(() => setValues(initial), [initial]);

  const set = (name: string, value: unknown) => setValues(v => ({ ...v, [name]: value }));

  return (
    <div className="absolute inset-0 z-20 flex justify-end bg-black/30" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-xl"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b px-4 py-2.5">
          <span className="text-sm font-medium">
            {record ? `Edit ${model.display_name}` : `New ${model.display_name}`}
          </span>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
          {model.fields.map(field => (
            <label key={field.name} className="block">
              <span className="mb-1 flex items-baseline gap-1.5 text-[11px] text-muted-foreground">
                {field.name}
                {field.required && <span className="text-destructive">required</span>}
              </span>
              <FieldInput field={field} models={models} value={values[field.name]} onChange={v => set(field.name, v)} />
            </label>
          ))}

          {record && (
            <p className="pt-2 text-[11px] text-muted-foreground">
              Created {record.created_at ? new Date(record.created_at).toLocaleString() : '—'}
              {record.updated_at && record.updated_at !== record.created_at && (
                <> · updated {new Date(record.updated_at).toLocaleString()}</>
              )}
            </p>
          )}
        </div>

        <div className="flex flex-shrink-0 justify-end gap-2 border-t px-4 py-2.5">
          <Button variant="ghost" size="sm" className="text-xs" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            className="gap-1 text-xs"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await onSave(forApi(values, model.fields));
              setSaving(false);
            }}
          >
            {saving && <Loader2 className="h-3 w-3 animate-spin" />}
            {record ? 'Save changes' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** The right input for a field, decided by its declared type. */
function FieldInput({
  field, models, value, onChange,
}: {
  field: AppFieldShape;
  models: ModelShape[];
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const css = 'w-full rounded border border-border bg-background px-2 py-1.5 text-xs';

  if (field.type === 'boolean') {
    return (
      <input type="checkbox" checked={Boolean(value)} onChange={e => onChange(e.target.checked)} />
    );
  }
  if (field.type === 'enum') {
    return (
      <select className={css} value={String(value ?? '')} onChange={e => onChange(e.target.value)}>
        {!field.required && <option value="">—</option>}
        {(field.enum_values ?? []).map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }
  if (field.type === 'reference') {
    // A plain id field for now. Turning it into a picker needs the target
    // model's rows, which is a second fetch per reference — worth it, but
    // not before someone has two models that point at each other.
    const target = models.find(m => m.name === field.references_model);
    return (
      <input
        className={`${css} font-mono`}
        value={String(value ?? '')}
        onChange={e => onChange(e.target.value)}
        placeholder={target ? `${target.display_name} id` : 'record id'}
      />
    );
  }
  if (field.type === 'text') {
    return (
      <textarea className={css} rows={4} value={String(value ?? '')} onChange={e => onChange(e.target.value)} />
    );
  }

  const type =
    field.type === 'date' ? 'date'
    : field.type === 'datetime' ? 'datetime-local'
    : field.type === 'integer' || field.type === 'number' ? 'number'
    : 'text';

  return (
    <input
      className={css}
      type={type}
      step={field.type === 'number' ? 'any' : undefined}
      value={String(value ?? '')}
      onChange={e => onChange(e.target.value)}
    />
  );
}
