import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, X, GripVertical, ArrowRight } from 'lucide-react'
import { useKanbanStore, type ColumnId, type Task } from '../stores/kanbanStore'

const COLUMN_META: { id: ColumnId; labelKey: string; color: string }[] = [
  { id: 'backlog', labelKey: 'kanban_page.backlog', color: '#8888a0' },
  { id: 'todo', labelKey: 'kanban_page.todo', color: '#6c63ff' },
  { id: 'progress', labelKey: 'kanban_page.in_progress', color: '#f59e0b' },
  { id: 'done', labelKey: 'kanban_page.done', color: '#22c55e' },
]

const TAGS = ['feature', 'bug', 'mejora', 'docs', 'test']
const TAG_COLORS: Record<string, string> = { feature: '#6c63ff', bug: '#ef4444', mejora: '#22c55e', docs: '#8888a0', test: '#f59e0b' }

export default function KanbanDemo() {
  const { t } = useTranslation()
  const { columns, moveTask, addTask, deleteTask, resetBoard } = useKanbanStore()

  // Desktop: HTML5 drag & drop
  const [dragItem, setDragItem] = useState<{ taskId: string; from: ColumnId } | null>(null)
  const [dragOver, setDragOver] = useState<ColumnId | null>(null)

  // Mobile: tap-to-select, tap-column-to-move
  const [selected, setSelected] = useState<{ task: Task; from: ColumnId } | null>(null)

  const [adding, setAdding] = useState<ColumnId | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newTag, setNewTag] = useState('feature')

  // Desktop drop
  const handleDrop = (to: ColumnId) => {
    if (dragItem) moveTask(dragItem.taskId, dragItem.from, to)
    setDragItem(null); setDragOver(null)
  }

  // Mobile: tap task to select, tap again to deselect
  const handleTapTask = (task: Task, from: ColumnId) => {
    if (selected?.task.id === task.id) {
      setSelected(null)
    } else {
      setSelected({ task, from })
    }
  }

  // Mobile: tap column header to move selected task there
  const handleTapColumn = (to: ColumnId) => {
    if (!selected || selected.from === to) return
    moveTask(selected.task.id, selected.from, to)
    setSelected(null)
  }

  const handleAdd = (col: ColumnId) => {
    if (!newTitle.trim()) return
    addTask(col, newTitle.trim(), newTag)
    setNewTitle(''); setAdding(null)
  }

  const totalTasks = Object.values(columns).reduce((s, c) => s + c.length, 0)
  const doneTasks = columns.done.length
  const isSelected = (taskId: string) => selected?.task.id === taskId

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">{t('kanban_page.title')}</h1>
          <p className="text-muted text-sm">
            {doneTasks}/{totalTasks} {t('kanban_page.completed')} &middot; {t('kanban_page.zustand_persist')}
          </p>
        </div>
        <button onClick={() => { resetBoard(); setSelected(null) }} className="text-xs text-muted border border-border rounded-lg px-3 py-1.5 hover:text-white hover:border-muted transition-colors">
          {t('kanban_page.reset')}
        </button>
      </div>

      {/* Mobile: instruction when task selected */}
      {selected && (
        <div className="mb-3 px-3 py-2 bg-accent-glow border border-accent rounded-lg text-sm flex items-center gap-2 lg:hidden">
          <ArrowRight size={14} className="text-accent shrink-0" />
          <span>{t('kanban_page.tap_instruction')} <strong className="text-accent">&quot;{selected.task.title.slice(0, 30)}{selected.task.title.length > 30 ? '...' : ''}&quot;</strong></span>
          <button onClick={() => setSelected(null)} className="ml-auto text-muted hover:text-white shrink-0"><X size={14} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMN_META.map(col => {
          const isDropTarget = selected && selected.from !== col.id
          const isActiveOver = dragOver === col.id

          return (
            <div
              key={col.id}
              className={`bg-card border rounded-xl min-h-[200px] sm:min-h-[300px] transition-all ${
                isActiveOver ? 'border-accent shadow-[0_0_15px_var(--color-accent-glow)]' :
                isDropTarget ? 'border-accent/40' :
                'border-border'
              }`}
              onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(col.id)}
            >
              {/* Column header - tappable on mobile when task selected */}
              <button
                onClick={() => handleTapColumn(col.id)}
                disabled={!isDropTarget}
                className={`w-full flex items-center gap-2 px-3 py-2.5 border-b transition-all ${
                  isDropTarget ? 'border-accent bg-accent-glow cursor-pointer' : 'border-border cursor-default'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                <h3 className="text-sm font-semibold flex-1 text-left">{t(col.labelKey)}</h3>
                <span className="text-[0.7rem] bg-white/[0.06] px-1.5 py-0.5 rounded-full text-muted">{columns[col.id].length}</span>
                {isDropTarget && <ArrowRight size={14} className="text-accent animate-pulse lg:hidden" />}
              </button>

              <div className="p-2 flex flex-col gap-1.5">
                {columns[col.id].map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => { setDragItem({ taskId: task.id, from: col.id }); setSelected(null) }}
                    onClick={() => handleTapTask(task, col.id)}
                    className={`group flex items-start gap-1.5 p-2.5 bg-bg border rounded-lg transition-all ${
                      isSelected(task.id)
                        ? 'border-accent bg-accent-glow ring-1 ring-accent'
                        : 'border-border hover:border-accent cursor-grab active:cursor-grabbing active:opacity-70'
                    }`}
                  >
                    <GripVertical size={14} className="text-muted/30 shrink-0 mt-0.5 hidden sm:block" />
                    <div className="flex-1 min-w-0">
                      <span className="inline-block text-[0.6rem] font-semibold uppercase tracking-wide px-1.5 py-px rounded-full text-white mb-1" style={{ background: TAG_COLORS[task.tag] || '#888' }}>
                        {task.tag}
                      </span>
                      <p className="text-xs leading-snug">{task.title}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteTask(col.id, task.id); if (isSelected(task.id)) setSelected(null) }}
                      className="opacity-0 group-hover:opacity-50 hover:!opacity-100 hover:text-red-400 text-muted transition-all p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {adding === col.id ? (
                  <div className="flex flex-col gap-1.5 p-2 border border-accent rounded-lg bg-bg">
                    <input autoFocus placeholder={t('kanban_page.title_placeholder')} value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAdd(col.id); if (e.key === 'Escape') setAdding(null) }}
                      className="px-2 py-1.5 rounded bg-card border border-border text-white text-xs focus:outline-none focus:border-accent" />
                    <select value={newTag} onChange={e => setNewTag(e.target.value)} className="px-2 py-1 rounded bg-card border border-border text-white text-xs focus:outline-none focus:border-accent">
                      {TAGS.map(tg => <option key={tg} value={tg}>{tg}</option>)}
                    </select>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleAdd(col.id)} className="flex-1 px-2 py-1 rounded bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors">{t('kanban_page.add')}</button>
                      <button onClick={() => setAdding(null)} className="px-2 py-1 rounded border border-border text-xs text-muted hover:text-white transition-colors">{t('kanban_page.cancel')}</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setAdding(col.id); setNewTitle(''); setNewTag('feature') }}
                    className="flex items-center justify-center gap-1 w-full py-2 border border-dashed border-border rounded-lg text-xs text-muted hover:border-accent hover:text-accent transition-all">
                    <Plus size={14} /> {t('kanban_page.add_task')}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
