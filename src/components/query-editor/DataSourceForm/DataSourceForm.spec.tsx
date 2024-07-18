import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import renderer from 'react-test-renderer';

import { DataSourceForm } from './DataSourceForm';
import { Dimension, DiscoveryApiModel, Metric } from '../../../types/discovery-api.model';
import { MyQuery } from '../../../types/types';

const datasource: any = {};
const model: DiscoveryApiModel = {
  dimensions: [
    {
      name: 'cpcode'
    } as Dimension
  ],
  metrics: [
    {
      name: 'edgeHitsSum'
    } as Metric
  ],
  defaults: {
    defaultMetrics: [
      'edgeHitsSum'
    ],
    defaultDimensions: [
      'cpcode'
    ],
    defaultSortBys: [
      {
        name: 'edgeHitsSum',
        sortOrder: 'DESCENDING'
      }
    ]
  },
  datasource
} as any as DiscoveryApiModel;

describe('DataSourceForm component', () => {
  it('should render editor with default values and info alert', () => {
    const query = {
      datasource
    } as any as MyQuery;

    const onChange = jest.fn();
    const onRunQuery = jest.fn();

    const tree = renderer.create(
      <DataSourceForm datasource={datasource} query={query} model={model} onChange={onChange} onRunQuery={onRunQuery}/>
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });

  it('should render new empty editor', () => {
    const query = {
      dimensions: [],
      metrics: [],
      datasource
    } as any as MyQuery;

    const onChange = jest.fn();
    const onRunQuery = jest.fn();

    const tree = renderer.create(
      <DataSourceForm datasource={datasource} query={query} model={model} onChange={onChange} onRunQuery={onRunQuery}/>
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });

  it('should render existing edit editor', () => {
    const query = {
      dimensions: [ 'cpcode' ],
      metrics: [ 'edgeHitsSum' ],
      datasource
    } as any as MyQuery;

    const onChange = jest.fn();
    const onRunQuery = jest.fn();

    const tree = renderer.create(
      <DataSourceForm datasource={datasource} query={query} model={model} onChange={onChange} onRunQuery={onRunQuery}/>
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });

  it('should hide info about default values on form change', () => {
    const query = {
      datasource
    } as any as MyQuery;

    const onChange = jest.fn();
    const onRunQuery = jest.fn();

    const component = render(
      <DataSourceForm datasource={datasource} query={query} model={model} onChange={onChange} onRunQuery={onRunQuery}/>
    );

    expect(component.queryByText('Default values')).toBeDefined();

    fireEvent.click(component.container.querySelectorAll('[type="reset"]')[ 1 ]);

    expect(component.queryByText('Default values')).toBeNull();
    expect(component).toMatchSnapshot();
  });

});
