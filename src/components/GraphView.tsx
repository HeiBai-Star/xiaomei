'use client'

import { useEffect, useRef, useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'

// ============ Types ============
interface Node {
  id: string
  title: string
  description?: string
  positionX: number
  positionY: number
  color: string
  tags?: string[]
}

interface Edge {
  id: string
  sourceId: string
  targetId: string
  relationType: string
  label?: string
}

interface RelationType {
  value: string
  label: string
  color: string
}

interface GraphViewHandle {
  addNode: (title: string, description?: string) => void
}

interface GraphViewProps {
  onNodeSelect: (nodeId: string | null) => void
  selectedNodeId: string | null
  relationTypes: RelationType[]
}

interface ContextMenu {
  x: number
  y: number
  nodeId: string
}

interface EdgeModal {
  edgeId: string
}

// ============ Mock Data ============
const mockNodes: Node[] = [
  { id: '1', title: '自由意志', description: '指个体做出选择的能力。哲学讨论中常与决定论对立。', positionX: 500, positionY: 300, color: '#6366f1', tags: ['核心', '哲学'] },
  { id: '2', title: '决定论', description: '所有事件都由先前原因完全决定，过去决定现在和未来。', positionX: 750, positionY: 200, color: '#8b5cf6', tags: ['对立', '哲学'] },
  { id: '3', title: '存在主义', description: '存在先于本质，人被判定为自由并需为自己的选择负责。', positionX: 300, positionY: 450, color: '#ec4899', tags: ['核心', '哲学'] },
  { id: '4', title: '虚无主义', description: '生命没有客观意义或价值，一切意义都是人为建构的。', positionX: 600, positionY: 520, color: '#f43f5e', tags: ['衍生', '哲学'] },
  { id: '5', title: '萨特', description: '法国存在主义哲学家，强调绝对自由和责任。', positionX: 150, positionY: 300, color: '#14b8a6', tags: ['人物', '哲学'] },
  { id: '6', title: '加缪', description: '荒诞主义哲学家，探讨生命的无意义与反抗。', positionX: 200, positionY: 500, color: '#f59e0b', tags: ['人物', '哲学'] },
  { id: '7', title: '尼采', description: '提出虚无主义概念，并寻求超越它的方法。', positionX: 800, positionY: 400, color: '#ef4444', tags: ['人物', '哲学'] },
]

const mockEdges: Edge[] = [
  { id: 'e1', sourceId: '1', targetId: '2', relationType: '对立', label: '相互排斥' },
  { id: 'e2', sourceId: '1', targetId: '3', relationType: '包含', label: '核心概念' },
  { id: 'e3', sourceId: '3', targetId: '4', relationType: '衍生', label: '极端形式' },
  { id: 'e4', sourceId: '5', targetId: '3', relationType: '相关', label: '创立者' },
  { id: 'e5', sourceId: '6', targetId: '4', relationType: '相关', label: '论述者' },
  { id: 'e6', sourceId: '7', targetId: '4', relationType: '因果', label: '提出者' },
  { id: 'e7', sourceId: '3', targetId: '7', relationType: '相关', label: '影响' },
  { id: 'e8', sourceId: '1', targetId: '7', relationType: '对立', label: '超人哲学' },
]

// ============ Colors ============
const COLORS = {
  bg: '#0a0a0f',
  sidebar: '#111118',
  sidebarBorder: 'rgba(255,255,255,0.07)',
  canvas: '#08080c',
  text: '#e4e4e7',
  textMuted: '#71717a',
  accent: '#6366f1',
  hover: 'rgba(99,102,241,0.15)',
  selected: 'rgba(99,102,241,0.25)',
  gridLine: '#1a1a22',
}

// ============ Main Component ============
const GraphView = forwardRef<GraphViewHandle, GraphViewProps>(({ onNodeSelect, selectedNodeId, relationTypes }, ref) => {
  const svgRef = useRef<SVGSVGElement>(null)
  // Keep refs to latest state for synchronous localStorage writes
  const nodesRef = useRef<Node[]>([])
  const edgesRef = useRef<Edge[]>([])

  // Initialize from localStorage, fall back to mock data
  const [nodes, setNodes] = useState<Node[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('graph_nodes')
        if (saved) { const p = JSON.parse(saved); nodesRef.current = p; return p }
      } catch {}
    }
    return mockNodes
  })
  const [edges, setEdges] = useState<Edge[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('graph_edges')
        if (saved) { const p = JSON.parse(saved); edgesRef.current = p; return p }
      } catch {}
    }
    return mockEdges
  })
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null)

  // Canvas transform (pan + zoom)
  const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [svgSize, setSvgSize] = useState({ w: 1200, h: 800 })

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<string[]>([])

  // Left sidebar
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [sidebarFilter, setSidebarFilter] = useState<string>('all')

  // Node expansion
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('graph_expanded')
        if (saved) return new Set(JSON.parse(saved))
      } catch {}
    }
    return new Set(['1'])
  })

  // Context menu
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)

  // Edge detail modal
  const [edgeModal, setEdgeModal] = useState<EdgeModal | null>(null)

  // Sync refs + save to localStorage synchronously
  const saveGraphData = useCallback((n: Node[], e: Edge[]) => {
    nodesRef.current = n
    edgesRef.current = e
    localStorage.setItem('graph_nodes', JSON.stringify(n))
    localStorage.setItem('graph_edges', JSON.stringify(e))
  }, [])

  // Mutation helpers — update refs + state + localStorage atomically
  const deleteNode = useCallback((id: string) => {
    const newNodes = nodesRef.current.filter(n => n.id !== id)
    const newEdges = edgesRef.current.filter(e => e.sourceId !== id && e.targetId !== id)
    saveGraphData(newNodes, newEdges)
    setNodes(newNodes)
    setEdges(newEdges)
    if (selectedNodeId === id) onNodeSelect(null)
  }, [selectedNodeId])

  const updateNodePosition = useCallback((id: string, x: number, y: number) => {
    const newNodes = nodesRef.current.map(n => n.id === id ? { ...n, positionX: x, positionY: y } : n)
    saveGraphData(newNodes, edgesRef.current)
    setNodes(newNodes)
  }, [])

  const addNode = useCallback((node: Node) => {
    const newNodes = [...nodesRef.current, node]
    saveGraphData(newNodes, edgesRef.current)
    setNodes(newNodes)
  }, [])

  // Expose imperative API to parent
  useImperativeHandle(ref, () => ({
    addNode: (title: string, description?: string) => {
      const newNode: Node = {
        id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title,
        description,
        positionX: 400 + Math.random() * 200,
        positionY: 300 + Math.random() * 150,
        color: COLORS.nodeColors[Math.floor(Math.random() * COLORS.nodeColors.length)],
      }
      addNode(newNode)
    },
  }), [addNode])

  const deleteEdge = useCallback((id: string) => {
    const newEdges = edgesRef.current.filter(e => e.id !== id)
    saveGraphData(nodesRef.current, newEdges)
    setEdges(newEdges)
  }, [])

  // Measure SVG
  useEffect(() => {
    const measure = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect()
        setSvgSize({ w: rect.width, h: rect.height })
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Global mouseup to clear dragging
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (draggingNode !== null) {
        saveGraphData(nodesRef.current, edgesRef.current)
      }
      setDraggingNode(null)
      setIsPanning(false)
    }
    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null)
        setEdgeModal(null)
        onNodeSelect(null)
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId && !(e.target instanceof HTMLInputElement)) {
        deleteNode(selectedNodeId)
      }
      if (e.key === 'f' && selectedNodeId && !(e.target instanceof HTMLInputElement)) {
        toggleExpandNode(selectedNodeId)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodeId, onNodeSelect, deleteNode])

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResult([])
      return
    }
    const q = searchQuery.toLowerCase()
    const results = nodes
      .filter(n => n.title.toLowerCase().includes(q) || n.description?.toLowerCase().includes(q))
      .map(n => n.id)
    setSearchResult(results)
  }, [searchQuery, nodes])

  // Get edge color
  const getEdgeColor = useCallback((type: string) => {
    const t = relationTypes.find(r => r.value === type)
    return t?.color || '#71717a'
  }, [relationTypes])

  // Toggle node expansion
  const toggleExpandNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }, [])

  // Get connected nodes of a node
  const getConnectedNodes = useCallback((nodeId: string): string[] => {
    const connected: string[] = []
    edges.forEach(edge => {
      if (edge.sourceId === nodeId) connected.push(edge.targetId)
      if (edge.targetId === nodeId) connected.push(edge.sourceId)
    })
    return connected
  }, [edges])

  // Get 2nd-degree nodes for expansion preview
  const getSecondDegreeNodes = useCallback((nodeId: string): string[] => {
    const first = new Set(getConnectedNodes(nodeId))
    const second: string[] = []
    first.forEach(nid => {
      getConnectedNodes(nid).forEach(n2 => {
        if (n2 !== nodeId && !first.has(n2)) second.push(n2)
      })
    })
    return second
  }, [getConnectedNodes])

  // Check if node is dimmed (not connected to selected/focused)
  const isNodeDimmed = useCallback((nodeId: string): boolean => {
    if (!selectedNodeId) {
      if (searchResult.length === 0) return false
      return !searchResult.includes(nodeId)
    }
    if (nodeId === selectedNodeId) return false
    const connected = getConnectedNodes(selectedNodeId)
    if (connected.includes(nodeId)) return false
    // If expanded, also show connected-to-connected
    if (expandedNodes.has(selectedNodeId)) {
      return !connected.includes(nodeId)
    }
    return true
  }, [selectedNodeId, searchResult, getConnectedNodes, expandedNodes])

  // Check if edge is dimmed
  const isEdgeDimmed = useCallback((edge: Edge): boolean => {
    if (!selectedNodeId) return false
    return edge.sourceId !== selectedNodeId && edge.targetId !== selectedNodeId
  }, [selectedNodeId])

  // Node drag
  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return
    e.stopPropagation()
    setDraggingNode(nodeId)
    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      setOffset({
        x: e.clientX - (node.positionX * viewTransform.scale + viewTransform.x),
        y: e.clientY - (node.positionY * viewTransform.scale + viewTransform.y),
      })
    }
  }, [nodes, viewTransform])

  // Canvas drag (pan)
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX - viewTransform.x, y: e.clientY - viewTransform.y })
    }
  }, [viewTransform])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setViewTransform(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }))
      return
    }
    if (!draggingNode) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left - viewTransform.x) / viewTransform.scale
    const y = (e.clientY - rect.top - viewTransform.y) / viewTransform.scale
    setNodes(prev => prev.map(node =>
      node.id === draggingNode ? { ...node, positionX: x, positionY: y } : node
    ))
  }, [isPanning, panStart, draggingNode, viewTransform])

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setViewTransform(prev => {
      const newScale = Math.min(Math.max(prev.scale * delta, 0.2), 4)
      const scaleChange = newScale / prev.scale
      return {
        scale: newScale,
        x: mouseX - scaleChange * (mouseX - prev.x),
        y: mouseY - scaleChange * (mouseY - prev.y),
      }
    })
  }, [])

  // Right-click context menu
  const handleNodeContextMenu = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId })
  }, [])

  const handleEdgeClick = useCallback((e: React.MouseEvent, edgeId: string) => {
    e.stopPropagation()
    setEdgeModal({ edgeId })
  }, [])

  // Center on node
  const centerOnNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return
    setViewTransform({
      x: svgSize.w / 2 - node.positionX * 1,
      y: svgSize.h / 2 - node.positionY * 1,
      scale: 1,
    })
    onNodeSelect(nodeId)
  }, [nodes, svgSize, onNodeSelect])

  // Filtered sidebar nodes
  const sidebarNodes = useMemo(() => {
    let filtered = nodes
    if (sidebarFilter !== 'all') {
      filtered = nodes.filter(n => {
        if (sidebarFilter === 'selected' && n.id !== selectedNodeId) return false
        if (sidebarFilter === 'expanded') return expandedNodes.has(n.id)
        if (sidebarFilter === 'dimmed') return isNodeDimmed(n.id)
        return true
      })
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(q) || n.description?.toLowerCase().includes(q)
      )
    }
    return filtered
  }, [nodes, sidebarFilter, selectedNodeId, expandedNodes, isNodeDimmed, searchQuery])

  // Right panel data
  const selectedNodeData = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId])
  const selectedNodeEdges = useMemo(() =>
    edges.filter(e => e.sourceId === selectedNodeId || e.targetId === selectedNodeId),
    [edges, selectedNodeId]
  )

  // Edge modal data
  const modalEdge = useMemo(() =>
    edgeModal ? edges.find(e => e.id === edgeModal.edgeId) : null,
    [edges, edgeModal]
  )

  const modalEdgeNodes = useMemo(() => {
    if (!modalEdge) return { source: null, target: null }
    return {
      source: nodes.find(n => n.id === modalEdge.sourceId),
      target: nodes.find(n => n.id === modalEdge.targetId),
    }
  }, [modalEdge, nodes])

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: COLORS.bg }}>

      {/* ========== Left Sidebar ========== */}
      <div
        className="absolute left-0 top-0 bottom-0 z-20 flex flex-col transition-all duration-300"
        style={{
          width: leftSidebarOpen ? 240 : 0,
          backgroundColor: COLORS.sidebar,
          borderRight: leftSidebarOpen ? `1px solid ${COLORS.sidebarBorder}` : 'none',
        }}
      >
        {leftSidebarOpen && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: COLORS.sidebarBorder }}>
              <span className="text-sm font-medium" style={{ color: COLORS.text }}>节点列表</span>
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: COLORS.textMuted }}>
                {sidebarNodes.length}
              </span>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-1 px-3 py-2 border-b" style={{ borderColor: COLORS.sidebarBorder }}>
              {[
                { key: 'all', label: '全部' },
                { key: 'selected', label: '已选' },
                { key: 'expanded', label: '已展开' },
                { key: 'dimmed', label: '已隐藏' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setSidebarFilter(tab.key)}
                  className="text-xs px-2 py-1 rounded transition-colors"
                  style={{
                    backgroundColor: sidebarFilter === tab.key ? COLORS.accent + '30' : 'transparent',
                    color: sidebarFilter === tab.key ? COLORS.accent : COLORS.textMuted,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Node list */}
            <div className="flex-1 overflow-y-auto py-2">
              {sidebarNodes.length === 0 ? (
                <div className="text-center text-xs px-4 py-8" style={{ color: COLORS.textMuted }}>
                  暂无节点
                </div>
              ) : (
                sidebarNodes.map(node => {
                  const isSel = node.id === selectedNodeId
                  const isExp = expandedNodes.has(node.id)
                  const connected = getConnectedNodes(node.id)
                  return (
                    <div
                      key={node.id}
                      onClick={() => centerOnNode(node.id)}
                      className="mx-2 mb-1 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150"
                      style={{
                        backgroundColor: isSel ? COLORS.selected : 'transparent',
                        borderLeft: `2px solid ${isSel ? node.color : 'transparent'}`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: node.color }}
                        />
                        <span
                          className="text-sm truncate flex-1"
                          style={{ color: isNodeDimmed(node.id) ? COLORS.textMuted : COLORS.text }}
                        >
                          {node.title}
                        </span>
                        {isExp && (
                          <span className="text-xs" style={{ color: COLORS.textMuted }}>▾</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 pl-4">
                        <span className="text-xs" style={{ color: COLORS.textMuted }}>
                          {connected.length} 个关联
                        </span>
                        {node.tags?.map(tag => (
                          <span
                            key={tag}
                            className="text-xs px-1 rounded"
                            style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: COLORS.textMuted }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Zoom controls */}
            <div className="px-3 py-2 border-t space-y-1" style={{ borderColor: COLORS.sidebarBorder }}>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: COLORS.textMuted }}>缩放</span>
                <span className="text-xs font-mono" style={{ color: COLORS.textMuted }}>
                  {Math.round(viewTransform.scale * 100)}%
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setViewTransform(p => ({ ...p, scale: Math.min(p.scale * 1.2, 4) }))}
                  className="flex-1 text-xs py-1 rounded"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: COLORS.text }}
                >
                  +
                </button>
                <button
                  onClick={() => setViewTransform({ x: 0, y: 0, scale: 1 })}
                  className="flex-1 text-xs py-1 rounded"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: COLORS.text }}
                >
                  重置
                </button>
                <button
                  onClick={() => setViewTransform(p => ({ ...p, scale: Math.max(p.scale * 0.8, 0.2) }))}
                  className="flex-1 text-xs py-1 rounded"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: COLORS.text }}
                >
                  −
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========== Main Canvas ========== */}
      <div className="absolute inset-0" style={{ left: leftSidebarOpen ? 240 : 0 }}>
        {/* Top search bar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <div
            className="flex items-center gap-3 px-4 py-2 rounded-xl backdrop-blur-md"
            style={{
              backgroundColor: 'rgba(17,17,24,0.9)',
              border: `1px solid ${COLORS.sidebarBorder}`,
              minWidth: 300,
            }}
          >
            <span style={{ color: COLORS.textMuted }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索节点..."
              className="bg-transparent text-sm outline-none flex-1"
              style={{ color: COLORS.text }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ color: COLORS.textMuted }}>
                ✕
              </button>
            )}
            {searchResult.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.accent + '30', color: COLORS.accent }}>
                {searchResult.length}
              </span>
            )}
          </div>
        </div>

        {/* Search result hints */}
        {searchResult.length > 1 && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 flex gap-2 flex-wrap justify-center max-w-xl">
            {searchResult.map(id => {
              const n = nodes.find(x => x.id === id)
              if (!n) return null
              return (
                <button
                  key={id}
                  onClick={() => centerOnNode(id)}
                  className="text-xs px-2 py-1 rounded-lg flex items-center gap-1.5 transition-all"
                  style={{
                    backgroundColor: n.id === selectedNodeId ? n.color + '30' : 'rgba(17,17,24,0.9)',
                    border: `1px solid ${n.color}40`,
                    color: n.color,
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: n.color }} />
                  {n.title}
                </button>
              )
            })}
          </div>
        )}

        {/* SVG Canvas */}
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ cursor: isPanning ? 'grabbing' : 'default' }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onWheel={handleWheel}
          onClick={() => {
            onNodeSelect(null)
            setContextMenu(null)
          }}
        >
          {/* Grid background */}
          <defs>
            <pattern
              id="grid"
              width={24 * viewTransform.scale}
              height={24 * viewTransform.scale}
              patternUnits="userSpaceOnUse"
              x={viewTransform.x % (24 * viewTransform.scale)}
              y={viewTransform.y % (24 * viewTransform.scale)}
            >
              <circle
                cx={1}
                cy={1}
                r={0.8}
                fill={COLORS.gridLine}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#grid)`} />

          {/* Transform group */}
          <g transform={`translate(${viewTransform.x}, ${viewTransform.y}) scale(${viewTransform.scale})`}>

            {/* Edges */}
            <g className="edges">
              {edges.map(edge => {
                const source = nodes.find(n => n.id === edge.sourceId)
                const target = nodes.find(n => n.id === edge.targetId)
                if (!source || !target) return null

                const dx = target.positionX - source.positionX
                const dy = target.positionY - source.positionY
                const angle = Math.atan2(dy, dx)
                const sourceRadius = 32
                const targetRadius = 32

                const startX = source.positionX + sourceRadius * Math.cos(angle)
                const startY = source.positionY + sourceRadius * Math.sin(angle)
                const endX = target.positionX - targetRadius * Math.cos(angle)
                const endY = target.positionY - targetRadius * Math.sin(angle)

                const midX = (startX + endX) / 2
                const midY = (startY + endY) / 2

                const isEdgeSelected = hoveredEdge === edge.id
                const dimmed = isEdgeDimmed(edge)

                return (
                  <g key={edge.id}>
                    {/* Invisible wider hit area for clicking */}
                    <line
                      x1={startX} y1={startY} x2={endX} y2={endY}
                      stroke="transparent"
                      strokeWidth={12}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredEdge(edge.id)}
                      onMouseLeave={() => setHoveredEdge(null)}
                      onClick={(e) => handleEdgeClick(e, edge.id)}
                    />
                    {/* Visible edge */}
                    <line
                      x1={startX} y1={startY} x2={endX} y2={endY}
                      stroke={getEdgeColor(edge.relationType)}
                      strokeWidth={isEdgeSelected ? 2.5 : dimmed ? 0.8 : 1.5}
                      opacity={dimmed ? 0.15 : 0.7}
                      markerEnd={`url(#arrow-${edge.relationType})`}
                    />
                    {/* Edge label */}
                    {edge.label && (
                      <g
                        opacity={dimmed ? 0.1 : isEdgeSelected ? 1 : 0.6}
                        onMouseEnter={() => setHoveredEdge(edge.id)}
                        onMouseLeave={() => setHoveredEdge(null)}
                        onClick={(e) => handleEdgeClick(e, edge.id)}
                        className="cursor-pointer"
                      >
                        <rect
                          x={midX - 24} y={midY - 10}
                          width={48} height={18}
                          rx={4}
                          fill={COLORS.bg}
                          opacity={0.85}
                        />
                        <text
                          x={midX} y={midY + 4}
                          fill={getEdgeColor(edge.relationType)}
                          fontSize={10}
                          textAnchor="middle"
                          className="pointer-events-none select-none"
                        >
                          {edge.label}
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}
            </g>

            {/* Nodes */}
            <g className="nodes">
              {nodes.map(node => {
                const isSelected = selectedNodeId === node.id
                const isHovered = hoveredNode === node.id
                const isSearchMatched = searchResult.length > 0 && searchResult.includes(node.id)
                const isDimmed = isNodeDimmed(node.id)
                const isExpanded = expandedNodes.has(node.id)
                const connectedToSelected = selectedNodeId ? getConnectedNodes(selectedNodeId).includes(node.id) : false
                const secondDegree = selectedNodeId === node.id ? getSecondDegreeNodes(node.id) : []

                const scale = isSelected ? 1.12 : isHovered ? 1.06 : isSearchMatched ? 1.05 : 1
                const opacity = isDimmed ? 0.2 : 1

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.positionX}, ${node.positionY}) scale(${scale})`}
                    opacity={opacity}
                    onMouseDown={(e) => handleMouseDown(e, node.id)}
                    onMouseUp={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      onNodeSelect(node.id)
                    }}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
                    className="cursor-pointer"
                  >
                    {/* Selection ring */}
                    {isSelected && (
                      <circle
                        r={48}
                        fill="none"
                        stroke={node.color}
                        strokeWidth={2}
                        opacity={0.4}
                        className="animate-pulse"
                      />
                    )}
                    {/* Search match ring */}
                    {isSearchMatched && !isSelected && (
                      <circle
                        r={45}
                        fill="none"
                        stroke={node.color}
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        opacity={0.6}
                      />
                    )}
                    {/* Connected-to-selected indicator */}
                    {connectedToSelected && (
                      <circle
                        r={44}
                        fill="none"
                        stroke={node.color}
                        strokeWidth={1}
                        opacity={0.2}
                      />
                    )}

                    {/* Glow on hover/select */}
                    {(isHovered || isSelected) && (
                      <circle
                        r={40}
                        fill={node.color}
                        opacity={0.12}
                      />
                    )}

                    {/* Main circle */}
                    <circle
                      r={32}
                      fill={COLORS.bg}
                      stroke={node.color}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />

                    {/* Title */}
                    <text
                      y={5}
                      textAnchor="middle"
                      fill={COLORS.text}
                      fontSize={12}
                      fontWeight={500}
                      className="select-none pointer-events-none"
                    >
                      {node.title.length > 9 ? node.title.slice(0, 9) + '…' : node.title}
                    </text>

                    {/* Expand indicator */}
                    {isExpanded && (
                      <text
                        y={-22}
                        textAnchor="middle"
                        fill={node.color}
                        fontSize={10}
                        opacity={0.8}
                        className="pointer-events-none select-none"
                      >
                        ▾ {getConnectedNodes(node.id).length}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>
          </g>

          {/* Arrow markers */}
          <defs>
            {relationTypes.map(type => (
              <marker
                key={type.value}
                id={`arrow-${type.value}`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill={type.color} />
              </marker>
            ))}
          </defs>
        </svg>

        {/* Zoom indicator */}
        <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg text-xs font-mono" style={{ backgroundColor: 'rgba(17,17,24,0.85)', color: COLORS.textMuted, border: `1px solid ${COLORS.sidebarBorder}` }}>
          {Math.round(viewTransform.scale * 100)}%
        </div>

        {/* Canvas drag hint */}
        {!leftSidebarOpen && (
          <div className="absolute bottom-4 left-4 text-xs" style={{ color: COLORS.textMuted }}>
            Alt+拖拽 或 中键拖拽 平移画布 | 滚轮缩放
          </div>
        )}
      </div>

      {/* ========== Right Detail Panel ========== */}
      {selectedNodeData && (
        <div
          className="absolute right-6 top-20 w-80 rounded-xl backdrop-blur-md p-5 z-10"
          style={{ backgroundColor: 'rgba(17,17,24,0.95)', border: `1px solid ${COLORS.sidebarBorder}` }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedNodeData.color }} />
                <h3 className="text-base font-medium" style={{ color: COLORS.text }}>
                  {selectedNodeData.title}
                </h3>
              </div>
              <div className="flex gap-1.5 mt-1">
                {selectedNodeData.tags?.map(tag => (
                  <span
                    key={tag}
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: selectedNodeData.color + '20', color: selectedNodeData.color }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => onNodeSelect(null)}
              className="text-sm transition-colors"
              style={{ color: COLORS.textMuted }}
              onMouseEnter={e => (e.currentTarget.style.color = COLORS.text)}
              onMouseLeave={e => (e.currentTarget.style.color = COLORS.textMuted)}
            >
              ✕
            </button>
          </div>

          {/* Description */}
          {selectedNodeData.description && (
            <p className="text-sm mb-4 leading-relaxed" style={{ color: COLORS.textMuted }}>
              {selectedNodeData.description}
            </p>
          )}

          {/* Expand/collapse button */}
          <div className="mb-3">
            <button
              onClick={() => toggleExpandNode(selectedNodeId!)}
              className="text-xs px-3 py-1.5 rounded-lg w-full text-center transition-colors"
              style={{
                backgroundColor: expandedNodes.has(selectedNodeId!) ? selectedNodeData.color + '20' : 'rgba(255,255,255,0.06)',
                color: expandedNodes.has(selectedNodeId!) ? selectedNodeData.color : COLORS.textMuted,
                border: `1px solid ${expandedNodes.has(selectedNodeId!) ? selectedNodeData.color + '40' : COLORS.sidebarBorder}`,
              }}
            >
              {expandedNodes.has(selectedNodeId!)
                ? `▾ 已展开 ${getConnectedNodes(selectedNodeId!).length} 个关联`
                : `▸ 展开 ${getConnectedNodes(selectedNodeId!).length} 个关联节点`}
            </button>
          </div>

          {/* Connected nodes preview */}
          {expandedNodes.has(selectedNodeId!) && (
            <div className="mb-3 space-y-1.5">
              {getConnectedNodes(selectedNodeId!).map(nid => {
                const n = nodes.find(x => x.id === nid)
                const edge = edges.find(e =>
                  (e.sourceId === selectedNodeId && e.targetId === nid) ||
                  (e.targetId === selectedNodeId && e.sourceId === nid)
                )
                if (!n || !edge) return null
                return (
                  <div
                    key={nid}
                    onClick={() => centerOnNode(nid)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: n.color }} />
                    <span className="text-sm flex-1" style={{ color: COLORS.text }}>{n.title}</span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: getEdgeColor(edge.relationType) + '20', color: getEdgeColor(edge.relationType) }}
                    >
                      {edge.relationType}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Connections */}
          <div>
            <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: COLORS.textMuted }}>
              全部关联关系 ({selectedNodeEdges.length})
            </label>
            <div className="space-y-1.5">
              {selectedNodeEdges.length === 0 ? (
                <p className="text-xs" style={{ color: COLORS.textMuted }}>暂无关联</p>
              ) : (
                selectedNodeEdges.map(edge => {
                  const otherId = edge.sourceId === selectedNodeId ? edge.targetId : edge.sourceId
                  const other = nodes.find(n => n.id === otherId)
                  const isOutgoing = edge.sourceId === selectedNodeId
                  return (
                    <div
                      key={edge.id}
                      onClick={() => centerOnNode(otherId)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
                      style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
                    >
                      <span
                        className="text-xs"
                        style={{ color: getEdgeColor(edge.relationType) }}
                      >
                        {isOutgoing ? '→' : '←'}
                      </span>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: other?.color }} />
                      <span className="text-sm flex-1" style={{ color: COLORS.text }}>{other?.title}</span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: getEdgeColor(edge.relationType) + '20', color: getEdgeColor(edge.relationType) }}
                      >
                        {edge.relationType}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 pt-3 flex gap-2" style={{ borderTop: `1px solid ${COLORS.sidebarBorder}` }}>
            <button
              onClick={() => {
                const connected = getConnectedNodes(selectedNodeId!)
                if (connected.length > 0) centerOnNode(connected[0])
              }}
              disabled={getConnectedNodes(selectedNodeId!).length === 0}
              className="flex-1 text-xs py-1.5 rounded-lg transition-colors disabled:opacity-30"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: COLORS.text }}
            >
              跳转关联
            </button>
            <button
              onClick={() => { deleteNode(selectedNodeId) }}
              className="flex-1 text-xs py-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
            >
              删除节点
            </button>
          </div>
        </div>
      )}

      {/* ========== Edge Detail Modal ========== */}
      {modalEdge && modalEdgeNodes.source && modalEdgeNodes.target && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setEdgeModal(null)}
        >
          <div
            className="w-96 rounded-xl p-6"
            style={{ backgroundColor: 'rgba(17,17,24,0.98)', border: `1px solid ${COLORS.sidebarBorder}` }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-base font-medium" style={{ color: COLORS.text }}>关系详情</h3>
              <button onClick={() => setEdgeModal(null)} style={{ color: COLORS.textMuted }}>✕</button>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex-1 px-3 py-2 rounded-lg text-center text-sm cursor-pointer"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: COLORS.text }}
                onClick={() => { centerOnNode(modalEdge.sourceId); setEdgeModal(null) }}
              >
                {modalEdgeNodes.source.title}
              </div>
              <div className="flex flex-col items-center">
                <div
                  className="w-8 h-0.5"
                  style={{ backgroundColor: getEdgeColor(modalEdge.relationType) }}
                />
                <span
                  className="text-xs px-1.5 py-0.5 rounded mt-1"
                  style={{ backgroundColor: getEdgeColor(modalEdge.relationType) + '20', color: getEdgeColor(modalEdge.relationType) }}
                >
                  {modalEdge.relationType}
                </span>
              </div>
              <div
                className="flex-1 px-3 py-2 rounded-lg text-center text-sm cursor-pointer"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: COLORS.text }}
                onClick={() => { centerOnNode(modalEdge.targetId); setEdgeModal(null) }}
              >
                {modalEdgeNodes.target.title}
              </div>
            </div>

            {modalEdge.label && (
              <div className="mb-4">
                <label className="text-xs uppercase tracking-wider mb-1 block" style={{ color: COLORS.textMuted }}>关系描述</label>
                <p className="text-sm" style={{ color: COLORS.text }}>{modalEdge.label}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => { deleteEdge(modalEdge.id); setEdgeModal(null) }}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
              >
                删除关系
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== Context Menu ========== */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 py-1 rounded-lg w-48 shadow-xl"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
              backgroundColor: 'rgba(17,17,24,0.98)',
              border: `1px solid ${COLORS.sidebarBorder}`,
              backdropFilter: 'blur(20px)',
            }}
          >
            {[
              { label: '选中节点', action: () => { centerOnNode(contextMenu.nodeId); setContextMenu(null) }, icon: '◉' },
              { label: '展开/收起关联', action: () => { toggleExpandNode(contextMenu.nodeId); setContextMenu(null) }, icon: '▾' },
              { label: '复制节点名称', action: () => { navigator.clipboard.writeText(nodes.find(n => n.id === contextMenu.nodeId)?.title || ''); setContextMenu(null) }, icon: '⎘' },
              { label: 'centerOnNode', action: () => { centerOnNode(contextMenu.nodeId); setContextMenu(null) }, icon: '⌖' },
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className="w-full text-left text-sm px-4 py-2 flex items-center gap-3 transition-colors"
                style={{ color: COLORS.text }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ color: COLORS.textMuted }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
            <div className="my-1" style={{ borderTop: `1px solid ${COLORS.sidebarBorder}` }} />
            <button
              onClick={() => {
                deleteNode(contextMenu.nodeId)
                setContextMenu(null)
              }}
              className="w-full text-left text-sm px-4 py-2 flex items-center gap-3 transition-colors"
              style={{ color: '#ef4444' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span>🗑</span>
              删除节点
            </button>
          </div>
        </>
      )}

      {/* ========== Toggle sidebar button ========== */}
      <button
        onClick={() => setLeftSidebarOpen(p => !p)}
        className="absolute top-4 z-30 w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors"
        style={{
          left: leftSidebarOpen ? 244 : 4,
          backgroundColor: 'rgba(17,17,24,0.9)',
          border: `1px solid ${COLORS.sidebarBorder}`,
          color: COLORS.textMuted,
        }}
        title={leftSidebarOpen ? '收起侧边栏' : '展开侧边栏'}
      >
        {leftSidebarOpen ? '◀' : '▶'}
      </button>

      {/* ========== Zoom indicator ========== */}
      <div className="absolute bottom-6 right-6 z-30 px-3 py-1.5 rounded-lg text-xs font-mono" style={{ backgroundColor: 'rgba(17,17,24,0.85)', border: `1px solid ${COLORS.sidebarBorder}`, color: COLORS.textMuted }}>
        缩放 {Math.round(viewTransform.scale * 100)}%
      </div>

      {/* ========== Empty state ========== */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🕸️</div>
            <h3 className="text-lg font-medium mb-2" style={{ color: COLORS.text }}>开始创建你的观念之网</h3>
            <p className="text-sm mb-4" style={{ color: COLORS.textMuted }}>点击右上角「创建节点」添加第一个概念</p>
          </div>
        </div>
      )}
    </div>
  )
})

export default GraphView
