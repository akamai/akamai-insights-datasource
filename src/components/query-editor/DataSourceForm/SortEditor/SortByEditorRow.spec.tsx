import React from 'react';
import renderer from 'react-test-renderer';

import { SortByEditorRow } from './SortByEditorRow';
import { mockDimensionsOptions, mockMetricsOptions } from '../../../../test/mocks/mock-selectable-values';
import {
  filterTypeOptions,
  SortByFormModel,
  sortByOrderOptions
} from '../FormTypes';
describe('SortByEditorRow component', () => {
  it('should render dimension row', () => {
    const model: SortByFormModel = {
      type: filterTypeOptions[ 0 ],
      query: {
        name: mockDimensionsOptions[ 1 ],
        sortOrder: sortByOrderOptions[ 1 ]
      }
    };

    const onChange = jest.fn();

    const tree = renderer.create(
      <SortByEditorRow model={model} dimensions={mockDimensionsOptions} metrics={mockMetricsOptions} onChange={onChange}/>
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });

  it('should render metric row', () => {
    const model: SortByFormModel = {
      type: filterTypeOptions[ 1 ],
      query: {
        name: mockMetricsOptions[ 1 ],
        sortOrder: sortByOrderOptions[ 0 ]
      }
    };

    const onChange = jest.fn();

    const tree = renderer.create(
      <SortByEditorRow model={model} dimensions={mockDimensionsOptions} metrics={mockMetricsOptions} onChange={onChange}/>
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });
});
