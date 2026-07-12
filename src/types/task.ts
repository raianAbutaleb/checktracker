export type Task = {
  id: string;
  title: string;
  createdAt: string;
  completed: boolean;
};

export type TaskFilter = 'all' | 'active' | 'completed';
