import {
  SessionBuilder,
  SessionCipher,
  SignalProtocolAddress,
} from "@privacyresearch/libsignal-protocol-typescript";
import { UserKey } from "../src/models/userKey-model";
import { SignalProtocolStore } from "./signal-store";
import { DeviceType } from "@privacyresearch/libsignal-protocol-typescript/lib/session-types";

export async function encryptMessage(
  recipientId: string,
  message: string,
  store: SignalProtocolStore
) {
  const recipientKey = await UserKey.findOne({ userId: recipientId });

  if (!recipientKey) {
    throw new Error("Recipient key not found");
  }

  const remoteAddress = new SignalProtocolAddress(
    recipientId,
    recipientKey.registrationId
  );

  const sessionBuilder = new SessionBuilder(store, remoteAddress);
  const ciphertext = sessionBuilder;

  //   const device: DeviceType<ArrayBuffer> = {
  //     identityKey: new Uint8Array(recipientKey.identityKeyPair.pubKey.buffer),
  //     preKey: {
  //       keyId: recipientKey.preKey.keyId,
  //       publicKey: new Uint8Array(recipientKey.preKey.keyPair.pubKey.buffer),
  //     },
  //     signedPreKey: {
  //       keyId: recipientKey.signedPreKey.keyId,
  //       publicKey: new Uint8Array(
  //         recipientKey.signedPreKey.keyPair.pubKey.buffer
  //       ),
  //       signature: new Uint8Array(recipientKey.signedPreKey.signature.buffer),
  //     },
  //     registrationId: recipientKey.registrationId,
  //   };

  //   getting "Invalid public key: [object ArrayBuffer] 8192"
  //   check the type of processPreKey parameter:
  //   export interface DeviceType<T = ArrayBuffer> {
  //     identityKey: T;
  //     signedPreKey: SignedPublicPreKeyType<T>;
  //     preKey?: PreKeyType<T>;
  //     registrationId?: number;
  //   }
  //   const session = await sessionBuilder.processPreKey(device);

  //   const sessionCipher = new SessionCipher(store, remoteAddress);
  //   const messageBuffer = new TextEncoder().encode(message);
  //   const ciphertext = await sessionCipher.encrypt(messageBuffer);
  return ciphertext;
}

export async function decryptMessage(
  senderId: string,
  ciphertext: ArrayBuffer,
  recipientId: string,
  store: SignalProtocolStore
) {
  const senderKey = await UserKey.findOne({ userId: senderId });
  const recipientKey = await UserKey.findOne({ userId: recipientId });

  if (!senderKey || !recipientKey) {
    throw new Error("Sender or recipient key not found");
  }

  const remoteAddress = new SignalProtocolAddress(
    senderId,
    senderKey.registrationId
  );

  const sessionCipher = new SessionCipher(store, remoteAddress);

  const plaintext = await sessionCipher.decryptPreKeyWhisperMessage(ciphertext);
  return plaintext;
}
