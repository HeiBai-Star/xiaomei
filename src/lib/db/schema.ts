import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// 节点表
export const nodes = sqliteTable('nodes', {
  id: text('id').primaryKey(), // UUID
  title: text('title').notNull(),
  description: text('description'),
  positionX: integer('position_x').default(0),
  positionY: integer('position_y').default(0),
  color: text('color').default('#6366f1'), // 默认靛蓝色
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// 笔记表
export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(), // UUID
  nodeId: text('node_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// 关系表（边）
export const edges = sqliteTable('edges', {
  id: text('id').primaryKey(), // UUID
  sourceId: text('source_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  targetId: text('target_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  relationType: text('relation_type').notNull(), // 因果/对立/包含/相关/...
  label: text('label'), // 关系描述
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// 类型导出
export type Node = typeof nodes.$inferSelect
export type NewNode = typeof nodes.$inferInsert
export type Note = typeof notes.$inferSelect
export type NewNote = typeof notes.$inferInsert
export type Edge = typeof edges.$inferSelect
export type NewEdge = typeof edges.$inferInsert
