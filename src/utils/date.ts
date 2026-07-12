const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function formatCreatedDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return dateFormatter.format(date);
}
