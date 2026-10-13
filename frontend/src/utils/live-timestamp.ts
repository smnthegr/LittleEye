/** Match the CCTV overlay format using the phone's local clock and time zone. */
export function formatLiveTimestamp(now: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return {
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
    date: `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`,
  };
}
