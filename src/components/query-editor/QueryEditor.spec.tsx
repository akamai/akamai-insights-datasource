import React from 'react';
import renderer from 'react-test-renderer';
import { of } from 'rxjs';

import { QueryEditor } from './QueryEditor';
import { DatasourceService } from '../../services/datasource.service';
import { mockReportsApi } from '../../test/mocks/mock-reports-api';
import { MyQuery } from '../../types/types';

const datasource: any = {
  id: 1
};

describe('given QueryEditor', () => {
  test('should render new empty editor', () => {
    const query = {
      dimensions: [],
      metrics: [],
      reportLink: ''
    } as any as MyQuery;

    jest.spyOn(DatasourceService, 'reportsApi').mockReturnValue(of(mockReportsApi));
    const onChange = jest.fn();
    const onRunQuery = jest.fn();

    const tree = renderer.create(
      <QueryEditor query={query} datasource={datasource} onChange={onChange} onRunQuery={onRunQuery}/>
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });

  test('should render editor with initial value', () => {
    const query = {
      dimensions: [],
      metrics: [],
      reportLink: '/reporting-api/v2/reports/delivery/traffic/emissions'
    } as any as MyQuery;

    jest.spyOn(DatasourceService, 'reportsApi').mockReturnValue(of(mockReportsApi));
    const onChange = jest.fn();
    const onRunQuery = jest.fn();

    const tree = renderer.create(
      <QueryEditor query={query} datasource={datasource} onChange={onChange} onRunQuery={onRunQuery}/>
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });
});
