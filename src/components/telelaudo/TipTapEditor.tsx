import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import CharacterCount from "@tiptap/extension-character-count";
import Typography from "@tiptap/extension-typography";
import { useState, useEffect, useCallback, useRef } from "react";
import { REPORT_MACROS, ReportMacro } from "@/lib/report-macros";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Heading2, Heading3, Undo, Redo, Slash, AlignLeft, AlignCenter,
  AlignRight, Highlighter, FileText,
} from "lucide-react";

interface TipTapEditorProps {
  content: string;
  onChange: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const TipTapEditor = ({ content, onChange, disabled, placeholder, className }: TipTapEditorProps) => {
  const [macroSuggestions, setMacroSuggestions] = useState<ReportMacro[]>([]);
  const [showMacros, setShowMacros] = useState(false);
  const [macrosOpen, setMacrosOpen] = useState(false);
  const [macroSearch, setMacroSearch] = useState("");
  const isInternalUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: false }),
      CharacterCount,
      Typography,
      Placeholder.configure({
        placeholder: placeholder || "Digite o laudo ou use / para macros...",
      }),
    ],
    content: content?.startsWith("<") ? content : content ? `<p>${content.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>` : "",
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      isInternalUpdate.current = true;
      const html = ed.getHTML();
      onChange(html);

      // Check for macro triggers
      const text = ed.getText();
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

      // Reset after a tick
      setTimeout(() => { isInternalUpdate.current = false; }, 50);
    },
  });

  // Sync content from parent (only when not focused / not internal update)
  useEffect(() => {
    if (!editor || !content) return;
    if (isInternalUpdate.current) return;
    const currentHTML = editor.getHTML();
    if (currentHTML !== content && !editor.isFocused) {
      editor.commands.setContent(content || "");
    }
  }, [content]);

  // Update editable state
  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  // Escape closes macro dropdown
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showMacros) {
        setShowMacros(false);
      }
      if ((e.key === "Enter" || e.key === "Tab") && showMacros && macroSuggestions.length > 0) {
        e.preventDefault();
        applyMacroInline(macroSuggestions[0]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showMacros, macroSuggestions]);

  const applyMacroInline = useCallback(
    (macro: ReportMacro) => {
      if (!editor) return;
      const text = editor.getText();
      const lines = text.split("\n");
      lines.pop();
      const prefix = lines.join("\n");
      const macroHtml = macro.text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n\n/g, "</p><p>")
        .replace(/\n/g, "<br/>");
      const newHtml = prefix
        ? `<p>${prefix.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p><p>${macroHtml}</p>`
        : `<p>${macroHtml}</p>`;
      editor.commands.setContent(newHtml);
      onChange(editor.getHTML());
      setShowMacros(false);
    },
    [editor, onChange]
  );

  const insertStructureTemplate = useCallback(() => {
    if (!editor) return;
    const template = `<p><strong>TÉCNICA:</strong></p><p></p><p><strong>ACHADOS:</strong></p><p></p><p><strong>IMPRESSÃO DIAGNÓSTICA:</strong></p><p></p>`;
    editor.commands.insertContent(template);
    onChange(editor.getHTML());
  }, [editor, onChange]);

  const insertSectionHeader = useCallback((header: string) => {
    if (!editor) return;
    editor.commands.insertContent(`<p><strong>${header}</strong></p>`);
    onChange(editor.getHTML());
  }, [editor, onChange]);

  const categories = [...new Set(REPORT_MACROS.map((m) => m.category))];
  const filteredMacros = REPORT_MACROS.filter(m =>
    !macroSearch ||
    m.label.toLowerCase().includes(macroSearch.toLowerCase()) ||
    m.trigger.includes(macroSearch)
  );

  if (!editor) return null;

  const words = editor.storage.characterCount.words();
  const chars = editor.storage.characterCount.characters();

  return (
    <TooltipProvider delayDuration={300}>
      <div className={`flex flex-col h-full relative ${className || ""}`}>
        {/* Toolbar Line 1 — Text formatting */}
        <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-border bg-card/30 flex-wrap">
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant={editor.isActive("bold") ? "default" : "ghost"} className="h-7 w-7"
              onClick={() => editor.chain().focus().toggleBold().run()} disabled={disabled}>
              <Bold className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent>Negrito (Ctrl+B)</TooltipContent></Tooltip>

          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant={editor.isActive("italic") ? "default" : "ghost"} className="h-7 w-7"
              onClick={() => editor.chain().focus().toggleItalic().run()} disabled={disabled}>
              <Italic className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent>Itálico (Ctrl+I)</TooltipContent></Tooltip>

          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant={editor.isActive("underline") ? "default" : "ghost"} className="h-7 w-7"
              onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={disabled}>
              <UnderlineIcon className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent>Sublinhado (Ctrl+U)</TooltipContent></Tooltip>

          <div className="w-px h-5 bg-border mx-0.5" />

          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"} className="h-7 w-7"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} disabled={disabled}>
              <Heading2 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent>Título H2</TooltipContent></Tooltip>

          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant={editor.isActive("heading", { level: 3 }) ? "default" : "ghost"} className="h-7 w-7"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} disabled={disabled}>
              <Heading3 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent>Título H3</TooltipContent></Tooltip>

          <div className="w-px h-5 bg-border mx-0.5" />

          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant={editor.isActive({ textAlign: "left" }) ? "default" : "ghost"} className="h-7 w-7"
              onClick={() => editor.chain().focus().setTextAlign("left").run()} disabled={disabled}>
              <AlignLeft className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent>Alinhar Esquerda</TooltipContent></Tooltip>

          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant={editor.isActive({ textAlign: "center" }) ? "default" : "ghost"} className="h-7 w-7"
              onClick={() => editor.chain().focus().setTextAlign("center").run()} disabled={disabled}>
              <AlignCenter className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent>Centralizar</TooltipContent></Tooltip>

          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant={editor.isActive({ textAlign: "right" }) ? "default" : "ghost"} className="h-7 w-7"
              onClick={() => editor.chain().focus().setTextAlign("right").run()} disabled={disabled}>
              <AlignRight className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent>Alinhar Direita</TooltipContent></Tooltip>

          <div className="w-px h-5 bg-border mx-0.5" />

          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant={editor.isActive("highlight") ? "default" : "ghost"} className="h-7 w-7"
              onClick={() => editor.chain().focus().toggleHighlight().run()} disabled={disabled}>
              <Highlighter className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent>Destacar</TooltipContent></Tooltip>

          <div className="w-px h-5 bg-border mx-0.5" />

          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7"
              onClick={() => editor.chain().focus().undo().run()} disabled={disabled || !editor.can().undo()}>
              <Undo className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent>Desfazer (Ctrl+Z)</TooltipContent></Tooltip>

          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7"
              onClick={() => editor.chain().focus().redo().run()} disabled={disabled || !editor.can().redo()}>
              <Redo className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent>Refazer (Ctrl+Y)</TooltipContent></Tooltip>
        </div>

        {/* Toolbar Line 2 — Structure & Macros */}
        <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-border bg-card/20 flex-wrap">
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant={editor.isActive("bulletList") ? "default" : "ghost"} className="h-7 w-7"
              onClick={() => editor.chain().focus().toggleBulletList().run()} disabled={disabled}>
              <List className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent>Lista com marcadores</TooltipContent></Tooltip>

          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant={editor.isActive("orderedList") ? "default" : "ghost"} className="h-7 w-7"
              onClick={() => editor.chain().focus().toggleOrderedList().run()} disabled={disabled}>
              <ListOrdered className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent>Lista numerada</TooltipContent></Tooltip>

          <div className="w-px h-5 bg-border mx-0.5" />

          <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-semibold"
            onClick={() => insertSectionHeader("TÉCNICA:")} disabled={disabled}>
            TÉCNICA
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-semibold"
            onClick={() => insertSectionHeader("ACHADOS:")} disabled={disabled}>
            ACHADOS
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-semibold"
            onClick={() => insertSectionHeader("IMPRESSÃO DIAGNÓSTICA:")} disabled={disabled}>
            IMPRESSÃO
          </Button>

          <div className="w-px h-5 bg-border mx-0.5" />

          <Tooltip><TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 px-2 text-[10px] gap-1"
              onClick={insertStructureTemplate} disabled={disabled}>
              <FileText className="w-3 h-3" /> Estrutura Completa
            </Button>
          </TooltipTrigger><TooltipContent>Inserir template TÉCNICA / ACHADOS / IMPRESSÃO</TooltipContent></Tooltip>

          <div className="flex-1" />

          <Popover open={macrosOpen} onOpenChange={(open) => { setMacrosOpen(open); if (!open) setMacroSearch(""); }}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={disabled}>
                <Slash className="w-3 h-3" /> Macros
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="end">
              <Input
                placeholder="Buscar macro..."
                value={macroSearch}
                onChange={(e) => setMacroSearch(e.target.value)}
                className="m-2 h-7 text-xs w-[calc(100%-16px)]"
                autoFocus
              />
              <ScrollArea className="max-h-64">
                {categories.filter(cat => filteredMacros.some(m => m.category === cat)).map((cat) => (
                  <div key={cat}>
                    <div className="px-3 py-1.5 bg-muted/50 text-[10px] font-semibold uppercase text-muted-foreground">
                      {cat}
                    </div>
                    {filteredMacros.filter((m) => m.category === cat).map((macro) => (
                      <button
                        key={macro.id}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors flex items-center justify-between"
                        onClick={() => {
                          applyMacroInline(macro);
                          setMacrosOpen(false);
                          setMacroSearch("");
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

        {/* Word count footer */}
        <div className="px-3 py-1 border-t border-border bg-card/20 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{words} palavras · {chars} caracteres</span>
          <span className={
            words >= 150 ? "text-green-500" :
            words >= 50 ? "text-warning" :
            "text-destructive"
          }>
            {words >= 150
              ? "✓ Completo"
              : words >= 50
              ? `${150 - words} para mínimo`
              : "Laudo muito curto"}
          </span>
        </div>

        {/* Inline macro suggestions */}
        {showMacros && macroSuggestions.length > 0 && (
          <div className="absolute bottom-10 left-3 right-3 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="px-3 py-1.5 text-[10px] text-muted-foreground border-b border-border">
              Macros encontradas — clique para inserir · Enter/Tab seleciona · Esc fecha
            </div>
            {macroSuggestions.slice(0, 6).map((macro) => (
              <button
                key={macro.id}
                className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors flex items-center justify-between"
                onClick={() => applyMacroInline(macro)}
              >
                <div>
                  <span className="text-[9px] text-muted-foreground block">{macro.category}</span>
                  <span className="font-medium">{macro.label}</span>
                </div>
                <Badge variant="secondary" className="text-[9px] font-mono">
                  {macro.trigger}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default TipTapEditor;
