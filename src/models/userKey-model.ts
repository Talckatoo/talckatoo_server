import {
  SignedPublicPreKeyType,
  PreKeyType,
} from "@privacyresearch/libsignal-protocol-typescript";

import { Schema, model } from "mongoose";

const arrayBufferToBuffer = (ab: ArrayBuffer): Buffer => {
  return Buffer.from(ab);
};

const bufferToArrayBuffer = (buffer: Buffer): ArrayBuffer => {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
};

export interface IUserKey {
  userId: String;
  registrationId: number;
  identityKeyPair: ArrayBuffer;
  oneTimePreKeys: PreKeyType[];
  signedPreKey: SignedPublicPreKeyType;
}
const preKeySchema = new Schema<PreKeyType>({
  keyId: { type: Number, required: true },
  publicKey: {
    type: Buffer,
    required: true,
    set: (ab: ArrayBuffer) => arrayBufferToBuffer(ab),
    get: (buffer: Buffer) => bufferToArrayBuffer(buffer),
  },
});

const signedPreKeySchema = new Schema<SignedPublicPreKeyType>({
  keyId: { type: Number, required: true },
  publicKey: {
    type: Buffer,
    required: true,
    set: (ab: ArrayBuffer) => arrayBufferToBuffer(ab),
    get: (buffer: Buffer) => bufferToArrayBuffer(buffer),
  },
  signature: {
    type: Buffer,
    required: true,
    set: (ab: ArrayBuffer) => arrayBufferToBuffer(ab),
    get: (buffer: Buffer) => bufferToArrayBuffer(buffer),
  },
});

const userKeySchema = new Schema<IUserKey>({
  userId: {
    type: String,
    ref: "User",
    required: true,
    unique: true,
  },
  registrationId: { type: Number, required: true },
  identityKeyPair: {
    type: Buffer,
    required: true,
    set: (ab: ArrayBuffer) => arrayBufferToBuffer(ab),
    get: (buffer: Buffer) => bufferToArrayBuffer(buffer),
  },
  oneTimePreKeys: { type: [preKeySchema], required: true },
  signedPreKey: { type: signedPreKeySchema, required: true },
});

// export interface IUserKey {
//   userId: String;
//   registrationId: number;
//   identityKeyPair: ArrayBuffer;
//   preKey: {
//     keyId: number;
//     publicKey: Buffer;
//   };
//   signedPreKey: {
//     keyId: number;
//     publicKey: Buffer;
//     signature: Buffer;
//   };
// }

// const userKeySchema = new Schema<IUserKey>({
//   userId: {
//     type: String,
//     ref: "User",
//     required: true,
//     unique: true,
//   },
//   registrationId: { type: Number, required: true },
//   identityKeyPair: { type: Buffer, required: true },
//   preKey: {
//     keyId: { type: Number, required: true },
//     publicKey: { type: Buffer, required: true },
//   },
//   signedPreKey: {
//     keyId: { type: Number, required: true },
//     publicKey: { type: Buffer, required: true },
//     signature: { type: Buffer, required: true },
//   },
// });

export const UserKey = model<IUserKey>("UserKey", userKeySchema);
