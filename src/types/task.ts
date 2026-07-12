export type Task = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  hasReminder: boolean;
  createdAt: string;
  completed: boolean;
};

export type ArchivedTask = Task & {
  archivedAt: string;
};

export type TaskFilter = 'all' | 'active' | 'completed';
