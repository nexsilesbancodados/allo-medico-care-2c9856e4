import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useState, useEffect, useCallback, useRef } from "react";
import { REPORT_MACROS, ReportMacro } from "@/lib/report-macros";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bold, Italic, List, Heading2, Undo, Redo, Slash } from "lucide-react";

interface TipTapEditorProps {
  content: string;
  onChange: (text: string) => void;
  disabled?: boolean;
}

const TipTapEditor = ({ content, onChange, disabled }: TipTapEditorProps) => {
  const [macroSuggestions, setMacroSuggestions] = useState<ReportMacro[]>([]);
  const [showMacros, setShowMacros] = useState(false);
  const [macrosOpen, setMacrosOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Dite ou digite o laudo aqui... Use / para macros (ex: /torax-normal)",
      }),
    ],
    content: content || "",
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      onChange(text);

      // Check for macro triggers
      const lines = text.split("\n");
      const lastLine = lines[lines.length - 1]?.trim().toLowerCase() || "";
      if (lastLine.startsWith("/") && lastLine.length > 1) {
        const query = lastLine;
        const matches = REPORT_MACROS.filter(
          (m) => m.trigger.startsWith(query) || m.label.toLowerCase().includes(query.slice(1))
        );
        setMacroSuggestions(matches);
        setShowMacros(matches.length > 0);
      } else {
        setShowMacros(false);
      }
    },
  });

  // Sync content from parent
  useEffect(() => {
    if (editor && content !== editor.getText()) {
      editor.commands.setContent(content || "");
    }
  }, [content]);

  // Update editable state
  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  const applyMacro = useCallback(
    (macro: ReportMacro) => {
      if (!editor) return;
      // Replace the trigger line with the macro text
      const text = editor.getText();
      const lines = text.split("\n");
      lines.pop(); // Remove trigger line
      const newContent = lines.length > 0 ? lines.join("\n") + "\n\n" + macro.text : macro.text;
      editor.commands.setContent(newContent);
      onChange(newContent);
      setShowMacros(false);
    },
    [editor, onChange]
  );

  const categories = [...new Set(REPORT_MACROS.map((m) => m.category))];

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full relative">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1.5 border-b border-border bg-card/30 flex-wrap">
        <Button size="icon"
          variant={editor.isActive("bold") ? "default" : "ghost"}
          className="h-7 w-7"
          aria-label="Ação" onClick={() =>  editor.chain().focus().toggleBold().run()}
          disabled={disabled}
        >
          <Bold className="w-3.5 h-3.5" />
        </Button>
        <Button size="icon"
          variant={editor.isActive("italic") ? "default" : "ghost"}
          className="h-7 w-7"
          aria-label="Ação" onClick={() =>  editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
        >
          <Italic className="w-3.5 h-3.5" />
        </Button>
        <Button size="icon"
          variant={editor.isActive("heading") ? "default" : "ghost"}
          className="h-7 w-7"
          aria-label="Ação" onClick={() =>  editor.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={disabled}
        >
          <Heading2 className="w-3.5 h-3.5" />
        </Button>
        <Button size="icon"
          variant={editor.isActive("bulletList") ? "default" : "ghost"}
          className="h-7 w-7"
          aria-label="Ação" onClick={() =>  editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
        >
          <List className="w-3.5 h-3.5" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button size="icon"
          variant="ghost"
          className="h-7 w-7"
          aria-label="Ação" onClick={() =>  editor.chain().focus().undo().run()}
          disabled={disabled}
        >
          <Undo className="w-3.5 h-3.5" />
        </Button>
        <Button size="icon"
          variant="ghost"
          className="h-7 w-7"
          aria-label="Ação" onClick={() =>  editor.chain().focus().redo().run()}
          disabled={disabled}
        >
          <Redo className="w-3.5 h-3.5" />
        </Button>
        <div className="flex-1" />
        <Popover open={macrosOpen} onOpenChange={setMacrosOpen}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={disabled}>
              <Slash className="w-3 h-3" /> Macros
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="end">
            <ScrollArea className="max-h-64">
              {categories.map((cat) => (
                <div key={cat}>
                  <div className="px-3 py-1.5 bg-muted/50 text-[10px] font-semibold uppercase text-muted-foreground">
                    {cat}
                  </div>
                  {REPORT_MACROS.filter((m) => m.category === cat).map((macro) => (
                    <button
                      key={macro.id}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors flex items-center justify-between"
                      onClick={() => {
                        applyMacro(macro);
                        setMacrosOpen(false);
                      }}
                    >
                      <span>{macro.label}</span>
                      <Badge variant="outline" className="text-[9px] font-mono">
                        {macro.trigger}
                      </Badge>
                    </button>
                  ))}
                </div>
              ))}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto p-3">
        <EditorContent
          editor={editor}
          className="prose prose-sm dark:prose-invert max-w-none min-h-full [&_.tiptap]:outline-none [&_.tiptap]:min-h-[200px] [&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_p.is-editor-empty:first-child::before]:h-0"
        />
      </div>

      {/* Inline macro suggestions */}
      {showMacros && macroSuggestions.length > 0 && (
        <div className="absolute bottom-2 left-3 right-3 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-1.5 text-[10px] text-muted-foreground border-b border-border">
            Macros encontradas — clique para inserir
          </div>
          {macroSuggestions.slice(0, 5).map((macro) => (
            <button
              key={macro.id}
              className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors flex items-center justify-between"
              onClick={() => applyMacro(macro)}
            >
              <span className="font-medium">{macro.label}</span>
              <Badge variant="secondary" className="text-[9px] font-mono">
                {macro.trigger}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TipTapEditor;
