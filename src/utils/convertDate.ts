export function getDate(timestamp: number) {
  return (timestamp && new Date(timestamp)) || null;
}

export function getTimestamp(date: Date) {
  return (date && +date) || null;
}
