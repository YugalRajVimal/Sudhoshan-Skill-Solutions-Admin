import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const RichTextEditor = ({ value, onChange }: any) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="border rounded-lg p-3 bg-white">
      {/* Toolbar */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className="btn">B</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className="btn">I</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className="btn">H1</button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className="btn">• List</button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} className="min-h-[200px] outline-none" />
    </div>
  );
};

export default RichTextEditor;