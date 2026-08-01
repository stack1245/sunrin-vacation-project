export function formatClearTime(clearTimeMs: number): string {
  const totalMilliseconds = Math.max(0, Math.floor(clearTimeMs));
  const milliseconds = totalMilliseconds % 1000;
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  const minutePart = String(minutes).padStart(2, "0");
  const secondPart = String(seconds).padStart(2, "0");
  const millisecondPart = String(milliseconds).padStart(3, "0");
  const baseTime = `${minutePart}:${secondPart}.${millisecondPart}`;

  return hours > 0
    ? `${String(hours).padStart(2, "0")}:${baseTime}`
    : baseTime;
}
