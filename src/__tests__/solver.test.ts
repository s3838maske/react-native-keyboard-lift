import { solveScroll } from '../core/solver';
import type { SolveScrollInput } from '../core/solver';

/**
 * A representative layout used by most cases below.
 *
 *   window        0 .. 800
 *   container   100 .. 700
 *   keyboard    500 .. 800   (occludes 300)
 *   visible     100 .. 500
 */
const BASE: SolveScrollInput = {
  containerRect: { x: 0, y: 100, width: 400, height: 600 },
  inputRect: { x: 0, y: 200, width: 400, height: 40 },
  windowHeight: 800,
  occludedHeight: 300,
  currentOffset: 0,
  contentHeight: 2000,
  containerHeight: 600,
  extraSpace: 12,
  behavior: 'minimal',
};

function solve(overrides: Partial<SolveScrollInput> = {}) {
  return solveScroll({ ...BASE, ...overrides });
}

describe('solveScroll', () => {
  describe('input visibility', () => {
    it('leaves a fully visible input alone', () => {
      const result = solve({ inputRect: { x: 0, y: 200, width: 400, height: 40 } });
      expect(result.shouldScroll).toBe(false);
      expect(result.delta).toBe(0);
    });

    it('scrolls exactly the covered amount for a partially covered input', () => {
      // bottom = 520, needs 520 + 12 of room but only has 500.
      const result = solve({ inputRect: { x: 0, y: 480, width: 400, height: 40 } });
      expect(result.shouldScroll).toBe(true);
      expect(result.delta).toBe(32);
      expect(result.offset).toBe(32);
    });

    it('scrolls a fully hidden input into view', () => {
      const result = solve({ inputRect: { x: 0, y: 600, width: 400, height: 40 } });
      expect(result.shouldScroll).toBe(true);
      expect(result.offset).toBe(152);
    });

    it('scrolls back up for an input above the visible area', () => {
      const result = solve({
        inputRect: { x: 0, y: 50, width: 400, height: 40 },
        currentOffset: 200,
      });
      expect(result.shouldScroll).toBe(true);
      expect(result.delta).toBe(-50);
      expect(result.offset).toBe(150);
    });

    it('does nothing when the keyboard is closed and the input already fits', () => {
      const result = solve({
        occludedHeight: 0,
        inputRect: { x: 0, y: 600, width: 400, height: 40 },
      });
      expect(result.shouldScroll).toBe(false);
    });
  });

  describe('extraSpace', () => {
    it('is respected when deciding whether an input is covered', () => {
      const input = { x: 0, y: 450, width: 400, height: 40 };

      // bottom = 490, which fits in 500 with no breathing room requested.
      expect(solve({ inputRect: input, extraSpace: 0 }).shouldScroll).toBe(false);
      // ...but not once 50pt of breathing room is asked for.
      expect(solve({ inputRect: input, extraSpace: 50 }).delta).toBe(40);
    });
  });

  describe('scroll behaviour', () => {
    it('centres the input when asked', () => {
      // input centre 620, visible centre 300 => move 320.
      const result = solve({
        inputRect: { x: 0, y: 600, width: 400, height: 40 },
        behavior: 'center',
      });
      expect(result.delta).toBe(320);
    });

    it('does not centre an input that is already visible', () => {
      const result = solve({
        inputRect: { x: 0, y: 200, width: 400, height: 40 },
        behavior: 'center',
      });
      expect(result.shouldScroll).toBe(false);
    });

    it('aligns the top of an input taller than the visible area', () => {
      // Cannot satisfy both edges, so prefer showing the top.
      const result = solve({
        inputRect: { x: 0, y: 300, width: 400, height: 500 },
      });
      expect(result.delta).toBe(200);
    });
  });

  describe('clamping', () => {
    it('never scrolls past the end of the content', () => {
      // Classic "last input in the form" case: only 100pt of scroll exists.
      const result = solve({
        inputRect: { x: 0, y: 600, width: 400, height: 40 },
        contentHeight: 700,
        containerHeight: 600,
      });
      expect(result.shouldScroll).toBe(true);
      expect(result.offset).toBe(100);
    });

    it('never scrolls above the top of the content', () => {
      const result = solve({
        inputRect: { x: 0, y: 50, width: 400, height: 40 },
        currentOffset: 20,
      });
      expect(result.offset).toBe(0);
      expect(result.delta).toBe(-20);
    });

    it('treats unmeasured content as unbounded', () => {
      const result = solve({
        inputRect: { x: 0, y: 600, width: 400, height: 40 },
        contentHeight: null,
        containerHeight: null,
      });
      expect(result.offset).toBe(152);
    });

    it('reports no scroll when already at the clamped limit', () => {
      const result = solve({
        inputRect: { x: 0, y: 600, width: 400, height: 40 },
        contentHeight: 600,
        containerHeight: 600,
      });
      expect(result.shouldScroll).toBe(false);
    });
  });

  describe('degenerate layouts', () => {
    it('does nothing when the keyboard covers the whole container', () => {
      const result = solve({ occludedHeight: 750 });
      expect(result.shouldScroll).toBe(false);
    });

    it('does nothing for a zero-height container', () => {
      const result = solve({
        containerRect: { x: 0, y: 100, width: 400, height: 0 },
      });
      expect(result.shouldScroll).toBe(false);
    });

    it('ignores sub-pixel adjustments to avoid jitter', () => {
      // bottom = 488.5 => needs 0.5pt, below the movement threshold.
      const result = solve({
        inputRect: { x: 0, y: 448.5, width: 400, height: 40 },
      });
      expect(result.shouldScroll).toBe(false);
    });

    it('survives NaN measurements without scrolling', () => {
      expect(
        solve({ inputRect: { x: 0, y: Number.NaN, width: 400, height: 40 } })
          .shouldScroll,
      ).toBe(false);

      expect(solve({ currentOffset: Number.NaN }).shouldScroll).toBe(false);

      expect(
        solve({
          containerRect: { x: 0, y: 100, width: 400, height: Number.NaN },
        }).shouldScroll,
      ).toBe(false);
    });
  });

  describe('small screens', () => {
    it('handles a keyboard that leaves only a sliver visible', () => {
      // 320x480 device, 250pt keyboard, container fills the screen.
      const result = solve({
        containerRect: { x: 0, y: 0, width: 320, height: 480 },
        inputRect: { x: 0, y: 300, width: 320, height: 40 },
        windowHeight: 480,
        occludedHeight: 250,
        containerHeight: 480,
        contentHeight: 1200,
      });
      // visible 0..230, input bottom 340 => 340 + 12 - 230
      expect(result.delta).toBe(122);
    });
  });
});
