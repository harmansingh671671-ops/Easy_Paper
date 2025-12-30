import { useState } from 'react';
import { FileText, Download, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';

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
    const element = document.getElementById('notes-content');
    const opt = {
      margin: [10, 10, 10, 10], // top, left, bottom, right in mm
      filename: `${title.replace(/\s+/g, '_')}_notes.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Generate PDF
    html2pdf().set(opt).from(element).save();
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
            title="Download PDF"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      <div
        id="notes-content"
        className="prose max-w-none prose-indigo 
          prose-headings:font-bold prose-headings:text-gray-900 
          prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg 
          prose-p:text-gray-700 prose-p:leading-relaxed
          prose-ul:list-disc prose-ul:pl-5 
          prose-li:text-gray-700 prose-li:my-1
          [&_ul_ul]:list-[circle] [&_ul_ul]:pl-6 [&_ul_ul]:my-1
          [&_ul_ul_ul]:list-[square] [&_ul_ul_ul]:pl-6
          space-y-4"
      >
        <ReactMarkdown>{notes}</ReactMarkdown>
      </div>
    </div>
  );
}

export default NotesViewer;








