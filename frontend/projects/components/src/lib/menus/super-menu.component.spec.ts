import { ComponentRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuItem } from './menu-item';
import { SuperMenuComponent } from './super-menu.component';

describe('OMCT-C15-L2-03.04 SuperMenuComponent', () => {
  let fixture: ComponentFixture<SuperMenuComponent>;
  let ref: ComponentRef<SuperMenuComponent>;

  const items: MenuItem[] = [
    { name: 'Folder', glyph: 'i-folder', description: 'A container for objects.', onClick: () => {} },
    { name: 'Plot', glyph: 'i-plot', description: 'Plots telemetry series.', onClick: () => {} },
  ];

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperMenuComponent);
    ref = fixture.componentRef;
    ref.setInput('items', items);
    fixture.detectChanges();
  });

  function itemButton(name: string): HTMLElement {
    return fixture.nativeElement.querySelector(`[data-testid="super-menu-item"][data-name="${name}"]`);
  }

  function description(): string {
    return fixture.nativeElement.querySelector('[data-testid="super-menu-desc"]').textContent.trim();
  }

  it('shows an item description when the item receives pointer focus', () => {
    itemButton('Folder').dispatchEvent(new Event('pointerenter'));
    fixture.detectChanges();
    expect(description()).toContain('A container for objects.');
  });

  it('updates the description as focus moves between items', () => {
    itemButton('Folder').dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(description()).toContain('A container for objects.');

    itemButton('Plot').dispatchEvent(new Event('pointerenter'));
    fixture.detectChanges();
    expect(description()).toContain('Plots telemetry series.');
  });
});
