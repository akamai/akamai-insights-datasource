import React from 'react';
import renderer from 'react-test-renderer';

import { SortByEditor } from './SortByEditor';
import { mockDimensionsOptions, mockMetricsOptions } from '../../../../test/mocks/mock-selectable-values';
import { sortByOrderOptions, SortByQueryFormModel } from '../FormTypes';

describe('SortEditor component', () => {
  it('should render dimension editor', () => {
    const model: SortByQueryFormModel = {
      name: mockDimensionsOptions[ 1 ],
      sortOrder: sortByOrderOptions[ 1 ]
    };

    const names = mockDimensionsOptions;
    const onChange = jest.fn();

    const tree = renderer.create(
      <SortByEditor model={model} names={names} onChange={onChange}/>
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });

  it('should render metric editor', () => {
    const model: SortByQueryFormModel = {
      name: mockMetricsOptions[ 1 ],
      sortOrder: sortByOrderOptions[ 1 ]
    };

    const names = mockMetricsOptions;
    const onChange = jest.fn();

    const tree = renderer.create(
      <SortByEditor model={model} names={names} onChange={onChange}/>
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });
});
