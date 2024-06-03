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
  const baseKeyId = Math.floor(10000 * Math.random());
  const signedPreKeyId = Math.floor(10000 * Math.random());

  const registrationId = KeyHelper.generateRegistrationId();
  const identityKeyPair = await KeyHelper.generateIdentityKeyPair();
  const preKey = await KeyHelper.generatePreKey(baseKeyId);
  const signedPreKey = await KeyHelper.generateSignedPreKey(
    identityKeyPair,
    signedPreKeyId
  );

  // store.storePreKey(`${baseKeyId}`, preKey.keyPair);
  // store.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair);

  const publicSignedPreKey = {
    keyId: signedPreKeyId,
    publicKey: signedPreKey.keyPair.pubKey,
    signature: signedPreKey.signature,
  };

  //   preKeys: preKeys.map(preKey => ({
  //     keyId: preKey.keyId,
  //     publicKey: preKey.keyPair.pubKey
  // }))

  const publicPreKey = {
    keyId: preKey.keyId,
    publicKey: preKey.keyPair.pubKey,
  };

  return {
    registrationId,
    identityKeyPair: identityKeyPair.pubKey,
    signedPreKey: publicSignedPreKey,
    oneTimePreKeys: [publicPreKey],
  };
}
// export async function generateUserKeys() {
//   const baseKeyId = Math.floor(10000 * Math.random());
//   const signedPreKeyId = Math.floor(10000 * Math.random());

//   const registrationId = KeyHelper.generateRegistrationId();
//   const identityKeyPair = await KeyHelper.generateIdentityKeyPair();
//   const preKey = await KeyHelper.generatePreKey(baseKeyId);
//   const signedPreKey = await KeyHelper.generateSignedPreKey(
//     identityKeyPair,
//     signedPreKeyId
//   );

//   // store.storePreKey(`${baseKeyId}`, preKey.keyPair);
//   // store.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair);

//   const publicSignedPreKey = {
//     keyId: signedPreKeyId,
//     publicKey: arrayBufferToBase64(signedPreKey.keyPair.pubKey),
//     signature: arrayBufferToBase64(signedPreKey.signature),
//   };

//   //   preKeys: preKeys.map(preKey => ({
//   //     keyId: preKey.keyId,
//   //     publicKey: preKey.keyPair.pubKey
//   // }))

//   const publicPreKey = {
//     keyId: preKey.keyId,
//     publicKey: arrayBufferToBase64(preKey.keyPair.pubKey),
//   };

//   return {
//     registrationId,
//     identityKeyPair: arrayBufferToBase64(identityKeyPair.pubKey),
//     signedPreKey: publicSignedPreKey,
//     oneTimePreKeys: [publicPreKey],
//   };
// }
