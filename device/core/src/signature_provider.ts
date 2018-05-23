import { SharedAccessSignature } from 'azure-iot-common';

export interface SignatureProvider {
    sign(keyName: string, data: string, callback: (err: Error, signature: SharedAccessSignature) => void): void;
}
