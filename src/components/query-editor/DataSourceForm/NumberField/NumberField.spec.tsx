import React from 'react';
import renderer from 'react-test-renderer';

import { NumberField } from './NumberField';

describe('NumberField component', () => {
  it('should render field', () => {
    const model = 100;

    const onChange = jest.fn();

    const tree = renderer.create(
      <NumberField fieldLabel="Limit" model={model} min={0} onChange={onChange}/>
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });
});
