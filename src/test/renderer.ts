import { act, ReactElement } from 'react';
import TestRenderer, { ReactTestRenderer } from 'react-test-renderer';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// React 19 renders asynchronously unless wrapped in act(), so flush synchronously here
const renderer = {
  create(element: ReactElement): ReactTestRenderer {
    let instance!: ReactTestRenderer;
    act(() => {
      instance = TestRenderer.create(element);
    });
    return instance;
  }
};

export default renderer;
