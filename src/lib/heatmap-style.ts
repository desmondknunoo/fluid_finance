/** Direction follows price change; percentage controls the color intensity. */
export function heatmapTileClass(change: number, changePercent: number): string {
  if (change > 0) {
    return changePercent > 3
      ? 'bg-emerald-200 text-emerald-950 dark:bg-emerald-800 dark:text-white'
      : 'bg-emerald-100 text-emerald-950 dark:bg-emerald-900 dark:text-emerald-50';
  }
  if (change < 0) {
    return changePercent < -5
      ? 'bg-rose-200 text-rose-950 dark:bg-rose-800 dark:text-white'
      : 'bg-rose-100 text-rose-950 dark:bg-rose-900 dark:text-rose-50';
  }
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
}
