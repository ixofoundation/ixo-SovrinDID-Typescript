
import bs58 from 'bs58'
import nacl from 'tweetnacl'


export function gen(): any {
  const seed = nacl.randomBytes(nacl.sign.seedLength)
    return fromSeed(seed)
}


export function fromSeed (seed: any) {
  const x = nacl.sign.keyPair.fromSeed(seed)
  const secretKey = x.secretKey.subarray(0, 32)
  const signKey = bs58.encode(Buffer.from(secretKey))
  const keyPair = nacl.box.keyPair.fromSecretKey(secretKey)

  return {

    did: bs58.encode(Buffer.from(x.publicKey.subarray(0, 16))),
    verifyKey: bs58.encode(Buffer.from(x.publicKey)),
    encryptionPublicKey: bs58.encode(Buffer.from(keyPair.publicKey)),

    secret: {
      seed: Buffer.from(seed).toString('hex'),
      signKey: signKey,
      encryptionPrivateKey: bs58.encode(Buffer.from(keyPair.secretKey))
    }
  }
}

export function verifySignedMessage (signedMessage: any, verifyKey: any) {
  const decodedKey = bs58.decode(verifyKey)
  const signed = nacl.sign.open(signedMessage, decodedKey)
  return signed !== null ? Buffer.from(signed).toString('utf8') : false
}

export function signMessage (message: any, signKey: any, verifyKey: any) {
  verifyKey = bs58.decode(verifyKey)
  signKey = bs58.decode(signKey)
  const fullSignKey = Buffer.concat([signKey, verifyKey])
  const arrayMessage = Buffer.from(message, 'utf8')
  return nacl.sign(arrayMessage, fullSignKey)
}

export function getArrayFromKey (key: any) {
  return Uint8Array.from(bs58.decode(key))
}

export function getNonce() {
  return nacl.randomBytes(nacl.box.nonceLength)
}

export function getKeyPairFromSignKey(signKey: any) {
  return nacl.box.keyPair.fromSecretKey(getArrayFromKey(signKey))
}

export function getSharedSecret (theirVerifyKey: any, mySigningKey: any) {
  theirVerifyKey = typeof theirVerifyKey === 'string' ? bs58.decode(theirVerifyKey) : theirVerifyKey
  mySigningKey = typeof mySigningKey === 'string' ? bs58.decode(mySigningKey) : mySigningKey
  return nacl.box.before(theirVerifyKey, mySigningKey)
}

export function decryptMessage  (encryptedMessage: any, nonce: any, sharedSecret: any) {
  const verifiedEncrypTion = nacl.box.open.after(encryptedMessage, nonce, sharedSecret)
  return verifiedEncrypTion !== null ? Buffer.from(verifiedEncrypTion).toString('utf8') : false
}

export function encryptMessage (message: any, nonce: any, sharedSecret: any) {
  return nacl.box.after(Buffer.from(message, 'utf8'), nonce, sharedSecret)
}
