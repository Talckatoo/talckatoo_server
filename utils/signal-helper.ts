import { KeyHelper } from "libsignal-protocol-typescript";

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

  return {
    registrationId,
    identityKeyPair,
    preKey,
    signedPreKey,
  };
}
