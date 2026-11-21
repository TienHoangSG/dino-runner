export function swipeDirection(dx: number, dy: number, rotated: boolean) {
  const vertical = rotated ? -dx : dy;
  const horizontal = rotated ? dy : dx;
  if (Math.abs(vertical) < 24 || Math.abs(vertical) < Math.abs(horizontal) * 1.2) return null;
  return vertical < 0 ? 'jump' : 'duck';
}
