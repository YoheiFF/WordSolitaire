import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: text('created_at').default(new Date().toISOString()),
})

export const cards = sqliteTable('cards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id').references(() => categories.id),  // NULL=カテゴリカード
  text: text('text').notNull(),
  type: text('type', { enum: ['normal', 'category'] }).notNull(),
  createdAt: text('created_at').default(new Date().toISOString()),
})

export const stages = sqliteTable('stages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  totalMoves: integer('total_moves').notNull(),
  createdAt: text('created_at').default(new Date().toISOString()),
})

export const stageCards = sqliteTable('stage_cards', {
  stageId: integer('stage_id').notNull().references(() => stages.id),
  cardId: integer('card_id').notNull().references(() => cards.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.stageId, table.cardId] }),
}))

export const playerProgress = sqliteTable('player_progress', {
  playerId: text('player_id').notNull(),
  stageId: integer('stage_id').notNull().references(() => stages.id),
  cleared: integer('cleared').notNull().default(0),
  bestMovesRemaining: integer('best_moves_remaining'),
  playCount: integer('play_count').notNull().default(0),
  updatedAt: text('updated_at').default(new Date().toISOString()),
}, (table) => ({
  pk: primaryKey({ columns: [table.playerId, table.stageId] }),
}))
