import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TaskFilter } from '../types/task';

type FilterTabsProps = {
  activeFilter: TaskFilter;
  counts: Record<TaskFilter, number>;
  onChange: (filter: TaskFilter) => void;
};

const filters: TaskFilter[] = ['all', 'active', 'completed'];

const labels: Record<TaskFilter, string> = {
  all: 'All',
  active: 'Active',
  completed: 'Completed',
};

export function FilterTabs({ activeFilter, counts, onChange }: FilterTabsProps) {
  return (
    <View style={styles.container}>
      {filters.map((filter) => {
        const isActive = filter === activeFilter;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            key={filter}
            onPress={() => onChange(filter)}
            style={[styles.tab, isActive && styles.activeTab]}
          >
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {labels[filter]}
            </Text>
            <Text style={[styles.count, isActive && styles.activeCount]}>
              {counts[filter]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  activeCount: {
    color: '#fffdf8',
  },
  activeLabel: {
    color: '#fffdf8',
  },
  activeTab: {
    backgroundColor: '#5f7f6a',
  },
  container: {
    backgroundColor: '#e7e5dc',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    marginTop: 18,
    padding: 6,
  },
  count: {
    color: '#67736a',
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    color: '#4a574d',
    fontSize: 13,
    fontWeight: '700',
  },
  tab: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    gap: 2,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});
