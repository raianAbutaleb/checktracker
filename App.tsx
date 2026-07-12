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
import type { Task, TaskFilter } from './src/types/task';
import { loadTasks, saveTasks } from './src/utils/storage';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all');
  const [hasLoadedTasks, setHasLoadedTasks] = useState(false);

  useEffect(() => {
    async function restoreTasks() {
      try {
        const restoredTasks = await loadTasks();
        setTasks(restoredTasks);
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

  function addTask() {
    const trimmedTitle = taskTitle.trim();

    if (!trimmedTitle) {
      return;
    }

    const task: Task = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: trimmedTitle,
      createdAt: new Date().toISOString(),
      completed: false,
    };

    setTasks((currentTasks) => [task, ...currentTasks]);
    setTaskTitle('');
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
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId),
    );
  }

  const canAddTask = taskTitle.trim().length > 0;

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
              Keep today visible, simple, and saved on this device.
            </Text>
          </View>

          <View style={styles.composer}>
            <TextInput
              accessibilityLabel="New task"
              onChangeText={setTaskTitle}
              onSubmitEditing={addTask}
              placeholder="Add a task"
              placeholderTextColor="#8795a6"
              returnKeyType="done"
              style={styles.input}
              value={taskTitle}
            />
            <Pressable
              accessibilityRole="button"
              disabled={!canAddTask}
              onPress={addTask}
              style={[styles.addButton, !canAddTask && styles.disabledButton]}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>

          <FilterTabs
            activeFilter={activeFilter}
            counts={counts}
            onChange={setActiveFilter}
          />

          <FlatList
            ListEmptyComponent={<EmptyState filter={activeFilter} />}
            contentContainerStyle={styles.listContent}
            data={filteredTasks}
            keyExtractor={(task) => task.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TaskItem
                onDelete={deleteTask}
                onToggle={toggleTask}
                task={item}
              />
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
    backgroundColor: '#2563eb',
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
    backgroundColor: '#a8b4c4',
  },
  eyebrow: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  header: {
    paddingTop: 10,
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#cdd8e5',
    borderRadius: 8,
    borderWidth: 1,
    color: '#182635',
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
  safeArea: {
    backgroundColor: '#f4f7fb',
    flex: 1,
  },
  subtitle: {
    color: '#627386',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 8,
  },
  title: {
    color: '#142334',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 6,
  },
});
