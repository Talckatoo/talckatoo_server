import { Schema, model } from "mongoose";

export interface IUserKey {
  userId: String;
  registrationId: number;
  identityKeyPair: {
    pubKey: Buffer;
    privKey: Buffer;
  };
  preKey: {
    keyId: number;
    keyPair: {
      pubKey: Buffer;
      privKey: Buffer;
    };
  };
  signedPreKey: {
    keyId: number;
    keyPair: {
      pubKey: Buffer;
      privKey: Buffer;
    };
    signature: Buffer;
  };
}

const userKeySchema = new Schema<IUserKey>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  registrationId: { type: Number, required: true },
  identityKeyPair: {
    pubKey: { type: Buffer, required: true },
    privKey: { type: Buffer, required: true },
  },
  preKey: {
    keyId: { type: Number, required: true },
    keyPair: {
      pubKey: { type: Buffer, required: true },
      privKey: { type: Buffer, required: true },
    },
  },
  signedPreKey: {
    keyId: { type: Number, required: true },
    keyPair: {
      pubKey: { type: Buffer, required: true },
      privKey: { type: Buffer, required: true },
    },
    signature: { type: Buffer, required: true },
  },
});

export const UserKey = model<IUserKey>("UserKey", userKeySchema);
