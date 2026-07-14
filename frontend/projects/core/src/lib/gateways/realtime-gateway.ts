import { Signal } from '@angular/core';
import { Observable } from 'rxjs';

import { ConnectionState } from '../models/connection-state';
import { DomainObject } from '../models/domain-object';
import { TelemetryValue } from '../models/telemetry-value';

export abstract class RealtimeGateway {
  abstract readonly connectionState: Signal<ConnectionState>;
  abstract connect(): void;
  abstract objectUpdates(keyString: string): Observable<DomainObject>;
  abstract telemetry(keyString: string): Observable<TelemetryValue>;
}
