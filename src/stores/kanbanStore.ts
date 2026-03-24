import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Task {
  id: string
  title: string
  tag: string
}

export type ColumnId = 'backlog' | 'todo' | 'progress' | 'done'

export interface KanbanState {
  columns: Record<ColumnId, Task[]>
  moveTask: (taskId: string, from: ColumnId, to: ColumnId) => void
  addTask: (column: ColumnId, title: string, tag: string) => void
  deleteTask: (column: ColumnId, taskId: string) => void
  resetBoard: () => void
}

const DEFAULT_COLUMNS: Record<ColumnId, Task[]> = {
  backlog: [
    { id: 't1', title: 'Integrar WebSocket para notificaciones en tiempo real', tag: 'feature' },
    { id: 't2', title: 'Anadir tests E2E con Playwright', tag: 'test' },
  ],
  todo: [
    { id: 't3', title: 'Configurar SonarQube en pipeline CI/CD', tag: 'mejora' },
    { id: 't4', title: 'Fix: paginacion no resetea al cambiar filtro', tag: 'bug' },
  ],
  progress: [
    { id: 't5', title: 'Dashboard de metricas con React Query', tag: 'feature' },
  ],
  done: [
    { id: 't6', title: 'Setup proyecto con Vite + Tailwind', tag: 'mejora' },
    { id: 't7', title: 'CRUD de productos con Zustand', tag: 'feature' },
    { id: 't8', title: 'Documentar endpoints de la API REST', tag: 'docs' },
  ],
}

let nextId = 100

export const useKanbanStore = create<KanbanState>()(
  persist(
    (set) => ({
      columns: DEFAULT_COLUMNS,

      moveTask: (taskId, from, to) =>
        set((state) => {
          const task = state.columns[from].find(t => t.id === taskId)
          if (!task || from === to) return state
          return {
            columns: {
              ...state.columns,
              [from]: state.columns[from].filter(t => t.id !== taskId),
              [to]: [...state.columns[to], task],
            },
          }
        }),

      addTask: (column, title, tag) =>
        set((state) => ({
          columns: {
            ...state.columns,
            [column]: [...state.columns[column], { id: `t${++nextId}`, title, tag }],
          },
        })),

      deleteTask: (column, taskId) =>
        set((state) => ({
          columns: {
            ...state.columns,
            [column]: state.columns[column].filter(t => t.id !== taskId),
          },
        })),

      resetBoard: () => set({ columns: DEFAULT_COLUMNS }),
    }),
    { name: 'portfolio-kanban' },
  ),
)
