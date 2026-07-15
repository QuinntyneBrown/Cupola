import { Injectable, inject, signal } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  CUPOLA_CONFIG,
  ConnectionState,
  DomainObject,
  RealtimeGateway,
  TelemetryValue,
} from '@cupola/core';

@Injectable()
export class SignalRRealtimeGateway extends RealtimeGateway {
  private readonly config = inject(CUPOLA_CONFIG);
  private readonly state = signal<ConnectionState>('unknown');
  private readonly objectUpdated$ = new Subject<DomainObject>();
  private readonly telemetry$ = new Subject<TelemetryValue>();
  private connection: HubConnection | null = null;
  private started: Promise<void> | null = null;

  override readonly connectionState = this.state.asReadonly();

  override connect(): void {
    if (this.connection) {
      return;
    }
    this.connection = new HubConnectionBuilder()
      .withUrl(this.config.hubUrl)
      .withAutomaticReconnect()
      .build();

    this.connection.on('ObjectUpdated', (object: DomainObject) =>
      this.objectUpdated$.next(object),
    );
    this.connection.on('TelemetryReceived', (value: TelemetryValue) =>
      this.telemetry$.next(value),
    );
    this.connection.onreconnecting(() => this.state.set('pending'));
    this.connection.onreconnected(() => this.state.set('connected'));
    this.connection.onclose(() => this.state.set('disconnected'));

    this.state.set('pending');
    this.started = this.connection
      .start()
      .then(() => this.state.set('connected'))
      .catch(() => this.state.set('disconnected'));
  }

  override objectUpdates(keyString: string): Observable<DomainObject> {
    return this.subscribed(
      this.objectUpdated$.pipe(filter((object) => object.keyString === keyString)),
      'SubscribeToObject',
      'UnsubscribeFromObject',
      keyString,
    );
  }

  override telemetry(keyString: string): Observable<TelemetryValue> {
    return this.subscribed(
      this.telemetry$.pipe(filter((value) => value.keyString === keyString)),
      'SubscribeToTelemetry',
      'UnsubscribeFromTelemetry',
      keyString,
    );
  }

  private subscribed<T>(
    source: Observable<T>,
    subscribeMethod: string,
    unsubscribeMethod: string,
    keyString: string,
  ): Observable<T> {
    return new Observable<T>((subscriber) => {
      const subscription = source.subscribe(subscriber);
      void this.invoke(subscribeMethod, keyString);
      return () => {
        subscription.unsubscribe();
        void this.invoke(unsubscribeMethod, keyString);
      };
    });
  }

  private async invoke(method: string, keyString: string): Promise<void> {
    try {
      await this.started;
      await this.connection?.invoke(method, keyString);
    } catch {
      // Hub unavailable — subscriptions resume on reconnect.
    }
  }
}
