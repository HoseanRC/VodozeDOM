export type EncryptionMode = 'on' | 'off';

const lockSvg = `<svg width="26" height="26" viewBox="0 0 26 26" role="img" aria-label="Lock-icon" color="var(--color-neutrals-n-400)" size="48"><path fill="var(--color-neutrals-n-400)" fill-rule="evenodd" d="M6.55 7.278A5.3 5.3 0 0 1 11.873 2c2.927 0 5.3 2.374 5.3 5.301v2.147a.75.75 0 0 1-1.5 0V7.301A3.802 3.802 0 0 0 11.87 3.5h-.004a3.8 3.8 0 0 0-3.816 3.783v2.165a.75.75 0 0 1-1.5 0v-2.17" clip-rule="evenodd"></path><path fill="var(--color-neutrals-n-400)" fill-rule="evenodd" d="M8.042 10.125A3.042 3.042 0 0 0 5 13.167v4.289a3.042 3.042 0 0 0 3.042 3.042h7.641a3.042 3.042 0 0 0 3.042-3.042v-4.289a3.042 3.042 0 0 0-3.042-3.042zM3.5 13.167a4.542 4.542 0 0 1 4.542-4.542h7.641a4.542 4.542 0 0 1 4.542 4.542v4.289a4.542 4.542 0 0 1-4.542 4.542H8.042A4.542 4.542 0 0 1 3.5 17.456z" clip-rule="evenodd"></path><path fill="var(--color-neutrals-n-400)" fill-rule="evenodd" d="M11.863 13.453a.75.75 0 0 1 .75.75v2.221a.75.75 0 0 1-1.5 0v-2.22a.75.75 0 0 1 .75-.75" clip-rule="evenodd"></path></svg>`;

const shieldEnabledSvg = `<svg width="24" height="24" viewBox="0 0 6.3499993 6.3499993" version="1.1"><defs id="defs1"><mask id="mask0_1732_25393-7" width="17" height="21" x="4" y="2" maskUnits="userSpaceOnUse"><path fill-rule="evenodd" d="M 4,2 H 20.967 V 22.356 H 4 Z" clip-rule="evenodd" fill="#fff" id="path1-5"></path></mask></defs><g id="layer1"><mask id="mask0_1732_25393" width="17" height="21" x="4" y="2" maskUnits="userSpaceOnUse"><path fill-rule="evenodd" d="M 4,2 H 20.967 V 22.356 H 4 Z" clip-rule="evenodd" fill="#fff" id="path1"></path></mask><g mask="url(#mask0_1732_25393-7)" id="g2-6" transform="matrix(0.26458333,0,0,0.26458333,-0.12797994,-0.04709583)"><path fill-rule="evenodd" d="M 12.484,22.356 C 12.41013,22.356409 12.336632,22.34562 12.266,22.324 11.931,22.223 4.061,19.761 4.061,12.879 4.061,10.962 4.036,9.575 4.018,8.557 3.972,6.014 3.962,5.484 4.619,4.828 5.404,4.041 11.35,2 12.483,2 c 1.133,0 7.078,2.041 7.865,2.828 0.656,0.656 0.646,1.186 0.6,3.726 -0.018,1.018 -0.043,2.405 -0.043,4.325 0,6.882 -7.87,9.344 -8.205,9.445 -0.07031,0.02152 -0.143469,0.03231 -0.217,0.032 M 11.779464,14.52 c -0.199181,1.13e-4 -0.390236,-0.07899 -0.530985,-0.219968 L 9.3564851,12.407017 c -0.6618709,-0.707603 0.3548976,-1.72354 1.0620099,-1.060989 l 1.359987,1.363011 3.368995,-3.3680118 c 0.706658,-0.7066583 1.766665,0.3533858 1.060006,1.0600058 l -3.898015,3.899981 c -0.140221,0.140977 -0.331087,0.219969 -0.530004,0.219969" clip-rule="evenodd" fill="#00b894" id="back"></path></g><g mask="url(#mask0_1732_25393)" id="g2" transform="matrix(0.26458333,0,0,0.26458333,-0.12784994,-0.04709583)"><path fill-rule="evenodd" d="M 12.484,3.5 C 11.636,3.5 6.286,5.384 5.669,5.899 5.487,6.082 5.48,6.4 5.519,8.529 c 0.018,1.026 0.043,2.42 0.043,4.35 0,5.201 5.722,7.51 6.921,7.935 1.198,-0.427 6.923,-2.749 6.923,-7.935 0,-1.932 0.025,-3.327 0.044,-4.353 C 19.488,6.399 19.481,6.081 19.288,5.889 18.683,5.384 13.332,3.5 12.484,3.5 m 0,18.856 A 0.731,0.731 0 0 1 12.266,22.324 C 11.931,22.223 4.061,19.761 4.061,12.879 4.061,10.962 4.036,9.575 4.018,8.557 3.972,6.014 3.962,5.484 4.619,4.828 5.404,4.041 11.35,2 12.483,2 c 1.133,0 7.078,2.041 7.865,2.828 0.656,0.656 0.646,1.186 0.6,3.726 -0.018,1.018 -0.043,2.405 -0.043,4.325 0,6.882 -7.87,9.344 -8.205,9.445 a 0.731,0.731 0 0 1 -0.217,0.032" clip-rule="evenodd" fill="transparent" id="frame"></path></g><path fill-rule="evenodd" d="m 2.9886701,3.7946542 c -0.0527,3e-5 -0.10325,-0.0209 -0.14049,-0.0582 l -0.50059,-0.50086 c -0.17512,-0.18722 0.0939,-0.45602 0.28099,-0.28072 l 0.35983,0.36063 0.89138,-0.89112 c 0.18697,-0.18697 0.46743,0.0935 0.28046,0.28046 l -1.03135,1.03187 c -0.0371,0.0373 -0.0876,0.0582 -0.14023,0.0582" clip-rule="evenodd" fill="transparent" style="stroke-width:0.264583" id="checkmark"></path></g></svg>`;

