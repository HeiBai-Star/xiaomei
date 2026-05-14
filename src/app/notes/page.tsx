import Link from 'next/link'

export default function NotesPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← 返回首页
          </Link>
          <h1 className="text-lg font-medium">笔记</h1>
        </div>
        <div className="flex items-center gap-3">
          <select className="px-3 py-1.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500">
            <option value="">所有节点</option>
            <option value="1">自由意志</option>
            <option value="2">决定论</option>
            <option value="3">存在主义</option>
          </select>
        </div>
      </header>

      {/* 主内容 */}
      <main className="pt-16 min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* 空状态 */}
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-5xl mb-6">📝</div>
            <h2 className="text-xl font-medium mb-3">笔记与观念之网联动</h2>
            <p className="text-zinc-400 text-center max-w-md mb-8">
              在观念之网中创建节点后，可以为每个节点添加笔记。
              笔记会直接关联到对应的概念，形成图谱与文字的双向通道。
            </p>
            <Link
              href="/graph"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
            >
              前往观念之网 →
            </Link>
          </div>

          {/* 示例笔记列表（模拟数据） */}
          <div className="mt-12">
            <h3 className="text-sm text-zinc-500 uppercase tracking-wider mb-4">现有笔记</h3>
            <div className="space-y-3">
              <div className="p-4 bg-zinc-900/50 border border-white/10 rounded-lg hover:border-pink-500/30 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 text-xs rounded-full"
                      style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}
                    >
                      自由意志
                    </span>
                    <span className="text-xs text-zinc-600">2 分钟前</span>
                  </div>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  关于自由意志与决定论的思考...
                </p>
              </div>

              <div className="p-4 bg-zinc-900/50 border border-white/10 rounded-lg hover:border-pink-500/30 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 text-xs rounded-full"
                      style={{ backgroundColor: 'rgba(236, 72, 153, 0.2)', color: '#f472b6' }}
                    >
                      存在主义
                    </span>
                    <span className="text-xs text-zinc-600">1 小时前</span>
                  </div>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  萨特的「存在先于本质」...
                </p>
              </div>

              <div className="p-4 bg-zinc-900/50 border border-white/10 rounded-lg hover:border-pink-500/30 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 text-xs rounded-full"
                      style={{ backgroundColor: 'rgba(244, 63, 94, 0.2)', color: '#fb7185' }}
                    >
                      虚无主义
                    </span>
                    <span className="text-xs text-zinc-600">昨天</span>
                  </div>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  尼采对虚无主义的批判与超越...
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
