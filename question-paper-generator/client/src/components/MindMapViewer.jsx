import { useState } from 'react';
import { Brain, Download, ZoomIn, ZoomOut } from 'lucide-react';

function MindMapViewer({ mindmap }) {
  const [zoom, setZoom] = useState(1);

  if (!mindmap || !mindmap.nodes || mindmap.nodes.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <Brain className="mx-auto text-gray-400 mb-4" size={48} />
        <p className="text-gray-600">No mind map data available</p>
      </div>
    );
  }

  const centralTopic = mindmap.central_topic || mindmap.nodes[0]?.label || 'Central Topic';
  const nodes = mindmap.nodes || [];
  const connections = mindmap.connections || [];

  // Organize nodes by level
  const nodesByLevel = {};
  nodes.forEach((node) => {
    const level = node.level || 1;
    if (!nodesByLevel[level]) {
      nodesByLevel[level] = [];
    }
    nodesByLevel[level].push(node);
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Brain className="text-indigo-600" size={24} />
          <h2 className="text-xl font-bold text-gray-900">Mind Map</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ZoomIn size={20} />
          </button>
        </div>
      </div>

      <div className="overflow-auto border-2 border-gray-200 rounded-lg p-8 bg-gray-50" style={{ minHeight: '400px' }}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
          {/* Central Topic */}
          <div className="flex justify-center mb-8">
            <div className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg">
              {centralTopic}
            </div>
          </div>

          {/* Nodes by Level */}
          {Object.keys(nodesByLevel).map((level) => (
            <div key={level} className="mb-6">
              <div className="flex flex-wrap justify-center gap-4">
                {nodesByLevel[level].map((node, idx) => (
                  <div
                    key={node.id || idx}
                    className={`px-4 py-2 rounded-lg shadow-md ${
                      level === '1' || level === 1
                        ? 'bg-blue-500 text-white'
                        : level === '2' || level === 2
                        ? 'bg-green-500 text-white'
                        : 'bg-yellow-500 text-white'
                    }`}
                  >
                    {node.label}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Simple Connection Lines (visual representation) */}
          {connections.length > 0 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              <p>{connections.length} connections identified</p>
            </div>
          )}
        </div>
      </div>

      {/* Node List */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">All Topics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {nodes.map((node, idx) => (
            <div key={node.id || idx} className="text-sm text-gray-700">
              • {node.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MindMapViewer;








