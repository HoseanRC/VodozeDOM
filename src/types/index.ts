export interface EncryptionKeyPair {
  deviceId: string;
  userId: string;
  publicKey: string;
  privateKey: string;
}

export interface StoredMessage {
  id: string;
  encryptedContent: string;
  timestamp: number;
  senderId: string;
  recipientId: string;
}

export interface EncryptionState {
  keyPair: EncryptionKeyPair;
  outboundGroupSessions: Map<string, any>;
  inboundGroupSessions: Map<string, any>;
}

export interface ExtensionMessage {
  type: 'ENCRYPT' | 'DECRYPT' | 'GENERATE_KEYS' | 'GET_KEYS' | 'ENCRYPT_RESULT' | 'DECRYPT_RESULT' | 'KEYS_RESULT';
  data?: any;
  requestId?: string;
}