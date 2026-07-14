import { StyleSheet, Text, View } from 'react-native';

import type { Language } from '../i18n';
import { translations } from '../i18n';
import type { TaskFilter } from '../types/task';

type EmptyStateProps = {
  filter: TaskFilter;
  isRtl: boolean;
  language: Language;
};

export function EmptyState({ filter, isRtl, language }: EmptyStateProps) {
  const t = translations[language];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isRtl && styles.rtlText]}>{t.emptyTitle}</Text>
      <Text style={[styles.message, isRtl && styles.rtlText]}>
        {t.emptyMessages[filter]}
      </Text>
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
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
