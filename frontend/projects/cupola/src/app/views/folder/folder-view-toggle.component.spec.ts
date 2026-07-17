import { TestBed } from '@angular/core/testing';
import { UrlParamsService } from '@cupola/core';

import { FolderViewToggleComponent } from './folder-view-toggle.component';

describe('OMCT-C09-L2-03.04 Folder grid and list — presentation toggle', () => {
  it('selects the presentation through the ?view= URL parameter', () => {
    const urlParams = { setParams: jest.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      providers: [{ provide: UrlParamsService, useValue: urlParams }],
    });
    const fixture = TestBed.createComponent(FolderViewToggleComponent);
    fixture.componentRef.setInput('active', 'folder');
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelector('[data-testid="folder-toggle-list"]') as HTMLElement
    ).click();

    expect(urlParams.setParams).toHaveBeenCalledWith({ view: 'list' });
    expect(
      fixture.nativeElement
        .querySelector('[data-testid="folder-toggle-grid"]')
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });
});
