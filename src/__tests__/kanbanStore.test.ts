import { describe, it, expect, beforeEach } from 'vitest'
import { useKanbanStore } from '../stores/kanbanStore'

describe('Kanban Store (Zustand)', () => {
  beforeEach(() => {
    useKanbanStore.getState().resetBoard()
  })

  it('tiene columnas iniciales con tareas', () => {
    const { columns } = useKanbanStore.getState()
    expect(columns.backlog.length).toBeGreaterThan(0)
    expect(columns.done.length).toBeGreaterThan(0)
  })

  it('mueve una tarea entre columnas', () => {
    const store = useKanbanStore.getState()
    const task = store.columns.backlog[0]
    store.moveTask(task.id, 'backlog', 'progress')

    const updated = useKanbanStore.getState()
    expect(updated.columns.backlog.find(t => t.id === task.id)).toBeUndefined()
    expect(updated.columns.progress.find(t => t.id === task.id)).toBeDefined()
  })

  it('anade una tarea nueva', () => {
    const store = useKanbanStore.getState()
    const before = store.columns.todo.length
    store.addTask('todo', 'Nueva tarea de test', 'test')

    const updated = useKanbanStore.getState()
    expect(updated.columns.todo).toHaveLength(before + 1)
    expect(updated.columns.todo[updated.columns.todo.length - 1]?.title).toBe('Nueva tarea de test')
  })

  it('elimina una tarea', () => {
    const store = useKanbanStore.getState()
    const task = store.columns.backlog[0]
    const before = store.columns.backlog.length
    store.deleteTask('backlog', task.id)

    expect(useKanbanStore.getState().columns.backlog).toHaveLength(before - 1)
  })

  it('resetea al estado inicial', () => {
    const store = useKanbanStore.getState()
    store.addTask('todo', 'Temporal', 'bug')
    store.resetBoard()

    const reset = useKanbanStore.getState()
    expect(reset.columns.todo.find(t => t.title === 'Temporal')).toBeUndefined()
  })
})
