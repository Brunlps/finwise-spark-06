import "@testing-library/jest-dom";

// Node 22+ expõe seu próprio global `localStorage` (atrás de --localstorage-file), que
// nesse ambiente de teste acaba sombreando o window.localStorage do jsdom com uma
// implementação quebrada (sem clear/getItem funcionais). Substitui os dois pelo mesmo
// polyfill em memória para os testes terem um Storage utilizável de verdade.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

const memoryStorage = new MemoryStorage();
Object.defineProperty(globalThis, "localStorage", { value: memoryStorage, configurable: true });
Object.defineProperty(window, "localStorage", { value: memoryStorage, configurable: true });

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// jsdom não implementa ResizeObserver; o componente InputOTP (usado em Login e nas
// telas de 2FA) usa um internamente para medir o container.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(window, "ResizeObserver", { writable: true, value: ResizeObserverStub });
Object.defineProperty(globalThis, "ResizeObserver", { writable: true, value: ResizeObserverStub });
