import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ObjectsGateway } from '../gateways/objects-gateway';
import { DomainObject } from '../models/domain-object';
import { ObjectSaveResult } from '../models/object-save-result';
import { ObjectProvider } from './object-provider';

/**
 * Default object provider backing every persisted namespace by delegating to
 * the {@link ObjectsGateway} transport (B02). Requirement: OMCT-C02-L2-01.03.
 */
@Injectable({ providedIn: 'root' })
export class GatewayObjectProvider implements ObjectProvider {
  private readonly gateway = inject(ObjectsGateway);

  async get(keyString: string): Promise<DomainObject | undefined> {
    try {
      return await firstValueFrom(this.gateway.getObject(keyString));
    } catch {
      return undefined;
    }
  }

  create(object: DomainObject): Promise<ObjectSaveResult> {
    return firstValueFrom(this.gateway.saveObject(object));
  }

  update(object: DomainObject): Promise<ObjectSaveResult> {
    return firstValueFrom(this.gateway.saveObject(object));
  }
}
