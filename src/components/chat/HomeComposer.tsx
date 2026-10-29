import React, { useEffect, useState } from 'react';
import { ArrowUp, Loader2, Network, Paperclip, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FileUpload from '../FileUpload';
import { AttachedFile } from '../../types/chat';

interface HomeComposerProps {
  onSubmit: (message: string, fileIds: string[]) => Promise<void>;
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
  const [swarm, setSwarm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (seed) setMessage(prev => (prev ? `${prev.trimEnd()}\n${seed}` : seed));
  }, [seed]);

  const handleSubmit = async () => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await onSubmit(message, attachedFileIds);
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
        {attachedFileIds.length > 0 && (
          <div className="flex items-center gap-2 border-b border-border px-5 py-2 text-sm text-muted-foreground">
            <Paperclip className="h-3.5 w-3.5" />
            <span>{attachedFileIds.length} file(s) attached</span>
            <button
              type="button"
              onClick={() => setAttachedFileIds([])}
              className="ml-auto rounded p-0.5 hover:text-foreground"
              aria-label="Remove attached files"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

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
            onFilesUploaded={(fileIds: string[], _details: AttachedFile[]) =>
              setAttachedFileIds(fileIds)
            }
          />

          {/* Routing hint sent with the task. The backend does not read it yet,
              so it is local state until a mode parameter exists. */}
          <button
            type="button"
            onClick={() => setSwarm(v => !v)}
            aria-pressed={swarm}
            className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
              swarm
                ? 'bg-blue-500/15 text-blue-400'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <Network className="h-4 w-4" />
            Swarm
          </button>

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
