import { EncryptionState } from '../bale/types';

export class EncryptionToggle {
  private element: HTMLElement;
  private currentState: EncryptionState = 'off';
  private chatId: string;
  private stateChangeCallback: ((newState: EncryptionState) => void) | null = null;

  constructor(chatId: string, initialState: EncryptionState = 'off') {
    this.chatId = chatId;
    this.currentState = initialState;
    this.element = this.createElement();
    this.injectStyles();
    this.attachListeners();
  }

  private createElement(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'matrixify-encryption-toggle';
    container.className = 'matrixify-encryption-toggle';

    container.innerHTML = `
      <button class="matrixify-toggle-button" data-state="off">
        <span class="matrixify-toggle-icon">🔓</span>
        <span class="matrixify-toggle-text">Off</span>
      </button>
    `;

    this.updateUI();
    return container;
  }

  private injectStyles(): void {
    if (document.querySelector('#matrixify-toggle-styles')) return;

    const style = document.createElement('style');
    style.id = 'matrixify-toggle-styles';
    style.textContent = `
      .matrixify-encryption-toggle {
        position: fixed;
        bottom: 100px;
        left: 20px;
        z-index: 10002;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .matrixify-toggle-button {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        border: none;
        border-radius: 8px;
        background: white;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
        min-width: 120px;
      }

      .matrixify-toggle-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      }

      .matrixify-toggle-button[data-state="on"] {
        background: linear-gradient(135deg, #00c853 0%, #00e676 100%);
        color: white;
      }

      .matrixify-toggle-button[data-state="off"] {
        background: white;
        color: #333;
      }

      .matrixify-toggle-button[data-state="init"] {
        background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
        color: white;
      }

      .matrixify-toggle-icon {
        font-size: 18px;
        line-height: 1;
      }

      .matrixify-toggle-text {
        font-size: 13px;
      }

      .matrixify-toggle-status {
        margin-top: 8px;
        font-size: 11px;
        color: #666;
        background: rgba(255, 255, 255, 0.95);
        padding: 6px 10px;
        border-radius: 4px;
        box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
        max-width: 200px;
        display: none;
      }

      .matrixify-toggle-status.visible {
        display: block;
      }
    `;

    document.head.appendChild(style);
  }

  private attachListeners(): void {
    const button = this.element.querySelector('.matrixify-toggle-button');
    button?.addEventListener('click', () => this.handleToggle());
  }

  private handleToggle(): void {
    const states: EncryptionState[] = ['off', 'on', 'init'];
    const currentIndex = states.indexOf(this.currentState);
    const nextIndex = (currentIndex + 1) % states.length;
    const nextState = states[nextIndex];

    if (nextState === 'init') {
      if (confirm('This will send your public key to start encrypted messaging. Continue?')) {
        this.setState('init');
      }
    } else {
      this.setState(nextState);
    }
  }

  setState(newState: EncryptionState): void {
    this.currentState = newState;
    this.updateUI();
    this.saveState();

    if (this.stateChangeCallback) {
      this.stateChangeCallback(newState);
    }
  }

  private updateUI(): void {
    const button = this.element.querySelector('.matrixify-toggle-button') as HTMLButtonElement;
    if (!button) return;

    const icons = { off: '🔓', on: '🔒', init: '🔄' };
    const texts = { off: 'Off', on: 'On', init: 'Init' };

    button.dataset.state = this.currentState;
    const iconSpan = button.querySelector('.matrixify-toggle-icon');
    const textSpan = button.querySelector('.matrixify-toggle-text');

    if (iconSpan) iconSpan.textContent = icons[this.currentState];
    if (textSpan) textSpan.textContent = texts[this.currentState];
  }

  private saveState(): void {
    const storageKey = 'matrixify_bale_states';
    const states = this.loadStates();
    states[this.chatId] = this.currentState;
    localStorage.setItem(storageKey, JSON.stringify(states));
  }

  private loadStates(): Record<string, EncryptionState> {
    const storageKey = 'matrixify_bale_states';
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  getState(): EncryptionState {
    return this.currentState;
  }

  onStateChange(callback: (newState: EncryptionState) => void): void {
    this.stateChangeCallback = callback;
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }

  unmount(): void {
    this.element.remove();
  }

  getElement(): HTMLElement {
    return this.element;
  }
}
