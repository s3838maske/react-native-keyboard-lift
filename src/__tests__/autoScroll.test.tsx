import { act, renderHook } from '@testing-library/react-native';
import { Dimensions } from 'react-native';

import { useKeyboardAware } from '../hooks/useKeyboardAware';
import type { UseKeyboardAwareOptions } from '../hooks/useKeyboardAware';
import { getFocusedInput, warnIfFocusDetectionUnavailable } from '../core/focus';
import { measureInWindow } from '../core/measure';
import type { MeasurableNode, Rect } from '../types';
import { emitKeyboardHide, emitKeyboardShow } from './helpers/keyboardEvents';

jest.mock('../core/focus', () => ({
  getFocusedInput: jest.fn(),
  getNodeTag: jest.fn(() => 42),
  warnIfFocusDetectionUnavailable: jest.fn(),
}));

jest.mock('../core/measure', () => ({
  measureInWindow: jest.fn(),
  asMeasurable: (node: unknown) => node ?? null,
}));

const mockGetFocusedInput = getFocusedInput as jest.MockedFunction<
  typeof getFocusedInput
>;
const mockMeasure = measureInWindow as jest.MockedFunction<typeof measureInWindow>;
const mockWarnNoFocus = warnIfFocusDetectionUnavailable as jest.MockedFunction<
  typeof warnIfFocusDetectionUnavailable
>;

const WINDOW_HEIGHT = Dimensions.get('window').height;
const KEYBOARD_HEIGHT = 300;

const CONTAINER: MeasurableNode = { measureInWindow: jest.fn() };
const INPUT: MeasurableNode = { measureInWindow: jest.fn() };

const CONTAINER_RECT: Rect = { x: 0, y: 0, width: 400, height: WINDOW_HEIGHT };

/** An input sitting 250pt above the bottom of the window, so 300pt of keyboard covers it. */
const COVERED_INPUT_RECT: Rect = {
  x: 0,
  y: WINDOW_HEIGHT - 250,
  width: 400,
  height: 40,
};

/** An input near the top of the screen, comfortably above the keyboard. */
const VISIBLE_INPUT_RECT: Rect = { x: 0, y: 100, width: 400, height: 40 };

function setMeasurements(inputRect: Rect | null, containerRect: Rect | null = CONTAINER_RECT) {
  mockMeasure.mockImplementation(async (node) =>
    node === CONTAINER ? containerRect : inputRect,
  );
}

async function setup(overrides: Partial<UseKeyboardAwareOptions> = {}) {
  const scrollToOffset = jest.fn();

  const rendered = await renderHook(() =>
    useKeyboardAware({
      getContainerNode: () => CONTAINER,
      scrollToOffset,
      ...overrides,
    }),
  );

  // Establish the layout the solver needs for clamping.
  await act(async () => {
    rendered.result.current?.handleLayout({
      nativeEvent: { layout: { x: 0, y: 0, width: 400, height: WINDOW_HEIGHT } },
    } as Parameters<NonNullable<typeof rendered.result.current>['handleLayout']>[0]);
    rendered.result.current?.handleContentSizeChange(400, 4000);
  });

  return { ...rendered, scrollToOffset };
}

async function showKeyboard(): Promise<void> {
  await act(async () => {
    emitKeyboardShow({ height: KEYBOARD_HEIGHT, windowHeight: WINDOW_HEIGHT });
  });
}

async function hideKeyboard(): Promise<void> {
  await act(async () => {
    emitKeyboardHide();
  });
}

beforeEach(() => {
  mockGetFocusedInput.mockReset();
  mockMeasure.mockReset();
  mockWarnNoFocus.mockReset();
  mockGetFocusedInput.mockReturnValue(INPUT);
  setMeasurements(COVERED_INPUT_RECT);
});

afterEach(async () => {
  await hideKeyboard();
});

