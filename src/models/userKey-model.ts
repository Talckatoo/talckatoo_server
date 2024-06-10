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
}

const userKeySchema = new Schema<IUserKey>({
  userId: {
    type: String,
    ref: "User",
    required: true,
    unique: true,
  },
  registrationId: { type: Number, required: true },
  identityKeyPair: {
    pubKey: {
      type: Buffer,
      required: true,
      get: (buffer: Buffer) => bufferToArrayBuffer(buffer),
      set: (ab: ArrayBuffer) => arrayBufferToBuffer(ab),
    },
    privKey: {
      type: Buffer,
      required: true,
      get: (buffer: Buffer) => bufferToArrayBuffer(buffer),
      set: (ab: ArrayBuffer) => arrayBufferToBuffer(ab),
    },
  },
});

export const UserKey = model<IUserKey>("UserKey", userKeySchema);
