import { KeyExchangeHandler } from './KeyExchangeHandler';
import { EncryptionState } from './types';
import { EncryptionToggle } from '../components/EncryptionToggle';

export class BaleChatManager {
  private keyExchangeHandler: KeyExchangeHandler;
  private encryptionToggle: any;
  private messageListObserver: MutationObserver | null = null;
  private inputObserver: MutationObserver | null = null;
  private sendButtonObserver: MutationObserver | null = null;
  private clonedSendButton: HTMLElement | null = null;
  private originalSendButton: HTMLElement | null = null;
  private currentChatId: string | null = null;
  private currentPeerUserId: string | null = null;
  private isProcessing = false;
  private messageElements = new Set<HTMLElement>();

  constructor() {
    const userId = this.getCurrentUserId() || '';
    this.keyExchangeHandler = new KeyExchangeHandler(userId);
  }

  async initialize(): Promise<void> {
    this.currentChatId = this.detectChatId();
    if (!this.currentChatId) {
      console.log('Not on a bale.ai chat page');
      return;
    }

    this.currentPeerUserId = this.currentChatId;
    this.observeMessageList();
    this.observeInputField();
    this.observeSendButton();
  }

  private detectChatId(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('uid') || null;
  }

  private getCurrentUserId(): string | null {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id || null;
    } catch {
      return null;
    }
  }

  private attachEncryptionToggle(): void {
    const chatId = this.currentChatId || 'unknown';
    const toggle = new EncryptionToggle(chatId);
    this.encryptionToggle = toggle;

    toggle.onStateChange((newState: EncryptionState) => {
      this.handleStateChange(newState);
    });

    const body = document.body;
    if (body) {
      toggle.mount(body);
    }
  }

  private async handleStateChange(newState: EncryptionState): Promise<void> {
    if (newState === 'init') {
      await this.initiateKeyExchange();
    }
  }

  private async initiateKeyExchange(): Promise<void> {
    if (!this.currentPeerUserId) return;

    const sendMessage = (_text: string) => {
      const input = document.getElementById('editable-message-text') as HTMLElement;
      if (input) {
        input.innerText = _text;
        this.triggerSend();
      }
    };

    const success = await this.keyExchangeHandler.initiateKeyExchange(
      this.currentPeerUserId,
      sendMessage
    );

    if (success) {
      this.encryptionToggle.setState('on');
    } else {
      alert('Failed to initiate key exchange');
    }
  }

  private observeMessageList(): void {
    const messageList = document.getElementById('message_list_scroller_id');
    if (!messageList) {
      console.log('Message list not found, waiting...');
      setTimeout(() => this.observeMessageList(), 1000);
      return;
    }

    if (this.messageListObserver) {
      this.messageListObserver.disconnect();
    }

    this.messageListObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            this.processMessageElement(node);
          }
        });
      });
    });

    this.messageListObserver.observe(messageList, {
      childList: true,
      subtree: true
    });

    console.log('Message list observer attached');
  }

  private processMessageElement(element: HTMLElement): void {
    if (element.classList.contains('message-item') && !element.dataset.matrixifyProcessed) {
      const sid = element.dataset.sid;
      if (!sid) return;

      const [messageId, senderId] = sid.split('-');
      this.currentPeerUserId = senderId;

      const span = element.querySelector('span.p');
      if (!span) return;

      const rawText = span.textContent || '';

      if (this.messageElements.has(element)) return;
      this.messageElements.add(element);

      this.decryptMessage(element, messageId, senderId, rawText);
    }
  }

  private async decryptMessage(
    element: HTMLElement,
    messageId: string,
    senderId: string,
    rawText: string
  ): Promise<void> {
    try {
      const parsed = JSON.parse(rawText);

      if (parsed.type === 'olm') {
        const decrypted = await this.keyExchangeHandler.decryptMessage(
          senderId,
          messageId,
          parsed.ciphertext.type,
          parsed.ciphertext.body
        );

        if (decrypted) {
          const span = element.querySelector('span.p');
          if (span) {
            span.textContent = decrypted;
            this.colorMessage(element, 'green');
          }
        } else {
          this.showError(element, 'message decryption failed');
          this.colorMessage(element, 'red');
        }
      } else if (parsed.type === 'key_share') {
        const success = await this.keyExchangeHandler.handleKeyShare(
          parsed,
          senderId,
          (text: string) => {
            const input = document.getElementById('editable-message-text') as HTMLElement;
            if (input) {
              input.innerText = text;
              this.triggerSend();
            }
          }
        );

        if (success) {
          const span = element.querySelector('span.p');
          if (span) {
            span.textContent = '🔑 Key exchange request received';
            this.colorMessage(element, 'yellow');
          }
        }
      } else if (this.isPreKeyMessage(parsed)) {
        const success = await this.keyExchangeHandler.handlePreKeyMessage(
          parsed,
          senderId
        );

        if (success) {
          this.encryptionToggle.setState('on');
          const span = element.querySelector('span.p');
          if (span) {
            span.textContent = '🔐 Encryption enabled';
            this.colorMessage(element, 'green');
          }
        } else {
          this.showError(element, 'key exchange failed');
          this.colorMessage(element, 'red');
        }
      }
    } catch {
      element.dataset.matrixifyProcessed = 'true';
    }
  }

  private isPreKeyMessage(parsed: any): boolean {
    return parsed.type === 'olm' && parsed.ciphertext && typeof parsed.ciphertext.type === 'number';
  }

  private showError(element: HTMLElement, text: string): void {
    const span = element.querySelector('span.p');
    if (!span) return;

    const errorDiv = document.createElement('div');
    errorDiv.textContent = text;
    errorDiv.style.cssText = 'color: #dc3545; font-size: 10px; margin-top: 4px;';
    span.parentNode?.insertBefore(errorDiv, span);
  }

  private colorMessage(element: HTMLElement, color: 'red' | 'blue' | 'green' | 'yellow'): void {
    const messageBlock = element.querySelector('.message-block') as HTMLElement || element.firstElementChild as HTMLElement;
    if (!messageBlock) return;

    const colors = {
      red: 'rgba(220, 53, 69, 0.2)',
      blue: 'rgba(0, 123, 255, 0.2)',
      green: 'rgba(40, 167, 69, 0.2)',
      yellow: 'rgba(255, 193, 7, 0.2)'
    };

    messageBlock.style.backgroundColor = colors[color];
  }

  private observeInputField(): void {
    const input = document.getElementById('editable-message-text') as HTMLElement;
    if (!input) {
      setTimeout(() => this.observeInputField(), 1000);
      return;
    }

    this.attachEncryptionToggle();

    if (this.inputObserver) {
      this.inputObserver.disconnect();
    }

    this.inputObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'innerText') {
          this.handleInputTextChange();
        }
      });
    });

    this.inputObserver.observe(input, {
      attributes: true,
      attributeFilter: ['innerText']
    });

    input.addEventListener('keydown', (e) => this.handleKeyPress(e));
  }

  private handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleSend();
    }
  }

  private handleInputTextChange(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const input = document.getElementById('editable-message-text') as HTMLElement;
    if (!input) {
      this.isProcessing = false;
      return;
    }

    setTimeout(() => {
      this.isProcessing = false;
    }, 100);
  }

  private async handleSend(): Promise<void> {
    const input = document.getElementById('editable-message-text') as HTMLElement;
    if (!input) return;

    const text = input.innerText;
    if (!text.trim()) return;

    const state = this.encryptionToggle.getState();

    if (state === 'on') {
      const encrypted = await this.keyExchangeHandler.encryptMessage(
        this.currentPeerUserId || '',
        text
      );

      if (encrypted) {
        input.innerText = encrypted;
        this.triggerSend();
      } else {
        const originalText = text;
        input.innerText = '';
        setTimeout(() => {
          input.innerText = originalText;
          alert('Encryption failed');
        }, 1000);
      }
    } else {
      this.triggerSend();
    }
  }

  private triggerSend(): void {
    const sendButton = document.querySelector('[aria-label="send-button"]') as HTMLElement;
    if (sendButton) {
      sendButton.click();
    }
  }

  private observeSendButton(): void {
    const sendButton = document.querySelector('[aria-label="send-button"]') as HTMLElement;
    if (!sendButton) {
      setTimeout(() => this.observeSendButton(), 1000);
      return;
    }

    this.originalSendButton = sendButton;

    if (this.sendButtonObserver) {
      this.sendButtonObserver.disconnect();
    }

    this.sendButtonObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          this.syncButtonStyles();
        }
      });
    });

    this.sendButtonObserver.observe(sendButton, {
      attributes: true,
      attributeFilter: ['style']
    });

    this.cloneSendButton();
  }

  private cloneSendButton(): void {
    if (!this.originalSendButton) return;

    const parent = this.originalSendButton.parentElement;
    if (!parent) return;

    this.clonedSendButton = this.originalSendButton.cloneNode(true) as HTMLElement;
    this.clonedSendButton.style.display = 'none';
    this.clonedSendButton.style.pointerEvents = 'none';
    parent.appendChild(this.clonedSendButton);

    this.clonedSendButton.addEventListener('click', () => this.handleSend());
  }

  private syncButtonStyles(): void {
    if (!this.originalSendButton || !this.clonedSendButton) return;

    const computedStyle = window.getComputedStyle(this.originalSendButton);
    const style = this.clonedSendButton.style;

    style.display = computedStyle.display;
    style.pointerEvents = computedStyle.pointerEvents;
    style.opacity = computedStyle.opacity;
    style.visibility = computedStyle.visibility;
    style.width = computedStyle.width;
    style.height = computedStyle.height;
    style.backgroundColor = computedStyle.backgroundColor;
    style.color = computedStyle.color;
    style.border = computedStyle.border;
    style.borderRadius = computedStyle.borderRadius;
    style.boxShadow = computedStyle.boxShadow;
    style.cursor = computedStyle.cursor;
  }

  public destroy(): void {
    if (this.messageListObserver) {
      this.messageListObserver.disconnect();
    }
    if (this.inputObserver) {
      this.inputObserver.disconnect();
    }
    if (this.sendButtonObserver) {
      this.sendButtonObserver.disconnect();
    }
    if (this.encryptionToggle) {
      this.encryptionToggle.unmount();
    }
  }
}
