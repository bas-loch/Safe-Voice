export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function isNewDay(lastDate: string | null): boolean {
  if (!lastDate) return true;
  return lastDate !== getTodayString();
}

export function getElapsedMs(timestamp: number): number {
  return Date.now() - timestamp;
}
