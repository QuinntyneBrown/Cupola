import { TestBed } from '@angular/core/testing';
import { DefaultUserService, IndicatorService } from '@cupola/core';

import { ExampleUserProvider } from '../providers/example-user-provider';
import { registerUserIndicator } from './user-indicator';

function setup(withProvider: boolean) {
  TestBed.configureTestingModule({});
  const users = TestBed.inject(DefaultUserService);
  if (withProvider) {
    users.setProvider(new ExampleUserProvider());
  }
  TestBed.runInInjectionContext(() => registerUserIndicator());
  return TestBed.inject(IndicatorService);
}

describe('OMCT-C14-L2-01.04 User indicator', () => {
  it('displays the active name when a user provider is configured', () => {
    const indicators = setup(true);

    const user = indicators.indicators().find((indicator) => indicator.key === 'user');
    expect(user).toBeDefined();
    expect(user!.textSignal!()).toBe('Operator');
  });

  it('registers no user indicator without a provider', () => {
    const indicators = setup(false);

    expect(indicators.indicators().map((indicator) => indicator.key)).not.toContain('user');
  });
});
