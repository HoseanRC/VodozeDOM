export interface CryptoState {
  userId: string;           // the crypto user id
  pickleKey: string;        // local secret
  accountPickle: string;    // vodozemac Account pickle
  identityKey: string;      // curve25519 public key
  lastUpdated: number;
}

export interface CryptoSession {
  peerUserId: string;
  sessionPickle: string;
}

export interface StoredMessage {
  id: string;
  plaintext: string;
  senderUserId: string;
  timestamp: number;
}

export interface KeyShare {
  type: 'key_response';
  forUserId: string;
  identityKey: string;
  oneTimeKey: string;
  timestamp: number;
}

export interface EncryptedPayload {
  type: 'olm';
  senderUserId: string;
  ciphertext: any; // vodozemac message
}

export interface ExtensionMessage {
  type: 'ENCRYPT' | 'DECRYPT' | 'GENERATE_KEYS' | 'GET_KEYS' | 'ENCRYPT_RESULT' | 'DECRYPT_RESULT' | 'KEYS_RESULT' | 'BALE_CREATE_OTK' | 'BALE_CREATE_SESSION_FROM_OTK' | 'BALE_CREATE_SESSION_FROM_PREKEY' | 'BALE_ENCRYPT' | 'BALE_DECRYPT' | 'BALE_GET_IDENTITY_KEY' | 'BALE_STORE_MESSAGE' | 'BALE_CHECK_MESSAGE';
  data?: any;
  requestId?: string;
}