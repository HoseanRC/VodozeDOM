import { z } from 'zod';

export const MessageType = {
  CREATE_OTK: 'CREATE_OTK',
  CREATE_OTK_RESPONSE: 'CREATE_OTK_RESPONSE',
  CREATE_SESSION_FROM_OTK: 'CREATE_SESSION_FROM_OTK',
  CREATE_SESSION_FROM_OTK_RESPONSE: 'CREATE_SESSION_FROM_OTK_RESPONSE',
  CREATE_SESSION_FROM_PREKEY: 'CREATE_SESSION_FROM_PREKEY',
  CREATE_SESSION_FROM_PREKEY_RESPONSE: 'CREATE_SESSION_FROM_PREKEY_RESPONSE',
  ENCRYPT: 'ENCRYPT',
  ENCRYPT_RESPONSE: 'ENCRYPT_RESPONSE',
  DECRYPT: 'DECRYPT',
  DECRYPT_RESPONSE: 'DECRYPT_RESPONSE',
  GET_IDENTITY_KEY: 'GET_IDENTITY_KEY',
  GET_IDENTITY_KEY_RESPONSE: 'GET_IDENTITY_KEY_RESPONSE',
  CHECK_MESSAGE: 'CHECK_MESSAGE',
  CHECK_MESSAGE_RESPONSE: 'CHECK_MESSAGE_RESPONSE',
  CHECK_SESSION: 'CHECK_SESSION',
  CHECK_SESSION_RESPONSE: 'CHECK_SESSION_RESPONSE'
} as const;

export type MessageType = typeof MessageType[keyof typeof MessageType];

export const CreateOtkDataSchema = z.object({
  peerUserId: z.string().optional(),
  identityKey: z.string().optional(),
  otk: z.string().optional()
});
export type CreateOtkData = z.infer<typeof CreateOtkDataSchema>;

export const CreateOtkResponseDataSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  otk: z.string().optional(),
  identityKey: z.string().optional()
});
export type CreateOtkResponseData = z.infer<typeof CreateOtkResponseDataSchema>;

export const CreateSessionFromOtkDataSchema = z.object({
  peerUserId: z.string(),
  identityKey: z.string(),
  otk: z.string()
});
export type CreateSessionFromOtkData = z.infer<typeof CreateSessionFromOtkDataSchema>;

export const CreateSessionFromOtkResponseDataSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  preKeyMessage: z.object({ message_type: z.number(), ciphertext: z.string() }).optional()
});
export type CreateSessionFromOtkResponseData = z.infer<typeof CreateSessionFromOtkResponseDataSchema>;

export const CreateSessionFromPrekeyDataSchema = z.object({
  peerUserId: z.string(),
  identityKey: z.string(),
  messageId: z.string(),
  messageType: z.number(),
  ciphertext: z.string()
});
export type CreateSessionFromPrekeyData = z.infer<typeof CreateSessionFromPrekeyDataSchema>;

export const CreateSessionFromPrekeyResponseDataSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  plainText: z.string().optional()
});
export type CreateSessionFromPrekeyResponseData = z.infer<typeof CreateSessionFromPrekeyResponseDataSchema>;

export const EncryptDataSchema = z.object({
  peerUserId: z.string(),
  message: z.string()
});
export type EncryptData = z.infer<typeof EncryptDataSchema>;

export const EncryptResponseDataSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  encryptedMessage: z.object({
    ciphertext: z.string().optional(),
    message_type: z.number().optional()
  }).optional()
});
export type EncryptResponseData = z.infer<typeof EncryptResponseDataSchema>;

export const DecryptDataSchema = z.object({
  peerUserId: z.string(),
  messageId: z.string(),
  messageType: z.number(),
  ciphertext: z.string(),
  lastSendMessage: z.string().nullable().optional()
});
export type DecryptData = z.infer<typeof DecryptDataSchema>;

export const DecryptResponseDataSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  decryptedMessage: z.string().optional()
});
export type DecryptResponseData = z.infer<typeof DecryptResponseDataSchema>;

export const GetIdentityKeyDataSchema = z.object({});
export type GetIdentityKeyData = z.infer<typeof GetIdentityKeyDataSchema>;

export const GetIdentityKeyResponseDataSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  identityKey: z.string().optional()
});
export type GetIdentityKeyResponseData = z.infer<typeof GetIdentityKeyResponseDataSchema>;

export const CheckMessageDataSchema = z.object({
  messageId: z.string()
});
export type CheckMessageData = z.infer<typeof CheckMessageDataSchema>;

export const CheckMessageResponseDataSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  exists: z.boolean().optional()
});
export type CheckMessageResponseData = z.infer<typeof CheckMessageResponseDataSchema>;

export const CheckSessionDataSchema = z.object({
  peerUserId: z.string()
});
export type CheckSessionData = z.infer<typeof CheckSessionDataSchema>;

export const CheckSessionResponseDataSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  exists: z.boolean().optional()
});
export type CheckSessionResponseData = z.infer<typeof CheckSessionResponseDataSchema>;

