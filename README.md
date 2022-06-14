# SovrinDid Typescript Library

A reimplementation of the original https://github.com/Picolab/node-sovrin-did node.js module to generate DID and Ed25519 keys to use with Sovrin in a modern typesafe project.

## Getting started

1. `git clone git@github.com:ixofoundation/SovrinDidTypescript my-project-name`
2. `cd my-project-name`
3. `yarn install`
4. `yarn setup`

## Features

### Typescript

Leverages [esbuild](https://github.com/evanw/esbuild) for blazing fast builds, but keeps `tsc` to generate `.d.ts` files.
Generates two builds to support both ESM and CJS.

Commands:

- `build`: runs typechecking then generates CJS, ESM and `d.ts` files in the `build/` directory
- `clean`: removes the `build/` directory
- `type:dts`: only generates `d.ts`
- `type:check`: only run typechecking
- `type:build`: only generates CJS and ESM

### Format & lint

This template relies on the combination of [eslint](https://github.com/eslint/eslint) — through [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint) for linting and [prettier](https://github.com/prettier/prettier) for formatting.
It also uses [cspell](https://github.com/streetsidesoftware/cspell) to ensure spelling

Commands:

- `format`: runs prettier with automatic fixing
- `format:check`: runs prettier without automatic fixing (used in CI)
- `lint`: runs eslint with automatic fixing
- `lint:check`: runs eslint without automatic fixing (used in CI)
- `spell:check`: runs spellchecking

## Example

```js
let sovrinDID = require("sovrin-did");

let d = sovrinDID.gen();

console.log(d);
```

output:

```js
{ did: 'S7evWWTSbaXELyE9w53sFr',
  verifyKey: 'EgvhZsLKSsqsbNBfJ2wfR9FFWo9YqkpxpfXeT4ifR1Cq',
  encryptionPublicKey: '5UAXeov4Gi7ioSTLDoMPtdvqX6RRmJcQAWagVgdaxUej',
  secret:
   { seed: '36a572a7e43956784b517c57b26720a8ef838d114c0619f1d8c7801c37fa4f6a',
     signKey: '4gKLe7Qq2WX249NBfymQySZbAzXboq2emMig6wBR82Bj',
     encryptionPrivateKey: '7H25Jfb2ND51hhaomL5FPhhqQvBGujd1jJeSjZZ8HQzR'} }
```

## API

### gen()

Generates a new did, verification key, signing key, and also gives you the seed used to generate them. It also includes the public and private key used for encryption.

```js
{
    did: "<base58 did>",
    verifyKey: "<base58 publicKey>",
    publicKey: "<base58 publicKey>",

    secret: {
        seed: "<hex encoded 32-byte seed>",
        signKey: "<base58 secretKey>",
        privateKey: "<base58 privateKey>"
    }
}
```

### fromSeed(seed)

Same as `.gen()` except you supply the seed. The seed should be a 32-byte Uint8Array (i.e. Buffer).

Example:

```
let seed = Buffer.from("36a572a7e43956784b517c57b26720a8ef838d114c0619f1d8c7801c37fa4f6a", "hex");

let d = sovrinDID.fromSeed(seed);

console.log(d);
```

The output is the same as the `.gen()` example.

### signMessage(message, signKey, verifyKey)

Signs a message with the given signKey and verifyKey.

- The message should be a string.
- Both the signKey and verifyKey should be the signKey and verifyKey given from the `gen()` or `fromSeed(seed)` methods

Returns a signed message as a Uint8Array (i.e. Buffer).

Example:

```js
let sovrin = sovrinDID.gen();

let signKey = sovrin.secret.signKey;
let verifyKey = sovrin.verifyKey;
let message = "Hello World!!";

let signedMessage = sovrinDID.signMessage(message, signKey, verifyKey);
```

### verifySignedMessage(signedMessage, verifyKey)

Verifies that the given message has been signed by the possessor of the given verifyKey.

- The signedMessage should be what is returned from `signMessage(message, signKey, verifyKey)`
- The verifyKey should be the verifyKey given from the `gen()` or `fromSeed(seed)` methods

Returns the original message if the message was signed by the owner of the verifyKey `false` otherwise.

Example:

```js
let sovrin = sovrinDID.gen();
let sovrin2 = sovrinDID.gen();

let signKey = sovrin.secret.signKey;
let verifyKey = sovrin.verifyKey;
let verifyKey2 = sovrin2.verifyKey;

let message = "Hello World!!";

let signedMessage = sovrinDID.signMessage(message, signKey, verifyKey);

console.log(sovrinDID.verifySignedMessage(signedMessage, verifyKey));
console.log(sovrinDID.verifySignedMessage(signedMessage, verifyKey2));
```

Output:

```
  Hello World!!
  false
```

### getKeyPairFromSignKey(signKey)

Returns a key pair that is valid to use for encrypting.

- The signKey should be the signKey given from the object given from `gen()` or `fromSeed()`

Example:

```js
let sovrin = sovrinDID.gen();
let signKey = sovrin.secret.signKey;

let keyPair = sovrinDID.getKeyPairFromSignKey(signKey);
console.log(keyPair);
```

Output:

```js
{
   publicKey: ...   // Uint8Array with 32-byte public key
   secretKey: ...   // Uint8Array with 32-byte secret key
}
```

### getNonce()

Returns a random nonce as a Uint8Array that can be used for encrypting.

Example:

```js
let nonce = sovrinDID.getNonce();
```

### getSharedSecret(theirVerifyKey, mySigningKey)

Computes a sharedSecret to be used for encryption.

- theirVerifyKey should be the publicKey given from the `getKeyPairFromSignKey(signKey)` method or the publicKey string given from the `gen()` method.
- mySigningKey should be the secretKey given from the `getKeyPairFromSignKey(signKey)` method or the privateKey given from the `gen()` method.

Example:

```js
let sovrin1 = sovrinDID.gen();
let sovrin2 = sovrinDID.gen();

// Using the strings given via the gen() method
let sharedSecret1 = sovrinDID.getSharedSecret(
  sovrin2.encryptionPublicKey,
  sovrin1.secret.encryptionPrivateKey
);
let sharedSecret2 = sovrinDID.getSharedSecret(
  sovrin1.encryptionPublicKey,
  sovrin2.secret.encryptionPrivateKey
);

let signKey1 = sovrin1.secret.signKey;
let signKey2 = sovrin2.secret.signKey;

let keyPair1 = sovrinDID.getKeyPairFromSignKey(signKey1);
let keyPair2 = sovrinDID.getKeyPairFromSignKey(signKey2);

// Using the buffer given from the getKeyPairFromSignKey(signKey2) method
let sharedSecret3 = sovrinDID.getSharedSecret(
  keyPair2.publicKey,
  keyPair1.secretKey
);
let sharedSecret4 = sovrinDID.getSharedSecret(
  keyPair1.publicKey,
  keyPair2.secretKey
);

// All the secrets generated are equivalent
```

### encryptMessage(message, nonce, sharedSecret)

Encrypts a the given message using a precomputed sharedSecret.

- message should be given as a string
- nonce should be a nonce from the `getNonce()` method
  - Note: The nonce used for encrypting and decrypting need to be the same
- sharedSecret should be computed using the `getSharedSecret(theirVerifyKey, mySigningKey)` method

Example:

```js
let sovrin1 = sovrinDID.gen();
let sovrin2 = sovrinDID.gen();

let signKey1 = sovrin1.secret.signKey;
let signKey2 = sovrin2.secret.signKey;

let keyPair1 = sovrinDID.getKeyPairFromSignKey(signKey1);
let keyPair2 = sovrinDID.getKeyPairFromSignKey(signKey2);
let sharedSecret1To2 = sovrinDID.getSharedSecret(
  keyPair2.publicKey,
  keyPair1.secretKey
);

let message = "Hello World!!";
let nonce = sovrinDID.getNonce();
let encryptedMessage = sovrinDID.encryptMessage(
  message,
  nonce,
  sharedSecret1To2
);
```

### decryptMessage(encryptedMessage, nonce, sharedSecret)

Verifies and decrypts a previously encrypted message.

- encryptedMessage should be what is returned from the `encryptMessage(message, nonce, sharedSecret)` method
- nonce should be a nonce given from the `getNonce()` method
  - Note: The nonce used for encrypting and decrypting need to be the same
- sharedSecret should be computed using the `getSharedSecret(theirVerifyKey, mySigningKey)` method

Example:

```js
let signKey1 = "4bMnc36WuLYJqsWTZtiazJJrtkvPwgyWnirn7gKk7ium";
let signKey2 = "516mChDX1BRjwHJc2w838W8cXxy8a6Eb35HKXjPR2fD8";
let signKey3 = "7H25Jfb2ND51hhaomL5FPhhqQvBGujd1jJeSjZZ8HQzR";

let keyPair1 = sovrinDID.getKeyPairFromSignKey(signKey1);
let keyPair2 = sovrinDID.getKeyPairFromSignKey(signKey2);
let keyPair3 = sovrinDID.getKeyPairFromSignKey(signKey3);

let sharedSecret1To2 = sovrinDID.getSharedSecret(
  keyPair2.publicKey,
  keyPair1.secretKey
);
let sharedSecret2To1 = sovrinDID.getSharedSecret(
  keyPair1.publicKey,
  keyPair2.secretKey
);
let sharedSecret3To1 = sovrinDID.getSharedSecret(
  keyPair3.publicKey,
  keyPair1.secretKey
);

let message = "Hello World!!";
let nonce = sovrinDID.getNonce();

let encryptedMessage = sovrinDID.encryptMessage(
  message,
  nonce,
  sharedSecret1To2
);
let decryptedMessage = sovrinDID.decryptMessage(
  encryptedMessage,
  nonce,
  sharedSecret2To1
);
let attemptedDecryption = sovrinDID.decryptMessage(
  encryptedMessage,
  nonce,
  sharedSecret3To1
);

console.log(decryptedMessage);
console.log(attemptedDecryption);
```
