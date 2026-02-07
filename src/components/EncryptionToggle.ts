export type EncryptionMode = 'on' | 'off';

const lockSvg = `<svg width="26" height="26" viewBox="0 0 13 13" role="img" aria-label="Lock-icon" color="var(--color-neutrals-n-400)" size="48"><path fill="var(--color-neutrals-n-400)" fill-rule="evenodd" d="M6.55 7.278A5.3 5.3 0 0 1 11.873 2c2.927 0 5.3 2.374 5.3 5.301v2.147a.75.75 0 0 1-1.5 0V7.301A3.802 3.802 0 0 0 11.87 3.5h-.004a3.8 3.8 0 0 0-3.816 3.783v2.165a.75.75 0 0 1-1.5 0v-2.17" clip-rule="evenodd"></path><path fill="var(--color-neutrals-n-400)" fill-rule="evenodd" d="M8.042 10.125A3.042 3.042 0 0 0 5 13.167v4.289a3.042 3.042 0 0 0 3.042 3.042h7.641a3.042 3.042 0 0 0 3.042-3.042v-4.289a3.042 3.042 0 0 0-3.042-3.042zM3.5 13.167a4.542 4.542 0 0 1 4.542-4.542h7.641a4.542 4.542 0 0 1 4.542 4.542v4.289a4.542 4.542 0 0 1-4.542 4.542H8.042A4.542 4.542 0 0 1 3.5 17.456z" clip-rule="evenodd"></path><path fill="var(--color-neutrals-n-400)" fill-rule="evenodd" d="M11.863 13.453a.75.75 0 0 1 .75.75v2.221a.75.75 0 0 1-1.5 0v-2.22a.75.75 0 0 1 .75-.75" clip-rule="evenodd"></path></svg>`;

const shieldDisabledSvg = `<svg width="24" height="24" viewBox="0 0 24 24" role="img" aria-label="ShieldDone-icon" size="24" color="var(--color-neutrals-n-300)"><mask id="mask0_1732_25393" width="17" height="21" x="4" y="2" maskUnits="userSpaceOnUse" style="mask-type: luminance;"><path fill="#fff" fill-rule="evenodd" d="M4 2h16.967v20.356H4z" clip-rule="evenodd"></path></mask><g mask="url(#mask0_1732_25393)"><path fill="var(--color-neutrals-n-300)" fill-rule="evenodd" d="M12.484 3.5c-.848 0-6.198 1.884-6.815 2.399-.182.183-.189.501-.15 2.63.018 1.026.043 2.42.043 4.35 0 5.201 5.722 7.51 6.921 7.935 1.198-.427 6.923-2.749 6.923-7.935 0-1.932.025-3.327.044-4.353.038-2.127.031-2.445-.162-2.637-.605-.505-5.956-2.389-6.804-2.389m0 18.856a.731.731 0 0 1-.218-.032c-.335-.101-8.205-2.563-8.205-9.445 0-1.917-.025-3.304-.043-4.322-.046-2.543-.056-3.073.601-3.729C5.404 4.041 11.35 2 12.483 2c1.133 0 7.078 2.041 7.865 2.828.656.656.646 1.186.6 3.726-.018 1.018-.043 2.405-.043 4.325 0 6.882-7.87 9.344-8.205 9.445a.731.731 0 0 1-.217.032" clip-rule="evenodd"></path></g><path fill="var(--color-neutrals-n-300)" fill-rule="evenodd" d="M11.779 14.52a.75.75 0 0 1-.531-.22l-1.892-1.893a.751.751 0 0 1 1.062-1.061l1.36 1.363 3.369-3.368a.749.749 0 1 1 1.06 1.06l-3.898 3.9a.747.747 0 0 1-.53.22" clip-rule="evenodd"></path></svg>`;

