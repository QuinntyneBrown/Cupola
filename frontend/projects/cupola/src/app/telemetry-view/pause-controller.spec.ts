import { PauseController } from './pause-controller';

describe('PauseController', () => {
  it('starts running', () => {
    expect(new PauseController().paused()).toBe(false);
  });

  it('pauses and resumes', () => {
    const controller = new PauseController();
    controller.pause();
    expect(controller.paused()).toBe(true);
    controller.resume();
    expect(controller.paused()).toBe(false);
  });

  it('toggles the paused state', () => {
    const controller = new PauseController();
    controller.toggle();
    expect(controller.isPaused()).toBe(true);
    controller.toggle();
    expect(controller.isPaused()).toBe(false);
  });

  it('clears the pause on a user-originated bounds change (02.06)', () => {
    const controller = new PauseController();
    controller.pause();
    controller.clearForUserBounds();
    expect(controller.paused()).toBe(false);
  });

  it('leaves a running view untouched on a bounds change', () => {
    const controller = new PauseController();
    controller.clearForUserBounds();
    expect(controller.paused()).toBe(false);
  });
});
