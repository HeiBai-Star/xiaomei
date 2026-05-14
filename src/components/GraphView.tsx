'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface Node {
  id: string
  title: string
  description?: string
  positionX: number
  positionY: number
  color: string
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

interface GraphViewProps {
  onNodeSelect: (nodeId: string | null) => void
  selectedNodeId: string | null
  relationTypes: RelationType[]
}

// 模拟数据
const mockNodes: Node[] = [
  { id: '1', title: '自由意志', description: '指个体做出选择的能力', positionX: 400, positionY: 300, color: '#6366f1' },
  { id: '2', title: '决定论', description: '所有事件都由先前原因决定', positionX: 600, positionY: 200, color: '#8b5cf6' },
  { id: '3', title: '存在主义', description: '存在先于本质', positionX: 300, positionY: 400, color: '#ec4899' },
  { id: '4', title: '虚无主义', description: '生命没有客观意义', positionX: 550, positionY: 450, color: '#f43f5e' },
]

const mockEdges: Edge[] = [
  { id: 'e1', sourceId: '1', targetId: '2', relationType: '对立', label: '相互排斥' },
  { id: 'e2', sourceId: '1', targetId: '3', relationType: '包含', label: '核心概念' },
  { id: 'e3', sourceId: '3', targetId: '4', relationType: '衍生', label: '极端形式' },
]

