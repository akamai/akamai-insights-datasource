import { DataQueryRequest, DataQueryResponse, DataSourceInstanceSettings, TestDataSourceResponse } from '@grafana/data';
import { DataSourceWithBackend, getBackendSrv } from '@grafana/runtime';
import { catchError, lastValueFrom, map, Observable, of, shareReplay } from 'rxjs';

import { DiscoveryApiModel } from '../types/discovery-api.model';
import { MyDataSourceOptions, MyQuery, TestDataSourceResponseStatus } from '../types/types';

export class DatasourceService extends DataSourceWithBackend<MyQuery, MyDataSourceOptions> {

  private static readonly DISCOVERY = 'discovery';
  private static readonly DATA = 'data';

  constructor(protected readonly instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
  }

  static discoveryApi(id: number): Observable<DiscoveryApiModel> {
    return getBackendSrv()
      .fetch<DiscoveryApiModel>({
        url: `${DatasourceService.getBackendDataSourceUrl(id)}/${DatasourceService.DISCOVERY}` }
      )
      .pipe(
        map(({ data }) => data),
        shareReplay()
      );
  }

  private static getBackendDataSourceUrl(id: number): string {
    return `/api/datasources/${id}/resources`;
  }

  async testDatasource(): Promise<TestDataSourceResponse> {
    const source$ = DatasourceService.discoveryApi(this.id)
      .pipe(
        map(data => this.createTestDataSourceResponse(data ? TestDataSourceResponseStatus.Success : TestDataSourceResponseStatus.Error)),
        catchError(() => of(this.createTestDataSourceResponse(TestDataSourceResponseStatus.Error)))
      );

    return await lastValueFrom(source$);
  }

  query(request: DataQueryRequest<MyQuery>): Observable<DataQueryResponse> {
    const { dimensions, metrics } = request.targets[ 0 ];
    const { from, to } = request.range;
    const body = {
      dimensions,
      metrics
    };

    return getBackendSrv()
      .fetch<DataQueryResponse>({
        method: 'POST',
        url: `${DatasourceService.getBackendDataSourceUrl(this.id)}/${DatasourceService.DATA}`,
        data: {
          body,
          from: from.toISOString(),
          to: to.toISOString()
        }
      })
      .pipe(
        map(({ data }) => data),
        shareReplay()
      );
  }

  private createTestDataSourceResponse(status: TestDataSourceResponseStatus): TestDataSourceResponse {
    if (status === TestDataSourceResponseStatus.Error) {
      return {
        status: TestDataSourceResponseStatus.Error,
        message: 'Data source test failed. Check credentials and try again.'
      };
    }

    return {
      status: TestDataSourceResponseStatus.Success,
      message: 'Data source is working properly.'
    };
    
  }
}

