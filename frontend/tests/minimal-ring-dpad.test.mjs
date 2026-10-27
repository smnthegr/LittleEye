import assert from 'node:assert/strict';
import test from 'node:test';
import { hitTestDPad, hitTestDPadTouch } from '../src/utils/minimal-ring-geometry.ts';
import { createDPadInteraction } from '../src/utils/dpad-interaction.ts';
import { createDPadFeedback } from '../src/utils/dpad-feedback.ts';

function setup() {
  const events = [];
  const controller = createDPadInteraction({
    start: direction => events.push(`start:${direction}`),
    stop: direction => events.push(`stop:${direction}`),
    feedback() {},
  });
  return { events, controller };
}

test('all five controls stay aligned at phone, tablet and reference scales', () => {
  const samples = [[150, 62, 'up'], [238, 150, 'right'], [150, 238, 'down'],
    [62, 150, 'left'], [150, 150, 'center']];
  for (const size of [192, 201.85, 234, 246, 300, 360, 600]) {
    for (const [x, y, expected] of samples) {
      assert.equal(hitTestDPad(x * size / 300, y * size / 300, size), expected);
    }
  }
});

test('organic corners, concave gaps, perimeter dots and exterior do not trigger controls', () => {
  for (const [x, y] of [[89, 29], [210, 30], [95, 95], [150, 110], [110, 150],
    [190, 150], [150, 190], [8, 150], [55, 55], [0, 0], [300, 300]]) {
    assert.equal(hitTestDPad(x, y), null, `${x},${y}`);
  }
  assert.equal(hitTestDPad(150, 150, 0), null);
});

test('larger buttons gain touch area without changing the ring or overall coordinates', () => {
  for (const [x, y, expected] of [[150, 26, 'up'], [274, 150, 'right'], [150, 274, 'down'],
    [26, 150, 'left'], [150, 119, 'center']]) {
    assert.equal(hitTestDPad(x, y), expected);
  }
  assert.equal(hitTestDPad(8, 150), null);
  assert.equal(hitTestDPad(292, 150), null);
});

test('touch padding accepts near misses consistently at different screen sizes', () => {
  for (const size of [192, 234, 300, 360]) {
    const scale = size / 300;
    for (const [x, y, expected] of [[150 * scale, 24.96 * scale - 8, 'up'],
      [275.04 * scale + 8, 150 * scale, 'right'], [150 * scale, 275.04 * scale + 8, 'down'],
      [24.96 * scale - 8, 150 * scale, 'left']]) {
      assert.equal(hitTestDPad(x, y, size), null);
      assert.equal(hitTestDPadTouch(x, y, size), expected);
    }
  }
});

test('wider touch padding handles larger fingers without resizing the artwork', () => {
  for (const size of [201.85, 246, 300, 360]) {
    const scale = size / 300;
    assert.equal(hitTestDPadTouch(150 * scale, 24.96 * scale - 12, size), 'up');
    assert.equal(hitTestDPadTouch(275.04 * scale + 12, 150 * scale, size), 'right');
    assert.equal(hitTestDPadTouch(150 * scale, 275.04 * scale + 12, size), 'down');
    assert.equal(hitTestDPadTouch(24.96 * scale - 12, 150 * scale, size), 'left');
    // The decorative center and its nearby gap cannot start a direction.
    assert.equal(hitTestDPadTouch(150 * scale, 150 * scale - 24, size), null);
    assert.equal(hitTestDPadTouch(150 * scale - 24, 150 * scale, size), null);
  }
});

test('shared gaps select the nearest button while distant decorations and exterior remain inactive', () => {
  assert.equal(hitTestDPadTouch(150, 107), 'up');
  assert.equal(hitTestDPadTouch(150, 115), null);
  assert.equal(hitTestDPadTouch(107, 150), 'left');
  assert.equal(hitTestDPadTouch(115, 150), null);
  for (const size of [192, 234, 300, 360]) {
    for (const [x, y] of [[55, 55], [0, 0]]) {
      assert.equal(hitTestDPadTouch(x * size / 300, y * size / 300, size), null);
    }
  }
  assert.equal(hitTestDPadTouch(-1, 150), null);
  assert.equal(hitTestDPadTouch(NaN, 150), null);
});

test('a held button tolerates larger finger drift without capturing another button', () => {
  for (const size of [300, 360, 600]) {
    const x = 150 * size / 300;
    const y = 24.96 * size / 300 - 20;
    assert.equal(hitTestDPadTouch(x, y, size), null);
    assert.equal(hitTestDPadTouch(x, y, size, 'up'), 'up');
    assert.equal(hitTestDPadTouch(x, 24.96 * size / 300 - 25, size, 'up'), null);
    assert.equal(hitTestDPadTouch(238 * size / 300, x, size, 'up'), null);
    assert.equal(hitTestDPadTouch(x, x, size, 'up'), null);
  }
});

