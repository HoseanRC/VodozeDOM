import { FloatingButton } from '../components/FloatingButton';
import { BaleChatManager } from '../bale/bale-chat';
import { ExtensionMessage } from '../types';

class ContentScript {
  private floatingButton: FloatingButton | null = null;
  private baleChatManager: BaleChatManager | null = null;
  private currentUserId = 'anonymous-user';

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    if (this.isBaleChat()) {
      this.baleChatManager = new BaleChatManager();
      await this.baleChatManager.initialize();
    } else {
      this.floatingButton = new FloatingButton();
      this.floatingButton.mount();
      this.attachPanelListeners();
    }

    this.attachPanelListeners();
    chrome.runtime.onMessage.addListener(this.handleBackgroundMessage.bind(this));
    await this.checkExistingKeys();
  }

  private isBaleChat(): boolean {
    return window.location.hostname === 'web.bale.ai' && window.location.pathname.includes('/chat');
  }

  private attachPanelListeners(): void {
    if (!this.floatingButton) return;

    const panel = this.floatingButton.getPanel();

    const generateBtn = panel.querySelector('#matrixify-generate-keys') as HTMLButtonElement;
    generateBtn?.addEventListener('click', () => this.generateKeys());

    const encryptBtn = panel.querySelector('#matrixify-encrypt-btn') as HTMLButtonElement;
    encryptBtn?.addEventListener('click', () => this.encryptMessage());

    const decryptBtn = panel.querySelector('#matrixify-decrypt-btn') as HTMLButtonElement;
    decryptBtn?.addEventListener('click', () => this.decryptMessage());

    const copyKeyBtn = panel.querySelector('#matrixify-copy-key') as HTMLButtonElement;
    copyKeyBtn?.addEventListener('click', () => this.copyPublicKey());
  }

  private async generateKeys(): Promise<void> {
    const message: ExtensionMessage = {
      type: 'GENERATE_KEYS',
      data: { userId: this.currentUserId },
      requestId: this.generateRequestId()
    };

    this.sendToBackground(message);
  }

  private async encryptMessage(): Promise<void> {
    if (!this.floatingButton) return;

    const panel = this.floatingButton.getPanel();
    const messageInput = panel.querySelector('#matrixify-message-input') as HTMLInputElement;
    const recipientInput = panel.querySelector('#matrixify-recipient-input') as HTMLInputElement;

    const message = messageInput?.value;
    const recipientKey = recipientInput?.value;

    if (!message || !recipientKey) {
      this.showError('Please enter both message and recipient public key');
      return;
    }

    const extensionMessage: ExtensionMessage = {
      type: 'ENCRYPT',
      data: {
        userId: this.currentUserId,
        message,
        recipientPublicKey: recipientKey
      },
      requestId: this.generateRequestId()
    };

    this.sendToBackground(extensionMessage);
  }

  private async decryptMessage(): Promise<void> {
    if (!this.floatingButton) return;

    const panel = this.floatingButton.getPanel();
    const encryptedInput = panel.querySelector('#matrixify-encrypted-input') as HTMLInputElement;
    const senderInput = panel.querySelector('#matrixify-sender-input') as HTMLInputElement;

    const encryptedMessage = encryptedInput?.value;
    const senderKey = senderInput?.value;

    if (!encryptedMessage || !senderKey) {
      this.showError('Please enter both encrypted message and sender public key');
      return;
    }

    const extensionMessage: ExtensionMessage = {
      type: 'DECRYPT',
      data: {
        userId: this.currentUserId,
        encryptedMessage,
        senderPublicKey: senderKey
      },
      requestId: this.generateRequestId()
    };

    this.sendToBackground(extensionMessage);
  }

  private async copyPublicKey(): Promise<void> {
    if (!this.floatingButton) return;

    const panel = this.floatingButton.getPanel();
    const publicKeyTextarea = panel.querySelector('#matrixify-public-key') as HTMLTextAreaElement;

    if (publicKeyTextarea?.value) {
      try {
        await navigator.clipboard.writeText(publicKeyTextarea.value);
        this.showSuccess('Public key copied to clipboard');
      } catch (error) {
        this.showError('Failed to copy public key');
      }
    }
  }

  private async checkExistingKeys(): Promise<void> {
    const message: ExtensionMessage = {
      type: 'GET_KEYS',
      data: { userId: this.currentUserId },
      requestId: this.generateRequestId()
    };

    this.sendToBackground(message);
  }

  private sendToBackground(message: ExtensionMessage): void {
    chrome.runtime.sendMessage(message);
  }

  private handleBackgroundMessage(message: ExtensionMessage, _sender: any, _sendResponse: any): void {
    if (!this.floatingButton) return;

    switch (message.type) {
      case 'KEYS_RESULT':
        this.handleKeysResult(message.data);
        break;
      case 'ENCRYPT_RESULT':
        this.handleEncryptResult(message.data);
        break;
      case 'DECRYPT_RESULT':
        this.handleDecryptResult(message.data);
        break;
    }
  }

  private handleKeysResult(data: any): void {
    if (!this.floatingButton) return;

    const panel = this.floatingButton.getPanel();
    const statusDiv = panel.querySelector('#matrixify-key-status') as HTMLDivElement;
    const publicKeyTextarea = panel.querySelector('#matrixify-public-key') as HTMLTextAreaElement;

    if (data.success && data.publicKey) {
      statusDiv.textContent = 'Keys generated successfully';
      statusDiv.className = '';
      publicKeyTextarea.value = data.publicKey;
    } else if (data.publicKey) {
      statusDiv.textContent = 'Existing keys found';
      statusDiv.className = '';
      publicKeyTextarea.value = data.publicKey;
    } else {
      statusDiv.textContent = data.error || 'No keys found';
      statusDiv.className = 'error';
    }
  }

  private handleEncryptResult(data: any): void {
    if (!this.floatingButton) return;

    const panel = this.floatingButton.getPanel();
    const outputDiv = panel.querySelector('#matrixify-encrypted-output') as HTMLDivElement;

    if (data.success) {
      outputDiv.textContent = data.encryptedMessage;
    } else {
      outputDiv.textContent = data.error || 'Encryption failed';
    }
  }

  private handleDecryptResult(data: any): void {
    if (!this.floatingButton) return;

    const panel = this.floatingButton.getPanel();
    const outputDiv = panel.querySelector('#matrixify-decrypted-output') as HTMLDivElement;

    if (data.success) {
      outputDiv.textContent = data.decryptedMessage;
    } else {
      outputDiv.textContent = data.error || 'Decryption failed';
    }
  }

  private showSuccess(message: string): void {
    this.showStatus(message, false);
  }

  private showError(message: string): void {
    this.showStatus(message, true);
  }

  private showStatus(message: string, isError: boolean): void {
    if (!this.floatingButton) return;

    const panel = this.floatingButton.getPanel();
    const statusDiv = panel.querySelector('#matrixify-key-status') as HTMLDivElement;

    statusDiv.textContent = message;
    statusDiv.className = isError ? 'error' : '';
  }

  private generateRequestId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  public destroy(): void {
    if (this.floatingButton) {
      this.floatingButton.unmount();
      this.floatingButton = null;
    }
    if (this.baleChatManager) {
      this.baleChatManager.destroy();
      this.baleChatManager = null;
    }
  }
}

new ContentScript();
