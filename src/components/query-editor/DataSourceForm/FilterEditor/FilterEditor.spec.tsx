import React from 'react';
import renderer from 'react-test-renderer';

import { FilterEditor } from './FilterEditor';
import { mockDimensionsOptions, mockMetricsOptions } from '../../../../test/mocks/mock-selectable-values';
import { dimensionOperatorOptions, FilterQueryFormModel, metricOperatorOptions } from '../FormTypes';

describe('FilterEditor component', () => {
  it('should render dimension editor', () => {
    const model: FilterQueryFormModel = {
      name: mockDimensionsOptions[ 1 ],
      operator: dimensionOperatorOptions[ 0 ],
      expressions: [ '1234', '5678' ]
    };

    const names = mockDimensionsOptions;
    const onChange = jest.fn();

    const tree = renderer.create(
      <FilterEditor model={model} names={names} operators={dimensionOperatorOptions} multiExpressions={true} onChange={onChange}/>
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });

  it('should render metric editor', () => {
    const model: FilterQueryFormModel = {
      name: mockMetricsOptions[ 1 ],
      operator: metricOperatorOptions[ 0 ],
      expressions: [ '1000' ]
    };

    const names = mockMetricsOptions;
    const onChange = jest.fn();

    const tree = renderer.create(
      <FilterEditor model={model} names={names} operators={metricOperatorOptions} multiExpressions={false} onChange={onChange}/>
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });
});
