import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Network,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Info,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  X
} from 'lucide-react';
import { NetworkGraphData, GraphNodeData, GraphEdgeData } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';
import { api } from '../../services/api';

interface NetworkGraphViewProps {
  onNavigateToInvestigator: (accountId: number) => void;
}

export const NetworkGraphView: React.FC<NetworkGraphViewProps> = ({ onNavigateToInvestigator }) => {
  const [graphData, setGraphData] = useState<NetworkGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const [nodeSearch, setNodeSearch] = useState('');
  const [activePatternFilter, setActivePatternFilter] = useState<string>('ALL');
  
  // Transform & Pan/Zoom State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchGraph = async () => {
    try {
      setLoading(true);
      const data = await api.getNetworkGraph({ limit_nodes: 70 });
      setGraphData(data);
    } catch (e) {
      console.error('Failed to load network graph', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  // Compute node coordinates deterministically in a ring / cluster topology
  const positionedNodes = useMemo(() => {
    if (!graphData?.nodes) return [];
    const count = graphData.nodes.length;
    const width = 900;
    const height = 650;
    const centerX = width / 2;
    const centerY = height / 2;

    return graphData.nodes.map((node, i) => {
      let x = centerX;
      let y = centerY;

      if (node.mule_ring_id === 'RING-01-CIRCULAR') {
        // Pentagonal ring in top-left
        const subIndex = node.account_id - 51;
        const angle = (subIndex / 5) * 2 * Math.PI - Math.PI / 2;
        x = 240 + Math.cos(angle) * 110;
        y = 200 + Math.sin(angle) * 110;
      } else if (node.mule_ring_id === 'RING-02-FAN-IN') {
        // Star pattern in top-right with collector in center
        if (node.account_id === 64) {
          x = 680;
          y = 210;
        } else {
          const subIndex = node.account_id - 56;
          const angle = (subIndex / 8) * 2 * Math.PI;
          x = 680 + Math.cos(angle) * 125;
          y = 210 + Math.sin(angle) * 125;
        }
      } else if (node.mule_ring_id === 'RING-03-SMURF-FAN-OUT') {
        // Dispersal pattern in bottom-right
        if (node.account_id === 65) {
          x = 680;
          y = 480;
        } else {
          const subIndex = node.account_id - 66;
          const angle = (subIndex / 8) * 2 * Math.PI;
          x = 680 + Math.cos(angle) * 120;
          y = 480 + Math.sin(angle) * 120;
        }
      } else if (node.mule_ring_id === 'RING-04-RAPID-DRAIN') {
        // Rapid drain cluster in bottom-left
        const subIndex = node.account_id - 74;
        x = 250 + subIndex * 60;
        y = 480 + (subIndex % 2) * 50;
      } else {
        // Background legitimate nodes distributed in orbit
        const normIdx = i % 30;
        const radius = 220 + ((i % 3) * 60);
        const angle = (normIdx / 30) * 2 * Math.PI;
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      }

      return {
        ...node,
        x,
        y,
      };
    });
  }, [graphData]);

  // Lookup for quick edge coordinate resolution
  const nodePosMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    positionedNodes.forEach((n) => map.set(n.id, { x: n.x, y: n.y }));
    return map;
  }, [positionedNodes]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Filter highlighting
  const isNodeHighlighted = (node: GraphNodeData) => {
    if (nodeSearch) {
      const q = nodeSearch.toLowerCase();
      return (
        node.account_number.toLowerCase().includes(q) ||
        node.holder_name.toLowerCase().includes(q) ||
        String(node.account_id) === q
      );
    }
    if (activePatternFilter === 'CIRCULAR') return node.mule_ring_id === 'RING-01-CIRCULAR';
    if (activePatternFilter === 'FAN_IN') return node.mule_ring_id === 'RING-02-FAN-IN';
    if (activePatternFilter === 'FAN_OUT') return node.mule_ring_id === 'RING-03-SMURF-FAN-OUT';
    if (activePatternFilter === 'HIGH_RISK') return node.risk_score >= 60;
    return true;
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-12">
      {/* Top Controls Bar */}
      <div className="bg-cyber-900 border border-cyber-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search account by number, name, or ID..."
            value={nodeSearch}
            onChange={(e) => setNodeSearch(e.target.value)}
            className="w-full bg-cyber-950 border border-cyber-border rounded-lg pl-10 pr-4 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Pattern Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          <span className="text-slate-500 mr-1 flex items-center gap-1 text-[11px]">
            <Filter className="w-3.5 h-3.5" /> Topology:
          </span>
          {[
            { id: 'ALL', label: 'All Entities' },
            { id: 'CIRCULAR', label: 'Circular Ring' },
            { id: 'FAN_IN', label: 'Fan-In Hub' },
            { id: 'FAN_OUT', label: 'Smurf Fan-Out' },
            { id: 'HIGH_RISK', label: 'Flagged Mules' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePatternFilter(item.id)}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                activePatternFilter === item.id
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-[0_0_12px_rgba(0,242,254,0.3)]'
                  : 'bg-cyber-950 text-slate-300 border-cyber-border hover:bg-cyber-850'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Zoom & Fit Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
            className="p-2 rounded-lg bg-cyber-800 border border-cyber-border hover:bg-cyber-700 text-slate-300 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
            className="p-2 rounded-lg bg-cyber-800 border border-cyber-border hover:bg-cyber-700 text-slate-300 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-2 rounded-lg bg-cyber-800 border border-cyber-border hover:bg-cyber-700 text-slate-300 transition-colors"
            title="Fit View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={fetchGraph}
            className="p-2 rounded-lg bg-cyber-800 border border-cyber-border hover:bg-cyber-700 text-slate-300 transition-colors"
            title="Re-fetch Network Topology"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Graph Canvas and Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Canvas Area */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`lg:col-span-3 h-[680px] bg-cyber-950 border border-cyber-border rounded-xl relative overflow-hidden select-none cursor-grab active:cursor-grabbing radar-grid`}
        >
          {/* Legend Overlay */}
          <div className="absolute top-4 left-4 z-10 bg-cyber-900/90 border border-cyber-border/80 backdrop-blur-md rounded-lg p-3 text-[11px] font-mono text-slate-300 space-y-1.5 shadow-xl pointer-events-none">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
              Topological Legend
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
              <span>Confirmed Mule / Critical Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
              <span>High Risk / Structuring Node</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe]" />
              <span>Central Collector Hub / Gateway</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Normal Account</span>
            </div>
          </div>

          {/* SVG Canvas */}
          <svg
            className="w-full h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            <defs>
              {/* Arrow Marker */}
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="14"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#38bdf8" opacity="0.6" />
              </marker>
              <marker
                id="arrowhead-danger"
                markerWidth="8"
                markerHeight="6"
                refX="14"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#f43f5e" opacity="0.8" />
              </marker>
            </defs>

            {/* Directed Edges */}
            {graphData?.edges.map((edge) => {
              const srcPos = nodePosMap.get(edge.source);
              const tgtPos = nodePosMap.get(edge.target);
              if (!srcPos || !tgtPos) return null;

              const isSuspicious = edge.is_flagged || edge.risk_score >= 60;

              return (
                <g key={edge.id} className="transition-opacity duration-300">
                  <line
                    x1={srcPos.x}
                    y1={srcPos.y}
                    x2={tgtPos.x}
                    y2={tgtPos.y}
                    stroke={isSuspicious ? '#f43f5e' : '#1e2e54'}
                    strokeWidth={isSuspicious ? 2 : 1}
                    strokeDasharray={edge.pattern_type === 'CIRCULAR_FLOW' ? '4 2' : undefined}
                    opacity={isSuspicious ? 0.8 : 0.4}
                    markerEnd={isSuspicious ? 'url(#arrowhead-danger)' : 'url(#arrowhead)'}
                  />
                </g>
              );
            })}

            {/* Nodes */}
            {positionedNodes.map((node) => {
              const highlighted = isNodeHighlighted(node);
              const isSelected = selectedNode?.id === node.id;
              const isCritical = node.risk_level === 'CRITICAL' || node.is_mule;
              const isHigh = node.risk_level === 'HIGH';

              let nodeColor = '#10b981';
              let haloColor = 'rgba(16, 185, 129, 0.2)';
              if (isCritical) {
                nodeColor = '#f43f5e';
                haloColor = 'rgba(244, 63, 94, 0.4)';
              } else if (isHigh) {
                nodeColor = '#f59e0b';
                haloColor = 'rgba(245, 158, 11, 0.3)';
              } else if (node.risk_level === 'MEDIUM') {
                nodeColor = '#00f2fe';
                haloColor = 'rgba(0, 242, 254, 0.2)';
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(node);
                  }}
                  className={`cursor-pointer transition-all duration-300 ${
                    highlighted ? 'opacity-100' : 'opacity-20'
                  }`}
                >
                  {/* Outer Pulsing Halo */}
                  {(isCritical || isSelected) && (
                    <circle
                      r={isSelected ? 26 : 20}
                      fill="none"
                      stroke={nodeColor}
                      strokeWidth="2"
                      opacity="0.6"
                      className="animate-ping"
                    />
                  )}

                  {/* Halo fill */}
                  <circle
                    r={isSelected ? 22 : 16}
                    fill={haloColor}
                    stroke={isSelected ? '#00f2fe' : nodeColor}
                    strokeWidth={isSelected ? 3 : 1.5}
                  />

                  {/* Inner Core */}
                  <circle r={8} fill={nodeColor} />

                  {/* Node Label */}
                  <text
                    y={24}
                    textAnchor="middle"
                    fill={isSelected ? '#00f2fe' : '#e2e8f0'}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    className="pointer-events-none drop-shadow-md"
                  >
                    {node.account_number}
                  </text>

                  {/* Subtitle / Mule Ring */}
                  {node.mule_ring_id && (
                    <text
                      y={34}
                      textAnchor="middle"
                      fill="#f43f5e"
                      fontSize="8"
                      fontFamily="monospace"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      {node.mule_ring_id}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Account Inspector Sidebar Drawer */}
        <div className="bg-cyber-900 border border-cyber-border rounded-xl p-5 flex flex-col justify-between">
          {selectedNode ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-cyber-border">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-cyber-800 border border-cyber-border text-cyan-400">
                    <Network className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-mono text-slate-100">
                      Entity Profile
                    </h3>
                    <p className="text-xs font-mono text-slate-400">{selectedNode.account_number}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-cyber-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Header */}
              <div className="flex items-center justify-between">
                <RiskBadge level={selectedNode.risk_level} score={selectedNode.risk_score} />
                <span className="text-xs font-mono text-slate-400 font-bold">
                  ${selectedNode.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Holder & Bank Info */}
              <div className="bg-cyber-850 p-3.5 rounded-xl border border-cyber-border space-y-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Account Holder</span>
                  <span className="font-semibold text-slate-200">{selectedNode.holder_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Type / Classification</span>
                  <span className="text-slate-300">{selectedNode.account_type}</span>
                </div>
                {selectedNode.mule_ring_id && (
                  <div>
                    <span className="text-[10px] text-rose-400 uppercase block">Mule Syndicate ID</span>
                    <span className="font-bold text-rose-400">{selectedNode.mule_ring_id}</span>
                  </div>
                )}
              </div>

              {/* Centrality Metrics */}
              <div>
                <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-2">
                  Graph Centrality Metrics
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-cyber-950 p-2.5 rounded-lg border border-cyber-border">
                    <span className="text-slate-500 block text-[10px]">In-Degree</span>
                    <span className="text-slate-200 font-bold">{selectedNode.in_degree} incoming</span>
                  </div>
                  <div className="bg-cyber-950 p-2.5 rounded-lg border border-cyber-border">
                    <span className="text-slate-500 block text-[10px]">Out-Degree</span>
                    <span className="text-slate-200 font-bold">{selectedNode.out_degree} outgoing</span>
                  </div>
                  <div className="bg-cyber-950 p-2.5 rounded-lg border border-cyber-border">
                    <span className="text-slate-500 block text-[10px]">PageRank</span>
                    <span className="text-cyan-400 font-bold">{selectedNode.pagerank.toFixed(2)}%</span>
                  </div>
                  <div className="bg-cyber-950 p-2.5 rounded-lg border border-cyber-border">
                    <span className="text-slate-500 block text-[10px]">Betweenness</span>
                    <span className="text-amber-400 font-bold">{selectedNode.betweenness.toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => onNavigateToInvestigator(selectedNode.account_id)}
                  className="w-full py-2.5 rounded-xl font-mono text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Investigator Workspace
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500 space-y-3">
              <Network className="w-12 h-12 text-slate-700 stroke-[1.5]" />
              <div>
                <h4 className="text-sm font-mono font-semibold text-slate-300">No Account Selected</h4>
                <p className="text-xs font-sans text-slate-500 mt-1">
                  Click any node in the topology canvas to inspect graph centrality, connections, and risk indicators.
                </p>
              </div>
            </div>
          )}

          {/* Quick stats footer */}
          {graphData && (
            <div className="pt-4 border-t border-cyber-border text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Nodes: {graphData.stats.total_nodes}</span>
              <span>Edges: {graphData.stats.total_edges}</span>
              <span className="text-rose-400 font-bold">Mules: {graphData.stats.flagged_nodes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
