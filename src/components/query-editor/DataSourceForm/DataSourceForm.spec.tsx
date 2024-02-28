import React from 'react';
import renderer from 'react-test-renderer';

import { Dimension, DiscoveryApiModel, Metric } from '../../../types/discovery-api.model';
import { MyQuery } from '../../../types/types';
import { DataSourceForm } from './DataSourceForm';

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
  datasource
} as any as DiscoveryApiModel;

describe('DataSourceForm component', () => {
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
});
