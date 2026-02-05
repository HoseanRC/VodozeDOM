import { ExtensionMessage } from '../types';
import { KeyShareMessage, EncryptedChatMessage } from './types';

const pendingRequests = new Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void }>();
let messageListenerAdded = false;

function addMessageListener(): void {
  if (messageListenerAdded) return;
  messageListenerAdded = true;

  chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, _sendResponse) => {
    const requestId = message.requestId;
    if (!requestId) return true;

    const pending = pendingRequests.get(requestId);
    if (pending) {
      pending.resolve(message);
      pendingRequests.delete(requestId);
    }

    return false;
  });
}

function sendMessageAndWait(message: ExtensionMessage): Promise<any> {
  return new Promise((resolve, reject) => {
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
  constructor(private currentUserId: string) { }

  async initiateKeyExchange(_peerUserId: string, sendMessage: (text: string) => void): Promise<boolean> {
    try {
      const response: any = await sendMessageAndWait({
        type: 'BALE_CREATE_OTK',
        requestId: generateRequestId()
      });

      if (response?.data?.success) {
        const { otk, identityKey } = response.data;

        const keyShare: KeyShareMessage = {
          type: 'key_share',
          senderUserId: this.currentUserId,
          identityKey,
          oneTimeKey: otk,
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

  async handleKeyShare(keyShare: KeyShareMessage, senderId: string, sendMessage: (text: string) => void): Promise<boolean> {
    try {
      const response: ExtensionMessage = await sendMessageAndWait({
        type: 'BALE_CREATE_SESSION_FROM_OTK',
        data: {
          peerUserId: senderId,
          identityKey: keyShare.identityKey,
          otk: keyShare.oneTimeKey
        },
        requestId: generateRequestId()
      });

      if (response?.data?.success && response.data.preKeyMessage) {
        const identityKey = await this.getIdentityKey();
        if (!identityKey) return false;
        const preKeyMessage: EncryptedChatMessage = {
          type: 'olm',
          senderUserId: this.currentUserId,
          identityKey,
          cipher: response.data.preKeyMessage
        };

        sendMessage(JSON.stringify(preKeyMessage));
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  async handlePreKeyMessage(encryptedMessage: EncryptedChatMessage, senderId: string): Promise<boolean> {
    try {
      const { message_type, ciphertext } = encryptedMessage.cipher;

      const response: any = await sendMessageAndWait({
        type: 'BALE_CREATE_SESSION_FROM_PREKEY',
        data: {
          peerUserId: senderId,
          identityKey: encryptedMessage.identityKey,
          messageType: message_type,
          ciphertext: ciphertext
        },
        requestId: generateRequestId()
      });

      return response?.data?.success === true;
    } catch {
      return false;
    }
  }

  async encryptMessage(peerUserId: string, plaintext: string): Promise<string | null> {
    try {
      const response: any = await sendMessageAndWait({
        type: 'BALE_ENCRYPT',
        data: {
          peerUserId,
          message: plaintext
        },
        requestId: generateRequestId()
      });

      if (response?.data?.success && response.data.encryptedMessage) {
        const { message_type, ciphertext } = response.data.encryptedMessage;
        const encryptedMessage: EncryptedChatMessage = {
          type: 'olm',
          senderUserId: this.currentUserId,
          cipher: {
            message_type,
            ciphertext
          }
        };
        return JSON.stringify(encryptedMessage);
      }

      return null;
    } catch {
      return null;
    }
  }

  async decryptMessage(
    peerUserId: string,
    messageId: string,
    messageType: number,
    ciphertext: string
  ): Promise<string | null> {
    try {
      const response: any = await sendMessageAndWait({
        type: 'BALE_DECRYPT',
        data: {
          peerUserId,
          messageId,
          messageType,
          ciphertext
        },
        requestId: generateRequestId()
      });

      if (response?.data?.success && response.data.decryptedMessage) {
        return response.data.decryptedMessage;
      }

      return null;
    } catch {
      return null;
    }
  }

  async checkMessageExists(messageId: string): Promise<boolean> {
    try {
      const response: any = await sendMessageAndWait({
        type: 'BALE_CHECK_MESSAGE',
        data: { messageId },
        requestId: generateRequestId()
      });

      return response?.data?.exists === true;
    } catch {
      return false;
    }
  }

  private cachedSessions: {
    [peerUserId: string]: {
      hasSession: boolean,
      lastUpdate: number,
    }
  } = {};
  async hasSession(peerUserId: string): Promise<boolean> {
    console.debug(`hasSession: ${peerUserId} > ${this.currentUserId}`);
    if (peerUserId == this.currentUserId) return true;
    if ((this.cachedSessions[peerUserId]?.lastUpdate + 3000) > Date.now())
      return this.cachedSessions[peerUserId].hasSession;

    try {
      const response: any = await sendMessageAndWait({
        type: 'BALE_CHECK_SESSION',
        data: { peerUserId },
        requestId: generateRequestId()
      });

      this.cachedSessions[peerUserId] = {
        hasSession: response?.data?.exists === true,
        lastUpdate: Date.now(),
      }

      return response?.data?.exists === true;
    } catch {
      return false;
    }
  }

  async getIdentityKey(): Promise<string | null> {
    try {
      const response: any = await sendMessageAndWait({
        type: 'BALE_GET_IDENTITY_KEY',
        requestId: generateRequestId()
      });

      return response?.data?.identityKey || null;
    } catch {
      return null;
    }
  }
}