test('holding sends one start and releasing sends exactly one immediate stop', () => {
  for (const direction of ['up', 'down', 'left', 'right']) {
    const { controller, events } = setup();
    controller.begin(direction, 'first');
    for (let i = 0; i < 20; i++) controller.move(direction, 'first');
    assert.deepEqual(events, [`start:${direction}`]);
    controller.end('first');
    controller.end('first');
    controller.cancel();
    assert.deepEqual(events, [`start:${direction}`, `stop:${direction}`]);
  }
});

test('another finger cannot start a conflicting direction or release the owner', () => {
  const { controller, events } = setup();
  assert.equal(controller.begin('left', 1), true);
  assert.equal(controller.begin('right', 2), false);
  controller.end(2);
  controller.move(null, 2);
  assert.deepEqual(events, ['start:left']);
  controller.end(1);
  controller.begin('right', 3);
  controller.end(3);
  assert.deepEqual(events, ['start:left', 'stop:left', 'start:right', 'stop:right']);
});

test('sliding into a gap or other direction stops without starting a new movement', () => {
  for (const target of [null, 'right', 'center']) {
    const { controller, events } = setup();
    controller.begin('up', 1);
    controller.move(target, 1);
    controller.end(1);
    assert.deepEqual(events, ['start:up', 'stop:up']);
  }
});

test('interruptions cancel holds and the decorative center never accepts a press', () => {
  const { controller, events } = setup();
  controller.begin('down', 1);
  controller.cancel();
  controller.end(1);
  assert.equal(controller.begin('center', 2), false);
  assert.equal(controller.active, null);
  controller.cancel();
  controller.end(2);
  assert.deepEqual(events, ['start:down', 'stop:down']);
  assert.equal(controller.begin('center', 3), false);
  controller.end(3);
  assert.deepEqual(events, ['start:down', 'stop:down']);
});

test('rapid taps remain paired and latest callbacks are used during a hold', () => {
  const { controller, events } = setup();
  for (let i = 0; i < 50; i++) { controller.begin('up', i); controller.end(i); }
  assert.equal(events.length, 100);
  controller.begin('left', 100);
  controller.updateCallbacks({ start() {}, stop: direction => events.push(`latest:${direction}`), feedback() {} });
  controller.end(100);
  assert.equal(events.at(-1), 'latest:left');
});

test('every point inside the center remains inactive at all supported scales', () => {
  for (const size of [192, 201.85, 246, 300, 360, 600]) {
    for (const [dx, dy] of [[0, 0], [31, 0], [-31, 0], [0, 31], [0, -31], [20, 20], [-20, -20]]) {
      assert.equal(hitTestDPadTouch((150 + dx) * size / 300, (150 + dy) * size / 300, size), null);
      assert.equal(hitTestDPadTouch((150 + dx) * size / 300, (150 + dy) * size / 300, size, 'up'), null);
    }
  }
});

test('every rapid tap delivers immediate animation feedback even before a React render', () => {
  const feedback = createDPadFeedback();
  const animation = [];
  const movement = [];
  feedback.subscribe('up', { press: () => animation.push('press'), release: () => animation.push('release') });
  const controller = createDPadInteraction({
    start: direction => movement.push(`start:${direction}`),
    stop: direction => movement.push(`stop:${direction}`), feedback: feedback.set,
  });
  // All transitions happen in one JS turn, like batched quick taps/accessibility actions.
  for (let pointer = 0; pointer < 100; pointer++) {
    controller.begin('up', pointer);
    assert.equal(animation.at(-1), 'press');
    assert.equal(animation.length, pointer * 2 + 1);
    controller.end(pointer);
    assert.equal(animation.at(-1), 'release');
  }
  assert.equal(animation.length, 200);
  assert.equal(movement.length, 200);
});

test('feedback follows rapid direction changes and ignores rejected fingers and center taps', () => {
  const feedback = createDPadFeedback();
  const events = [];
  for (const direction of ['up', 'right', 'down', 'left']) {
    feedback.subscribe(direction, { press: () => events.push(`press:${direction}`), release: () => events.push(`release:${direction}`) });
  }
  const controller = createDPadInteraction({ start() {}, stop() {}, feedback: feedback.set });
  controller.begin('left', 1);
  controller.begin('right', 2);
  controller.end(2);
  assert.deepEqual(events, ['press:left']);
  controller.cancel();
  controller.begin('center', 3);
  controller.begin('right', 4);
  controller.end(4);
  assert.deepEqual(events, ['press:left', 'release:left', 'press:right', 'release:right']);
});

test('removed animation listeners receive no late feedback after cleanup', () => {
  const feedback = createDPadFeedback();
  const events = [];
  const unsubscribe = feedback.subscribe('down', { press: () => events.push('press'), release: () => events.push('release') });
  feedback.set('down');
  unsubscribe();
  feedback.set(null);
  feedback.set('down');
  feedback.set(null);
  assert.deepEqual(events, ['press']);
});
