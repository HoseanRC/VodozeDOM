import {
  ExtensionMessage,
  CreateOtkResponseData,
  CreateSessionFromOtkResponseData,
  CreateSessionFromPrekeyResponseData,
  EncryptResponseData,
  DecryptResponseData,
  GetIdentityKeyResponseData,
  CheckMessageResponseData,
  CheckSessionResponseData,
  validateIncomingMessage
} from '../utils/messageSchema';
import { KeyShareMessage, EncryptedChatMessage } from './types';

const pendingRequests = new Map<string, { resolve: (value: ExtensionMessage) => void; reject: (reason: Error) => void }>();
let messageListenerAdded = false;

function addMessageListener(): void {
  if (messageListenerAdded) return;
  messageListenerAdded = true;

  chrome.runtime.onMessage.addListener((message: unknown, _sender, _sendResponse) => {
    const validation = validateIncomingMessage(message);
    if (!validation.success) {
      console.warn('Invalid response message received:', validation.error);
      return false;
    }

    const typedMessage = validation.data;
    const requestId = typedMessage.requestId;
    if (!requestId) return true;

    const pending = pendingRequests.get(requestId);
    if (pending) {
      pending.resolve(typedMessage);
      pendingRequests.delete(requestId);
    }

    return false;
  });
}

function sendMessageAndWait(message: ExtensionMessage): Promise<ExtensionMessage> {
  return new Promise((resolve: (value: ExtensionMessage) => void, reject: (reason: Error) => void) => {
    const requestId = message.requestId || Date.now().toString(36) + Math.random().toString(36).substring(2);
    message.requestId = requestId;

    pendingRequests.set(requestId, { resolve, reject });

    chrome.runtime.sendMessage(message);

    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject(new Error('Timeout'));
      }
    }, 10000);
  });
}

function generateRequestId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

addMessageListener();

export class KeyExchangeHandler {
  constructor(private currentUserId: string, private storagePrefix: string) {
    this.keepAlive();
  }

  private async keepAlive() {
    sendMessageAndWait({
      type: "PING",
      data: undefined,
      requestId: generateRequestId()
    }).catch((reason) => {
      console.error("Ping failed:", reason)
      alert(reason);
    });
    setTimeout(() => this.keepAlive(), 20000);
  }

