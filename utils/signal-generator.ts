import { KeyHelper } from "@privacyresearch/libsignal-protocol-typescript";
import { SignalProtocolStore } from "./signal-store";

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export async function generateUserKeys() {
  const registrationId = KeyHelper.generateRegistrationId();
  const identityKeyPair = await KeyHelper.generateIdentityKeyPair();

  return {
    registrationId,
    identityKeyPair,
  };
}
