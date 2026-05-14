import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium">magicdong.top</h1>
            <p className="text-xs text-zinc-500 mt-0.5">不必从头开始，从中间穿行</p>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* 介绍 */}
          <section className="mb-16">
            <h2 className="text-3xl font-medium mb-4">装置集</h2>
            <p className="text-zinc-400 leading-relaxed max-w-2xl">
              这是一个个人工具集。每个装置都是一个小世界，在这里生成超越文本与视频的事物。
              借用德勒兹的说法：装置是一组由异质元素构成的动态网络。
            </p>
          </section>

          {/* 装置列表 */}
          <section>
            <h3 className="text-sm text-zinc-500 uppercase tracking-wider mb-6">可用装置</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {/* 观念之网 */}
              <Link
                href="/graph"
                className="group block p-6 bg-zinc-900/50 border border-white/10 rounded-xl hover:border-indigo-500/50 hover:bg-zinc-900 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
                  >
                    🕸️
                  </div>
                  <span className="text-xs text-zinc-500">v0.1.0</span>
                </div>
                <h4 className="text-lg font-medium mb-1 group-hover:text-indigo-400 transition-colors">
                  观念之网
                </h4>
                <p className="text-sm text-zinc-500 mb-3">
                  Web of Ideas · 知识图谱
                </p>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  在哲学概念、领域、传统、立场和关系中穿行。让概念产生新的上下文。
                </p>
              </Link>

              {/* 笔记系统 */}
              <Link
                href="/notes"
                className="group block p-6 bg-zinc-900/50 border border-white/10 rounded-xl hover:border-indigo-500/50 hover:bg-zinc-900 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: 'rgba(236, 72, 153, 0.2)' }}
                  >
                    📝
                  </div>
                  <span className="text-xs text-zinc-500">v0.1.0</span>
                </div>
                <h4 className="text-lg font-medium mb-1 group-hover:text-pink-400 transition-colors">
                  笔记
                </h4>
                <p className="text-sm text-zinc-500 mb-3">
                  Notes · 卡片盒
                </p>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  与节点关联的笔记系统。每个笔记都属于一个概念，在图谱与文字之间建立桥梁。
                </p>
              </Link>

              {/* 任务管理 - 规划中 */}
              <div className="block p-6 bg-zinc-900/30 border border-white/5 rounded-xl opacity-60 cursor-not-allowed">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
                  >
                    ✅
                  </div>
                  <span className="text-xs text-zinc-600">规划中</span>
                </div>
                <h4 className="text-lg font-medium mb-1 text-zinc-500">
                  任务管理
                </h4>
                <p className="text-sm text-zinc-600 mb-3">
                  Tasks · 待办事项
                </p>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  个人任务和日程管理，跟踪想法到执行的路径。
                </p>
              </div>

              {/* 代码片段 - 规划中 */}
              <div className="block p-6 bg-zinc-900/30 border border-white/5 rounded-xl opacity-60 cursor-not-allowed">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: 'rgba(249, 115, 22, 0.2)' }}
                  >
                    💻
                  </div>
                  <span className="text-xs text-zinc-600">规划中</span>
                </div>
                <h4 className="text-lg font-medium mb-1 text-zinc-500">
                  代码片段
                </h4>
                <p className="text-sm text-zinc-600 mb-3">
                  Snippets · 代码库
                </p>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  收藏和整理常用的代码片段，快速检索和使用。
                </p>
              </div>
            </div>
          </section>

          {/* 底部 */}
          <footer className="mt-20 pt-8 border-t border-white/10">
            <p className="text-sm text-zinc-600">
              A Window on the World · Philosophy & its apparatuses
            </p>
          </footer>
        </div>
      </main>
    </div>
  )
}
