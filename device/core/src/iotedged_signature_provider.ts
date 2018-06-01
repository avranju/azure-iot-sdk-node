import {
  SharedAccessSignature,
  SignatureProvider,
  encodeUriComponentStrict
} from 'azure-iot-common';
import { RestApiClient } from 'azure-iot-http-base';
import { URL } from 'url';

// tslint:disable-next-line:no-var-requires
const packageJson = require('../package.json');

export const WORKLOAD_API_VERSION = '2018-06-28';
const DEFAULT_SIGN_ALGORITHM = 'HMACSHA256';
const DEFAULT_KEY_ID = 'primary';

export interface EdgedAuthConfig {
  workloadUri: string;
  deviceId: string;
  moduleId: string;
  iothubHostName: string;
  authScheme: string;
  gatewayHostName?: string;
  generationId: string;
}

interface SignRequest {
  keyId: string;
  algo: string;
  data: string;
}

interface SignResponse {
  digest: string;
}

export class IotEdgedSignatureProvider implements SignatureProvider {
  private _restApiClient: RestApiClient;
  private _tokenValidTimeInSeconds: number = 3600; // 1 hour

  constructor(
    private _authConfig: EdgedAuthConfig,
    tokenValidTimeInSeconds?: number
  ) {
    // Codes_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_001: [ The constructor shall throw a ReferenceError if the _authConfig parameter is falsy. ]
    if (!this._authConfig) {
      throw new ReferenceError('_authConfig cannot be \'' + _authConfig + '\'');
    }

    // Codes_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_002: [ The constructor shall throw a ReferenceError if the _authConfig.workloadUri field is falsy. ]
    if (!this._authConfig.workloadUri) {
      throw new ReferenceError(
        '_authConfig.workloadUri cannot be \'' +
          this._authConfig.workloadUri +
          '\''
      );
    }

    // Codes_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_003: [ The constructor shall throw a ReferenceError if the _authConfig.moduleId field is falsy. ]
    if (!this._authConfig.moduleId) {
      throw new ReferenceError(
        '_authConfig.moduleId cannot be \'' + this._authConfig.moduleId + '\''
      );
    }

    // Codes_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_004: [ The constructor shall throw a ReferenceError if the _authConfig.generationId field is falsy. ]
    if (!this._authConfig.generationId) {
      throw new ReferenceError(
        '_authConfig.generationId cannot be \'' +
          this._authConfig.generationId +
          '\''
      );
    }

    // Codes_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_005: [ The constructor shall throw a TypeError if the _authConfig.workloadUri field is not a valid URI. ]
    // Codes_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_006: [ The constructor shall build a unix domain socket path host if the workload URI protocol is unix. ]
    // Codes_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_007: [ The constructor shall build a string host if the workload URI protocol is not unix. ]
    let workloadUri = new URL(this._authConfig.workloadUri);
    const config: RestApiClient.TransportConfig = {
      host:
        workloadUri.protocol === 'unix:'
          ? { socketPath: workloadUri.pathname }
          : workloadUri.host
    };

    this._restApiClient = new RestApiClient(
      config,
      `${packageJson.name}/${packageJson.version}`
    );

    // Codes_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_008: [ The constructor shall save the tokenValidTimeInSeconds parameter if supplied. If not, it shall default to 3600 seconds (1 hour). ]
    if (tokenValidTimeInSeconds) {
      this._tokenValidTimeInSeconds = tokenValidTimeInSeconds;
    }
  }

  sign(
    keyName: string,
    data: string,
    callback: (err: Error, signature: SharedAccessSignature) => void
  ): void {
    // Codes_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_009: [ The sign method shall throw a ReferenceError if the callback parameter is falsy or is not a function. ]
    if (!callback || typeof callback !== 'function') {
      throw new ReferenceError('callback cannot be \'' + callback + '\'');
    }

    // Codes_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_010: [ The sign method invoke callback with a ReferenceError if the data parameter is falsy. ]
    if (!data) {
      callback(new ReferenceError('data cannot be \'' + data + '\''), null);
      return;
    }

    // Codes_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_011: [ The sign method shall build the HTTP request path in the format /modules/<module id>/genid/<generation id>/sign?api-version=2018-06-28. ]

    // the request path needs to look like this:
    //  /modules/<module id>/genid/<generation id>/sign?api-version=2018-06-28
    const path = `/modules/${encodeUriComponentStrict(
      this._authConfig.moduleId
    )}/genid/${encodeUriComponentStrict(
      this._authConfig.generationId
    )}/sign?api-version=${encodeUriComponentStrict(WORKLOAD_API_VERSION)}`;

    // Codes_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_012: [ The sign method shall compute the token expiry period by adding _tokenValidTimeInSeconds to the current time. ]
    const newExpiry =
      Math.floor(Date.now() / 1000) + this._tokenValidTimeInSeconds;

    // Codes_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_014: [ The sign method shall build an object with the following schema as the HTTP request body as the sign request:
    //   interface SignRequest {
    //     keyId: string;
    //     algo: string;
    //     data: string;
    //   }
    //   ]

    // Codes_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_013: [ The sign method shall build the sign request using the following values:
    //   const signRequest = {
    //     keyId: "primary"
    //     algo: "HMACSHA256"
    //     data: `${data}\n${expiry}`
    //   };
    //   ]
    const signRequest: SignRequest = {
      keyId: DEFAULT_KEY_ID,
      algo: DEFAULT_SIGN_ALGORITHM,
      // the data to be signed needs to have the expiry value appended with a newline
      data: `${data}\n${newExpiry}`
    };

    // Codes_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_014: [ The sign method shall invoke this._restApiClient.executeApiCall to make the REST call on iotedged using the POST method. ]
    this._restApiClient.executeApiCall(
      'POST',
      path,
      null,
      signRequest,
      (err, body: SignResponse, response) => {
        if (err) {
          callback(err, null);
        } else {
          // Codes_SRS_NODE_IOTEDGED_SIG_PROVIDER_13_015: [ The sign method shall build a SharedAccessSignature object and invoke callback when the signature is available. ]
          const sas = new SharedAccessSignature();
          sas.sr = encodeUriComponentStrict(data);
          sas.se = newExpiry;
          sas.skn = DEFAULT_KEY_ID;
          sas.sig = body.digest;

          callback(null, sas);
        }
      }
    );
  }
}
