import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ArchivedTask, Task } from '../types/task';

const TASKS_STORAGE_KEY = '@checktracker/tasks';
const HISTORY_STORAGE_KEY = '@checktracker/history';
const USER_ACCOUNT_STORAGE_KEY = '@checktracker/user-account';
const CURRENT_USER_STORAGE_KEY = '@checktracker/current-user';

export type UserAccount = {
  username: string;
  password: string;
};

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

export async function loadHistoryTasks() {
  const storedTasks = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);

  if (!storedTasks) {
    return [];
  }

  const parsedTasks = JSON.parse(storedTasks);

  if (!Array.isArray(parsedTasks)) {
    return [];
  }

  return parsedTasks.filter(isStoredTask).map(normalizeArchivedTask);
}

export async function saveHistoryTasks(tasks: ArchivedTask[]) {
  await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(tasks));
}

export async function loadUserAccount() {
  const storedAccount = await AsyncStorage.getItem(USER_ACCOUNT_STORAGE_KEY);

  if (!storedAccount) {
    return null;
  }

  const parsedAccount = JSON.parse(storedAccount);

  if (!isUserAccount(parsedAccount)) {
    return null;
  }

  return parsedAccount;
}

export async function saveUserAccount(account: UserAccount) {
  await AsyncStorage.setItem(USER_ACCOUNT_STORAGE_KEY, JSON.stringify(account));
}

export async function loadCurrentUsername() {
  return AsyncStorage.getItem(CURRENT_USER_STORAGE_KEY);
}

export async function saveCurrentUsername(username: string) {
  await AsyncStorage.setItem(CURRENT_USER_STORAGE_KEY, username);
}

export async function clearCurrentUsername() {
  await AsyncStorage.removeItem(CURRENT_USER_STORAGE_KEY);
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
    notes: typeof task.notes === 'string' ? task.notes : '',
    hasReminder:
      typeof task.hasReminder === 'boolean' ? task.hasReminder : false,
  };
}

function normalizeArchivedTask(task: StoredTask): ArchivedTask {
  const archivedAt =
    'archivedAt' in task && typeof task.archivedAt === 'string'
      ? task.archivedAt
      : new Date().toISOString();

  return {
    ...normalizeTask(task),
    archivedAt,
  };
}

function isUserAccount(value: unknown): value is UserAccount {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const account = value as UserAccount;

  return (
    typeof account.username === 'string' &&
    typeof account.password === 'string'
  );
}