export type ExtensionMessage =
  | { type: 'PING'; data: undefined; requestId?: string }
  | { type: 'CREATE_OTK'; data: CreateOtkData; requestId?: string }
  | { type: 'CREATE_OTK_RESPONSE'; data: CreateOtkResponseData; requestId?: string }
  | { type: 'CREATE_SESSION_FROM_OTK'; data: CreateSessionFromOtkData; requestId?: string }
  | { type: 'CREATE_SESSION_FROM_OTK_RESPONSE'; data: CreateSessionFromOtkResponseData; requestId?: string }
  | { type: 'CREATE_SESSION_FROM_PREKEY'; data: CreateSessionFromPrekeyData; requestId?: string }
  | { type: 'CREATE_SESSION_FROM_PREKEY_RESPONSE'; data: CreateSessionFromPrekeyResponseData; requestId?: string }
  | { type: 'ENCRYPT'; data: EncryptData; requestId?: string }
  | { type: 'ENCRYPT_RESPONSE'; data: EncryptResponseData; requestId?: string }
  | { type: 'DECRYPT'; data: DecryptData; requestId?: string }
  | { type: 'DECRYPT_RESPONSE'; data: DecryptResponseData; requestId?: string }
  | { type: 'GET_IDENTITY_KEY'; data: GetIdentityKeyData; requestId?: string }
  | { type: 'GET_IDENTITY_KEY_RESPONSE'; data: GetIdentityKeyResponseData; requestId?: string }
  | { type: 'CHECK_MESSAGE'; data: CheckMessageData; requestId?: string }
  | { type: 'CHECK_MESSAGE_RESPONSE'; data: CheckMessageResponseData; requestId?: string }
  | { type: 'CHECK_SESSION'; data: CheckSessionData; requestId?: string }
  | { type: 'CHECK_SESSION_RESPONSE'; data: CheckSessionResponseData; requestId?: string };

const createPingSchema = z.object({
  type: z.literal('PING'),
  data: z.undefined(),
  requestId: z.string().optional()
});

const createOtkSchema = z.object({
  type: z.literal('CREATE_OTK'),
  data: CreateOtkDataSchema,
  requestId: z.string().optional()
});

const createOtkResponseSchema = z.object({
  type: z.literal('CREATE_OTK_RESPONSE'),
  data: CreateOtkResponseDataSchema,
  requestId: z.string().optional()
});

const createSessionFromOtkSchema = z.object({
  type: z.literal('CREATE_SESSION_FROM_OTK'),
  data: CreateSessionFromOtkDataSchema,
  requestId: z.string().optional()
});

const createSessionFromOtkResponseSchema = z.object({
  type: z.literal('CREATE_SESSION_FROM_OTK_RESPONSE'),
  data: CreateSessionFromOtkResponseDataSchema,
  requestId: z.string().optional()
});

const createSessionFromPrekeySchema = z.object({
  type: z.literal('CREATE_SESSION_FROM_PREKEY'),
  data: CreateSessionFromPrekeyDataSchema,
  requestId: z.string().optional()
});

const createSessionFromPrekeyResponseSchema = z.object({
  type: z.literal('CREATE_SESSION_FROM_PREKEY_RESPONSE'),
  data: CreateSessionFromPrekeyResponseDataSchema,
  requestId: z.string().optional()
});

const encryptSchema = z.object({
  type: z.literal('ENCRYPT'),
  data: EncryptDataSchema,
  requestId: z.string().optional()
});

const encryptResponseSchema = z.object({
  type: z.literal('ENCRYPT_RESPONSE'),
  data: EncryptResponseDataSchema,
  requestId: z.string().optional()
});

const decryptSchema = z.object({
  type: z.literal('DECRYPT'),
  data: DecryptDataSchema,
  requestId: z.string().optional()
});

const decryptResponseSchema = z.object({
  type: z.literal('DECRYPT_RESPONSE'),
  data: DecryptResponseDataSchema,
  requestId: z.string().optional()
});

const getIdentityKeySchema = z.object({
  type: z.literal('GET_IDENTITY_KEY'),
  data: GetIdentityKeyDataSchema,
  requestId: z.string().optional()
});

const getIdentityKeyResponseSchema = z.object({
  type: z.literal('GET_IDENTITY_KEY_RESPONSE'),
  data: GetIdentityKeyResponseDataSchema,
  requestId: z.string().optional()
});

const checkMessageSchema = z.object({
  type: z.literal('CHECK_MESSAGE'),
  data: CheckMessageDataSchema,
  requestId: z.string().optional()
});

const checkMessageResponseSchema = z.object({
  type: z.literal('CHECK_MESSAGE_RESPONSE'),
  data: CheckMessageResponseDataSchema,
  requestId: z.string().optional()
});

const checkSessionSchema = z.object({
  type: z.literal('CHECK_SESSION'),
  data: CheckSessionDataSchema,
  requestId: z.string().optional()
});

const checkSessionResponseSchema = z.object({
  type: z.literal('CHECK_SESSION_RESPONSE'),
  data: CheckSessionResponseDataSchema,
  requestId: z.string().optional()
});

export const incomingMessageSchema = z.union([
  createPingSchema,
  createOtkSchema,
  createOtkResponseSchema,
  createSessionFromOtkSchema,
  createSessionFromOtkResponseSchema,
  createSessionFromPrekeySchema,
  createSessionFromPrekeyResponseSchema,
  encryptSchema,
  encryptResponseSchema,
  decryptSchema,
  decryptResponseSchema,
  getIdentityKeySchema,
  getIdentityKeyResponseSchema,
  checkMessageSchema,
  checkMessageResponseSchema,
  checkSessionSchema,
  checkSessionResponseSchema
]);

export function validateIncomingMessage(message: unknown): { success: true; data: ExtensionMessage } | { success: false; error: string } {
  const result = incomingMessageSchema.safeParse(message);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.message };
}