describe('automatic scrolling', () => {
  it('scrolls a covered input into view when the keyboard opens', async () => {
    const { scrollToOffset } = await setup();

    await showKeyboard();

    // visible bottom = H - 300; input bottom = H - 210; default extraSpace 12.
    // (H - 210 + 12) - (H - 300) = 102
    expect(scrollToOffset).toHaveBeenCalledWith(102, true);
  });

  it('leaves an already visible input alone', async () => {
    setMeasurements(VISIBLE_INPUT_RECT);
    const { scrollToOffset } = await setup();

    await showKeyboard();

    expect(scrollToOffset).not.toHaveBeenCalled();
  });

  it('honours extraSpace', async () => {
    const { scrollToOffset } = await setup({ extraSpace: 50 });

    await showKeyboard();

    expect(scrollToOffset).toHaveBeenCalledWith(140, true);
  });

  it('accepts the deprecated extraScrollHeight alias', async () => {
    const { scrollToOffset } = await setup({ extraScrollHeight: 50 });

    await showKeyboard();

    expect(scrollToOffset).toHaveBeenCalledWith(140, true);
  });

  it('does nothing when disabled', async () => {
    const { scrollToOffset } = await setup({ enabled: false });

    await showKeyboard();

    expect(scrollToOffset).not.toHaveBeenCalled();
  });

  it('reports what it did through onScrollToInput', async () => {
    const onScrollToInput = jest.fn();
    await setup({ onScrollToInput });

    await showKeyboard();

    expect(onScrollToInput).toHaveBeenCalledWith(
      expect.objectContaining({
        target: 42,
        from: 0,
        to: 102,
        reason: 'keyboard',
        inputRect: COVERED_INPUT_RECT,
      }),
    );
  });

  it('notifies onKeyboardChange with normalised geometry', async () => {
    const onKeyboardChange = jest.fn();
    await setup({ onKeyboardChange });

    await showKeyboard();

    expect(onKeyboardChange).toHaveBeenCalledWith(
      expect.objectContaining({ isVisible: true, occludedHeight: KEYBOARD_HEIGHT }),
    );
  });
});

describe('graceful degradation', () => {
  it('skips scrolling when no input can be identified', async () => {
    mockGetFocusedInput.mockReturnValue(null);
    const { scrollToOffset } = await setup();

    await showKeyboard();

    expect(scrollToOffset).not.toHaveBeenCalled();
    expect(mockWarnNoFocus).toHaveBeenCalled();
  });

  it('skips scrolling when the input cannot be measured', async () => {
    setMeasurements(null);
    const { scrollToOffset } = await setup();

    await showKeyboard();

    expect(scrollToOffset).not.toHaveBeenCalled();
  });

  it('skips scrolling when the container cannot be measured', async () => {
    setMeasurements(COVERED_INPUT_RECT, null);
    const { scrollToOffset } = await setup();

    await showKeyboard();

    expect(scrollToOffset).not.toHaveBeenCalled();
  });

  it('skips scrolling when there is no container node at all', async () => {
    const { scrollToOffset } = await setup({ getContainerNode: () => null });

    await showKeyboard();

    expect(scrollToOffset).not.toHaveBeenCalled();
  });
});

describe('scroll restoration', () => {
  it('does not move on hide by default', async () => {
    const { scrollToOffset } = await setup();

    await showKeyboard();
    scrollToOffset.mockClear();
    await hideKeyboard();

    expect(scrollToOffset).not.toHaveBeenCalled();
  });

  it('returns to the pre-keyboard offset when asked', async () => {
    const { scrollToOffset, result } = await setup({ resetScrollOnHide: true });

    // The user had scrolled to 500 before focusing anything.
    await act(async () => {
      result.current?.handleScroll({
        nativeEvent: { contentOffset: { x: 0, y: 500 } },
      } as Parameters<NonNullable<typeof result.current>['handleScroll']>[0]);
    });

    await showKeyboard();
    scrollToOffset.mockClear();
    await hideKeyboard();

    expect(scrollToOffset).toHaveBeenCalledWith(500, true);
  });

  it('returns to explicit coordinates when given them', async () => {
    const { scrollToOffset } = await setup({
      resetScrollOnHide: { x: 0, y: 0 },
    });

    await showKeyboard();
    scrollToOffset.mockClear();
    await hideKeyboard();

    expect(scrollToOffset).toHaveBeenCalledWith(0, true);
  });
});

describe('dynamic content', () => {
  it('re-checks the focused input when content height changes', async () => {
    const { scrollToOffset, result } = await setup();

    await showKeyboard();
    scrollToOffset.mockClear();

    // An inline validation message appears and the content grows.
    await act(async () => {
      result.current?.handleContentSizeChange(400, 4200);
    });

    expect(scrollToOffset).toHaveBeenCalled();
  });

  it('ignores a content size change while the keyboard is closed', async () => {
    const { scrollToOffset, result } = await setup();

    await act(async () => {
      result.current?.handleContentSizeChange(400, 4200);
    });

    expect(scrollToOffset).not.toHaveBeenCalled();
  });
});