export default function GraphView({ onNodeSelect, selectedNodeId, relationTypes }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [nodes, setNodes] = useState(mockNodes)
  const [edges, setEdges] = useState(mockEdges)
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  // 获取边的颜色
  const getEdgeColor = useCallback((type: string) => {
    const relationType = relationTypes.find(r => r.value === type)
    return relationType?.color || '#71717a'
  }, [relationTypes])

  // 处理鼠标事件
  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return
    e.stopPropagation()
    setDraggingNode(nodeId)
    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      setOffset({
        x: e.clientX - node.positionX,
        y: e.clientY - node.positionY,
      })
    }
  }, [nodes])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingNode) return
    setNodes(prev => prev.map(node => {
      if (node.id === draggingNode) {
        return {
          ...node,
          positionX: e.clientX - offset.x,
          positionY: e.clientY - offset.y,
        }
      }
      return node
    }))
  }, [draggingNode, offset])

  const handleMouseUp = useCallback(() => {
    setDraggingNode(null)
  }, [])

  const handleNodeClick = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    onNodeSelect(selectedNodeId === nodeId ? null : nodeId)
  }, [selectedNodeId, onNodeSelect])

  const handleSvgClick = useCallback(() => {
    onNodeSelect(null)
  }, [onNodeSelect])

  // 键盘删除
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        setNodes(prev => prev.filter(n => n.id !== selectedNodeId))
        setEdges(prev => prev.filter(edge => 
          edge.sourceId !== selectedNodeId && edge.targetId !== selectedNodeId
        ))
        onNodeSelect(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodeId, onNodeSelect])

  return (
    <div className="w-full h-full relative bg-zinc-950">
      {/* 网格背景 */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: 'radial-gradient(circle, #27272a 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* 主图谱 SVG */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleSvgClick}
      >
        <defs>
          {/* 箭头标记 */}
          {relationTypes.map(type => (
            <marker
              key={type.value}
              id={`arrow-${type.value}`}
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={type.color} />
            </marker>
          ))}
        </defs>

        {/* 边 */}
        <g className="edges">
          {edges.map(edge => {
            const source = nodes.find(n => n.id === edge.sourceId)
            const target = nodes.find(n => n.id === edge.targetId)
            if (!source || !target) return null

            const dx = target.positionX - source.positionX
            const dy = target.positionY - source.positionY
            const angle = Math.atan2(dy, dx)
            const sourceRadius = 30
            const targetRadius = 30

            const startX = source.positionX + sourceRadius * Math.cos(angle)
            const startY = source.positionY + sourceRadius * Math.sin(angle)
            const endX = target.positionX - targetRadius * Math.cos(angle)
            const endY = target.positionY - targetRadius * Math.sin(angle)

            const midX = (startX + endX) / 2
            const midY = (startY + endY) / 2

            return (
              <g key={edge.id}>
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke={getEdgeColor(edge.relationType)}
                  strokeWidth={selectedNodeId === edge.sourceId || selectedNodeId === edge.targetId ? 2 : 1.5}
                  markerEnd={`url(#arrow-${edge.relationType})`}
                  opacity={selectedNodeId && selectedNodeId !== edge.sourceId && selectedNodeId !== edge.targetId ? 0.3 : 0.8}
                />
                {edge.label && (
                  <text
                    x={midX}
                    y={midY - 8}
                    fill={getEdgeColor(edge.relationType)}
                    fontSize={11}
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                  >
                    {edge.label}
                  </text>
                )}
                <text
                  x={midX}
                  y={midY + 6}
                  fill="#71717a"
                  fontSize={10}
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                >
                  {edge.relationType}
                </text>
              </g>
            )
          })}
        </g>

        {/* 节点 */}
        <g className="nodes">
          {nodes.map(node => {
            const isSelected = selectedNodeId === node.id
            const isHovered = hoveredNode === node.id
            const scale = isSelected ? 1.1 : isHovered ? 1.05 : 1

            return (
              <g
                key={node.id}
                transform={`translate(${node.positionX}, ${node.positionY}) scale(${scale})`}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                onMouseUp={(e) => e.stopPropagation()}
                onClick={(e) => handleNodeClick(e, node.id)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer"
              >
                {/* 光晕 */}
                {isSelected && (
                  <circle
                    r={45}
                    fill={node.color}
                    opacity={0.15}
                    className="animate-pulse"
                  />
                )}

                {/* 节点主体 */}
                <circle
                  r={32}
                  fill="#18181b"
                  stroke={node.color}
                  strokeWidth={isSelected ? 3 : 2}
                />

                {/* 节点标题 */}
                <text
                  y={5}
                  textAnchor="middle"
                  fill="white"
                  fontSize={13}
                  fontWeight={500}
                  className="select-none"
                >
                  {node.title.length > 8 ? node.title.slice(0, 8) + '...' : node.title}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {/* 节点详情面板 */}
      {selectedNodeId && (
        <div className="absolute right-6 top-24 w-80 bg-zinc-900/95 backdrop-blur-sm rounded-xl border border-white/10 p-5">
          {(() => {
            const node = nodes.find(n => n.id === selectedNodeId)
            const nodeEdges = edges.filter(e => e.sourceId === selectedNodeId || e.targetId === selectedNodeId)
            if (!node) return null

            return (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium">{node.title}</h3>
                    <div
                      className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full"
                      style={{ backgroundColor: node.color + '20', color: node.color }}
                    >
                      节点
                    </div>
                  </div>
                  <button
                    onClick={() => onNodeSelect(null)}
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {node.description && (
                  <p className="text-sm text-zinc-400 mb-4">{node.description}</p>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">关联关系</label>
                    <div className="mt-2 space-y-2">
                      {nodeEdges.length === 0 ? (
                        <p className="text-sm text-zinc-600">暂无关联</p>
                      ) : (
                        nodeEdges.map(edge => {
                          const otherNodeId = edge.sourceId === selectedNodeId ? edge.targetId : edge.sourceId
                          const otherNode = nodes.find(n => n.id === otherNodeId)
                          const isOutgoing = edge.sourceId === selectedNodeId
                          return (
                            <div
                              key={edge.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <span
                                className="px-1.5 py-0.5 text-xs rounded"
                                style={{
                                  backgroundColor: getEdgeColor(edge.relationType) + '20',
                                  color: getEdgeColor(edge.relationType),
                                }}
                              >
                                {isOutgoing ? '→' : '←'} {edge.relationType}
                              </span>
                              <span className="text-zinc-300">
                                {otherNode?.title || '未知'}
                              </span>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10">
                    <p className="text-xs text-zinc-500">
                      按 Delete 键删除节点及其所有关联
                    </p>
                  </div>
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* 空状态提示 */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">🕸️</div>
            <h3 className="text-lg font-medium mb-2">开始创建你的观念之网</h3>
            <p className="text-sm text-zinc-500">点击右上角「创建节点」添加第一个概念</p>
          </div>
        </div>
      )}

      {/* 关系类型图例 */}
      <div className="absolute left-6 bottom-6 bg-zinc-900/80 backdrop-blur-sm rounded-lg border border-white/10 p-4">
        <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">关系类型</h4>
        <div className="space-y-2">
          {relationTypes.map(type => (
            <div key={type.value} className="flex items-center gap-2">
              <div
                className="w-3 h-0.5 rounded-full"
                style={{ backgroundColor: type.color }}
              />
              <span className="text-xs text-zinc-400">{type.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
