import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Network,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  ExternalLink,
  X,
  Layers,
  Sparkles,
  Box,
  Eye,
  Activity
} from 'lucide-react';
import type { NetworkGraphData, GraphNodeData, GraphEdgeData } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { api } from '../../services/api';

interface NetworkGraphViewProps {
  onNavigateToInvestigator: (accountId: number) => void;
}

export const NetworkGraphView: React.FC<NetworkGraphViewProps> = ({ onNavigateToInvestigator }) => {
  const [graphData, setGraphData] = useState<NetworkGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNodeData | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<GraphEdgeData | null>(null);
  const [nodeSearch, setNodeSearch] = useState('');
  const [activePatternFilter, setActivePatternFilter] = useState<string>('ALL');
  const [is3DView, setIs3DView] = useState(true);
  
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
    const width = 900;
    const height = 650;
    const centerX = width / 2;
    const centerY = height / 2;

    return graphData.nodes.map((node, i) => {
      let x = centerX;
      let y = centerY;

      if (node.mule_ring_id === 'RING-01-CIRCULAR') {
        const subIndex = node.account_id - 51;
        const angle = (subIndex / 5) * 2 * Math.PI - Math.PI / 2;
        x = 240 + Math.cos(angle) * 110;
        y = 200 + Math.sin(angle) * 110;
      } else if (node.mule_ring_id === 'RING-02-FAN-IN') {
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
        const subIndex = node.account_id - 74;
        x = 250 + subIndex * 60;
        y = 480 + (subIndex % 2) * 50;
      } else {
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

  const nodePosMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    positionedNodes.forEach((n) => map.set(n.id, { x: n.x, y: n.y }));
    return map;
  }, [positionedNodes]);

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
      {/* Top Glassmorphic Controls Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900/60 via-slate-900/40 to-slate-950/60 backdrop-blur-2xl border border-white/10 p-4 shadow-glass flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search entity by name, account number..."
            value={nodeSearch}
            onChange={(e) => setNodeSearch(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,242,254,0.2)] backdrop-blur-md"
          />
        </div>

        {/* Topology Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          <span className="text-slate-400 mr-1 flex items-center gap-1 text-[11px]">
            <Filter className="w-3.5 h-3.5 text-cyan-400" /> Filter:
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
              className={`px-3 py-1.5 rounded-xl border transition-all duration-300 ${
                activePatternFilter === item.id
                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-white font-bold border-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.3)] backdrop-blur-md'
                  : 'bg-white/[0.03] text-slate-300 border-white/10 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Zoom & Fit & 3D Matrix Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIs3DView(!is3DView)}
            className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold flex items-center gap-1.5 transition-all duration-300 ${
              is3DView
                ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 text-cyan-200 border-cyan-400/80 shadow-[0_0_20px_rgba(0,242,254,0.35)] backdrop-blur-md'
                : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08]'
            }`}
            title="Toggle 3D Holographic Matrix Projection"
          >
            <Box className={`w-4 h-4 ${is3DView ? 'text-cyan-300 animate-spin-slow' : 'text-slate-400'}`} />
            <span>{is3DView ? '3D Matrix Mode' : '2D Plane'}</span>
          </button>

          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors"
            title="Fit View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={fetchGraph}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors"
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
          className="lg:col-span-3 h-[680px] bg-slate-950/70 border border-white/10 rounded-2xl relative overflow-hidden select-none cursor-grab active:cursor-grabbing radar-grid shadow-glass backdrop-blur-2xl"
          style={{
            perspective: is3DView ? '1200px' : 'none',
          }}
        >
          {/* Cyber Radar Scanline */}
          <div className="cyber-scanline" />

          {/* Ambient Canvas Lighting */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Interactive Floating 3D Hover HUD (Edge or Node Details) */}
          {(hoveredEdge || hoveredNode) && (
            <div className="absolute top-4 right-4 z-20 bg-slate-900/80 border border-cyan-400/50 backdrop-blur-2xl rounded-xl px-4 py-2.5 text-xs font-mono shadow-[0_0_25px_rgba(0,242,254,0.3)] animate-fadeIn pointer-events-none flex items-center gap-3">
              {hoveredEdge && (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">LIVE TRANSACTION LINK</span>
                    <span className="text-white font-bold">
                      ${hoveredEdge.amount.toLocaleString()} via <strong className="text-cyan-300">{hoveredEdge.channel}</strong>
                    </span>
                  </div>
                  <div className="pl-3 border-l border-white/10">
                    <span className="text-slate-400 text-[10px] uppercase block">RISK SCORE</span>
                    <span className={`font-black ${hoveredEdge.risk_score >= 70 ? 'text-rose-400' : 'text-amber-300'}`}>
                      {hoveredEdge.risk_score}/100 ({hoveredEdge.pattern_type})
                    </span>
                  </div>
                </>
              )}
              {!hoveredEdge && hoveredNode && (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">ENTITY HOVER</span>
                    <span className="text-white font-bold">
                      {hoveredNode.account_number} ({hoveredNode.holder_name})
                    </span>
                  </div>
                  <div className="pl-3 border-l border-white/10">
                    <span className="text-slate-400 text-[10px] uppercase block">CLASSIFICATION</span>
                    <span className={`font-black ${hoveredNode.is_mule ? 'text-rose-400' : 'text-emerald-300'}`}>
                      {hoveredNode.is_mule ? `MULE [${hoveredNode.mule_ring_id || 'FLAGGED'}]` : 'STANDARD ENTITY'}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Legend Overlay */}
          <div className="absolute top-4 left-4 z-10 bg-slate-900/60 border border-white/10 backdrop-blur-2xl rounded-xl p-3.5 text-[11px] font-mono text-slate-300 space-y-1.5 shadow-glass pointer-events-none">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Topological Classification
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]" />
              <span>Confirmed Mule / Critical Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]" />
              <span>High Risk / Structuring Node</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f2fe]" />
              <span>Central Collector Hub / Gateway</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              <span>Normal Entity</span>
            </div>
          </div>

          {/* SVG Canvas with 3D Matrix Transform */}
          <svg
            className="w-full h-full"
            style={{
              transform: is3DView
                ? `perspective(1200px) rotateX(24deg) rotateZ(-6deg) translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoom * 0.95})`
                : `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          >
            <defs>
              <filter id="glow-danger" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
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
                <polygon points="0 0, 8 3, 0 6" fill="#f43f5e" opacity="0.9" />
              </marker>
            </defs>

            {/* Directed Edges with Streaming Laser Animations & Hover */}
            {graphData?.edges.map((edge) => {
              const srcPos = nodePosMap.get(edge.source);
              const tgtPos = nodePosMap.get(edge.target);
              if (!srcPos || !tgtPos) return null;

              const isSuspicious = edge.is_flagged || edge.risk_score >= 60;
              const isEdgeHovered = hoveredEdge?.id === edge.id;

              return (
                <g
                  key={edge.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredEdge(edge)}
                  onMouseLeave={() => setHoveredEdge(null)}
                >
                  {/* Invisible thicker stroke for effortless mouse hovering */}
                  <line
                    x1={srcPos.x}
                    y1={srcPos.y}
                    x2={tgtPos.x}
                    y2={tgtPos.y}
                    stroke="transparent"
                    strokeWidth={14}
                  />

                  {/* Visible Streaming Laser Line */}
                  <line
                    x1={srcPos.x}
                    y1={srcPos.y}
                    x2={tgtPos.x}
                    y2={tgtPos.y}
                    stroke={isSuspicious ? '#f43f5e' : (isEdgeHovered ? '#00f2fe' : 'rgba(255, 255, 255, 0.16)')}
                    strokeWidth={isEdgeHovered ? 3.5 : (isSuspicious ? 2.5 : 1)}
                    className={isSuspicious ? 'edge-flow-danger' : 'edge-flow-normal'}
                    filter={isSuspicious ? 'url(#glow-danger)' : (isEdgeHovered ? 'url(#glow-cyan)' : undefined)}
                    opacity={isEdgeHovered ? 1 : (isSuspicious ? 0.95 : 0.4)}
                    markerEnd={isSuspicious ? 'url(#arrowhead-danger)' : 'url(#arrowhead)'}
                  />
                </g>
              );
            })}

            {/* 3D Holographic Nodes */}
            {positionedNodes.map((node) => {
              const highlighted = isNodeHighlighted(node);
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoveredNode?.id === node.id;
              const isCritical = node.risk_level === 'CRITICAL' || node.is_mule;
              const isHigh = node.risk_level === 'HIGH';

              let nodeColor = '#10b981';
              let haloColor = 'rgba(16, 185, 129, 0.25)';
              if (isCritical) {
                nodeColor = '#f43f5e';
                haloColor = 'rgba(244, 63, 94, 0.45)';
              } else if (isHigh) {
                nodeColor = '#f59e0b';
                haloColor = 'rgba(245, 158, 11, 0.35)';
              } else if (node.risk_level === 'MEDIUM') {
                nodeColor = '#00f2fe';
                haloColor = 'rgba(0, 242, 254, 0.3)';
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y}) ${isHovered ? 'scale(1.25)' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(node);
                  }}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className={`cursor-pointer transition-all duration-300 ${
                    highlighted ? 'opacity-100' : 'opacity-15'
                  }`}
                >
                  {/* Outer Pulsing Halo */}
                  {(isCritical || isSelected || isHovered) && (
                    <circle
                      r={isSelected || isHovered ? 28 : 20}
                      fill="none"
                      stroke={nodeColor}
                      strokeWidth="2"
                      opacity="0.6"
                      className="animate-ping"
                    />
                  )}

                  {/* Halo fill */}
                  <circle
                    r={isSelected || isHovered ? 22 : 16}
                    fill={haloColor}
                    stroke={isSelected || isHovered ? '#00f2fe' : nodeColor}
                    strokeWidth={isSelected || isHovered ? 3 : 1.5}
                    filter={isCritical ? 'url(#glow-danger)' : undefined}
                  />

                  {/* Inner Core */}
                  <circle r={8} fill={nodeColor} />

                  {/* Node Label */}
                  <text
                    y={24}
                    textAnchor="middle"
                    fill={isSelected || isHovered ? '#00f2fe' : '#f8fafc'}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight={isSelected || isHovered ? 'bold' : 'normal'}
                    className="pointer-events-none drop-shadow-md"
                  >
                    {node.account_number}
                  </text>

                  {/* Subtitle / Mule Ring */}
                  {node.mule_ring_id && (
                    <text
                      y={35}
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

        {/* Frosted Account Inspector Sidebar Drawer */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/70 backdrop-blur-2xl border border-white/10 p-5 shadow-glass flex flex-col justify-between">
          {selectedNode ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
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
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Header */}
              <div className="flex items-center justify-between">
                <RiskBadge level={selectedNode.risk_level} score={selectedNode.risk_score} />
                <span className="text-xs font-mono text-slate-200 font-bold">
                  ${selectedNode.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Holder & Bank Info */}
              <div className="bg-white/[0.03] p-4 rounded-xl border border-white/10 space-y-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Account Holder</span>
                  <span className="font-semibold text-slate-100">{selectedNode.holder_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Type / Classification</span>
                  <span className="text-slate-300">{selectedNode.account_type}</span>
                </div>
                {selectedNode.mule_ring_id && (
                  <div>
                    <span className="text-[10px] text-rose-400 uppercase block font-bold">Mule Syndicate ID</span>
                    <span className="font-bold text-rose-300">{selectedNode.mule_ring_id}</span>
                  </div>
                )}
              </div>

              {/* Centrality Metrics */}
              <div>
                <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-2">
                  Graph Centrality Metrics
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/10">
                    <span className="text-slate-400 block text-[10px]">In-Degree</span>
                    <span className="text-slate-200 font-bold">{selectedNode.in_degree} incoming</span>
                  </div>
                  <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/10">
                    <span className="text-slate-400 block text-[10px]">Out-Degree</span>
                    <span className="text-slate-200 font-bold">{selectedNode.out_degree} outgoing</span>
                  </div>
                  <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/10">
                    <span className="text-slate-400 block text-[10px]">PageRank</span>
                    <span className="text-cyan-400 font-bold">{selectedNode.pagerank.toFixed(2)}%</span>
                  </div>
                  <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/10">
                    <span className="text-slate-400 block text-[10px]">Betweenness</span>
                    <span className="text-amber-400 font-bold">{selectedNode.betweenness.toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => onNavigateToInvestigator(selectedNode.account_id)}
                  className="w-full py-2.5 rounded-xl font-mono text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Investigate Entity Dossier
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                <Network className="w-7 h-7 text-cyan-400" />
              </div>
              <div>
                <h4 className="text-sm font-mono font-semibold text-slate-200">No Entity Selected</h4>
                <p className="text-xs font-sans text-slate-400 mt-1">
                  Click any node in the topology canvas to inspect graph centrality, connections, and risk indicators.
                </p>
              </div>
            </div>
          )}

          {/* Quick stats footer */}
          {graphData && (
            <div className="pt-4 border-t border-white/[0.08] text-[11px] font-mono text-slate-400 flex items-center justify-between">
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
