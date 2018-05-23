import { EventEmitter } from 'events';
import { AuthenticationProvider, AuthenticationType, TransportConfig } from 'azure-iot-common';

export class IotEdgedAuthenticationProvider extends EventEmitter implements AuthenticationProvider {
    type: AuthenticationType = AuthenticationType.Token;

    constructor(private authConfig: EdgedAuthConfig) {
        super();
    }

    getDeviceCredentials(callback: (err: Error, credentials?: TransportConfig) => void): void {
        throw new Error('Method not implemented.');
    }
}
