import { SignatureProvider } from './signature_provider';
import { TransportConfig, encodeUriComponentStrict, SharedAccessSignature } from 'azure-iot-common';

export class SharedAccessKeySignatureProvider implements SignatureProvider {
    constructor(
        private _sharedAccessKey: string,
        private _tokenValidTimeInSeconds?: number,
    ) {}

    sign(keyName: string, data: string, callback: (err: Error, signature: SharedAccessSignature) => void): void {
        if (!callback || typeof(callback) !== 'function') {
            throw new ReferenceError('callback cannot be \'' + callback + '\'');
        }
        if (!keyName) {
            callback(new ReferenceError('keyName cannot be \'' + keyName + '\''), null);
        }
        if (!data) {
            callback(new ReferenceError('data cannot be \'' + data + '\''), null);
        }

        const newExpiry = Math.floor(Date.now() / 1000) + this._tokenValidTimeInSeconds;
        const sas = SharedAccessSignature.create(data, keyName, this._sharedAccessKey, newExpiry);

        callback(null, sas);
    }
}
