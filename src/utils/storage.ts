import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Task } from '../types/task';

const TASKS_STORAGE_KEY = '@checktracker/tasks';

export async function loadTasks() {
  const storedTasks = await AsyncStorage.getItem(TASKS_STORAGE_KEY);

  if (!storedTasks) {
    return [];
  }

  const parsedTasks = JSON.parse(storedTasks);

  if (!Array.isArray(parsedTasks)) {
    return [];
  }

  return parsedTasks.filter(isStoredTask).map(normalizeTask);
}

export async function saveTasks(tasks: Task[]) {
  await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

type StoredTask = Partial<Task> & Pick<Task, 'id' | 'title' | 'createdAt' | 'completed'>;

function isStoredTask(value: unknown): value is StoredTask {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const task = value as Task;

  return (
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.createdAt === 'string' &&
    typeof task.completed === 'boolean'
  );
}

function normalizeTask(task: StoredTask): Task {
  return {
    ...task,
    startTime: typeof task.startTime === 'string' ? task.startTime : '',
    endTime: typeof task.endTime === 'string' ? task.endTime : '',
    hasReminder:
      typeof task.hasReminder === 'boolean' ? task.hasReminder : false,
  };
}
