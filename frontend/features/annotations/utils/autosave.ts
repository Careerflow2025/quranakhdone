import debounce from 'lodash.debounce';
import { telemetry } from '../../telemetry/client';

let autosaveFn: ReturnType<typeof debounce> | null = null;
let saveCount = 0;

export function initAutosave(saveFn: (payload: any) => Promise<void>) {
  autosaveFn = debounce(async (payload: any) => {
    try {
      await saveFn(payload);
      saveCount++;
      telemetry.logEvent('annotation.autosaved', { 
        save_count: saveCount,
        page: payload.page_number 
      });
    } catch (error) {
      console.error('[autosave] Failed:', error);
      telemetry.logEvent('annotation.autosave_failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }, 10000); // 10 seconds
}

export function triggerAutosave(payload: any) {
  if (autosaveFn) {
    autosaveFn(payload);
  }
}

export function cancelAutosave() {
  if (autosaveFn) {
    autosaveFn.cancel();
  }
}

export function flushAutosave() {
  if (autosaveFn) {
    autosaveFn.flush();
  }
}