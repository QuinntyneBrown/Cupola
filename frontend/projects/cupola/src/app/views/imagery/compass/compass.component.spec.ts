import { TestBed } from '@angular/core/testing';

import { orientationFor } from './compass-orientation';
import { CompassComponent } from './compass.component';

describe('OMCT-C11-L2-02.05 Compass overlays — rendering', () => {
  it('rotates the rose to the calculated orientation and shows the HUD heading', () => {
    TestBed.configureTestingModule({});
    const fixture = TestBed.createComponent(CompassComponent);
    fixture.componentRef.setInput('orientation', orientationFor(45, -5));
    fixture.detectChanges();

    const rose = fixture.nativeElement.querySelector('[data-testid="compass-rose"]');
    expect(rose.getAttribute('transform')).toBe('rotate(40 22 22)');
    expect(fixture.nativeElement.querySelector('[data-testid="compass-hud"]').textContent).toBe(
      'HDG 45.0°',
    );
  });
});
