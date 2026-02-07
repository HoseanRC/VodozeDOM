import { storageService } from './storage';
import * as vodozemac from '../vodozemac';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function stringToUint8Array(str: string): Uint8Array {
  return encoder.encode(str); // UTF-8
}

export function uInt8ArrayToString(arr: Uint8Array): string {
  return decoder.decode(arr); // UTF-8
}


export class EncryptionService {
  static preKeyInitialMessage = "🔑 Encryption works!";
  private initialized = false;
  private account: vodozemac.Account | undefined;
  private id: string;
  public identityKey: string | undefined;
  private pickleKey: Uint8Array | undefined;

  constructor(identifier: string) {
    this.id = identifier;
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Import vodozemac-wasm-bindings
      await storageService.init();
      this.initialized = true;
      this.setupAccount();
    } catch (error) {
      console.error('Failed to initialize encryption service:', error);
      throw error;
    }
  }

  private async rePickleAccount() {
    const accountCrypto = await storageService.getCrypto(this.id);
    if (accountCrypto && this.account && this.pickleKey) {
      await storageService.storeCrypto({
        userId: accountCrypto.userId,
        accountPickle: this.account.pickle(this.pickleKey),
        pickleKey: accountCrypto.pickleKey,
        identityKey: accountCrypto.identityKey,
        lastUpdated: Date.now(),
      })
    }
  }

  private async rePickleSession(peerUserId: string, session: vodozemac.Session) {
    if (this.pickleKey) {
      await storageService.storeSession({
        peerUserId: peerUserId,
        sessionPickle: session.pickle(this.pickleKey),
      })
    }
  }

  private async setupAccount() {
    const accountCrypto = await storageService.getCrypto(this.id);
    if (accountCrypto) {
      const pickleKeyBinary = atob(accountCrypto.pickleKey);
      this.pickleKey = new Uint8Array(pickleKeyBinary.length);
      for (let i = 0; i < pickleKeyBinary.length; i++) {
        this.pickleKey[i] = pickleKeyBinary.charCodeAt(i);
      }
      this.account = vodozemac.Account.from_pickle(accountCrypto.accountPickle, this.pickleKey);
    } else {
      this.account = new vodozemac.Account();
      this.pickleKey = crypto.getRandomValues(new Uint8Array(32));
      await storageService.storeCrypto({
        userId: this.id,
        accountPickle: this.account.pickle(this.pickleKey),
        pickleKey: btoa(String.fromCharCode(...this.pickleKey)),
        identityKey: this.account.curve25519_key,
        lastUpdated: Date.now()
      })
    }

    this.identityKey = this.account.curve25519_key;
  }


  /**
   * creates an OTK (one time key) ready to be published
   * @returns OTK `string` or `undefined` if account is not initialized
   */
  async createOTK() {
    if (!this.account) return;
    this.account.generate_one_time_keys(1);
    this.rePickleAccount();
    const otk = Array.from((this.account.one_time_keys as Map<number, string>).values())[0];
    this.account.mark_keys_as_published();
    return otk;
  }

  /**
    * creates a session from OTK (one time key)
    * @param peerUserId id of the user that the OTK was gotten from
    * @param identityKey identityKey of the peer user
    * @param otk the one time key
    * @returns first encrypted message sent to establish full connection
    */
  async createSessionFromOTK(peerUserId: string, identityKey: string, otk: string): Promise<{
    ciphertext: string,
    message_type: number,
  } | undefined> {
    if (!this.account) return;
    const session = this.account.create_outbound_session(identityKey, otk);
    const preKeyMessage = session.encrypt(stringToUint8Array(EncryptionService.preKeyInitialMessage));
    this.rePickleSession(peerUserId, session);
    this.rePickleAccount();
    return { ciphertext: preKeyMessage.ciphertext, message_type: preKeyMessage.message_type };
  }

  /**
   * creates a session from prekey (or the first message gotten from a user)
   * @param peerUserId id of the user that the message was gotten from
   * @param identityKey identityKey of the peer user
   * @param messageType type of the message (placed inside the message itself)
   * @param ciphertext ciphertext part of the message
   * @returns `string` sent as the prekey message
   */
  async createSessionFromPreKey(peerUserId: string, identityKey: string, messageId: string, messageType: number, ciphertext: string) {
    if (!this.account) return;
    const storedMessage = await storageService.getMessage(messageId);
    if (storedMessage) {
      return storedMessage.plaintext;
    }
    const preKeyMessage = this.account.create_inbound_session(identityKey, messageType, ciphertext);
    const plaintext = uInt8ArrayToString(preKeyMessage.plaintext);
    this.rePickleSession(peerUserId, preKeyMessage.session);
    this.rePickleAccount();
    storageService.storeMessage({
      id: messageId,
      plaintext,
      senderUserId: peerUserId,
      timestamp: Date.now()
    });
    return plaintext;
  }

  /**
   * Encrypt a message to be sent to a user
   * @param peerUserId id of the user to be sent to
   * @param message the message
   * @returns an `object` containing `ciphertext` and `messageType`
   */
  async encryptMessage(peerUserId: string, message: string) {
    if (!this.initialized) await this.init();

    try {
      const storedSession = await storageService.getSession(peerUserId);
      if (!storedSession || !this.pickleKey) {
        console.error('Failed to encrypt message: session/account not found');
        return;
      }
      const session = vodozemac.Session.from_pickle(storedSession.sessionPickle, this.pickleKey);
      const encryptedMessage = session.encrypt(stringToUint8Array(message));
      this.rePickleSession(peerUserId, session);
      return encryptedMessage;
    } catch (error) {
      console.error('Failed to encrypt message:', error);
      throw error;
    }
  }

  /**
   * Decrypt a message sent by a user
   * @param peerUserId id of the user that sent the message
   * @param messageType type of the message
   * @param ciphertext the encrypted message
   * @returns the decrypted text in form of `string`
   */
  async decryptMessage(peerUserId: string, messageId: string, messageType: number, ciphertext: string) {
    if (!this.initialized) await this.init();

    try {
      const storedMessage = await storageService.getMessage(messageId);
      if (storedMessage) {
        return storedMessage.plaintext;
      }
      const storedSession = await storageService.getSession(peerUserId);
      if (!storedSession || !this.pickleKey) {
        console.error('Failed to encrypt message: session/account not found');
        return;
      }
      const session = vodozemac.Session.from_pickle(storedSession.sessionPickle, this.pickleKey);
      const decryptedMessage = uInt8ArrayToString(session.decrypt(messageType, ciphertext));
      storageService.storeMessage({
        id: messageId,
        plaintext: decryptedMessage,
        senderUserId: peerUserId,
        timestamp: Date.now()
      });
      this.rePickleSession(peerUserId, session);
      return decryptedMessage;
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      throw error;
    }
  }

  async storeMessage(messageId: string, text: string, senderUserId: string) {
    storageService.storeMessage({
      id: messageId,
      plaintext: text,
      senderUserId,
      timestamp: Date.now(),
    })
  }

  async checkMessage(messageId: string) {
    const message = await storageService.getMessage(messageId);
    return !!message;
  }

  async hasSession(peerUserId: string) {
    const session = await storageService.getSession(peerUserId);
    return !!session;
  }
  // TODO: implement MEGOLM for groups
}
