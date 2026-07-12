// 極簡事件匯流排：state 層發事件、UI 層顯示，避免循環依賴
const listeners = {};

export function on(evt, fn) {
  (listeners[evt] ??= []).push(fn);
}

export function emit(evt, data) {
  (listeners[evt] ?? []).forEach(fn => fn(data));
}
