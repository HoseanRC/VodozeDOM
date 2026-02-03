import { EncryptionKeyPair, EncryptionState, StoredMessage } from '../types';

class StorageService {
  private dbName = 'MatrixifyDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store for encryption key pairs
        if (!db.objectStoreNames.contains('keyPairs')) {
          db.createObjectStore('keyPairs', { keyPath: 'userId' });
        }
        
        // Store for encryption states
        if (!db.objectStoreNames.contains('encryptionStates')) {
          db.createObjectStore('encryptionStates', { keyPath: 'userId' });
        }
        
        // Store for encrypted messages
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('timestamp', 'timestamp', { unique: false });
          messageStore.createIndex('senderId', 'senderId', { unique: false });
          messageStore.createIndex('recipientId', 'recipientId', { unique: false });
        }
      };
    });
  }

  async storeKeyPair(userId: string, keyPair: EncryptionKeyPair): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['keyPairs'], 'readwrite');
      const store = transaction.objectStore('keyPairs');
      const request = store.put({ ...keyPair, userId });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getKeyPair(userId: string): Promise<EncryptionKeyPair | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['keyPairs'], 'readonly');
      const store = transaction.objectStore('keyPairs');
      const request = store.get(userId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async storeEncryptionState(userId: string, state: EncryptionState): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['encryptionStates'], 'readwrite');
      const store = transaction.objectStore('encryptionStates');
      const request = store.put({ ...state, userId });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getEncryptionState(userId: string): Promise<EncryptionState | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['encryptionStates'], 'readonly');
      const store = transaction.objectStore('encryptionStates');
      const request = store.get(userId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async storeMessage(message: StoredMessage): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const request = store.put(message);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getMessage(messageId: string): Promise<StoredMessage | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const request = store.get(messageId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getMessagesByUser(userId: string): Promise<StoredMessage[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const index = store.index('recipientId');
      const request = index.getAll(userId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }
}

export const storageService = new StorageService();