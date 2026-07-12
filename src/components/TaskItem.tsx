import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ArchivedTask, Task } from '../types/task';
import { formatCreatedDate } from '../utils/date';

type TaskItemProps = {
  task: ArchivedTask | Task;
  onDelete: (id: string) => void;
  onEdit?: (task: Task) => void;
  onRestore?: (id: string) => void;
  onToggle?: (id: string) => void;
};

export function TaskItem({
  task,
  onDelete,
  onEdit,
  onRestore,
  onToggle,
}: TaskItemProps) {
  const isArchived = 'archivedAt' in task;
  const timeLabel =
    task.startTime || task.endTime
      ? `${task.startTime || 'Anytime'} - ${task.endTime || 'Open'}`
      : 'No time set';

  return (
    <View style={styles.card}>
      {onToggle ? (
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
      ) : null}

      <View style={styles.content}>
        <Text
          numberOfLines={3}
          style={[styles.title, task.completed && styles.completedTitle]}
        >
          {task.title}
        </Text>
        <Text style={styles.time}>{timeLabel}</Text>
        {task.notes ? <Text style={styles.notes}>{task.notes}</Text> : null}
        {task.hasReminder ? <Text style={styles.reminder}>Reminder on</Text> : null}
        <Text style={styles.date}>Created {formatCreatedDate(task.createdAt)}</Text>
        {isArchived ? (
          <Text style={styles.date}>
            Moved to history {formatCreatedDate(task.archivedAt)}
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        {onEdit && !isArchived ? (
          <Pressable
            accessibilityLabel={`Edit ${task.title}`}
            accessibilityRole="button"
            onPress={() => onEdit(task)}
            style={styles.editButton}
          >
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        ) : null}

        {onRestore && isArchived ? (
          <Pressable
            accessibilityLabel={`Restore ${task.title}`}
            accessibilityRole="button"
            onPress={() => onRestore(task.id)}
            style={styles.editButton}
          >
            <Text style={styles.editText}>Restore</Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityLabel={`Delete ${task.title}`}
          accessibilityRole="button"
          onPress={() => onDelete(task.id)}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteText}>
            {isArchived ? 'Delete forever' : 'Delete'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'flex-start',
    backgroundColor: '#fffdf8',
    borderColor: '#deded4',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
    padding: 14,
    shadowColor: '#2d352f',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  actions: {
    gap: 8,
  },
  check: {
    alignItems: 'center',
    borderColor: '#9aa89d',
    borderRadius: 13,
    borderWidth: 2,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  checked: {
    backgroundColor: '#6f8f79',
    borderColor: '#6f8f79',
  },
  checkMark: {
    color: '#fffdf8',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },
  completedTitle: {
    color: '#7a857d',
    textDecorationLine: 'line-through',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  date: {
    color: '#747f77',
    fontSize: 12,
    marginTop: 5,
  },
  deleteButton: {
    alignItems: 'center',
    borderColor: '#ead3ce',
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  deleteText: {
    color: '#9f5f56',
    fontSize: 13,
    fontWeight: '700',
  },
  editButton: {
    alignItems: 'center',
    borderColor: '#cbd8c9',
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  editText: {
    color: '#4f6f59',
    fontSize: 13,
    fontWeight: '700',
  },
  notes: {
    color: '#5d695f',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  reminder: {
    color: '#4f6f59',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 5,
  },
  time: {
    color: '#4a574d',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  title: {
    color: '#253029',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
  },
});