const shieldDisabledSvg = `<svg width="24" height="24" viewBox="0 0 6.3499993 6.3499993" version="1.1"><defs id="defs1"><mask id="mask0_1732_25393-7" width="17" height="21" x="4" y="2" maskUnits="userSpaceOnUse"><path fill-rule="evenodd" d="M 4,2 H 20.967 V 22.356 H 4 Z" clip-rule="evenodd" fill="#fff" id="path1-5"></path></mask></defs><g id="layer1"><mask id="mask0_1732_25393" width="17" height="21" x="4" y="2" maskUnits="userSpaceOnUse"><path fill-rule="evenodd" d="M 4,2 H 20.967 V 22.356 H 4 Z" clip-rule="evenodd" fill="#fff" id="path1"></path></mask><g mask="url(#mask0_1732_25393-7)" id="g2-6" transform="matrix(0.26458333,0,0,0.26458333,-0.12797994,-0.04709583)"><path fill-rule="evenodd" d="M 12.484,22.356 C 12.41013,22.356409 12.336632,22.34562 12.266,22.324 11.931,22.223 4.061,19.761 4.061,12.879 4.061,10.962 4.036,9.575 4.018,8.557 3.972,6.014 3.962,5.484 4.619,4.828 5.404,4.041 11.35,2 12.483,2 c 1.133,0 7.078,2.041 7.865,2.828 0.656,0.656 0.646,1.186 0.6,3.726 -0.018,1.018 -0.043,2.405 -0.043,4.325 0,6.882 -7.87,9.344 -8.205,9.445 -0.07031,0.02152 -0.143469,0.03231 -0.217,0.032 M 11.779464,14.52 c -0.199181,1.13e-4 -0.390236,-0.07899 -0.530985,-0.219968 L 9.3564851,12.407017 c -0.6618709,-0.707603 0.3548976,-1.72354 1.0620099,-1.060989 l 1.359987,1.363011 3.368995,-3.3680118 c 0.706658,-0.7066583 1.766665,0.3533858 1.060006,1.0600058 l -3.898015,3.899981 c -0.140221,0.140977 -0.331087,0.219969 -0.530004,0.219969" clip-rule="evenodd" fill="transparent" id="back"></path></g><g mask="url(#mask0_1732_25393)" id="g2" transform="matrix(0.26458333,0,0,0.26458333,-0.12784994,-0.04709583)"><path fill-rule="evenodd" d="M 12.484,3.5 C 11.636,3.5 6.286,5.384 5.669,5.899 5.487,6.082 5.48,6.4 5.519,8.529 c 0.018,1.026 0.043,2.42 0.043,4.35 0,5.201 5.722,7.51 6.921,7.935 1.198,-0.427 6.923,-2.749 6.923,-7.935 0,-1.932 0.025,-3.327 0.044,-4.353 C 19.488,6.399 19.481,6.081 19.288,5.889 18.683,5.384 13.332,3.5 12.484,3.5 m 0,18.856 A 0.731,0.731 0 0 1 12.266,22.324 C 11.931,22.223 4.061,19.761 4.061,12.879 4.061,10.962 4.036,9.575 4.018,8.557 3.972,6.014 3.962,5.484 4.619,4.828 5.404,4.041 11.35,2 12.483,2 c 1.133,0 7.078,2.041 7.865,2.828 0.656,0.656 0.646,1.186 0.6,3.726 -0.018,1.018 -0.043,2.405 -0.043,4.325 0,6.882 -7.87,9.344 -8.205,9.445 a 0.731,0.731 0 0 1 -0.217,0.032" clip-rule="evenodd" fill="#5e6c84" id="frame"></path></g><path fill-rule="evenodd" d="m 2.9886701,3.7946542 c -0.0527,3e-5 -0.10325,-0.0209 -0.14049,-0.0582 l -0.50059,-0.50086 c -0.17512,-0.18722 0.0939,-0.45602 0.28099,-0.28072 l 0.35983,0.36063 0.89138,-0.89112 c 0.18697,-0.18697 0.46743,0.0935 0.28046,0.28046 l -1.03135,1.03187 c -0.0371,0.0373 -0.0876,0.0582 -0.14023,0.0582" clip-rule="evenodd" fill="#5e6c84" style="stroke-width:0.264583" id="checkmark"></path></g></svg>`;

