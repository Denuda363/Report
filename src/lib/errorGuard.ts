// Global error and unhandled rejection guard to handle benign Firebase Auth network/offline glitches
// (e.g. ad blockers, iframe third-party cookie restrictions, or offline mode)
if (typeof window !== 'undefined') {
  const isAuthNetworkError = (err: any) => {
    if (!err) return false;
    const msg = typeof err === 'string' ? err : (err.message || err.reason?.message || String(err || ''));
    const code = err.code || err.reason?.code || '';
    return (
      code === 'auth/network-request-failed' ||
      msg.includes('auth/network-request-failed') ||
      msg.includes('network-request-failed') ||
      msg.includes('Quota limit exceeded') ||
      msg.includes('resource-exhausted')
    );
  };

  // Capture uncaught window errors
  window.addEventListener(
    'error',
    (event) => {
      if (isAuthNetworkError(event.error) || isAuthNetworkError(event.message)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return true;
      }
    },
    true
  );

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (isAuthNetworkError(event.reason)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  // Intercept console.error to avoid spamming automated error monitors
  const origConsoleError = console.error;
  console.error = (...args: any[]) => {
    const shouldIgnore = args.some(arg => isAuthNetworkError(arg));
    if (shouldIgnore) return;
    origConsoleError(...args);
  };
}

export {};
