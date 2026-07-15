import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LicensesComponent } from './licenses.component';

describe('OMCT-C16-L2-06.03 LicensesComponent', () => {
  let fixture: ComponentFixture<LicensesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    fixture = TestBed.createComponent(LicensesComponent);
    fixture.detectChanges();
  });

  it('renders a full-screen overlay containing the MIT project license', () => {
    const overlay = fixture.nativeElement.querySelector('[data-testid="licenses-overlay"]');
    expect(overlay).not.toBeNull();
    const projectText = fixture.nativeElement.querySelector(
      '[data-testid="licenses-project-text"]',
    ).textContent;
    expect(projectText).toContain('MIT License');
    expect(projectText).toContain('Cupola contributors');
  });

  it('lists third-party dependency licenses', () => {
    const rows = fixture.nativeElement.querySelectorAll('[data-testid="licenses-entry"]');
    expect(rows.length).toBeGreaterThan(0);
    const table = fixture.nativeElement.querySelector(
      '[data-testid="licenses-third-party"]',
    ).textContent;
    expect(table).toContain('@angular/core');
    expect(table).toContain('rxjs');
  });
});
