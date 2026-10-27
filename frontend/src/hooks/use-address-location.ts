import { useCallback, useEffect, useRef, useState } from 'react';
import { requestAddressLocation } from '@/services/address-location';

export function useAddressLocation(enabled: boolean) {
  const [state, setState] = useState<{ status: 'idle' | 'loading' | 'error'; error?: string; controller?: AbortController }>({ status: 'idle' });
  const pending = useRef<AbortController | null>(null);
  useEffect(() => {
    const requestRef = pending;
    return () => { requestRef.current?.abort(); requestRef.current = null; };
  }, [enabled]);
  const cancel = useCallback(() => { pending.current?.abort(); pending.current = null; setState({ status: 'idle' }); }, []);
  const locate = useCallback(async () => {
    if (!enabled || pending.current) return null;
    const controller = new AbortController();
    pending.current = controller;
    setState({ status: 'loading', controller });
    try {
      const result = await requestAddressLocation(controller.signal);
      if (controller.signal.aborted || pending.current !== controller) return null;
      setState({ status: 'idle', error: result.notice });
      return result;
    } catch (error) {
      if (!controller.signal.aborted && pending.current === controller) setState({ status: 'error', error: error instanceof Error ? error.message : 'Could not get your location.' });
      return null;
    } finally { if (pending.current === controller) pending.current = null; }
  }, [enabled]);
  return { locate, cancel, locating: enabled && state.status === 'loading' && !state.controller?.signal.aborted, error: enabled ? state.error : undefined };
}
