import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { ObjectsGateway } from '../gateways/objects-gateway';
import { DomainObject } from '../models/domain-object';
import { NotificationService } from '../notifications/notification.service';
import { ObjectUpdatesService } from '../objects/object-updates.service';
import { ObjectPersistenceService } from './object-persistence.service';

describe('ObjectPersistenceService', () => {
  it('notifies a conflict and preserves the unsaved state (OMCT-C04-L2-02.07)', async () => {
    const draft: DomainObject = {
      identifier: { namespace: '', key: 'draft' },
      keyString: 'draft',
      name: 'Unsaved edit',
      type: 'folder',
      location: null,
      composition: [],
      version: 1,
    };
    const objects = {
      saveObject: jest.fn(() =>
        of({ keyString: 'draft', outcome: 'conflict', object: { ...draft, name: 'Server' } }),
      ),
    };
    const notifications = { error: jest.fn() };
    const updates = { emitLocal: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        ObjectPersistenceService,
        { provide: ObjectsGateway, useValue: objects },
        { provide: NotificationService, useValue: notifications },
        { provide: ObjectUpdatesService, useValue: updates },
      ],
    });
    const persistence = TestBed.inject(ObjectPersistenceService);

    await firstValueFrom(persistence.save(draft));

    expect(notifications.error).toHaveBeenCalledWith(expect.stringContaining('Save conflict'));
    expect(persistence.getUnsaved('draft')).toBe(draft);
    expect(updates.emitLocal).not.toHaveBeenCalled();
  });
});
