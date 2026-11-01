import React from 'react';
import { CornerDownLeft, Loader2 } from 'lucide-react';
import FileUpload from '../FileUpload';
import { AttachedFiles } from './AttachedFiles';

interface ChatInputSectionProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onFilesUploaded: (fileIds: string[], fileDetails: any[]) => void;
  attachedFileIds: string[];
  attachedFileDetails: any[];
  setAttachedFileIds: React.Dispatch<React.SetStateAction<string[]>>;
  setAttachedFileDetails: React.Dispatch<React.SetStateAction<any[]>>;
  isStreaming: boolean;
  isLoadingHistory: boolean;
}

export const ChatInputSection: React.FC<ChatInputSectionProps> = ({
  inputValue,
  setInputValue,
  onSendMessage,
  onKeyPress,
  onFilesUploaded,
  attachedFileIds,
  attachedFileDetails,
  setAttachedFileIds,
  setAttachedFileDetails,
  isStreaming,
  isLoadingHistory
}) => {
  const busy = isStreaming || isLoadingHistory;
  const canSend = Boolean(inputValue.trim()) && !busy;

  return (
    <div className="space-y-2">
      <AttachedFiles
        files={attachedFileDetails}
        onRemove={id => {
          setAttachedFileIds(ids => ids.filter(i => i !== id));
          setAttachedFileDetails(files => files.filter(f => f.id !== id));
        }}
      />

      {/* A filled, borderless field: it reads as one soft shape against the
          conversation rather than an outlined box bolted to the bottom.
          Deeply rounded, but not rounded-full -- a fully round field turns
          into a lozenge the moment the text wraps to three lines. */}
      <div className="relative rounded-[22px] bg-muted/60 transition-colors focus-within:bg-muted">
        {/* Both controls sit inside the field, flanking the text. The
            padding below reserves their lanes, so a long message wraps
            above them instead of running underneath. */}
        <div className="absolute bottom-[11px] left-2">
          <FileUpload
            onFilesUploaded={onFilesUploaded}
            disabled={busy}
            variant="ghost"
            className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:bg-background/60 hover:text-foreground"
          />
        </div>

        <textarea
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder={busy ? 'Working…' : 'Reply'}
          disabled={busy}
          rows={1}
          className="max-h-[160px] min-h-[52px] w-full resize-none border-0 bg-transparent py-[15px] pl-12 pr-12 text-[15px] leading-[22px] text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
        />

        {/* A glyph, not a filled button. The send only confirms what Enter
            already does, so it should not be the loudest thing in the bar. */}
        <button
          type="button"
          onClick={onSendMessage}
          disabled={!canSend}
          aria-label="Send message"
          className="absolute bottom-[13px] right-3 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground"
        >
          {isStreaming ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin" />
          ) : (
            <CornerDownLeft className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>

      <p className="hidden text-center text-[11px] text-muted-foreground sm:block">
        AI can make mistakes. Check anything important.
      </p>
    </div>
  );
};
