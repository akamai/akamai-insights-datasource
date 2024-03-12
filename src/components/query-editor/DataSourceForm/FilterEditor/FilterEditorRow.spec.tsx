import React from 'react';
import renderer from 'react-test-renderer';

import { mockDimensionsOptions, mockMetricsOptions } from '../../../../test/mocks/mock-selectable-values';
import { dimensionOperatorOptions, FilterFormModel, filterTypeOptions, metricOperatorOptions } from '../FormTypes';
import { FilterEditorRow } from './FilterEditorRow';

describe('FilterEditorRow component', () => {
  it('should render dimension row', () => {
    const model: FilterFormModel = {
      type: filterTypeOptions[ 0 ],
      query: {
        name: mockDimensionsOptions[ 1 ],
        operator: dimensionOperatorOptions[ 0 ],
        expressions: [ '1234' ]
      }
    };

    const onChange = jest.fn();

    const tree = renderer.create(
      <FilterEditorRow model={model} dimensions={mockDimensionsOptions} metrics={mockMetricsOptions} onChange={onChange}/>
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });

  it('should render metric row', () => {
    const model: FilterFormModel = {
      type: filterTypeOptions[ 1 ],
      query: {
        name: mockMetricsOptions[ 1 ],
        operator: metricOperatorOptions[ 0 ],
        expressions: [ '1234' ]
      }
    };

    const onChange = jest.fn();

    const tree = renderer.create(
      <FilterEditorRow model={model} dimensions={mockDimensionsOptions} metrics={mockMetricsOptions} onChange={onChange}/>
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });
});