import { useEffect } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Undo2,
} from 'lucide-react';

import { htmlToMarkdown, markdownToHtml } from './markdown';

interface Props {
  /** The document, as Markdown. */
  value: string;
  /** Called with Markdown whenever the user changes something. */
  onChange: (markdown: string) => void;
  /** The agent is writing; the document is about to be replaced. */
  readOnly?: boolean;
}

/**
 * A document editor, not a Markdown textarea.
 *
 * The first version of this was a textarea on the Markdown source, which
 * is the right call for editing a config file and the wrong one for
 * editing a CV: the thing on screen was not the thing being produced, and
 * writing a sentence meant thinking about hashes and hyphens.
 *
 * So TipTap, in rich-text mode, with the conversion to and from Markdown
 * at the boundary -- see markdown.ts, where the round trip is tested,
 * because that crossing is the one place a document can quietly lose a
 * heading.
 *
 * Storage stays Markdown. The model writes it natively, it survives being
 * read by anything else, and the editor's HTML is a presentation of it
 * rather than the thing itself.
 */
export function DocumentEditor({ value, onChange, readOnly = false }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // A CV has no block quotes or horizontal rules, and every extra
        // node type is another way for the Markdown round trip to differ
        // from what the model wrote.
        blockquote: false,
        horizontalRule: false,
        codeBlock: false,
      }),
    ],
    content: markdownToHtml(value),
    editable: !readOnly,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-full focus:outline-none min-h-[320px]',
        'aria-label': 'Document',
      },
    },
    onUpdate: ({ editor }) => onChange(htmlToMarkdown(editor.getHTML())),
  });

  // The agent wrote a new version. Replace what is on screen -- but only
  // when it genuinely differs, because setContent moves the caret to the
  // start and doing that on every keystroke would make the editor
  // unusable.
  useEffect(() => {
    if (!editor) return;
    if (htmlToMarkdown(editor.getHTML()) === value) return;
    editor.commands.setContent(markdownToHtml(value), { emitUpdate: false });
  }, [value, editor]);

  useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [readOnly, editor]);

  if (!editor) return null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Toolbar editor={editor} disabled={readOnly} />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  const actions = [
    {
      icon: Bold,
      label: 'Bold',
      run: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive('bold'),
    },
    {
      icon: Italic,
      label: 'Italic',
      run: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive('italic'),
    },
    {
      icon: Heading1,
      label: 'Heading 1',
      run: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      active: editor.isActive('heading', { level: 1 }),
    },
    {
      icon: Heading2,
      label: 'Heading 2',
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive('heading', { level: 2 }),
    },
    {
      icon: List,
      label: 'Bullet list',
      run: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive('bulletList'),
    },
    {
      icon: ListOrdered,
      label: 'Numbered list',
      run: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive('orderedList'),
    },
    {
      icon: Undo2,
      label: 'Undo',
      run: () => editor.chain().focus().undo().run(),
      active: false,
    },
    {
      icon: Redo2,
      label: 'Redo',
      run: () => editor.chain().focus().redo().run(),
      active: false,
    },
  ];

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-0.5 border-b px-3 py-1.5">
      {actions.map(({ icon: Icon, label, run, active }) => (
        <button
          key={label}
          type="button"
          onClick={run}
          disabled={disabled}
          aria-label={label}
          aria-pressed={active}
          title={label}
          className={`rounded p-1.5 transition-colors disabled:opacity-40 ${
            active
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
