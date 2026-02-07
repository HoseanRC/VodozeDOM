import { ExtensionMessage } from '../types';
import { EncryptionService } from '../utils/encryption';
import vodozemacWasm from "../vodozemac/vodozemac_bg.wasm?url";
import vodozemac from "../vodozemac";
import { storageService } from '../utils/storage';

const encryptionService = new EncryptionService('background-service');

class BackgroundService {
  private initialized = false;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    if (this.initialized) return;

    await vodozemac(vodozemacWasm);

    try {
      await encryptionService.init();
      this.initialized = true;

      console.log('Background service initialized');
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
    try {
      switch (message.type) {
        case 'BALE_CREATE_OTK':
          await this.handleBaleCreateOTK(message, sender);
          break;
        case 'BALE_GET_IDENTITY_KEY':
          await this.handleBaleGetIdentityKey(message, sender);
          break;
        case 'BALE_CREATE_SESSION_FROM_OTK':
          await this.handleBaleCreateSessionFromOTK(message, sender);
          break;
        case 'BALE_CREATE_SESSION_FROM_PREKEY':
          await this.handleBaleCreateSessionFromPrekey(message, sender);
          break;
        case 'BALE_ENCRYPT':
          await this.handleBaleEncrypt(message, sender);
          break;
        case 'BALE_DECRYPT':
          await this.handleBaleDecrypt(message, sender);
          break;
        case 'BALE_CHECK_MESSAGE':
          await this.handleBaleCheckMessage(message, sender);
          break;
        case 'BALE_CHECK_SESSION':
          await this.handleBaleCheckSession(message, sender);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendErrorResponse(sender, message.requestId, error as Error);
    }
  }

  private async handleBaleCreateOTK(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<void> {
    try {
      const otk = await encryptionService.createOTK();
      const identityKey = encryptionService.identityKey;

      const response: ExtensionMessage = {
        type: 'KEYS_RESULT',
        data: {
          success: true,
          otk,
          identityKey
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

  private async handleBaleGetIdentityKey(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<void> {
    try {
      const identityKey = encryptionService.identityKey;

      const response: ExtensionMessage = {
        type: 'KEYS_RESULT',
        data: {
          success: !!identityKey,
          identityKey
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

  private async handleBaleCreateSessionFromOTK(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<void> {
    try {
      const { peerUserId, identityKey, otk } = message.data;

      const preKeyMessage = await encryptionService.createSessionFromOTK(
        peerUserId,
        identityKey,
        otk
      );

      const response: ExtensionMessage = {
        type: 'KEYS_RESULT',
        data: {
          success: true,
          preKeyMessage
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

  private async handleBaleCreateSessionFromPrekey(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<void> {
    try {
      const { peerUserId, identityKey, messageType, ciphertext } = message.data;

      const result = await encryptionService.createSessionFromPreKey(
        peerUserId,
        identityKey,
        messageType,
        ciphertext
      );

      const response: ExtensionMessage = {
        type: 'KEYS_RESULT',
        data: {
          plainText: result
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

  private async handleBaleEncrypt(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<void> {
    try {
      const { peerUserId, message: plainMessage } = message.data;

      const encryptedMessage = await encryptionService.encryptMessage(
        peerUserId,
        plainMessage
      );

      const response: ExtensionMessage = {
        type: 'KEYS_RESULT',
        data: {
          success: true,
          encryptedMessage: {
            ciphertext: encryptedMessage?.ciphertext,
            message_type: encryptedMessage?.message_type,
          }
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

  private async handleBaleDecrypt(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<void> {
    try {
      const { peerUserId, messageId, messageType, ciphertext, lastSendMessage } = message.data;

      let decryptedMessage: string | undefined = undefined;

      if (typeof lastSendMessage === 'string') {
        storageService.storeMessage({
          id: messageId,
          senderUserId: peerUserId,
          plaintext: lastSendMessage,
          timestamp: Date.now()
        });
        decryptedMessage = lastSendMessage;
      } else {
        decryptedMessage = await encryptionService.decryptMessage(
          peerUserId,
          messageId,
          messageType,
          ciphertext
        );
      }

      const response: ExtensionMessage = {
        type: 'KEYS_RESULT',
        data: {
          success: true,
          decryptedMessage
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

  private async handleBaleCheckMessage(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<void> {
    try {
      const { messageId } = message.data;

      const exists = await encryptionService.checkMessage(messageId);

      const response: ExtensionMessage = {
        type: 'KEYS_RESULT',
        data: {
          success: true,
          exists
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

  private async handleBaleCheckSession(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<void> {
    try {
      const { peerUserId } = message.data;

      const exists = await encryptionService.hasSession(peerUserId);

      console.debug(`check session: ${peerUserId}, ${exists}`);

      const response: ExtensionMessage = {
        type: 'KEYS_RESULT',
        data: {
          success: true,
          exists
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
}

new BackgroundService();
