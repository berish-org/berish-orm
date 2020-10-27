function prepareOptions(maxAttempsArg?: number, timeoutArg?: number | [number, number]) {
  const maxAttemps = maxAttempsArg <= 0 ? 1 : typeof maxAttempsArg === 'number' ? maxAttempsArg : 10;
  const timeout =
    timeoutArg === 0
      ? [0, 0]
      : typeof timeoutArg === 'number'
      ? [timeoutArg, timeoutArg]
      : Array.isArray(timeoutArg)
      ? timeoutArg
      : [1000, 1000];
  return { maxAttemps, timeout };
}

function setTimeoutPromise(timeout: number) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

function randomInteger(min: number, max: number) {
  return Math.floor(min + Math.random() * (max + 1 - min));
}

export async function tryCall<T>(
  func: () => T | Promise<T>,
  maxAttempsArg?: number,
  timeoutArg?: number | [number, number],
  canThrow?: boolean
) {
  const { maxAttemps, timeout } = prepareOptions(maxAttempsArg, timeoutArg);

  let currentAttemp = 0;
  let currentError: any = null;
  do {
    try {
      const result = await func();
      return result;
    } catch (err) {
      currentError = err;
      const currentTimeout = timeout[0] === timeout[1] ? timeout[0] : randomInteger(timeout[0], timeout[1]);
      if (currentTimeout) await setTimeoutPromise(currentTimeout);
    } finally {
      currentAttemp++;
    }
  } while (currentAttemp < maxAttemps);
  if (!canThrow) return null;
  throw currentError;
}
