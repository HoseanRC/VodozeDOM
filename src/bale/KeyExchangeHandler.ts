import { ExtensionMessage } from '../types';
import { KeyShareMessage, EncryptedChatMessage } from './types';

export class KeyExchangeHandler {
  private onKeyExchangeComplete: ((success: boolean) => void) | null = null;

  constructor(private currentUserId: string) {}

  async initiateKeyExchange(_peerUserId: string, sendMessage: (text: string) => void): Promise<boolean> {
    return new Promise((resolve) => {
      this.onKeyExchangeComplete = resolve;

      const message: ExtensionMessage = {
        type: 'BALE_CREATE_OTK',
        requestId: this.generateRequestId()
      };

      chrome.runtime.sendMessage(message, (response) => {
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
        } else {
          this.onKeyExchangeComplete?.(false);
        }
      });
    });
  }

  async handleKeyShare(keyShare: KeyShareMessage, senderId: string, sendMessage: (text: string) => void): Promise<boolean> {
    return new Promise((resolve) => {
      const message: ExtensionMessage = {
        type: 'BALE_CREATE_SESSION_FROM_OTK',
        data: {
          peerUserId: senderId,
          identityKey: keyShare.identityKey,
          otk: keyShare.oneTimeKey
        },
        requestId: this.generateRequestId()
      };

      chrome.runtime.sendMessage(message, (response) => {
        if (response?.data?.success && response.data.preKeyMessage) {
          const preKeyMessage: EncryptedChatMessage = {
            type: 'olm',
            senderUserId: this.currentUserId,
            ciphertext: response.data.preKeyMessage
          };

          sendMessage(JSON.stringify(preKeyMessage));
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  async handlePreKeyMessage(
    encryptedMessage: EncryptedChatMessage,
    senderId: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const { type, body } = encryptedMessage.ciphertext;

      const message: ExtensionMessage = {
        type: 'BALE_CREATE_SESSION_FROM_PREKEY',
        data: {
          peerUserId: senderId,
          identityKey: encryptedMessage.senderUserId,
          messageType: type,
          ciphertext: body
        },
        requestId: this.generateRequestId()
      };

      chrome.runtime.sendMessage(message, (response) => {
        const success = response?.data?.success === true;
        this.onKeyExchangeComplete?.(success);
        resolve(success);
      });
    });
  }

  async encryptMessage(peerUserId: string, plaintext: string): Promise<string | null> {
    return new Promise((resolve) => {
      const message: ExtensionMessage = {
        type: 'BALE_ENCRYPT',
        data: {
          peerUserId,
          message: plaintext
        },
        requestId: this.generateRequestId()
      };

      chrome.runtime.sendMessage(message, (response) => {
        if (response?.data?.success && response.data.encryptedMessage) {
          const encryptedMessage: EncryptedChatMessage = {
            type: 'olm',
            senderUserId: this.currentUserId,
            ciphertext: response.data.encryptedMessage
          };
          resolve(JSON.stringify(encryptedMessage));
        } else {
          resolve(null);
        }
      });
    });
  }

  async decryptMessage(
    peerUserId: string,
    messageId: string,
    messageType: number,
    ciphertext: string
  ): Promise<string | null> {
    return new Promise((resolve) => {
      const message: ExtensionMessage = {
        type: 'BALE_DECRYPT',
        data: {
          peerUserId,
          messageId,
          messageType,
          ciphertext
        },
        requestId: this.generateRequestId()
      };

      chrome.runtime.sendMessage(message, (response) => {
        if (response?.data?.success && response.data.decryptedMessage) {
          resolve(response.data.decryptedMessage);
        } else {
          resolve(null);
        }
      });
    });
  }

  async checkMessageExists(messageId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const message: ExtensionMessage = {
        type: 'BALE_CHECK_MESSAGE',
        data: {
          messageId
        },
        requestId: this.generateRequestId()
      };

      chrome.runtime.sendMessage(message, (response) => {
        resolve(response?.data?.exists === true);
      });
    });
  }

  async getIdentityKey(): Promise<string | null> {
    return new Promise((resolve) => {
      const message: ExtensionMessage = {
        type: 'BALE_GET_IDENTITY_KEY',
        requestId: this.generateRequestId()
      };

      chrome.runtime.sendMessage(message, (response) => {
        resolve(response?.data?.identityKey || null);
      });
    });
  }

  private generateRequestId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
