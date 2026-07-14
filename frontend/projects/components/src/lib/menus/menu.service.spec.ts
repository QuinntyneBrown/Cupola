import { OverlayContainer } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';

import { MenuItem } from './menu-item';
import { MenuService } from './menu.service';

describe('OMCT-C15-L2-03.03 MenuService', () => {
  let service: MenuService;
  let container: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MenuService);
    container = TestBed.inject(OverlayContainer).getContainerElement();
  });

  afterEach(() => TestBed.inject(OverlayContainer).ngOnDestroy());

  function menuItems(onClick: () => void): MenuItem[] {
    return [{ name: 'Open', glyph: 'i-external', onClick }];
  }

  it('renders the menu at the requested coordinate', () => {
    service.showMenu(120, 240, menuItems(() => {}));
    TestBed.tick();

    const menu = container.querySelector<HTMLElement>('[data-testid="menu"]');
    expect(menu).not.toBeNull();
  });

  it('invokes the clicked item callback and dismisses the menu', () => {
    const onClick = jest.fn();
    service.showMenu(10, 10, menuItems(onClick));
    TestBed.tick();

    const item = container.querySelector<HTMLButtonElement>('[data-testid="menu-item"]');
    item!.click();
    TestBed.tick();

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-testid="menu"]')).toBeNull();
  });
});
