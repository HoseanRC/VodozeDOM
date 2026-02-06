import { KeyExchangeHandler } from './KeyExchangeHandler';
import { EncryptionToggle, EncryptionMode } from '../components/EncryptionToggle';
import { EncryptedChatMessage, KeyShareMessage } from './types';

export class BaleChatManager {
  private keyExchangeHandler: KeyExchangeHandler;
  private encryptionToggle: EncryptionToggle | null = null;
  private mainWrapperObserver: MutationObserver | null = null;
  private chatFooterObserver: MutationObserver | null = null;
  private messageListObserver: MutationObserver | null = null;
  private sendButtonObserver: MutationObserver | null = null;
  private clonedSendButton: HTMLElement | null = null;
  private originalSendButton: HTMLElement | null = null;
  private messageList: HTMLElement | null = null;
  private currentChatId: string | null = null;
  private currentPeerUserId: string | null = null;
  private messageElements = new Set<string>();
  private encryptionButtonPeerId: string | null = null;

  constructor() {
    const userId = this.getCurrentUserId() || '';
    this.keyExchangeHandler = new KeyExchangeHandler(userId);
  }

  async initialize(): Promise<void> {
    this.currentChatId = this.detectChatId();
    if (!this.currentChatId) {
      return;
    }

    this.currentPeerUserId = this.currentChatId;
    this.attachMainWrapperObserver();
  }

  private detectChatId(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('uid') || null;
  }