const shieldEnabledSvg = `<svg width="26" height="26" viewBox="0 0 26 26" role="img" aria-label="ShieldDone-icon" color="var(--color-primary-p-50)"><path fill="var(--color-primary-p-50)" fill-rule="evenodd" d="M12.484 22.356c-.074 0-.147-.01-.218-.032-.335-.101-8.205-2.563-8.205-9.445 0-1.917-.025-3.304-.043-4.322-.046-2.543-.056-3.073.601-3.729.785-.787 6.731-2.828 7.865-2.828 1.133 0 7.078 2.041 7.865 2.828.656.656.646 1.186.6 3.726-.018 1.018-.043 2.405-.043 4.325 0 6.882-7.87 9.344-8.205 9.445a.731.731 0 0 1-.217.032m.705-7.836a.75.75 0 0 1-.531-.22l-1.892-1.893a.751.751 0 0 1 1.062-1.061l1.36 1.363 3.369-3.368a.749.749 0 1 1 1.06 1.06l-3.898 3.9a.747.747 0 0 1-.53.22"></path></svg>`;

export class EncryptionToggle {
  private element: HTMLElement;
  private currentMode: EncryptionMode = 'off';
  private chatId: string;
  private keyExchangeCallback: (() => Promise<void>) | null = null;
  private modeChangeCallback: ((newMode: EncryptionMode) => void) | null = null;
  private isLockMode: boolean = false;

  constructor(chatId: string, initialMode: EncryptionMode = 'off', needsKeyExchange: boolean = false) {
    this.chatId = chatId;
    this.currentMode = initialMode;
    this.isLockMode = needsKeyExchange;
    this.element = this.createElement();
  }

  private createElement(): HTMLElement {
    const emojiButton = document.querySelector('[aria-label="emoji-icon"]') as HTMLElement;
    if (!emojiButton) {
      const container = document.createElement('div');
      container.className = 'kXxU2w matrixify-encryption-toggle';
      return container;
    }

    const button = emojiButton.cloneNode(true) as HTMLElement;
    button.className = 'kXxU2w matrixify-encryption-toggle';
    button.removeAttribute('aria-label');
    button.setAttribute('aria-label', 'encryption-toggle');

    const svgElement = button.querySelector('svg');
    if (svgElement) {
      svgElement.outerHTML = this.getCurrentSvg();
    }

    return button;
  }

  private getCurrentSvg(): string {
    if (this.isLockMode) {
      return lockSvg;
    }
    return this.currentMode === 'on' ? shieldEnabledSvg : shieldDisabledSvg;
  }

  private updateIcon(): void {
    const svgElement = this.element.querySelector('svg');
    if (svgElement) {
      const currentSvg = this.getCurrentSvg();
      if (svgElement.outerHTML !== currentSvg)
        svgElement.outerHTML = currentSvg;
    }
  }

  private async handleClick(): Promise<void> {
    if (this.isLockMode) {
      if (confirm('This will send your public key to start encrypted messaging. Continue?')) {
        if (this.keyExchangeCallback) {
          await this.keyExchangeCallback();
        }
      }
    } else {
      const newMode: EncryptionMode = this.currentMode === 'on' ? 'off' : 'on';
      this.currentMode = newMode;
      this.updateIcon();
      this.saveState();
      if (this.modeChangeCallback) {
        this.modeChangeCallback(newMode);
      }
    }
  }

  setMode(newMode: EncryptionMode): void {
    this.currentMode = newMode;
    this.updateIcon();
    this.saveState();
  }

  setNeedsKeyExchange(needs: boolean): void {
    this.isLockMode = needs;
    this.updateIcon();
  }

  setKeyExchangeCallback(callback: () => Promise<void>): void {
    this.keyExchangeCallback = callback;
  }

  setModeChangeCallback(callback: (newMode: EncryptionMode) => void): void {
    this.modeChangeCallback = callback;
  }

  private saveState(): void {
    const storageKey = 'matrixify_bale_states';
    const states = this.loadStates();
    states[this.chatId] = this.currentMode;
    localStorage.setItem(storageKey, JSON.stringify(states));
  }

  private loadStates(): Record<string, EncryptionMode> {
    const storageKey = 'matrixify_bale_states';
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  getMode(): EncryptionMode {
    return this.currentMode;
  }

  mount(): void {
    const sendButton = document.querySelector('[aria-label="send-button"]');
    if (sendButton && sendButton.parentElement) {
      sendButton.parentElement.insertBefore(this.element, sendButton);
      this.element.addEventListener('click', () => this.handleClick());
    }
  }

  unmount(): void {
    this.element.remove();
  }

  getElement(): HTMLElement {
    return this.element;
  }
}
