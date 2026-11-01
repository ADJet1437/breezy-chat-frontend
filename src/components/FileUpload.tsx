import React, { useRef, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { authenticatedPost } from '../utils/authenticatedFetch';
import { buildApiUrl } from '../utils/apiConfig';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface FileUploadProps {
  onFilesUploaded: (fileIds: string[], fileDetails: UploadedFile[]) => void;
  disabled?: boolean;
  missionId?: string | null;
}

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED = [
  'text/plain', 'text/csv', 'text/markdown',
  'application/pdf', 'application/json', 'application/xml',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
];

function rejectionFor(file: File): string | null {
  if (file.size > MAX_BYTES) return 'is larger than 10MB';
  if (!ALLOWED.includes(file.type) && !file.type.startsWith('text/')) {
    return 'is not a supported file type';
  }
  return null;
}

/**
 * Attach files to a message.
 *
 * The button opens the file picker and the upload starts immediately —
 * there is no dialog. The old one made attaching a three-step errand:
 * open a modal, choose files, press Upload, then press "Attach 2 File(s)"
 * to dismiss it. Every chat application does this in one click because
 * choosing the file IS the intent; nothing is being configured in between.
 *
 * What was lost with the modal is the drop zone, which is no loss: the
 * composer accepts a drop anywhere, which is a larger target than a
 * rectangle you must first open a dialog to see.
 */
const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUploaded,
  disabled,
  missionId,
}) => {
  const [uploading, setUploading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const upload = async (file: File): Promise<UploadedFile | null> => {
    const body = new FormData();
    body.append('file', file);
    if (missionId) body.append('mission_id', missionId);
    try {
      const response = await authenticatedPost(
        buildApiUrl('/api/v1/files/upload'),
        body
      );
      if (!response.ok) throw new Error(String(response.status));
      const { file: stored } = await response.json();
      return {
        id: stored.id,
        name: stored.name,
        size: stored.size || file.size,
        type: stored.mime_type || file.type,
      };
    } catch {
      return null;
    }
  };

  const take = async (chosen: FileList | null) => {
    if (!chosen?.length) return;

    const accepted: File[] = [];
    const refused: string[] = [];
    for (const file of Array.from(chosen)) {
      const why = rejectionFor(file);
      if (why) refused.push(`${file.name} ${why}`);
      else accepted.push(file);
    }
    if (refused.length) {
      toast({ description: refused.join('\n'), variant: 'destructive', duration: 5000 });
    }
    if (!accepted.length) return;

    setUploading(true);
    const results = await Promise.all(accepted.map(upload));
    const done = results.filter((f): f is UploadedFile => f !== null);
    const failed = accepted.filter((_, i) => results[i] === null).map(f => f.name);
    setUploading(false);

    if (failed.length) {
      toast({
        description: `Could not upload ${failed.join(', ')}`,
        variant: 'destructive',
        duration: 5000,
      });
    }
    // No success toast: the file appears in the composer, which says it
    // better and does not cover the conversation to do so.
    if (done.length) onFilesUploaded(done.map(f => f.id), done);
  };

  return (
    <>
      <input
        ref={input}
        type="file"
        multiple
        className="hidden"
        onChange={e => {
          void take(e.target.files);
          // Reset, or choosing the same file twice in a row does nothing.
          e.target.value = '';
        }}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => input.current?.click()}
        disabled={disabled || uploading}
        aria-label="Attach files"
        title="Attach files"
        className="h-10 w-10 rounded-xl p-2"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </Button>
    </>
  );
};

export default FileUpload;
