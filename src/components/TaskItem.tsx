import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Task } from '../types/task';
import { formatCreatedDate } from '../utils/date';

type TaskItemProps = {
  task: Task;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
};

export function TaskItem({ task, onDelete, onToggle }: TaskItemProps) {
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityLabel={
          task.completed ? 'Mark task as active' : 'Mark task as completed'
        }
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed }}
        onPress={() => onToggle(task.id)}
        style={[styles.check, task.completed && styles.checked]}
      >
        {task.completed ? <Text style={styles.checkMark}>✓</Text> : null}
      </Pressable>

      <View style={styles.content}>
        <Text
          numberOfLines={3}
          style={[styles.title, task.completed && styles.completedTitle]}
        >
          {task.title}
        </Text>
        <Text style={styles.date}>Created {formatCreatedDate(task.createdAt)}</Text>
      </View>

      <Pressable
        accessibilityLabel={`Delete ${task.title}`}
        accessibilityRole="button"
        onPress={() => onDelete(task.id)}
        style={styles.deleteButton}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dfe7ef',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
    padding: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  check: {
    alignItems: 'center',
    borderColor: '#98a8ba',
    borderRadius: 13,
    borderWidth: 2,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  checked: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },
  completedTitle: {
    color: '#738195',
    textDecorationLine: 'line-through',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  date: {
    color: '#728196',
    fontSize: 12,
    marginTop: 5,
  },
  deleteButton: {
    alignItems: 'center',
    borderColor: '#f0c6c6',
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  deleteText: {
    color: '#b42318',
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    color: '#182635',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
  },
});
