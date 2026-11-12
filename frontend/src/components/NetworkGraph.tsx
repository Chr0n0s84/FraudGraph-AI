import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { GraphData, GraphNode, NodeRisk } from '../types.ts';
import { ZoomInIcon, ZoomOutIcon, Maximize2Icon, AlertTriangleIcon } from './Icons.tsx';

interface NetworkGraphProps {
  graphData: GraphData;
  selectedAccountId: string | null;
  onSelectAccount: (accountId: string) => void;
  riskFilter: 'all' | 'high' | 'suspicious' | 'normal';
  highlightPreset: 'cycle' | 'fan-in' | null;
  onClearPreset: () => void;
}

export function NetworkGraph({
  graphData,
  selectedAccountId,
  onSelectAccount,
  riskFilter,
  highlightPreset,
  onClearPreset,
}: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const nodeCacheRef = useRef<Map<string, any>>(new Map());
  const prevFilteredRef = useRef<{ nodes: any[]; links: any[]; topologyKey: string } | null>(null);
  const cameraSnapshotRef = useRef<{ zoom: number; center: { x: number; y: number } } | null>(null);
  const lastCenteredPresetRef = useRef<'cycle' | 'fan-in' | null>(null);
  const lastCenteredAccountRef = useRef<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Resize observer to fill container cleanly
  useEffect(() => {
    if (!containerRef.current) return;
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 800,
          height: containerRef.current.clientHeight || 600,
        });
      }
    };
    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Incrementally merge graphData while preserving existing node objects, positions, and zoom
  const filteredData = useMemo(() => {
    const cache = nodeCacheRef.current;
    const incomingIds = new Set(graphData.nodes.map((n) => n.id));

    // Remove nodes no longer present in graphData
    for (const id of Array.from(cache.keys())) {
      if (!incomingIds.has(id)) {
        cache.delete(id);
      }
    }

    const hadPositionedNodes = Array.from(cache.values()).some(
      (n) => Number.isFinite(n.x) && Number.isFinite(n.y)
    );

    // Update existing node objects in place (preserving x, y, vx, vy, fx, fy) and seed new nodes
    const newlyAddedNodes: any[] = [];
    for (const n of graphData.nodes) {
      const existing = cache.get(n.id);
      if (existing) {
        existing.risk = n.risk;
        existing.score = n.score;
        if (n.cluster !== undefined) existing.cluster = n.cluster;
      } else {
        const created: any = { ...n };
        cache.set(n.id, created);
        newlyAddedNodes.push(created);
      }
    }

    // Seed newly arrived nodes near a connected positioned neighbor so they enter smoothly
    if (hadPositionedNodes && newlyAddedNodes.length > 0) {
      for (const created of newlyAddedNodes) {
        let anchor: any = null;
        for (const e of graphData.edges) {
          const src = typeof e.source === 'object' ? (e.source as GraphNode).id : e.source;
          const tgt = typeof e.target === 'object' ? (e.target as GraphNode).id : e.target;
          if (src === created.id) {
            const candidate = cache.get(tgt);
            if (candidate && Number.isFinite(candidate.x) && Number.isFinite(candidate.y)) {
              anchor = candidate;
              break;
            }
          } else if (tgt === created.id) {
            const candidate = cache.get(src);
            if (candidate && Number.isFinite(candidate.x) && Number.isFinite(candidate.y)) {
              anchor = candidate;
              break;
            }
          }
        }
        if (anchor) {
          const angle = Math.random() * Math.PI * 2;
          created.x = anchor.x + Math.cos(angle) * 28;
          created.y = anchor.y + Math.sin(angle) * 28;
        }
      }
    }

    let nodes = graphData.nodes.map((n) => cache.get(n.id));
    if (riskFilter !== 'all') {
      nodes = nodes.filter((n) => n.risk === riskFilter);
    }

    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = graphData.edges.filter((e) => {
      const src = typeof e.source === 'object' ? (e.source as GraphNode).id : e.source;
      const tgt = typeof e.target === 'object' ? (e.target as GraphNode).id : e.target;
      return nodeIds.has(src) && nodeIds.has(tgt);
    });

    const nodeKey = nodes.map((n) => n.id).sort().join(',');
    const edgeKey = edges
      .map((e) => {
        const src = typeof e.source === 'object' ? (e.source as GraphNode).id : e.source;
        const tgt = typeof e.target === 'object' ? (e.target as GraphNode).id : e.target;
        return `${src}->${tgt}:${e.amount}`;
      })
      .sort()
      .join('|');
    const topologyKey = `${riskFilter}::${nodeKey}::${edgeKey}`;

    if (prevFilteredRef.current && prevFilteredRef.current.topologyKey === topologyKey) {
      return prevFilteredRef.current;
    }

    // Preserve camera zoom/pan and existing node positions across incremental topology updates
    if (prevFilteredRef.current && prevFilteredRef.current.nodes.length > 0 && fgRef.current) {
      const currentZoom = fgRef.current.zoom();
      const currentCenter = fgRef.current.centerAt();
      if (
        Number.isFinite(currentZoom) &&
        currentCenter &&
        Number.isFinite(currentCenter.x) &&
        Number.isFinite(currentCenter.y)
      ) {
        cameraSnapshotRef.current = { zoom: currentZoom, center: currentCenter };
      }

      for (const n of nodes) {
        if (!newlyAddedNodes.includes(n) && Number.isFinite(n.x) && Number.isFinite(n.y)) {
          n.fx = n.x;
          n.fy = n.y;
        }
      }
    }

    const nextData = {
      nodes,
      links: edges.map((e) => ({
        source: typeof e.source === 'object' ? (e.source as GraphNode).id : e.source,
        target: typeof e.target === 'object' ? (e.target as GraphNode).id : e.target,
        amount: e.amount,
      })),
      topologyKey,
    };
    prevFilteredRef.current = nextData;
    return nextData;
  }, [graphData, riskFilter]);

  // Restore zoom/pan after incremental graphData updates so ForceGraph2D never auto-resets view
  useEffect(() => {
    const snap = cameraSnapshotRef.current;
    if (!snap || !fgRef.current) return;
    cameraSnapshotRef.current = null;
    fgRef.current.centerAt(snap.center.x, snap.center.y, 0);
    fgRef.current.zoom(snap.zoom, 0);
    const rafId = window.requestAnimationFrame(() => {
      if (fgRef.current) {
        fgRef.current.centerAt(snap.center.x, snap.center.y, 0);
        fgRef.current.zoom(snap.zoom, 0);
      }
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [filteredData]);

  // Handle Preset zoom / focus only when preset changes
  useEffect(() => {
    if (!highlightPreset) {
      lastCenteredPresetRef.current = null;
      return;
    }
    if (!fgRef.current || lastCenteredPresetRef.current === highlightPreset) return;

    if (highlightPreset === 'cycle') {
      // 5-Node Cycle nodes: A101, A102, A103, A104, A105
      const cycleNode = filteredData.nodes.find((n) => n.id === 'A101');
      if (cycleNode && Number.isFinite(cycleNode.x) && Number.isFinite(cycleNode.y)) {
        lastCenteredPresetRef.current = highlightPreset;
        fgRef.current.centerAt(cycleNode.x, cycleNode.y, 800);
        fgRef.current.zoom(2.5, 800);
      }
    } else if (highlightPreset === 'fan-in') {
      // Fan-in hub: A4821
      const hubNode = filteredData.nodes.find((n) => n.id === 'A4821');
      if (hubNode && Number.isFinite(hubNode.x) && Number.isFinite(hubNode.y)) {
        lastCenteredPresetRef.current = highlightPreset;
        fgRef.current.centerAt(hubNode.x, hubNode.y, 800);
        fgRef.current.zoom(2.5, 800);
      }
    }
  }, [highlightPreset, filteredData]);

  // Center on selectedAccountId only when the selection changes, never on graph polling updates
  useEffect(() => {
    if (!selectedAccountId) {
      lastCenteredAccountRef.current = null;
      return;
    }
    if (!fgRef.current || lastCenteredAccountRef.current === selectedAccountId) return;
    const targetNode = filteredData.nodes.find((n) => n.id === selectedAccountId);
    if (targetNode && Number.isFinite(targetNode.x) && Number.isFinite(targetNode.y)) {
      lastCenteredAccountRef.current = selectedAccountId;
      fgRef.current.centerAt(targetNode.x, targetNode.y, 600);
      fgRef.current.zoom(2.2, 600);
    }
  }, [selectedAccountId, filteredData]);

  // Custom node canvas renderer matching FraudGraph AI specs
  const drawNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      // Guard against non-finite or uninitialized coordinates from force simulation
      if (
        !node ||
        typeof node.x !== 'number' ||
        typeof node.y !== 'number' ||
        !Number.isFinite(node.x) ||
        !Number.isFinite(node.y)
      ) {
        return;
      }

      const isSelected = node.id === selectedAccountId;
      const isHovered = hoveredNode?.id === node.id;
      const isCycleNode = ['A101', 'A102', 'A103', 'A104', 'A105'].includes(node.id);
      const isHubNode = node.id === 'A4821';

      const radius = isHubNode ? 10 : isCycleNode ? 8 : node.risk === 'high' ? 7 : node.risk === 'suspicious' ? 6 : 5;

      // Outer radial glow for threats and selected
      if (node.risk === 'high' || isSelected) {
        const glowRadius = Math.max(1, radius + (isSelected ? 10 : 7));
        const innerRadius = Math.max(0.1, radius * 0.5);
        try {
          const gradient = ctx.createRadialGradient(node.x, node.y, innerRadius, node.x, node.y, glowRadius);
          if (isSelected) {
            gradient.addColorStop(0, 'rgba(0, 242, 254, 0.8)');
            gradient.addColorStop(1, 'rgba(0, 242, 254, 0)');
          } else {
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.7)');
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
          }
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(node.x, node.y, glowRadius, 0, 2 * Math.PI, false);
          ctx.fill();
        } catch {
          // Graceful fallback if gradient fails
        }
      } else if (node.risk === 'suspicious') {
        const glowRadius = Math.max(1, radius + 5);
        const innerRadius = Math.max(0.1, radius * 0.5);
        try {
          const gradient = ctx.createRadialGradient(node.x, node.y, innerRadius, node.x, node.y, glowRadius);
          gradient.addColorStop(0, 'rgba(249, 115, 22, 0.5)');
          gradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(node.x, node.y, glowRadius, 0, 2 * Math.PI, false);
          ctx.fill();
        } catch {
          // Graceful fallback if gradient fails
        }
      }

      // Base solid circle: normal=blue, suspicious=orange, high=red
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);

      if (node.risk === 'high') {
        ctx.fillStyle = '#ef4444';
      } else if (node.risk === 'suspicious') {
        ctx.fillStyle = '#f97316';
      } else {
        ctx.fillStyle = '#3b82f6';
      }
      ctx.fill();

      // Inner glyph ring / border
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.strokeStyle = isSelected ? '#00f2fe' : '#080d1a';
      ctx.stroke();

      // Double ring for high threats
      if (node.risk === 'high') {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 2.5, 0, 2 * Math.PI, false);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.stroke();
      }

      // Draw Account ID label when zoomed in or hovered
      const validScale = Number.isFinite(globalScale) && globalScale > 0 ? globalScale : 1;
      const fontSize = Math.max(9 / validScale, 3);
      if (validScale > 0.9 || isHovered || isSelected || isHubNode || isCycleNode) {
        ctx.font = `600 ${fontSize}px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const textY = node.y + radius + 3;
        const text = node.id || '';

        // Label background badge
        const textWidth = ctx.measureText(text).width;
        ctx.fillStyle = 'rgba(8, 13, 26, 0.85)';
        ctx.fillRect(node.x - textWidth / 2 - 2, textY - 1, textWidth + 4, fontSize + 2);

        // Label text
        ctx.fillStyle = isSelected
          ? '#00f2fe'
          : node.risk === 'high'
          ? '#fca5a5'
          : node.risk === 'suspicious'
          ? '#fdba74'
          : '#93c5fd';
        ctx.fillText(text, node.x, textY);
      }
    },
    [selectedAccountId, hoveredNode]
  );

  const drawPointerArea = useCallback((node: any, color: string, ctx: CanvasRenderingContext2D) => {
    if (
      !node ||
      typeof node.x !== 'number' ||
      typeof node.y !== 'number' ||
      !Number.isFinite(node.x) ||
      !Number.isFinite(node.y)
    ) {
      return;
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI, false);
    ctx.fill();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px] bg-[#080d1a] overflow-hidden cyber-grid">
      {/* Top Controls Overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="glass-panel px-3 py-1.5 rounded flex items-center gap-2">
          <span className="font-mono-data text-xs text-[#f8fafc] font-semibold">
            TOPOLOGY GRAPH
          </span>
          <span className="font-mono-data text-[10px] text-[#00f2fe] px-1.5 py-0.5 rounded bg-[#0f1c3f]">
            {filteredData.nodes.length} NODES
          </span>
        </div>

        {highlightPreset && (
          <div className="glass-panel px-2.5 py-1 rounded flex items-center gap-2 border-[#f43f5e]/50 glow-red">
            <span className="w-2 h-2 rounded-full bg-[#f43f5e] animate-ping" />
            <span className="font-mono-data text-xs text-[#f43f5e] font-semibold">
              {highlightPreset === 'cycle' ? '5-Node Red Cycle Focused' : 'Fan-in Hub A4821 Focused'}
            </span>
            <button
              onClick={onClearPreset}
              className="text-[#dee2f5] hover:text-[#f43f5e] text-xs font-mono-data px-1"
              title="Clear focus"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
        <button
          onClick={() => fgRef.current?.zoom((fgRef.current.zoom() || 1) * 1.3, 300)}
          aria-label="Zoom in graph"
          className="p-2 rounded bg-[#0b1329]/90 border border-[rgba(56,189,248,0.2)] hover:border-[#00f2fe] text-[#dee2f5] hover:text-[#00f2fe] transition-colors"
          title="Zoom In"
        >
          <ZoomInIcon size={16} />
        </button>
        <button
          onClick={() => fgRef.current?.zoom((fgRef.current.zoom() || 1) / 1.3, 300)}
          aria-label="Zoom out graph"
          className="p-2 rounded bg-[#0b1329]/90 border border-[rgba(56,189,248,0.2)] hover:border-[#00f2fe] text-[#dee2f5] hover:text-[#00f2fe] transition-colors"
          title="Zoom Out"
        >
          <ZoomOutIcon size={16} />
        </button>
        <button
          onClick={() => fgRef.current?.zoomToFit(500, 40)}
          aria-label="Fit graph to viewport"
          className="p-2 rounded bg-[#0b1329]/90 border border-[rgba(56,189,248,0.2)] hover:border-[#00f2fe] text-[#dee2f5] hover:text-[#00f2fe] transition-colors"
          title="Reset View"
        >
          <Maximize2Icon size={16} />
        </button>
      </div>

      {/* Bottom Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-10 glass-panel px-3 py-2 rounded text-[11px] font-mono-data flex flex-wrap items-center gap-4 text-[#94a3b8] pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-[0_0_8px_#ef4444]" />
          <span className="text-[#f8fafc]">High Threat (Score ≥ 70)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] shadow-[0_0_8px_#f97316]" />
          <span className="text-[#f8fafc]">Suspicious (40-69)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] shadow-[0_0_8px_#3b82f6]" />
          <span className="text-[#f8fafc]">Normal (0-39)</span>
        </div>
        <span className="text-[#475569]">|</span>
        <span className="text-[#38bdf8]">Click any node to inspect dossier</span>
      </div>

      {/* Force Graph 2D Canvas */}
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={filteredData}
        autoPauseRedraw={false}
        backgroundColor="#080d1a"
        nodeCanvasObject={drawNode}
        nodePointerAreaPaint={drawPointerArea}
        onNodeDragEnd={(node: any) => {
          node.fx = node.x;
          node.fy = node.y;
        }}
        linkColor={(link: any) => {
          const srcId = typeof link.source === 'object' ? link.source.id : link.source;
          const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
          if (
            ['A101', 'A102', 'A103', 'A104', 'A105'].includes(srcId) &&
            ['A101', 'A102', 'A103', 'A104', 'A105'].includes(tgtId)
          ) {
            return 'rgba(244, 63, 94, 0.75)'; // Red cycle
          }
          if (tgtId === 'A4821') {
            return 'rgba(244, 63, 94, 0.65)'; // Fan-in cluster
          }
          return 'rgba(56, 189, 248, 0.25)'; // Regular links
        }}
        linkWidth={(link: any) => {
          const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
          return tgtId === 'A4821' ? 2 : 1.2;
        }}
        linkDirectionalArrowLength={4.5}
        linkDirectionalArrowRelPos={0.9}
        linkDirectionalArrowColor={(link: any) => {
          const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
          return tgtId === 'A4821' ? '#f43f5e' : '#00f2fe';
        }}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleColor={(link: any) => {
          const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
          return tgtId === 'A4821' ? '#f43f5e' : '#00f2fe';
        }}
        onNodeClick={(node: any) => {
          onSelectAccount(node.id);
        }}
        onNodeHover={(node: any) => {
          setHoveredNode(node || null);
        }}
        cooldownTicks={120}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />
    </div>
  );
}