  async createOneTimeKey(_peerUserId: string, sendMessage: (text: string) => void): Promise<boolean> {
    try {
      const response = await sendMessageAndWait({
        type: 'CREATE_OTK',
        data: {},
        requestId: generateRequestId()
      });

      const responseData = response.data as CreateOtkResponseData;
      if (responseData?.success && responseData.otk && responseData.identityKey) {
        const keyShare: KeyShareMessage = {
          type: 'key_share',
          senderUserId: this.currentUserId,
          identityKey: responseData.identityKey,
          oneTimeKey: responseData.otk,
          timestamp: Date.now()
        };

        sendMessage(JSON.stringify(keyShare));
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  async preKeyFromOneTimeKey(keyShare: KeyShareMessage, senderId: string) {
    try {
      const response = await sendMessageAndWait({
        type: 'CREATE_SESSION_FROM_OTK',
        data: {
          peerUserId: this.storagePrefix + senderId,
          identityKey: keyShare.identityKey,
          otk: keyShare.oneTimeKey
        },
        requestId: generateRequestId()
      });

      const responseData = response.data as CreateSessionFromOtkResponseData;
      if (responseData?.success && responseData.preKeyMessage) {
        const identityKey = await this.getIdentityKey();
        if (!identityKey) return undefined;
        const preKeyMessage: EncryptedChatMessage = {
          type: 'olm',
          senderUserId: this.currentUserId,
          identityKey,
          cipher: responseData.preKeyMessage
        };

        return preKeyMessage;
      }
    } catch { }
  }

  async decryptPreKey(encryptedMessage: EncryptedChatMessage, messageId: string, senderId: string) {
    try {
      const { message_type, ciphertext } = encryptedMessage.cipher;

      const response = await sendMessageAndWait({
        type: 'CREATE_SESSION_FROM_PREKEY',
        data: {
          peerUserId: this.storagePrefix + senderId,
          identityKey: encryptedMessage.identityKey || '',
          messageId: this.storagePrefix + messageId,
          messageType: message_type,
          ciphertext: ciphertext
        },
        requestId: generateRequestId()
      });

      const responseData = response.data as CreateSessionFromPrekeyResponseData;
      return responseData?.plainText;
    } catch { }
  }

  async encryptMessage(peerUserId: string, plaintext: string) {
    try {
      const response = await sendMessageAndWait({
        type: 'ENCRYPT',
        data: {
          peerUserId: this.storagePrefix + peerUserId,
          message: plaintext
        },
        requestId: generateRequestId()
      });

      const responseData = response.data as EncryptResponseData;
      if (responseData?.success && responseData.encryptedMessage?.ciphertext && responseData.encryptedMessage.message_type) {
        const { message_type, ciphertext } = responseData.encryptedMessage;
        const encryptedMessage: EncryptedChatMessage = {
          type: 'olm',
          senderUserId: this.currentUserId,
          cipher: {
            message_type,
            ciphertext
          }
        };
        return encryptedMessage;
      }
    } catch { }
  }

  async decryptMessage(
    peerUserId: string,
    messageId: string,
    messageType: number,
    ciphertext: string,
    lastSendMessage: string | null,
  ) {
    try {
      const response = await sendMessageAndWait({
        type: 'DECRYPT',
        data: {
          peerUserId: this.storagePrefix + peerUserId,
          messageId: this.storagePrefix + messageId,
          messageType,
          ciphertext,
          lastSendMessage
        },
        requestId: generateRequestId()
      });

      const responseData = response.data as DecryptResponseData;
      if (responseData?.success && responseData.decryptedMessage) {
        return responseData.decryptedMessage;
      }
    } catch { }
  }

  async isMessageCached(messageId: string) {
    try {
      const response = await sendMessageAndWait({
        type: 'CHECK_MESSAGE',
        data: {
          messageId: this.storagePrefix + messageId
        },
        requestId: generateRequestId()
      });

      const responseData = response.data as CheckMessageResponseData;
      return !!responseData?.exists;
    } catch { }
    return false;
  }

  private cachedSessions: {
    [peerUserId: string]: {
      hasSession: boolean,
      lastUpdate: number,
      processing: boolean,
    }
  } = {};
  private cacheQueue: {
    [peerUserId: string]: {
      resolves: ((hasSession: boolean) => void)[]
    }
  } = {};

  async hasSession(peerUserId: string) {
    if (peerUserId == this.currentUserId) return true;
    if ((this.cachedSessions[peerUserId]?.lastUpdate + 3000) > Date.now()) {
      if (this.cachedSessions[peerUserId].processing) {
        return await new Promise((resolve) => {
          if (!this.cacheQueue[peerUserId]) this.cacheQueue[peerUserId] = { resolves: [] };
          this.cacheQueue[peerUserId].resolves.push(resolve);
        });
      } else return this.cachedSessions[peerUserId].hasSession;
    }

    try {
      this.cachedSessions[peerUserId] = {
        hasSession: false,
        lastUpdate: Date.now(),
        processing: true,
      }

      if (!this.cacheQueue[peerUserId]) this.cacheQueue[peerUserId] = { resolves: [] };

      const response = await sendMessageAndWait({
        type: 'CHECK_SESSION',
        data: {
          peerUserId: this.storagePrefix + peerUserId
        },
        requestId: generateRequestId()
      });

      const responseData = response.data as CheckSessionResponseData;
      const exists = !!responseData?.exists;

      this.cachedSessions[peerUserId] = {
        hasSession: exists,
        lastUpdate: Date.now(),
        processing: false,
      }

      this.cacheQueue[peerUserId].resolves.forEach(resolve => resolve(exists));
      this.cacheQueue[peerUserId].resolves = [];

      return exists;
    } catch { }
    return false;
  }

  async getIdentityKey() {
    try {
      const response = await sendMessageAndWait({
        type: 'GET_IDENTITY_KEY',
        data: {},
        requestId: generateRequestId()
      });

      const responseData = response.data as GetIdentityKeyResponseData;
      return responseData?.identityKey;
    } catch { }
  }
}
