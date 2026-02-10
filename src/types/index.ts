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
  type: 'KEYS_RESULT'
  | 'CREATE_OTK'
  | 'CREATE_SESSION_FROM_OTK'
  | 'CREATE_SESSION_FROM_PREKEY'
  | 'ENCRYPT'
  | 'DECRYPT'
  | 'GET_IDENTITY_KEY'
  | 'STORE_MESSAGE'
  | 'CHECK_MESSAGE'
  | 'CHECK_SESSION';
  data?: any;
  requestId?: string;
}