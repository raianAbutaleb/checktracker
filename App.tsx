import { StatusBar } from 'expo-status-bar';
import * as Speech from 'expo-speech';
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
  clearCurrentUsername,
  loadHistoryTasks,
  loadCurrentUsername,
  loadTasks,
  loadUserAccount,
  saveCurrentUsername,
  saveHistoryTasks,
  saveTasks,
  saveUserAccount,
  type UserAccount,
} from './src/utils/storage';

type AppView = 'tasks' | 'history';
type AuthMode = 'signIn' | 'signUp';

export default function App() {
  const [savedAccount, setSavedAccount] = useState<UserAccount | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('signIn');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [hasLoadedAuth, setHasLoadedAuth] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [historyTasks, setHistoryTasks] = useState<ArchivedTask[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [hasReminder, setHasReminder] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all');
  const [activeView, setActiveView] = useState<AppView>('tasks');
  const [hasLoadedTasks, setHasLoadedTasks] = useState(false);

  useEffect(() => {
    async function restoreAuth() {
      try {
        const [restoredAccount, restoredUsername] = await Promise.all([
          loadUserAccount(),
          loadCurrentUsername(),
        ]);

        const validSession =
          restoredAccount && restoredUsername === restoredAccount.username
            ? restoredUsername
            : null;

        setSavedAccount(restoredAccount);
        setCurrentUsername(validSession);
        setAuthMode(restoredAccount ? 'signIn' : 'signUp');
      } catch {
        Alert.alert('Sign in error', 'Saved account details could not be loaded.');
      } finally {
        setHasLoadedAuth(true);
      }
    }

    restoreAuth();
  }, []);

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
    setNotes('');
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
                notes: notes.trim(),
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
      notes: notes.trim(),
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
    setNotes(task.notes);
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

  async function submitAuth() {
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setAuthError('Enter a username and password.');
      return;
    }

    if (authMode === 'signUp') {
      const account = {
        username: trimmedUsername,
        password: trimmedPassword,
      };

      try {
        await Promise.all([
          saveUserAccount(account),
          saveCurrentUsername(trimmedUsername),
        ]);

        setSavedAccount(account);
        setCurrentUsername(trimmedUsername);
        setAuthError('');
        setUsername('');
        setPassword('');
        Keyboard.dismiss();
      } catch {
        setAuthError('Account could not be saved on this device.');
      }

      return;
    }

    if (!savedAccount) {
      setAuthMode('signUp');
      setAuthError('Create an account first.');
      return;
    }

    if (
      savedAccount.username !== trimmedUsername ||
      savedAccount.password !== trimmedPassword
    ) {
      setAuthError('Username or password is incorrect.');
      return;
    }

    try {
      await saveCurrentUsername(trimmedUsername);
      setCurrentUsername(trimmedUsername);
      setAuthError('');
      setUsername('');
      setPassword('');
      Keyboard.dismiss();
    } catch {
      setAuthError('Sign in could not be saved on this device.');
    }
  }

  async function signOut() {
    try {
      await clearCurrentUsername();
      setCurrentUsername(null);
      setUsername('');
      setPassword('');
      setAuthError('');
      resetComposer();
      setActiveView('tasks');
    } catch {
      Alert.alert('Sign out error', 'You could not be signed out.');
    }
  }

  function switchAuthMode(nextMode: AuthMode) {
    setAuthMode(nextMode);
    setAuthError('');
    setPassword('');
  }

  function getTaskSpeechText(task: Task | ArchivedTask) {
    const parts = [
      task.completed ? 'Completed task.' : 'Active task.',
      task.title,
      task.startTime || task.endTime
        ? `Time: ${task.startTime || 'anytime'} to ${task.endTime || 'open'}`
        : 'No time set.',
      task.notes ? `Notes: ${task.notes}` : '',
      task.hasReminder ? 'Reminder is on.' : '',
    ];

    return parts.filter(Boolean).join(' ');
  }

  function speakText(text: string) {
    Speech.stop();
    Speech.speak(text, {
      rate: 0.92,
      pitch: 1,
    });
  }

  function speakTask(task: Task | ArchivedTask) {
    speakText(getTaskSpeechText(task));
  }

  function speakVisibleTasks() {
    const visibleTasks = isHistoryView ? historyTasks : filteredTasks;

    if (visibleTasks.length === 0) {
      speakText(isHistoryView ? 'No history tasks yet.' : 'No tasks to read.');
      return;
    }

    const intro = isHistoryView ? 'History tasks.' : 'Current tasks.';
    const taskText = visibleTasks
      .map((task, index) => `Task ${index + 1}. ${getTaskSpeechText(task)}`)
      .join(' ');

    speakText(`${intro} ${taskText}`);
  }

  const canAddTask = taskTitle.trim().length > 0;
  const canSubmitAuth = username.trim().length > 0 && password.trim().length > 0;
  const isEditing = editingTaskId !== null;
  const isHistoryView = activeView === 'history';

  if (!hasLoadedAuth) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.authContainer}>
          <Text style={styles.authTitle}>checktracker</Text>
          <Text style={styles.authSubtitle}>Loading your account...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentUsername) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View style={styles.authContainer}>
            <Text style={styles.eyebrow}>Daily Task Tracker</Text>
            <Text style={styles.authTitle}>checktracker</Text>
            <Text style={styles.authSubtitle}>
              Sign in to keep your tasks private on this device.
            </Text>

            <View style={styles.authPanel}>
              <View style={styles.authSwitch}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: authMode === 'signIn' }}
                  onPress={() => switchAuthMode('signIn')}
                  style={[
                    styles.authSwitchButton,
                    authMode === 'signIn' && styles.activeViewSwitchButton,
                  ]}
                >
                  <Text
                    style={[
                      styles.authSwitchText,
                      authMode === 'signIn' && styles.activeViewSwitchText,
                    ]}
                  >
                    Sign In
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: authMode === 'signUp' }}
                  onPress={() => switchAuthMode('signUp')}
                  style={[
                    styles.authSwitchButton,
                    authMode === 'signUp' && styles.activeViewSwitchButton,
                  ]}
                >
                  <Text
                    style={[
                      styles.authSwitchText,
                      authMode === 'signUp' && styles.activeViewSwitchText,
                    ]}
                  >
                    Sign Up
                  </Text>
                </Pressable>
              </View>

              <TextInput
                accessibilityLabel="Username"
                autoCapitalize="none"
                onChangeText={setUsername}
                placeholder="Username"
                placeholderTextColor="#8a9488"
                returnKeyType="next"
                style={styles.authInput}
                value={username}
              />
              <TextInput
                accessibilityLabel="Password"
                onChangeText={setPassword}
                onSubmitEditing={submitAuth}
                placeholder="Password"
                placeholderTextColor="#8a9488"
                returnKeyType="done"
                secureTextEntry
                style={styles.authInput}
                value={password}
              />

              {authError ? <Text style={styles.authError}>{authError}</Text> : null}

              <Pressable
                accessibilityRole="button"
                disabled={!canSubmitAuth}
                onPress={submitAuth}
                style={[styles.authButton, !canSubmitAuth && styles.disabledButton]}
              >
                <Text style={styles.addButtonText}>
                  {authMode === 'signIn' ? 'Sign In' : 'Create Account'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

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
            <View style={styles.accountRow}>
              <Text style={styles.accountText}>Signed in as {currentUsername}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={signOut}
                style={styles.signOutButton}
              >
                <Text style={styles.signOutText}>Sign out</Text>
              </Pressable>
            </View>
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

          <View style={styles.voiceRow}>
            <Pressable
              accessibilityRole="button"
              onPress={speakVisibleTasks}
              style={styles.voiceButton}
            >
              <Text style={styles.voiceButtonText}>Read tasks</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => Speech.stop()}
              style={styles.stopVoiceButton}
            >
              <Text style={styles.stopVoiceText}>Stop voice</Text>
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

              <View style={styles.notesGroup}>
                <Text style={styles.notesLabel}>Notes</Text>
                <TextInput
                  accessibilityLabel="Task notes"
                  multiline
                  onChangeText={setNotes}
                  placeholder="Add notes"
                  placeholderTextColor="#8a9488"
                  style={styles.notesInput}
                  textAlignVertical="top"
                  value={notes}
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
                  onSpeak={speakTask}
                  task={item}
                />
              ) : (
                <TaskItem
                  onDelete={deleteTask}
                  onEdit={startEditingTask}
                  onSpeak={speakTask}
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
  accountRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 14,
  },
  accountText: {
    color: '#667266',
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
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
  notesGroup: {
    marginTop: 10,
  },
  notesInput: {
    backgroundColor: '#fffdf8',
    borderColor: '#d8ded2',
    borderRadius: 8,
    borderWidth: 1,
    color: '#253029',
    fontSize: 15,
    lineHeight: 21,
    minHeight: 92,
    paddingHorizontal: 14,
    paddingTop: 13,
  },
  notesLabel: {
    color: '#667266',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 7,
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
  authButton: {
    alignItems: 'center',
    backgroundColor: '#5f7f6a',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    marginTop: 8,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  authError: {
    color: '#9f5f56',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  authInput: {
    backgroundColor: '#fffdf8',
    borderColor: '#d8ded2',
    borderRadius: 8,
    borderWidth: 1,
    color: '#253029',
    fontSize: 16,
    height: 50,
    paddingHorizontal: 14,
  },
  authPanel: {
    gap: 12,
    marginTop: 26,
  },
  authSubtitle: {
    color: '#667266',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 8,
  },
  authSwitch: {
    backgroundColor: '#e7e5dc',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    padding: 6,
  },
  authSwitchButton: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  authSwitchText: {
    color: '#4a574d',
    fontSize: 14,
    fontWeight: '800',
  },
  authTitle: {
    color: '#253029',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 6,
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
  voiceButton: {
    alignItems: 'center',
    backgroundColor: '#e4eee6',
    borderColor: '#cbd8c9',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  voiceButtonText: {
    color: '#4f6f59',
    fontSize: 14,
    fontWeight: '800',
  },
  voiceRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  stopVoiceButton: {
    alignItems: 'center',
    borderColor: '#ead3ce',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  stopVoiceText: {
    color: '#9f5f56',
    fontSize: 14,
    fontWeight: '800',
  },
  signOutButton: {
    alignItems: 'center',
    borderColor: '#d8ded2',
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  signOutText: {
    color: '#4f6f59',
    fontSize: 13,
    fontWeight: '800',
  },
});
