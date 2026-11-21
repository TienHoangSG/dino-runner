export const RESTART_BUTTON_WINDOW = 5_000;

export function canRestartAfterGameOver(elapsedMs: number, usedRestartButton: boolean) {
  return usedRestartButton || elapsedMs >= RESTART_BUTTON_WINDOW;
}
