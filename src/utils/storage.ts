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

  return parsedTasks.filter(isTask);
}

export async function saveTasks(tasks: Task[]) {
  await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

function isTask(value: unknown): value is Task {
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