export class EncryptionToggle {
  private element: HTMLElement;
  private currentMode: EncryptionMode = 'off';
  private iconMode: EncryptionMode | 'lock' = 'off';
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
      this.iconMode = 'lock';
      return lockSvg;
    }
    this.iconMode = this.currentMode;
    return this.currentMode === 'on' ? shieldEnabledSvg : shieldDisabledSvg;
  }

  private updateIcon(): void {
    const svgElement = this.element.querySelector('svg');
    if (svgElement) {
      if (this.isLockMode) {
        if (svgElement.outerHTML !== lockSvg)
          svgElement.outerHTML = lockSvg;
        this.iconMode = 'lock';
      } else {
        if (this.iconMode === 'lock') {
          svgElement.outerHTML = this.currentMode === 'on' ? shieldEnabledSvg : shieldDisabledSvg;
        } else if (this.iconMode !== this.currentMode) {
          if (this.currentMode === 'on') {
            svgElement.getElementById("checkmark")?.setAttribute("fill", "transparent");
            svgElement.getElementById("frame")?.setAttribute("fill", "transparent");
            svgElement.getElementById("back")?.setAttribute("fill", "#00b894");
          } else {
            svgElement.getElementById("checkmark")?.setAttribute("fill", "#5e6c84");
            svgElement.getElementById("frame")?.setAttribute("fill", "#5e6c84");
            svgElement.getElementById("back")?.setAttribute("fill", "transparent");
          }
        }
        this.iconMode = this.currentMode;
      }
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
