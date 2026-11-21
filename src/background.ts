export type BackgroundMode = 'detailed' | 'simple';

export function backgroundModeFromStored(value: string | null): BackgroundMode {
  return value === 'detailed' ? 'detailed' : 'simple';
}
