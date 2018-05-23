import { SignatureProvider } from './signature_provider';
import { SharedAccessSignature, encodeUriComponentStrict } from 'azure-iot-common';
import { RestApiClient } from 'azure-iot-http-base';
import { URL } from 'url';

// tslint:disable-next-line:no-var-requires
const packageJson = require('../package.json');

const WORKLOAD_API_VERSION = '2018-06-28';
const DEFAULT_SIGN_ALGORITHM = 'HMACSHA256';

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

    constructor(private _authConfig: EdgedAuthConfig) {
        if (!this._authConfig) {
            throw new ReferenceError('_authConfig cannot be \'' + _authConfig + '\'');
        }

        let workloadUri = new URL(this._authConfig.workloadUri);
        const config: RestApiClient.TransportConfig = {};
        if (workloadUri.protocol === 'unix:') {
            config.socketPath = workloadUri.pathname;
        } else {
            config.host = workloadUri.host;
        }

        this._restApiClient = new RestApiClient(config, `${packageJson.name}/${packageJson.version}`);
    }

    sign(keyId: string, data: string, callback: (err: Error, signature: SharedAccessSignature) => void): void {
        const path = `/modules/${encodeUriComponentStrict(this._authConfig.moduleId)}/genid/${encodeUriComponentStrict(this._authConfig.generationId)}/sign?api-version=${encodeUriComponentStrict(WORKLOAD_API_VERSION)}`;
        const signRequest: SignRequest = { keyId, algo: DEFAULT_SIGN_ALGORITHM, data };
        this._restApiClient.executeApiCall('POST', path, null, signRequest, (err, body: SignResponse, response) => {
            if (err) {
                callback(err, null);
            } else {

            }
        });
    }
}
