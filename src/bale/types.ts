export type EncryptionState = 'on' | 'off' | 'init';

export interface ChatEncryptionState {
  chatId: string;
  state: EncryptionState;
}

export interface KeyShareMessage {
  type: 'key_share';
  senderUserId: string;
  identityKey: string;
  oneTimeKey: string;
  timestamp: number;
}

export interface EncryptedChatMessage {
  type: 'olm';
  senderUserId: string;
  identityKey?: string;
  cipher: {
    message_type: number;
    ciphertext: string;
  };
}

export interface PreKeyMessage {
  type: number;
  body: string;
}
