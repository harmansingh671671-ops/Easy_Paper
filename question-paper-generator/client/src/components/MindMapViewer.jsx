import { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Brain } from 'lucide-react';
import dagre from 'dagre';

const nodeWidth = 180;
const nodeHeight = 50;

const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    // Only layout visible nodes to avoid gaps or incorrect positioning
    if (!node.hidden) {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    }
  });

  edges.forEach((edge) => {
    if (!edge.hidden) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    if (node.hidden) return node;

    // Use safe access in case dagre didn't layout this node (though it should have if hidden check passed)
    const nodeWithPosition = dagreGraph.node(node.id);
    if (!nodeWithPosition) return node;

    node.targetPosition = direction === 'LR' ? 'left' : 'top';
    node.sourcePosition = direction === 'LR' ? 'right' : 'bottom';

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes: layoutedNodes, edges };
};

function MindMapViewer({ mindmap }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [direction] = useState('LR'); // Horizontal Layout

  useEffect(() => {
    if (mindmap && mindmap.nodes && mindmap.nodes.length > 0) {
      const { nodes: contextNodes, connections } = mindmap;

      // Initial setup - mapping API data to ReactFlow structure
      // HIDE nodes deeper than Level 1 initially
      const initialNodes = contextNodes.map(n => ({
        id: n.id,
        type: 'default',
        data: { label: n.label },
        position: { x: 0, y: 0 },
        style: {
          background: n.level === 0 ? '#4338ca' : (n.level === 1 ? '#e0e7ff' : '#ffffff'),
          color: n.level === 0 ? '#ffffff' : '#1f2937',
          border: n.level === 0 ? 'none' : '1px solid #e0e7ff',
          borderRadius: '12px',
          padding: '12px',
          width: nodeWidth,
          fontSize: n.level === 0 ? '14px' : '12px',
          fontWeight: n.level === 0 ? '600' : 'normal',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        },
        level: n.level,
        hidden: n.level > 1 // Collapsed by default
      }));

      const initialEdges = connections.map((c, i) => ({
        id: `e${i}`,
        source: c.from,
        target: c.to,
        type: 'default', // Bezier
        markerEnd: { type: MarkerType.ArrowClosed, color: '#9ca3af' },
        style: { stroke: '#9ca3af', strokeWidth: 2 },
        animated: true,
        hidden: false
      }));

      // Also hide edges connected to hidden nodes
      // A simple pass: if target node is hidden, hide edge
      initialEdges.forEach(edge => {
        const targetNode = initialNodes.find(n => n.id === edge.target);
        if (targetNode && targetNode.hidden) {
          edge.hidden = true;
        }
      });

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        initialNodes,
        initialEdges,
        direction
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
  }, [mindmap, direction, setNodes, setEdges]);

  const onNodeClick = useCallback((event, clickedNode) => {
    // Logic: Toggle children visibility
    const childrenIds = edges.filter(e => e.source === clickedNode.id).map(e => e.target);
    if (childrenIds.length === 0) return;

    const firstChildId = childrenIds[0];
    const isExpanded = !nodes.find(n => n.id === firstChildId)?.hidden;

    const newHiddenState = isExpanded; // If expanded, we hide. If hidden, we show.

    // Recursive or Direct? User asked to "show the rest... when user clicks".
    // Let's do direct children toggle to keep it hierarchical.

    const updatedNodes = nodes.map(n => {
      if (childrenIds.includes(n.id)) {
        return { ...n, hidden: newHiddenState };
      }
      return n;
    });

    const updatedEdges = edges.map(e => {
      if (e.source === clickedNode.id) {
        return { ...e, hidden: newHiddenState };
      }
      return e;
    });

    // Re-calculate layout for visible nodes
    const { nodes: newLayoutNodes, edges: newLayoutEdges } = getLayoutedElements(
      updatedNodes,
      updatedEdges,
      direction
    );

    setNodes(newLayoutNodes);
    setEdges(newLayoutEdges);

  }, [nodes, edges, direction, setNodes, setEdges]);

  if (!mindmap || !mindmap.nodes || mindmap.nodes.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <Brain className="mx-auto text-gray-400 mb-4" size={48} />
        <p className="text-gray-600">No mind map data available</p>
      </div>
    );
  }

  return (
    <div className="h-[600px] border-2 border-gray-100 rounded-lg bg-gray-50 overflow-hidden relative group">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-right"
      >
        <Background gap={20} size={1} color="#e5e7eb" />
        <Controls showInteractive={false} className="bg-white border shadow-sm rounded-lg" />
      </ReactFlow>

      <div className="absolute top-4 right-4 bg-white/90 p-2 rounded-lg shadow-sm text-xs text-gray-500 backdrop-blur-sm flex flex-col gap-2">
        <div className="font-semibold text-gray-700 mb-1">Controls</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Click nodes to toggle sub-branches
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gray-400"></span> Drag canvas to pan
        </div>
      </div>
    </div>
  );
}

export default MindMapViewer;
