# IotEdgedSignatureProvider Requirements

# Overview

The `IotEdgedSignatureProvider` class implements the `SignatureProvider` interface by delegating the token generation process to iotedged.

# Public API

# constructor(private _authConfig: EdgedAuthConfig, tokenValidTimeInSeconds?: number)

**SRS_NODE_IOTEDGED_SIG_PROVIDER_13_001: [** The `constructor` shall throw a `ReferenceError` if the `_authConfig` parameter is falsy. **]**

**SRS_NODE_IOTEDGED_SIG_PROVIDER_13_002: [** The `constructor` shall throw a `ReferenceError` if the `_authConfig.workloadUri` field is falsy. **]**

**SRS_NODE_IOTEDGED_SIG_PROVIDER_13_003: [** The `constructor` shall throw a `ReferenceError` if the `_authConfig.moduleId` field is falsy. **]**

**SRS_NODE_IOTEDGED_SIG_PROVIDER_13_004: [** The `constructor` shall throw a `ReferenceError` if the `_authConfig.generationId` field is falsy. **]**

**SRS_NODE_IOTEDGED_SIG_PROVIDER_13_005: [** The `constructor` shall throw a `TypeError` if the `_authConfig.workloadUri` field is not a valid URI. **]**

**SRS_NODE_IOTEDGED_SIG_PROVIDER_13_006: [** The `constructor` shall build a unix domain socket path host if the workload URI protocol is `unix`. **]**

**SRS_NODE_IOTEDGED_SIG_PROVIDER_13_007: [** The `constructor` shall build a string host if the workload URI protocol is not `unix`. **]**

**SRS_NODE_IOTEDGED_SIG_PROVIDER_13_008: [** The `constructor` shall save the `tokenValidTimeInSeconds` parameter if supplied. If not, it shall default to 3600 seconds (1 hour). **]**

# sign(keyName: string, data: string, callback: (err: Error, signature: SharedAccessSignature) => void): void

**SRS_NODE_IOTEDGED_SIG_PROVIDER_13_009: [** The `sign` method shall throw a `ReferenceError` if the `callback` parameter is falsy or is not a function. **]**

**SRS_NODE_IOTEDGED_SIG_PROVIDER_13_010: [** The `sign` method invoke `callback` with a `ReferenceError` if the `data` parameter is falsy. **]**

**SRS_NODE_IOTEDGED_SIG_PROVIDER_13_011: [** The `sign` method shall build the HTTP request path in the format `/modules/<module id>/genid/<generation id>/sign?api-version=2018-06-28`. **]**

**SRS_NODE_IOTEDGED_SIG_PROVIDER_13_012: [** The `sign` method shall compute the token expiry period by adding `_tokenValidTimeInSeconds` to the current time. **]**

**SRS_NODE_IOTEDGED_SIG_PROVIDER_13_014: [** The `sign` method shall invoke `this._restApiClient.executeApiCall` to make the REST call on iotedged using the POST method. **]**

**SRS_NODE_IOTEDGED_SIG_PROVIDER_13_014: [** The `sign` method shall build an object with the following schema as the HTTP request body as the sign request:

```typescript
interface SignRequest {
  keyId: string;
  algo: string;
  data: string;
}
```
**]**

**SRS_NODE_IOTEDGED_SIG_PROVIDER_13_013: [** The `sign` method shall build the sign request using the following values:

```typescript
const signRequest = {
  keyId: "primary"
  algo: "HMACSHA256"
  data: `${data}\n${expiry}`
};
```
**]**

**SRS_NODE_IOTEDGED_SIG_PROVIDER_13_015: [** The `sign` method shall build a `SharedAccessSignature` object and invoke `callback` when the signature is available. **]**