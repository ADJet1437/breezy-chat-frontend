import React from 'react';
import { FileText, Image as ImageIcon, X } from 'lucide-react';
import type { UploadedFile } from '../FileUpload';

interface Props {
  files: UploadedFile[];
  /** Omitted in the transcript: a sent message's attachments are history. */
  onRemove?: (id: string) => void;
  /** Right-aligned under a user's own message. */
  align?: 'start' | 'end';
}

function size(bytes: number): string {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * What is attached, as named chips.
 *
 * It used to read "2 file(s) attached", which tells you a number and
 * nothing else: not which files, and with no way to take one back short of
 * reloading. A chip per file, each removable, is what every composer does.
 */
export function AttachedFiles({ files, onRemove, align = 'start' }: Props) {
  if (!files.length) return null;

  return (
    <div
      className={`flex flex-wrap gap-1.5 px-1 pb-2 ${
        align === 'end' ? 'justify-end' : ''
      }`}
    >
      {files.map(file => {
        const Icon = file.type?.startsWith('image/') ? ImageIcon : FileText;
        return (
          <span
            key={file.id}
            className={`group flex min-w-0 max-w-[14rem] items-center gap-1.5 rounded-lg border border-border bg-muted/40 py-1 pl-2 text-xs ${
              onRemove ? 'pr-1' : 'pr-2'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 truncate" title={file.name}>
              {file.name}
            </span>
            {file.size > 0 && (
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {size(file.size)}
              </span>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(file.id)}
                aria-label={`Remove ${file.name}`}
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}
