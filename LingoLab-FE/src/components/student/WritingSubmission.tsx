import {
  FileText,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Undo,
  Redo,
} from "lucide-react";

interface WritingSubmissionProps {
  text: string;
  onChange: (text: string) => void;
  readOnly?: boolean;
  autoSaved?: boolean;
}

export function WritingSubmission({
  text,
  onChange,
  readOnly = false,
  autoSaved = false,
}: WritingSubmissionProps) {
  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span className="bg-purple-100 text-purple-600 p-1.5 rounded-md">
            <FileText size={20} />
          </span>
          <h3 className="font-bold text-slate-900">Written Response</h3>
        </div>
        {!readOnly && autoSaved && (
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Auto-saved
          </span>
        )}
      </div>

      {/* Toolbar */}
      {!readOnly && (
        <div className="px-4 py-2 border-b border-slate-200 flex items-center gap-1 flex-wrap bg-white">
          <button
            type="button"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
            title="Bold"
          >
            <Bold size={18} />
          </button>
          <button
            type="button"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
            title="Italic"
          >
            <Italic size={18} />
          </button>
          <button
            type="button"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
            title="Underline"
          >
            <Underline size={18} />
          </button>
          <div className="w-px h-5 bg-slate-300 mx-2"></div>
          <button
            type="button"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
            title="Bullet List"
          >
            <List size={18} />
          </button>
          <button
            type="button"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
            title="Numbered List"
          >
            <ListOrdered size={18} />
          </button>
          <div className="w-px h-5 bg-slate-300 mx-2"></div>
          <button
            type="button"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
            title="Undo"
          >
            <Undo size={18} />
          </button>
          <button
            type="button"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
            title="Redo"
          >
            <Redo size={18} />
          </button>
        </div>
      )}

      {/* Text Input */}
      <div className="relative">
        <textarea
          className="w-full h-[400px] p-6 text-base text-slate-900 bg-white border-none focus:ring-0 resize-none font-sans leading-relaxed outline-none"
          placeholder="Start typing your essay here..."
          value={text}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
        />
        {/* Word Count */}
        <div className="absolute bottom-4 right-6 bg-white border border-slate-200 shadow-sm rounded-full px-3 py-1 text-xs font-medium text-slate-500 flex items-center gap-2">
          <span>{wordCount} words</span>
        </div>
      </div>
    </div>
  );
}

export default WritingSubmission;

