import {
  ExtensionMessage,
  validateIncomingMessage,
  CreateOtkData,
  CreateSessionFromOtkData,
  CreateSessionFromPrekeyData,
  EncryptData,
  DecryptData,
  GetIdentityKeyData,
  CheckMessageData,
  CheckSessionData
} from '../utils/messageSchema';
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
  ): Promise<void> {
    const validation = validateIncomingMessage(message);
    if (!validation.success) {
      console.warn('Invalid message received:', validation.error);
      return;
    }

    const typedMessage = validation.data;

    try {
      switch (typedMessage.type) {
        case 'PING':
          this.sendResponse(sender.tab?.id, {
            type: "PING",
            data: undefined,
            requestId: message.requestId,
          });
          break;
        case 'CREATE_OTK':
          await this.handleCreateOTK(typedMessage, sender);
          break;
        case 'GET_IDENTITY_KEY':
          await this.handleGetIdentityKey(typedMessage, sender);
          break;
        case 'CREATE_SESSION_FROM_OTK':
          await this.handleCreateSessionFromOTK(typedMessage, sender);
          break;
        case 'CREATE_SESSION_FROM_PREKEY':
          await this.handleCreateSessionFromPrekey(typedMessage, sender);
          break;
        case 'ENCRYPT':
          await this.handleEncrypt(typedMessage, sender);
          break;
        case 'DECRYPT':
          await this.handleDecrypt(typedMessage, sender);
          break;
        case 'CHECK_MESSAGE':
          await this.handleCheckMessage(typedMessage, sender);
          break;
        case 'CHECK_SESSION':
          await this.handleCheckSession(typedMessage, sender);
          break;
        default:
          console.warn('Unknown message type:', typedMessage.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendErrorResponse(sender, typedMessage.requestId, error as Error);
    }
  }

  private async handleCreateOTK(message: { data: CreateOtkData; requestId?: string }, sender: chrome.runtime.MessageSender): Promise<void> {
    try {
      const otk = await encryptionService.createOTK();
      const identityKey = encryptionService.identityKey;

      const response: ExtensionMessage = {
        type: 'CREATE_OTK_RESPONSE',
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
        type: 'CREATE_OTK_RESPONSE',
        data: {
          success: false,
          error: (error as Error).message
        },
        requestId: message.requestId
      };

      this.sendResponse(sender.tab?.id, response);
    }
  }

  private async handleGetIdentityKey(message: { data: GetIdentityKeyData; requestId?: string }, sender: chrome.runtime.MessageSender): Promise<void> {
    try {
      const identityKey = encryptionService.identityKey;

      const response: ExtensionMessage = {
        type: 'GET_IDENTITY_KEY_RESPONSE',
        data: {
          success: !!identityKey,
          identityKey
        },
        requestId: message.requestId
      };

      this.sendResponse(sender.tab?.id, response);
    } catch (error) {
      const response: ExtensionMessage = {
        type: 'GET_IDENTITY_KEY_RESPONSE',
        data: {
          success: false,
          error: (error as Error).message
        },
        requestId: message.requestId
      };

      this.sendResponse(sender.tab?.id, response);
    }
  }

  private async handleCreateSessionFromOTK(message: { data: CreateSessionFromOtkData; requestId?: string }, sender: chrome.runtime.MessageSender): Promise<void> {
    try {
      const { peerUserId, identityKey, otk } = message.data;

      const preKeyMessage = await encryptionService.createSessionFromOTK(
        peerUserId,
        identityKey,
        otk
      );

      const response: ExtensionMessage = {
        type: 'CREATE_SESSION_FROM_OTK_RESPONSE',
        data: {
          success: true,
          preKeyMessage
        },
        requestId: message.requestId
      };

      this.sendResponse(sender.tab?.id, response);
    } catch (error) {
      const response: ExtensionMessage = {
        type: 'CREATE_SESSION_FROM_OTK_RESPONSE',
        data: {
          success: false,
          error: (error as Error).message
        },
        requestId: message.requestId
      };

      this.sendResponse(sender.tab?.id, response);
    }
  }

  private async handleCreateSessionFromPrekey(message: { data: CreateSessionFromPrekeyData; requestId?: string }, sender: chrome.runtime.MessageSender): Promise<void> {
    try {
      const { peerUserId, identityKey, messageId, messageType, ciphertext } = message.data;

      const result = await encryptionService.createSessionFromPreKey(
        peerUserId,
        identityKey,
        messageId,
        messageType,
        ciphertext
      );

      const response: ExtensionMessage = {
        type: 'CREATE_SESSION_FROM_PREKEY_RESPONSE',
        data: {
          success: true,
          plainText: result
        },
        requestId: message.requestId
      };

      this.sendResponse(sender.tab?.id, response);
    } catch (error) {
      const response: ExtensionMessage = {
        type: 'CREATE_SESSION_FROM_PREKEY_RESPONSE',
        data: {
          success: false,
          error: (error as Error).message
        },
        requestId: message.requestId
      };

      this.sendResponse(sender.tab?.id, response);
    }
  }

  private async handleEncrypt(message: { data: EncryptData; requestId?: string }, sender: chrome.runtime.MessageSender): Promise<void> {
    try {
      const { peerUserId, message: plainMessage } = message.data;

      const encryptedMessage = await encryptionService.encryptMessage(
        peerUserId,
        plainMessage
      );

      const response: ExtensionMessage = {
        type: 'ENCRYPT_RESPONSE',
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
        type: 'ENCRYPT_RESPONSE',
        data: {
          success: false,
          error: (error as Error).message
        },
        requestId: message.requestId
      };

      this.sendResponse(sender.tab?.id, response);
    }
  }

  private async handleDecrypt(message: { data: DecryptData; requestId?: string }, sender: chrome.runtime.MessageSender): Promise<void> {
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
        type: 'DECRYPT_RESPONSE',
        data: {
          success: true,
          decryptedMessage
        },
        requestId: message.requestId
      };

      this.sendResponse(sender.tab?.id, response);
    } catch (error) {
      const response: ExtensionMessage = {
        type: 'DECRYPT_RESPONSE',
        data: {
          success: false,
          error: (error as Error).message
        },
        requestId: message.requestId
      };

      this.sendResponse(sender.tab?.id, response);
    }
  }

  private async handleCheckMessage(message: { data: CheckMessageData; requestId?: string }, sender: chrome.runtime.MessageSender): Promise<void> {
    try {
      const { messageId } = message.data;

      const exists = await encryptionService.checkMessage(messageId);

      const response: ExtensionMessage = {
        type: 'CHECK_MESSAGE_RESPONSE',
        data: {
          success: true,
          exists
        },
        requestId: message.requestId
      };

      this.sendResponse(sender.tab?.id, response);
    } catch (error) {
      const response: ExtensionMessage = {
        type: 'CHECK_MESSAGE_RESPONSE',
        data: {
          success: false,
          error: (error as Error).message
        },
        requestId: message.requestId
      };

      this.sendResponse(sender.tab?.id, response);
    }
  }

  private async handleCheckSession(message: { data: CheckSessionData; requestId?: string }, sender: chrome.runtime.MessageSender): Promise<void> {
    try {
      const { peerUserId } = message.data;

      const exists = await encryptionService.hasSession(peerUserId);

      console.debug(`check session: ${peerUserId}, ${exists}`);

      const response: ExtensionMessage = {
        type: 'CHECK_SESSION_RESPONSE',
        data: {
          success: true,
          exists
        },
        requestId: message.requestId
      };

      this.sendResponse(sender.tab?.id, response);
    } catch (error) {
      const response: ExtensionMessage = {
        type: 'CHECK_SESSION_RESPONSE',
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
      type: 'DECRYPT_RESPONSE',
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
