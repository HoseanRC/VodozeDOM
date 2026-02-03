import { EncryptionKeyPair, EncryptionState } from '../types';
import { storageService } from './storage';

class EncryptionService {
  private initialized = false;
  private vodozemac: any = null;

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Import vodozemac-wasm-bindings
      const vodozemac = await import('vodozemac-wasm-bindings');
      this.vodozemac = vodozemac;
      await storageService.init();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize encryption service:', error);
      throw error;
    }
  }

  async generateKeyPair(userId: string, deviceId: string): Promise<EncryptionKeyPair> {
    if (!this.initialized) await this.init();

    try {
      // Generate account using vodozemac
      const account = new this.vodozemac.Account();
      const deviceKeys = account.device_keys();
      
      const keyPair: EncryptionKeyPair = {
        userId,
        deviceId,
        publicKey: JSON.stringify(deviceKeys),
        privateKey: JSON.stringify(account.pickle())
      };

      // Store the key pair and account
      await storageService.storeKeyPair(userId, keyPair);
      
      const encryptionState: EncryptionState = {
        keyPair,
        outboundGroupSessions: new Map(),
        inboundGroupSessions: new Map()
      };
      
      await storageService.storeEncryptionState(userId, encryptionState);
      
      return keyPair;
    } catch (error) {
      console.error('Failed to generate key pair:', error);
      throw error;
    }
  }

  async getKeyPair(userId: string): Promise<EncryptionKeyPair | null> {
    if (!this.initialized) await this.init();
    return await storageService.getKeyPair(userId);
  }

  async encryptMessage(userId: string, recipientPublicKey: string, message: string): Promise<string> {
    if (!this.initialized) await this.init();

    try {
      // Get the current encryption state
      const state = await storageService.getEncryptionState(userId);
      if (!state) {
        throw new Error('No encryption state found for user');
      }

      // Restore account from stored pickle
      const accountData = JSON.parse(state.keyPair.privateKey);
      const account = this.vodozemac.Account.from_pickle(accountData);

      // Create olm session for encryption
      const recipientKeys = JSON.parse(recipientPublicKey);
      const session = account.create_outbound_session(recipientKeys);
      
      // Encrypt the message
      const encryptedMessage = session.encrypt(message);
      
      // Update the account state
      const updatedEncryptionState: EncryptionState = {
        ...state,
        keyPair: {
          ...state.keyPair,
          privateKey: JSON.stringify(account.pickle())
        }
      };
      
      await storageService.storeEncryptionState(userId, updatedEncryptionState);

      return JSON.stringify(encryptedMessage);
    } catch (error) {
      console.error('Failed to encrypt message:', error);
      throw error;
    }
  }

  async decryptMessage(userId: string, senderPublicKey: string, encryptedMessage: string): Promise<string> {
    if (!this.initialized) await this.init();

    try {
      // Get the current encryption state
      const state = await storageService.getEncryptionState(userId);
      if (!state) {
        throw new Error('No encryption state found for user');
      }

      // Restore account from stored pickle
      const accountData = JSON.parse(state.keyPair.privateKey);
      const account = this.vodozemac.Account.from_pickle(accountData);

      // Parse the encrypted message
      const encryptedData = JSON.parse(encryptedMessage);
      
      // Create inbound session for decryption
      const senderKeys = JSON.parse(senderPublicKey);
      const session = account.create_inbound_session(senderKeys, encryptedData);
      
      // Decrypt the message
      const decryptedMessage = session.decrypt(encryptedData);
      
      // Update the account state
      const updatedEncryptionState: EncryptionState = {
        ...state,
        keyPair: {
          ...state.keyPair,
          privateKey: JSON.stringify(account.pickle())
        }
      };
      
      await storageService.storeEncryptionState(userId, updatedEncryptionState);

      return decryptedMessage;
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      throw error;
    }
  }

  // Exposed functions for later implementation
  async createGroupSession(userId: string, roomId: string): Promise<string> {
    if (!this.initialized) await this.init();
    
    // This will be implemented later for group chat encryption
    console.log('createGroupSession called for userId:', userId, 'roomId:', roomId);
    return 'group-session-placeholder';
  }

  async encryptForGroup(userId: string, roomId: string, _message: string): Promise<string> {
    if (!this.initialized) await this.init();
    
    // This will be implemented later for group chat encryption
    console.log('encryptForGroup called for userId:', userId, 'roomId:', roomId);
    return 'encrypted-group-message-placeholder';
  }

  async decryptFromGroup(userId: string, roomId: string, _encryptedMessage: string): Promise<string> {
    if (!this.initialized) await this.init();
    
    // This will be implemented later for group chat encryption
    console.log('decryptFromGroup called for userId:', userId, 'roomId:', roomId);
    return 'decrypted-group-message-placeholder';
  }

  async getPublicKey(userId: string): Promise<string | null> {
    const keyPair = await this.getKeyPair(userId);
    return keyPair ? keyPair.publicKey : null;
  }

  async hasKeys(userId: string): Promise<boolean> {
    const keyPair = await this.getKeyPair(userId);
    return keyPair !== null;
  }
}

export const encryptionService = new EncryptionService();