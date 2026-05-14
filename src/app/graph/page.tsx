'use client'

import { useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// 动态导入图谱组件，避免 SSR 问题
const GraphView = dynamic(() => import('@/components/GraphView'), { ssr: false })

// 关系类型
const RELATION_TYPES = [
  { value: '因果', label: '因果', color: '#ef4444' },
  { value: '对立', label: '对立', color: '#f97316' },
  { value: '包含', label: '包含', color: '#eab308' },
  { value: '相关', label: '相关', color: '#22c55e' },
  { value: '衍生', label: '衍生', color: '#06b6d4' },
  { value: '类比', label: '类比', color: '#8b5cf6' },
]

export default function GraphPage() {
  const graphRef = useRef<{ addNode: (title: string, desc?: string) => void } | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [editingNode, setEditingNode] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEdgeModal, setShowEdgeModal] = useState(false)
  const [nodeTitle, setNodeTitle] = useState('')
  const [nodeDescription, setNodeDescription] = useState('')
  const [edgeSource, setEdgeSource] = useState('')
  const [edgeTarget, setEdgeTarget] = useState('')
  const [edgeType, setEdgeType] = useState('相关')
  const [edgeLabel, setEdgeLabel] = useState('')

  const handleCreateNode = useCallback(() => {
    setShowCreateModal(true)
    setNodeTitle('')
    setNodeDescription('')
  }, [])

  const handleCreateEdge = useCallback(() => {
    if (!selectedNode) return
    setEdgeSource(selectedNode)
    setEdgeTarget('')
    setEdgeType('相关')
    setEdgeLabel('')
    setShowEdgeModal(true)
  }, [selectedNode])

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← 返回首页
          </Link>
          <h1 className="text-lg font-medium">观念之网</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateNode}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            + 创建节点
          </button>
          <button
            onClick={handleCreateEdge}
            disabled={!selectedNode}
            className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            + 添加关系
          </button>
        </div>
      </header>

      {/* 图谱画布 */}
      <main className="pt-16 h-screen">
        <GraphView
          ref={graphRef as React.RefObject<{ addNode: (title: string, desc?: string) => void }>}
          onNodeSelect={setSelectedNode}
          selectedNodeId={selectedNode}
          relationTypes={RELATION_TYPES}
        />
      </main>

      {/* 创建节点弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-md p-6 bg-zinc-900 rounded-xl border border-white/10">
            <h2 className="text-lg font-medium mb-4">创建新节点</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">节点标题</label>
                <input
                  type="text"
                  value={nodeTitle}
                  onChange={(e) => setNodeTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500"
                  placeholder="输入节点名称..."
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">描述（可选）</label>
                <textarea
                  value={nodeDescription}
                  onChange={(e) => setNodeDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500 resize-none"
                  rows={3}
                  placeholder="简要描述这个概念..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (!nodeTitle.trim()) return
                    graphRef.current?.addNode(nodeTitle.trim(), nodeDescription.trim() || undefined)
                    setNodeTitle('')
                    setNodeDescription('')
                    setShowCreateModal(false)
                  }}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 添加关系弹窗 */}
      {showEdgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-md p-6 bg-zinc-900 rounded-xl border border-white/10">
            <h2 className="text-lg font-medium mb-4">添加关系</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">从节点</label>
                <input
                  type="text"
                  value={edgeSource}
                  disabled
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">到节点</label>
                <input
                  type="text"
                  value={edgeTarget}
                  onChange={(e) => setEdgeTarget(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500"
                  placeholder="选择目标节点..."
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">关系类型</label>
                <div className="flex flex-wrap gap-2">
                  {RELATION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setEdgeType(type.value)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        edgeType === type.value
                          ? 'border-indigo-500 bg-indigo-500/20'
                          : 'border-zinc-700 hover:border-zinc-500'
                      }`}
                      style={{
                        borderColor: edgeType === type.value ? type.color : undefined,
                        color: edgeType === type.value ? type.color : undefined,
                      }}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">关系描述（可选）</label>
                <input
                  type="text"
                  value={edgeLabel}
                  onChange={(e) => setEdgeLabel(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500"
                  placeholder="描述这段关系..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowEdgeModal(false)}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    // TODO: 调用 API 创建边
                    setShowEdgeModal(false)
                  }}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
