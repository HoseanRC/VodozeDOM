import { KeyExchangeHandler } from '../../KeyExchangeHandler';
import { EncryptionToggle, EncryptionMode } from './BaleEncryptionToggle';
import { EncryptedChatMessage, KeyShareMessage } from '../../types';

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
  private currentPeerUserId: string | null = null;
  private encryptionButtonPeerId: string | null = null;
  private lastSendMessage: string | null = null;

  constructor() {
    const userId = this.getCurrentUserId() || '';
    this.keyExchangeHandler = new KeyExchangeHandler(userId, "bale-");
  }

  async initialize(): Promise<void> {
    this.currentPeerUserId = this.detectChatId();
    if (!this.currentPeerUserId) {
      return;
    }

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
      this.attachEncryptionToggle('on', true);
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

  private async attachMessageListObserver() {
    if (this.messageList && this.messageList.parentElement) return;
    const messageList = document.getElementById('message_list_scroller_id');
    if (!messageList) return;

    this.messageList = messageList;

    this.detachMessageListObserver();
    console.log("Matrixify: attaching message list...");

    const chatId = this.detectChatId();
    if (this.currentPeerUserId !== chatId) {
      this.currentPeerUserId = chatId;
      this.encryptionToggle?.setNeedsKeyExchange(this.currentPeerUserId ? (!await this.keyExchangeHandler.hasSession(this.currentPeerUserId)) : false);
    }

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

    this.attachEnterEvent();
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

  private attachEnterEvent() {
    const input = document.getElementById('editable-message-text') as HTMLElement;
    if (input.dataset.matrixifyAttached) return;
    input.addEventListener("keypress", (event) => {
      if (event.key === 'Enter' && !(event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)) {
        this.handleSend();
        input.innerText = "";
      }
    });
    input.dataset.matrixifyAttached = "";
  }

  private attachEncryptionToggle(initialMode: EncryptionMode, needsKeyExchange: boolean): void {
    const chatId = this.currentPeerUserId || 'unknown';
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
    messageItem.dataset.matrixifyProcessed = "true";

    const sliced_sid = sid.split('-');
    const messageId = sliced_sid.slice(0, sliced_sid.length - 1).join("-");
    const senderId = sliced_sid[sliced_sid.length - 1];

    const span = messageItem.querySelector('span.p');
    if (!span) return;

    const rawText = span.textContent || '';
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
        if (parsed.cipher.message_type === 1 || await this.keyExchangeHandler.hasSession(parsed.senderUserId)) {
          const decrypted = await this.keyExchangeHandler.decryptMessage(
            senderId,
            messageId,
            parsed.cipher.message_type,
            parsed.cipher.ciphertext,
            this.lastSendMessage
          );
          this.lastSendMessage = null;

          if (decrypted) {
            const span = element.querySelector('span.p');
            if (span) {
              span.textContent = decrypted;
              this.colorMessage(element, 'blue');
            }
          } else {
            this.showError(element, 'message decryption failed');
            this.colorMessage(element, 'red');
          }
        } else {
          const plaintext = await this.keyExchangeHandler.decryptPreKey(parsed, messageId, parsed.senderUserId);
          if (!plaintext) {
            this.colorMessage(element, 'red');
            element.getElementsByClassName("p")[0].textContent = "🔑 Failed to create session";
          } else {
            this.encryptionToggle?.setNeedsKeyExchange(false);
            this.colorMessage(element, 'blue');
            element.getElementsByClassName("p")[0].textContent = plaintext;
          }
        }
        if (senderId === this.getCurrentUserId()) {
          this.colorMessage(element, 'green');
        }
      } else if (parsed.type === 'key_share') {
        console.log("Matrixify: received key share request.");
        if (parsed.senderUserId === this.getCurrentUserId()) {
          console.log("Matrixify: this is our own key share request. aborting");
          element.getElementsByClassName("p")[0].textContent = "🔑 Key exchange request sent";
          this.colorMessage(element, 'green');
          return;
        } else if (await this.keyExchangeHandler.hasSession(parsed.senderUserId)) {
          element.getElementsByClassName("p")[0].textContent = "🔑 Key exchange request received";
          this.colorMessage(element, 'blue');
          return;
        }
        const preKeyMessage = await this.keyExchangeHandler.preKeyFromOneTimeKey(
          parsed,
          senderId,
        );

        if (preKeyMessage) {
          console.log("Matrixify: handling key share succeeded.");
          this.colorMessage(element, 'blue');
          const span = element.querySelector('span.p');
          if (span) {
            span.textContent = '🔑 Key exchange request received';
          }
          this.encryptionToggle?.setNeedsKeyExchange(false);

          this.colorMessage(element, 'blue');
          const input = document.getElementById('editable-message-text') as HTMLElement;
          if (input) {
            setTimeout(async () => {
              input.innerText = JSON.stringify(preKeyMessage);
              await this.handleSend(true);
              input.innerText = "";
              this.lastSendMessage = "🔑 Encryption established";
            }, 100);
          }
        }
      }
    } catch {

    }
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
    const messageBlock = element.querySelector(':scope > div > div') as HTMLElement || element.firstElementChild as HTMLElement;
    if (!messageBlock) return;

    const colors = {
      red: 'rgba(220, 53, 69, 0.2)',
      blue: 'linear-gradient(45deg, var(--color-bubble-in-primary) 50%, var(--color-bubble-in-secondary) 125%)',
      green: 'linear-gradient(-45deg, var(--color-bubble-out-primary) 50%, var(--color-bubble-out-secondary) 125%)',
      yellow: 'rgba(255, 193, 7, 0.2)'
    };

    messageBlock.style.background = colors[color];
  }

  private async handleSend(raw?: boolean): Promise<void> {
    // act fast or the message will be sent
    const input = document.getElementById('editable-message-text') as HTMLElement;
    if (!input) return;

    const originalText = input.innerText;

    if (!originalText.trim()) return;
    input.innerText = "";
    // we can rest now

    if (raw || !await this.keyExchangeHandler.hasSession(this.currentPeerUserId || "")) {
      input.innerText = originalText;
      this.originalSendButton?.click();
      return;
    }

    const mode = this.encryptionToggle?.getMode() || 'off';

    if (mode === 'on') {
      try {
        const encrypted = await this.keyExchangeHandler.encryptMessage(
          this.currentPeerUserId || '',
          originalText
        );

        if (encrypted) {
          input.innerText = JSON.stringify(encrypted);
          this.lastSendMessage = originalText;
          this.originalSendButton?.click();
          input.innerText = '';
        } else {
          input.innerText = '';
          setTimeout(() => {
            input.innerText = originalText;
            alert('Encryption failed');
          }, 100);
        }
      } catch {
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
        this.handleSend(true);
        input.innerText = "";
      }
    };

    const success = await this.keyExchangeHandler.createOneTimeKey(
      this.currentPeerUserId,
      sendMessage
    );

    if (!success) {
      alert('Failed to initiate key exchange');
      this.encryptionToggle?.setMode('off');
      this.encryptionToggle?.setNeedsKeyExchange(true);
    }
  }

  public destroy(): void {
    this.detachAll();
  }
}
