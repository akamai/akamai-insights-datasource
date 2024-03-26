import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceInstanceSettings,
  FieldType,
  MutableDataFrame,
  TestDataSourceResponse
} from '@grafana/data';
import { BackendSrvRequest, DataSourceWithBackend, getBackendSrv } from '@grafana/runtime';
import { isEmpty, omitBy, uniq } from 'lodash';
import {
  catchError,
  forkJoin,
  lastValueFrom,
  map,
  Observable,
  of,
  shareReplay,
  withLatestFrom
} from 'rxjs';

import { DiscoveryApiModel, ReportsApiModel } from '../types/discovery-api.model';
import { MyDataSourceOptions, MyQuery, TestDataSourceResponseStatus } from '../types/types';

export class DatasourceService extends DataSourceWithBackend<MyQuery, MyDataSourceOptions> {

  private static readonly DISCOVERY = 'discovery';
  private static readonly REPORTS = 'reports';
  private static readonly DATA = 'data';
  private static readonly MILLISECONDS_IN_SECOND = 1000;

  constructor(protected readonly instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
  }

  static discoveryApi(id: number, targetUrl: string): Observable<DiscoveryApiModel> {
    return DatasourceService.makeBackendSrvCall({
      url: `${DatasourceService.getBackendDataSourceUrl(id)}/${DatasourceService.DISCOVERY}`,
      params: {
        targetUrl
      }
    });
  }

  static reportsApi(id: number): Observable<ReportsApiModel> {
    return DatasourceService.makeBackendSrvCall({
      url: `${DatasourceService.getBackendDataSourceUrl(id)}/${DatasourceService.REPORTS}`
    });
  }

  private static makeBackendSrvCall<T>(options: BackendSrvRequest): Observable<T> {
    return getBackendSrv()
      .fetch<T>(options)
      .pipe(
        map(({ data }) => data),
        shareReplay()
      );
  }

  private static getBackendDataSourceUrl(id: number): string {
    return `/api/datasources/${id}/resources`;
  }

  async testDatasource(): Promise<TestDataSourceResponse> {
    const source$ = DatasourceService.reportsApi(this.id)
      .pipe(
        map(data => this.createTestDataSourceResponse(data ? TestDataSourceResponseStatus.Success : TestDataSourceResponseStatus.Error)),
        catchError(() => of(this.createTestDataSourceResponse(TestDataSourceResponseStatus.Error)))
      );

    return await lastValueFrom(source$);
  }

  query(request: DataQueryRequest<MyQuery>): Observable<DataQueryResponse> {
    const dataObservables = request.targets.map(target => {
      const { dimensions, metrics, filters, sortBys, reportLink, refId } = target;
      const { from, to } = request.range;
      const body = {
        ...omitBy({
          dimensions,
          metrics,
          filters,
          sortBys
        }, isEmpty)
      };

      return getBackendSrv()
        .fetch<Record<string, any>>({
          method: 'POST',
          url: `${DatasourceService.getBackendDataSourceUrl(this.id)}/${DatasourceService.DATA}`,
          data: {
            body,
            from: from.toISOString(),
            to: to.toISOString()
          },
          params: {
            targetUrl: reportLink
          }
        })
        .pipe(
          withLatestFrom(DatasourceService.discoveryApi(this.id, reportLink || '')),
          map(([ { data: { data } }, discoveryApiModel ]) => ({
              data: [ this.convertToDataFrame(data, discoveryApiModel, refId) ]
          }))
        );
    });

    return forkJoin([ ...dataObservables ])
      .pipe(
        map(data => ({ data: data.map(singleQuery => singleQuery.data).flat() }))
      );
  }

  private convertToDataFrame(data: Record<string, any>[], discoveryApiModel: DiscoveryApiModel, refId: string) {
    const fieldsData = [ ...discoveryApiModel.dimensions, ...discoveryApiModel.metrics ];
    const frame = new MutableDataFrame({
      fields: uniq(data?.map(row => Object.keys(row)).flat()).map(dataKey => {
        const fieldData = fieldsData.find(({ name }) => name === dataKey);
        const type = fieldData?.type.toLowerCase() === FieldType.string ? FieldType.string : FieldType.number;

        return {
          name: dataKey,
          // Change to type matching after https://track.akamai.com/jira/browse/DPS-28473 is done
          type: dataKey.includes('time') ? FieldType.time : type,
          refId
        };
      })
    });

    data?.forEach(row => frame.add(row));

    const hasTimeField = frame.fields.find(field => field.type === FieldType.time);

    if (hasTimeField) {
      hasTimeField.values = hasTimeField.values.map(value => value * DatasourceService.MILLISECONDS_IN_SECOND);
    }

    return frame;
  };

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

