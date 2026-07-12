import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { EmptyState } from './src/components/EmptyState';
import { FilterTabs } from './src/components/FilterTabs';
import { TaskItem } from './src/components/TaskItem';
import type { ArchivedTask, Task, TaskFilter } from './src/types/task';
import {
  loadHistoryTasks,
  loadTasks,
  saveHistoryTasks,
  saveTasks,
} from './src/utils/storage';

type AppView = 'tasks' | 'history';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [historyTasks, setHistoryTasks] = useState<ArchivedTask[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [hasReminder, setHasReminder] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all');
  const [activeView, setActiveView] = useState<AppView>('tasks');
  const [hasLoadedTasks, setHasLoadedTasks] = useState(false);

  useEffect(() => {
    async function restoreTasks() {
      try {
        const [restoredTasks, restoredHistoryTasks] = await Promise.all([
          loadTasks(),
          loadHistoryTasks(),
        ]);

        setTasks(restoredTasks);
        setHistoryTasks(restoredHistoryTasks);
      } catch {
        Alert.alert('Storage error', 'Saved tasks could not be loaded.');
      } finally {
        setHasLoadedTasks(true);
      }
    }

    restoreTasks();
  }, []);

  useEffect(() => {
    if (!hasLoadedTasks) {
      return;
    }

    saveTasks(tasks).catch(() => {
      Alert.alert('Storage error', 'Your latest task changes could not be saved.');
    });
  }, [hasLoadedTasks, tasks]);

  useEffect(() => {
    if (!hasLoadedTasks) {
      return;
    }

    saveHistoryTasks(historyTasks).catch(() => {
      Alert.alert('Storage error', 'Your latest history changes could not be saved.');
    });
  }, [hasLoadedTasks, historyTasks]);

  const counts = useMemo(
    () => ({
      all: tasks.length,
      active: tasks.filter((task) => !task.completed).length,
      completed: tasks.filter((task) => task.completed).length,
    }),
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    if (activeFilter === 'active') {
      return tasks.filter((task) => !task.completed);
    }

    if (activeFilter === 'completed') {
      return tasks.filter((task) => task.completed);
    }

    return tasks;
  }, [activeFilter, tasks]);

  function resetComposer() {
    setTaskTitle('');
    setStartTime('');
    setEndTime('');
    setHasReminder(false);
    setEditingTaskId(null);
  }

  function saveTask() {
    const trimmedTitle = taskTitle.trim();

    if (!trimmedTitle) {
      return;
    }

    if (editingTaskId) {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === editingTaskId
            ? {
                ...task,
                title: trimmedTitle,
                startTime: startTime.trim(),
                endTime: endTime.trim(),
                hasReminder,
              }
            : task,
        ),
      );
      resetComposer();
      Keyboard.dismiss();
      return;
    }

    const task: Task = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: trimmedTitle,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      hasReminder,
      createdAt: new Date().toISOString(),
      completed: false,
    };

    setTasks((currentTasks) => [task, ...currentTasks]);
    resetComposer();
    setActiveFilter('all');
    Keyboard.dismiss();
  }

  function toggleTask(taskId: string) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  function deleteTask(taskId: string) {
    const taskToArchive = tasks.find((task) => task.id === taskId);

    if (taskToArchive) {
      setHistoryTasks((currentHistoryTasks) => [
        {
          ...taskToArchive,
          archivedAt: new Date().toISOString(),
        },
        ...currentHistoryTasks,
      ]);
    }

    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId),
    );

    if (taskId === editingTaskId) {
      resetComposer();
    }
  }

  function startEditingTask(task: Task) {
    setEditingTaskId(task.id);
    setTaskTitle(task.title);
    setStartTime(task.startTime);
    setEndTime(task.endTime);
    setHasReminder(task.hasReminder);
    setActiveView('tasks');
  }

  function restoreTask(taskId: string) {
    const taskToRestore = historyTasks.find((task) => task.id === taskId);

    if (!taskToRestore) {
      return;
    }

    const { archivedAt: _archivedAt, ...restoredTask } = taskToRestore;

    setTasks((currentTasks) => [restoredTask, ...currentTasks]);
    setHistoryTasks((currentHistoryTasks) =>
      currentHistoryTasks.filter((task) => task.id !== taskId),
    );
    setActiveView('tasks');
    setActiveFilter('all');
  }

  function permanentlyDeleteHistoryTask(taskId: string) {
    setHistoryTasks((currentHistoryTasks) =>
      currentHistoryTasks.filter((task) => task.id !== taskId),
    );
  }

  const canAddTask = taskTitle.trim().length > 0;
  const isEditing = editingTaskId !== null;
  const isHistoryView = activeView === 'history';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Daily Task Tracker</Text>
            <Text style={styles.title}>checktracker</Text>
            <Text style={styles.subtitle}>
              Keep today visible, and keep old tasks close when you need them.
            </Text>
          </View>

          <View style={styles.viewSwitch}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: activeView === 'tasks' }}
              onPress={() => setActiveView('tasks')}
              style={[
                styles.viewSwitchButton,
                activeView === 'tasks' && styles.activeViewSwitchButton,
              ]}
            >
              <Text
                style={[
                  styles.viewSwitchText,
                  activeView === 'tasks' && styles.activeViewSwitchText,
                ]}
              >
                Tasks
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isHistoryView }}
              onPress={() => {
                resetComposer();
                setActiveView('history');
              }}
              style={[
                styles.viewSwitchButton,
                isHistoryView && styles.activeViewSwitchButton,
              ]}
            >
              <Text
                style={[
                  styles.viewSwitchText,
                  isHistoryView && styles.activeViewSwitchText,
                ]}
              >
                History ({historyTasks.length})
              </Text>
            </Pressable>
          </View>

          {!isHistoryView ? (
            <>
              <View style={styles.composer}>
                <TextInput
                  accessibilityLabel={isEditing ? 'Edit task' : 'New task'}
                  onChangeText={setTaskTitle}
                  onSubmitEditing={saveTask}
                  placeholder={isEditing ? 'Edit task' : 'Add a task'}
                  placeholderTextColor="#8a9488"
                  returnKeyType="done"
                  style={styles.input}
                  value={taskTitle}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={!canAddTask}
                  onPress={saveTask}
                  style={[styles.addButton, !canAddTask && styles.disabledButton]}
                >
                  <Text style={styles.addButtonText}>
                    {isEditing ? 'Save' : 'Add'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.timeRow}>
                <TextInput
                  accessibilityLabel="Start time"
                  onChangeText={setStartTime}
                  placeholder="Start time"
                  placeholderTextColor="#8a9488"
                  style={styles.timeInput}
                  value={startTime}
                />
                <TextInput
                  accessibilityLabel="End time"
                  onChangeText={setEndTime}
                  placeholder="End time"
                  placeholderTextColor="#8a9488"
                  style={styles.timeInput}
                  value={endTime}
                />
              </View>

              <View style={styles.optionRow}>
                <Pressable
                  accessibilityRole="switch"
                  accessibilityState={{ checked: hasReminder }}
                  onPress={() => setHasReminder((currentValue) => !currentValue)}
                  style={[
                    styles.reminderButton,
                    hasReminder && styles.activeReminderButton,
                  ]}
                >
                  <View
                    style={[
                      styles.reminderDot,
                      hasReminder && styles.activeReminderDot,
                    ]}
                  />
                  <Text
                    style={[
                      styles.reminderButtonText,
                      hasReminder && styles.activeReminderButtonText,
                    ]}
                  >
                    Reminder
                  </Text>
                </Pressable>

                {isEditing ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={resetComposer}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelButtonText}>Cancel edit</Text>
                  </Pressable>
                ) : null}
              </View>

              <FilterTabs
                activeFilter={activeFilter}
                counts={counts}
                onChange={setActiveFilter}
              />
            </>
          ) : null}

          <FlatList
            ListEmptyComponent={
              isHistoryView ? (
                <View style={styles.historyEmptyState}>
                  <Text style={styles.historyEmptyTitle}>No old tasks yet</Text>
                  <Text style={styles.historyEmptyMessage}>
                    Deleted tasks will move here so you can restore them later.
                  </Text>
                </View>
              ) : (
                <EmptyState filter={activeFilter} />
              )
            }
            contentContainerStyle={styles.listContent}
            data={isHistoryView ? historyTasks : filteredTasks}
            keyExtractor={(task) => task.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              isHistoryView ? (
                <TaskItem
                  onDelete={permanentlyDeleteHistoryTask}
                  onRestore={restoreTask}
                  task={item}
                />
              ) : (
                <TaskItem
                  onDelete={deleteTask}
                  onEdit={startEditingTask}
                  onToggle={toggleTask}
                  task={item}
                />
              )
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    backgroundColor: '#5f7f6a',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  activeReminderButton: {
    backgroundColor: '#e4eee6',
    borderColor: '#6f8f79',
  },
  activeReminderButtonText: {
    color: '#45634f',
  },
  activeReminderDot: {
    backgroundColor: '#5f7f6a',
  },
  cancelButton: {
    alignItems: 'center',
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cancelButtonText: {
    color: '#9f5f56',
    fontSize: 14,
    fontWeight: '700',
  },
  composer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  disabledButton: {
    backgroundColor: '#a9b3a8',
  },
  eyebrow: {
    color: '#5f7f6a',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  header: {
    paddingTop: 10,
  },
  historyEmptyMessage: {
    color: '#667266',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  historyEmptyState: {
    alignItems: 'center',
    borderColor: '#d8ded2',
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    marginTop: 18,
    paddingHorizontal: 24,
    paddingVertical: 34,
  },
  historyEmptyTitle: {
    color: '#253029',
    fontSize: 18,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#fffdf8',
    borderColor: '#d8ded2',
    borderRadius: 8,
    borderWidth: 1,
    color: '#253029',
    flex: 1,
    fontSize: 16,
    height: 50,
    paddingHorizontal: 14,
  },
  keyboardView: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 28,
    paddingTop: 18,
  },
  optionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  reminderButton: {
    alignItems: 'center',
    borderColor: '#d8ded2',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    minHeight: 38,
    paddingHorizontal: 12,
  },
  reminderButtonText: {
    color: '#4a574d',
    fontSize: 14,
    fontWeight: '800',
  },
  reminderDot: {
    backgroundColor: '#b6bfb2',
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  safeArea: {
    backgroundColor: '#f6f4ee',
    flex: 1,
  },
  subtitle: {
    color: '#667266',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 8,
  },
  title: {
    color: '#253029',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 6,
  },
  timeInput: {
    backgroundColor: '#fffdf8',
    borderColor: '#d8ded2',
    borderRadius: 8,
    borderWidth: 1,
    color: '#253029',
    flex: 1,
    fontSize: 15,
    height: 46,
    paddingHorizontal: 14,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  activeViewSwitchButton: {
    backgroundColor: '#5f7f6a',
  },
  activeViewSwitchText: {
    color: '#fffdf8',
  },
  viewSwitch: {
    backgroundColor: '#e7e5dc',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    marginTop: 20,
    padding: 6,
  },
  viewSwitchButton: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  viewSwitchText: {
    color: '#4a574d',
    fontSize: 14,
    fontWeight: '800',
  },
});
