/** Serialize native async loads so a late load cannot restore video on an inactive route. */
export function createMediaSourceQueue<T>(replace: (source: T) => Promise<void>, active: () => boolean) {
  let queue: Promise<void> = Promise.resolve();
  return (source: T) => {
    const operation = queue.catch(() => {}).then(async () => {
      if (active()) await replace(source);
    });
    queue = operation;
    return operation;
  };
}
