import { StyleSheet, Text, View } from 'react-native';

import type { TaskFilter } from '../types/task';

type EmptyStateProps = {
  filter: TaskFilter;
};

const messages: Record<TaskFilter, string> = {
  all: 'No tasks yet. Add your first task to start tracking the day.',
  active: 'No active tasks. Nice work keeping the list clear.',
  completed: 'No completed tasks yet. Finish one and it will show up here.',
};

export function EmptyState({ filter }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nothing here</Text>
      <Text style={styles.message}>{messages[filter]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderColor: '#d8ded2',
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    marginTop: 18,
    paddingHorizontal: 24,
    paddingVertical: 34,
  },
  message: {
    color: '#667266',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  title: {
    color: '#253029',
    fontSize: 18,
    fontWeight: '700',
  },
});
