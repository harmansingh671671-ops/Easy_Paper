import { useState } from 'react';
import { FileText, Download, Copy, Check } from 'lucide-react';

function NotesViewer({ notes, title = 'Short Notes' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(notes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([notes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_notes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="text-indigo-600" size={24} />
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Copy notes"
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
          <button
            onClick={handleDownload}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Download notes"
          >
            <Download size={20} />
          </button>
        </div>
      </div>
      
      <div className="prose max-w-none">
        <pre className="whitespace-pre-wrap text-gray-700 font-sans bg-gray-50 p-4 rounded-lg border border-gray-200">
          {notes}
        </pre>
      </div>
    </div>
  );
}

export default NotesViewer;








