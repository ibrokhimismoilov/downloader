export type DesktopBridge = {
  pickFolder: () => Promise<string | null>;
  reveal: (filepath: string) => Promise<void>;
};

declare global {
  interface Window {
    desktop?: DesktopBridge;
  }
}
