import { ExtensionMessage } from '../types';
import { encryptionService } from '../utils/encryption';

console.log("dklskjkjfglkjfdlkgdf");

class BackgroundService {
  private initialized = false;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    if (this.initialized) return;

    try {
      await encryptionService.init();
      this.initialized = true;

      console.log("cool ig");
      // Listen for messages from content scripts
      chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    } catch (error) {
      console.error('Failed to initialize background service:', error);
    }
  }

  private async handleMessage(
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    _sendResponse: (response?: any) => void
  ): Promise<void> {
    console.log("got msg");
    try {
      switch (message.type) {
        case 'GENERATE_KEYS':
          await this.handleGenerateKeys(message, sender);
          break;
        case 'GET_KEYS':
          console.log("getting keys");
          await this.handleGetKeys(message, sender);
          break;
        case 'ENCRYPT':
          await this.handleEncrypt(message, sender);
          break;
        case 'DECRYPT':
          await this.handleDecrypt(message, sender);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendErrorResponse(sender, message.requestId, error as Error);
    }
  }

  private async handleGenerateKeys(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<void> {
    try {
      const { userId } = message.data;
      const deviceId = `device-${Date.now()}`;
      
      const keyPair = await encryptionService.generateKeyPair(userId, deviceId);
      
      const response: ExtensionMessage = {
        type: 'KEYS_RESULT',
        data: {
          success: true,
          publicKey: keyPair.publicKey,
          deviceId: keyPair.deviceId
        },
        requestId: message.requestId
      };

      this.sendResponse(sender.tab?.id, response);
    } catch (error) {
      const response: ExtensionMessage = {
        type: 'KEYS_RESULT',
        data: {
          success: false,
          error: (error as Error).message
        },
        requestId: message.requestId
      };

      this.sendResponse(sender.tab?.id, response);
    }
  }

  private async handleGetKeys(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<void> {
    try {
      const { userId } = message.data;
      
      const hasKeys = await encryptionService.hasKeys(userId);
      let publicKey = null;
      
      if (hasKeys) {
        publicKey = await encryptionService.getPublicKey(userId);
      }

      const response: ExtensionMessage = {
        type: 'KEYS_RESULT',
        data: {
          success: hasKeys,
          publicKey: publicKey,
          hasKeys
        },
        requestId: message.requestId
      };

      this.sendResponse(sender.tab?.id, response);
    } catch (error) {
      const response: ExtensionMessage = {
        type: 'KEYS_RESULT',
        data: {
          success: false,
          error: (error as Error).message
        },
        requestId: message.requestId
      };

      this.sendResponse(sender.tab?.id, response);
    }
  }

  private async handleEncrypt(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<void> {
    try {
      const { userId, message: plainMessage, recipientPublicKey } = message.data;
      
      const encryptedMessage = await encryptionService.encryptMessage(
        userId,
        recipientPublicKey,
        plainMessage
      );

      const response: ExtensionMessage = {
        type: 'ENCRYPT_RESULT',
        data: {
          success: true,
          encryptedMessage
        },
        requestId: message.requestId
      };

      this.sendResponse(sender.tab?.id, response);
    } catch (error) {
      const response: ExtensionMessage = {
        type: 'ENCRYPT_RESULT',
        data: {
          success: false,
          error: (error as Error).message
        },
        requestId: message.requestId
      };

      this.sendResponse(sender.tab?.id, response);
    }
  }

  private async handleDecrypt(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<void> {
    try {
      const { userId, encryptedMessage, senderPublicKey } = message.data;
      
      const decryptedMessage = await encryptionService.decryptMessage(
        userId,
        senderPublicKey,
        encryptedMessage
      );

      const response: ExtensionMessage = {
        type: 'DECRYPT_RESULT',
        data: {
          success: true,
          decryptedMessage
        },
        requestId: message.requestId
      };

      this.sendResponse(sender.tab?.id, response);
    } catch (error) {
      const response: ExtensionMessage = {
        type: 'DECRYPT_RESULT',
        data: {
          success: false,
          error: (error as Error).message
        },
        requestId: message.requestId
      };

      this.sendResponse(sender.tab?.id, response);
    }
  }

  private sendResponse(tabId: number | undefined, message: ExtensionMessage): void {
    if (tabId) {
      chrome.tabs.sendMessage(tabId, message);
    }
  }

  private sendErrorResponse(sender: chrome.runtime.MessageSender, requestId: string | undefined, error: Error): void {
    const response: ExtensionMessage = {
      type: 'KEYS_RESULT',
      data: {
        success: false,
        error: error.message
      },
      requestId
    };

    this.sendResponse(sender.tab?.id, response);
  }

  // Exposed functions for later implementation
  public async handleGroupSessionCreation(roomId: string): Promise<string> {
    return await encryptionService.createGroupSession('anonymous-user', roomId);
  }

  public async handleGroupEncryption(roomId: string, message: string): Promise<string> {
    return await encryptionService.encryptForGroup('anonymous-user', roomId, message);
  }

  public async handleGroupDecryption(roomId: string, encryptedMessage: string): Promise<string> {
    return await encryptionService.decryptFromGroup('anonymous-user', roomId, encryptedMessage);
  }
}

// Initialize background service
new BackgroundService();
