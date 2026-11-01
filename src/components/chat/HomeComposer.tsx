import React, { useEffect, useState } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FileUpload, { UploadedFile } from '../FileUpload';
import { AttachedFiles } from './AttachedFiles';

interface HomeComposerProps {
  onSubmit: (
    message: string,
    fileIds: string[],
    files: UploadedFile[]
  ) => Promise<void>;
  placeholder?: string;
  /** Prefill from a thinking-model card. Appended, so picking one mid-draft
      does not discard what is already typed. */
  seed?: string;
}

/**
 * The landing composer: the prompt, then a row of controls beneath it.
 *
 * Replaces FloatingChatInput, which was built for a light marketing hero -- a
 * gradient halo, a white glass panel and hard-coded gray-900 text that was
 * invisible on black.
 */
export const HomeComposer: React.FC<HomeComposerProps> = ({
  onSubmit,
  placeholder = 'Ask anything, or task an agent…',
  seed,
}) => {
  const [message, setMessage] = useState('');
  const [attachedFileIds, setAttachedFileIds] = useState<string[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (seed) setMessage(prev => (prev ? `${prev.trimEnd()}\n${seed}` : seed));
  }, [seed]);

  const handleSubmit = async () => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await onSubmit(message, attachedFileIds, attachedFiles);
    } catch {
      toast({
        description: 'Could not start the task. Please try again.',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-border bg-card/60 transition-colors focus-within:border-muted-foreground/30">
        <AttachedFiles
          files={attachedFiles}
          onRemove={id => {
            setAttachedFileIds(ids => ids.filter(i => i !== id));
            setAttachedFiles(files => files.filter(f => f.id !== id));
          }}
        />

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className="max-h-[220px] min-h-[64px] w-full resize-none border-0 bg-transparent px-5 pt-5 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${Math.min(target.scrollHeight, 220)}px`;
          }}
        />

        <div className="flex items-center gap-2 px-4 pb-4 pt-2">
          <FileUpload
            onFilesUploaded={(fileIds, details) => {
              // Appended, not replaced: attaching a second time should add
              // to what is there, the way picking files twice does
              // everywhere else.
              setAttachedFileIds(ids => [...ids, ...fileIds]);
              setAttachedFiles(files => [...files, ...details]);
            }}
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!message.trim() || isLoading}
            aria-label="Send"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-accent text-foreground transition-opacity hover:bg-accent/80 disabled:opacity-40"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
