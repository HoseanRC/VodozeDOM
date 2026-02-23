import { CryptoSession, CryptoState, StoredMessage } from '../types';

class StorageService {
  private dbName = 'VodozeDOMDB';
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

        // CryptoStore
        if (!db.objectStoreNames.contains('CryptoStore')) {
          db.createObjectStore('CryptoStore', { keyPath: 'userId' });
        }

        // Store for per user sessions
        if (!db.objectStoreNames.contains('CryptoSessions')) {
          db.createObjectStore('CryptoSessions', { keyPath: 'peerUserId' });
        }

        // Store for encrypted messages
        if (!db.objectStoreNames.contains('StoredMessages')) {
          db.createObjectStore('StoredMessages', { keyPath: 'id' });
        }
      };
    });
  }

  async storeCrypto(state: CryptoState): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['CryptoStore'], 'readwrite');
      const store = transaction.objectStore('CryptoStore');
      const request = store.put(state);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getCrypto(userId: string): Promise<CryptoState | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['CryptoStore'], 'readonly');
      const store = transaction.objectStore('CryptoStore');
      const request = store.get(userId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async storeSession(session: CryptoSession): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['CryptoSessions'], 'readwrite');
      const store = transaction.objectStore('CryptoSessions');
      const request = store.put(session);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSession(peerUserId: string): Promise<CryptoSession | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['CryptoSessions'], 'readonly');
      const store = transaction.objectStore('CryptoSessions');
      const request = store.get(peerUserId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async storeMessage(message: StoredMessage): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['StoredMessages'], 'readwrite');
      const store = transaction.objectStore('StoredMessages');
      const request = store.put(message);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getMessage(id: string): Promise<StoredMessage | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['StoredMessages'], 'readonly');
      const store = transaction.objectStore('StoredMessages');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }
}

export const storageService = new StorageService();