  private getCurrentUserId(): string | null {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return String(user.id) || null;
    } catch {
      return null;
    }
  }

  private attachMainWrapperObserver(): void {
    const mainWrapper = document.getElementById('app_main_wrapper');
    if (!mainWrapper) {
      console.log("Matrixify: main wrapper not found");
      setTimeout(() => this.attachMainWrapperObserver(), 500);
      return;
    }
    console.log("Matrixify: main wrapper found. ataching...");

    this.mainWrapperObserver = new MutationObserver(() => {
      this.checkAndAttachChildren();
    });

    this.mainWrapperObserver.observe(mainWrapper, {
      childList: true,
      subtree: true
    });

    this.checkAndAttachChildren();
  }

  private checkAndAttachChildren(): void {
    this.attachChatFooterObserver();
    this.attachMessageListObserver();
  }

  private detachAll(): void {
    if (this.mainWrapperObserver) {
      this.mainWrapperObserver.disconnect();
      this.mainWrapperObserver = null;
    }
    this.detachChatFooterObserver();
    this.detachMessageListObserver();
    this.detachSendButtonObserver();
    this.detachEncryptionToggle();
  }

  private async checkSessionAndAttachToggle(): Promise<void> {
    if (this.encryptionButtonPeerId == this.currentPeerUserId) return;
    const hasSession = await this.keyExchangeHandler.hasSession(this.currentPeerUserId || '');
    console.debug(`attaching toggle: ${this.currentPeerUserId} ${hasSession}`);

    if (hasSession) {
      this.attachEncryptionToggle('on', false);
    } else {
      this.attachEncryptionToggle('off', true);
    }

    this.encryptionButtonPeerId = this.currentPeerUserId;
  }

  private attachChatFooterObserver(): void {
    const chatFooter = document.getElementById('chat_footer');
    if (!chatFooter) {
      this.detachChatFooterObserver();
      return;
    }


    this.chatFooterObserver = new MutationObserver(() => {
      const currentFooter = document.getElementById('chat_footer');
      if (!currentFooter) {
        this.detachChatFooterObserver();
        return;
      }
      this.attachSendButtonObserver();
    });

    this.chatFooterObserver.observe(chatFooter, {
      childList: true,
      subtree: true
    });

    this.attachSendButtonObserver();
    this.checkSessionAndAttachToggle();
  }

  private detachChatFooterObserver(): void {
    if (this.chatFooterObserver) {
      console.log("Matrixify: detaching from chat footer...");
      this.chatFooterObserver.disconnect();
      this.chatFooterObserver = null;
    }
    this.detachSendButtonObserver();
  }

  private attachMessageListObserver(): void {
    if (this.messageList && this.messageList.parentElement) return;
    const messageList = document.getElementById('message_list_scroller_id');
    if (!messageList) return;

    this.messageList = messageList;

    this.detachMessageListObserver();
    console.log("Matrixify: attaching message list...");

    this.messageListObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            this.processMessageElement(node);
          }
          if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
            this.processMessageElement(node.parentElement);
          }
        });
      });
    });

    this.messageListObserver.observe(messageList, {
      childList: true,
      subtree: true
    });

    Array.from(messageList.children).forEach(element => {
      if (!(element instanceof HTMLElement)) return;
      this.processMessageElement(element);
    });
  }

  private detachMessageListObserver(): void {
    console.log("Matrixify: deattaching message list...");
    if (this.messageListObserver) {
      this.messageListObserver.disconnect();
      this.messageListObserver = null;
    }
  }

  private attachSendButtonObserver(): void {
    if (this.originalSendButton && this.originalSendButton.parentElement) return;
    const sendButton = document.querySelector('[aria-label="send-button"]') as HTMLElement;
    if (!sendButton) return;

    this.detachSendButtonObserver();

    this.originalSendButton = sendButton;

    this.sendButtonObserver = new MutationObserver(() => {
      const currentButton = document.querySelector('[aria-label="send-button"]') as HTMLElement;
      if (!currentButton || currentButton !== this.originalSendButton) {
        console.log("Matrixify: reattaching send button...");
        this.attachSendButtonObserver();
        return;
      }
      this.syncButtonStyles();
    });

    console.log("Matrixify: attaching send button...");

    this.sendButtonObserver.observe(sendButton, {
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden', 'visibility']
    });

    this.cloneSendButton();
  }

  private detachSendButtonObserver(): void {
    if (this.sendButtonObserver) {
      console.log("Matrixify: detaching from send button...");
      this.sendButtonObserver.disconnect();
      this.sendButtonObserver = null;
    }
    if (this.originalSendButton && this.originalSendButton.parentElement) {
      this.originalSendButton.innerHTML = '';
    }
    if (this.clonedSendButton && this.clonedSendButton.parentElement) {
      this.clonedSendButton.remove();
      this.clonedSendButton = null;
    }
    this.originalSendButton = null;
  }

  private syncButtonStyles(): void {
    if (!this.originalSendButton || !this.clonedSendButton) return;

    const originalStyle = this.originalSendButton.getAttribute('style') || '';
    this.clonedSendButton.setAttribute('style', originalStyle);
  }

  private cloneSendButton(): void {
    const sendButton = this.originalSendButton;
    if (!sendButton) return;

    if (this.clonedSendButton && this.clonedSendButton.parentElement) {
      this.clonedSendButton.remove();
    }

    this.clonedSendButton = sendButton.cloneNode(true) as HTMLElement;
    this.clonedSendButton.id = 'matrixify-cloned-send-button';

    sendButton.parentElement?.appendChild(this.clonedSendButton);
    this.clonedSendButton.addEventListener('click', () => this.handleSend());

    sendButton.innerHTML = '';
  }

  private attachEncryptionToggle(initialMode: EncryptionMode, needsKeyExchange: boolean): void {
    const chatId = this.currentChatId || 'unknown';
    if (this.encryptionToggle && document.body.contains(this.encryptionToggle.getElement())) {
      this.encryptionToggle.setMode(initialMode);
      this.encryptionToggle.setNeedsKeyExchange(needsKeyExchange);
      return;
    }

    this.detachEncryptionToggle();

    const toggle = new EncryptionToggle(chatId, initialMode, needsKeyExchange);
    this.encryptionToggle = toggle;

    toggle.setKeyExchangeCallback(async () => {
      await this.initiateKeyExchange();
    });

    toggle.mount();
  }

  private detachEncryptionToggle(): void {
    if (this.encryptionToggle) {
      this.encryptionToggle.unmount();
      this.encryptionToggle = null;
    }
  }

  private processMessageElement(element: HTMLElement): void {
    const messageItem = element.closest('.message-item') as HTMLElement;
    if (!messageItem) return;
    if (!messageItem.classList.contains('message-item')) return;

    const sid = messageItem.dataset.sid;
    if (!sid) return;
    if (messageItem.dataset.matrixifyProcessed) return;

    const sliced_sid = sid.split('-');
    const messageId = sliced_sid.slice(0, sliced_sid.length - 1).join("-");
    const senderId = sliced_sid[sliced_sid.length - 1];
    if (senderId == this.getCurrentUserId()) return;
    this.currentPeerUserId = senderId;

    const span = messageItem.querySelector('span.p');
    if (!span) return;

    const rawText = span.textContent || '';
    const messageKey = `${messageId}-${senderId}`;
    if (this.messageElements.has(messageKey)) return;
    this.messageElements.add(messageKey);

    this.decryptMessage(messageItem, messageId, senderId, rawText);
  }

  private async decryptMessage(
    element: HTMLElement,
    messageId: string,
    senderId: string,
    rawText: string
  ): Promise<void> {
    try {
      const parsed = JSON.parse(rawText) as EncryptedChatMessage | KeyShareMessage;

      if (parsed.type === 'olm') {
        if (parsed.cipher.message_type === 1) {
          const decrypted = await this.keyExchangeHandler.decryptMessage(
            senderId,
            messageId,
            parsed.cipher.message_type,
            parsed.cipher.ciphertext
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
        } else {
          if (parsed.senderUserId === this.getCurrentUserId()) {
            this.colorMessage(element, 'green');
            element.getElementsByClassName("p")[0].textContent = "🔑 Encryption established";
          } else {
            await this.keyExchangeHandler.handlePreKeyMessage(parsed, parsed.senderUserId);
            this.encryptionButtonPeerId = null;
          }
        }
      } else if (parsed.type === 'key_share') {
        this.encryptionButtonPeerId = null;
        console.log("Matrixify: received key share request.");
        if (parsed.senderUserId === this.getCurrentUserId()) {
          console.log("Matrixify: this is our own key share request. aborting");
          element.getElementsByClassName("p")[0].textContent = "🔑 Key exchange request sent";
          this.colorMessage(element, 'blue');
          return;
        } else if (await this.keyExchangeHandler.hasSession(parsed.senderUserId)) {
          element.getElementsByClassName("p")[0].textContent = "🔑 Key exchange request received";
          this.colorMessage(element, 'yellow');
          return;
        }
        const success = await this.keyExchangeHandler.handleKeyShare(
          parsed,
          senderId,
          (text: string) => {
            console.log("Matrixify: handling key share succeeded.");
            this.colorMessage(element, 'blue');
            const input = document.getElementById('editable-message-text') as HTMLElement;
            if (input) {
              input.innerText = text;
              this.handleSend(true);
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
          this.encryptionToggle?.setMode('on');
          this.encryptionToggle?.setNeedsKeyExchange(false);
          const span = element.querySelector('span.p');
          if (span) {
            span.textContent = 'Encryption enabled';
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

  private isPreKeyMessage(parsed: EncryptedChatMessage): boolean {
    return parsed.type === 'olm' && !!parsed.cipher.ciphertext && parsed.cipher.message_type === 0;
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
    const messageBlock = element.querySelector(':scope > div') as HTMLElement || element.firstElementChild as HTMLElement;
    if (!messageBlock) return;

    const colors = {
      red: 'rgba(220, 53, 69, 0.2)',
      blue: 'rgba(0, 123, 255, 0.2)',
      green: 'rgba(40, 167, 69, 0.2)',
      yellow: 'rgba(255, 193, 7, 0.2)'
    };

    messageBlock.style.backgroundColor = colors[color];
  }

  private async handleSend(raw?: boolean): Promise<void> {
    if (raw) {
      this.originalSendButton?.click();
      return;
    }
    const input = document.getElementById('editable-message-text') as HTMLElement;
    if (!input) return;

    const text = input.innerText;
    if (!text.trim()) return;

    const mode = this.encryptionToggle?.getMode() || 'off';

    if (mode === 'on') {
      try {
        const encrypted = await this.keyExchangeHandler.encryptMessage(
          this.currentPeerUserId || '',
          text
        );

        if (encrypted) {
          input.innerText = encrypted;
          this.originalSendButton?.click();
        } else {
          const originalText = text;
          input.innerText = '';
          setTimeout(() => {
            input.innerText = originalText;
            alert('Encryption failed');
          }, 100);
        }
      } catch {
        const originalText = text;
        input.innerText = '';
        setTimeout(() => {
          input.innerText = originalText;
          alert('Encryption failed');
        }, 100);
      }
    } else {
      this.originalSendButton?.click();
    }
  }

  private async initiateKeyExchange(): Promise<void> {
    if (!this.currentPeerUserId) return;

    const sendMessage = (text: string) => {
      const input = document.getElementById('editable-message-text') as HTMLElement;
      if (input) {
        input.innerText = text;
        this.handleSend();
      }
    };

    const success = await this.keyExchangeHandler.initiateKeyExchange(
      this.currentPeerUserId,
      sendMessage
    );

    if (success) {
      this.encryptionToggle?.setMode('on');
      this.encryptionToggle?.setNeedsKeyExchange(false);
    } else {
      alert('Failed to initiate key exchange');
      this.encryptionToggle?.setMode('off');
      this.encryptionToggle?.setNeedsKeyExchange(true);
    }
  }

  public destroy(): void {
    this.detachAll();
  }
}
