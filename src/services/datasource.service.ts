import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceInstanceSettings,
  DataSourceVariableSupport,
  FieldType,
  MutableDataFrame,
  TestDataSourceResponse
} from '@grafana/data';
import { BackendSrvRequest, DataSourceWithBackend, getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { isEmpty, omitBy, uniq } from 'lodash';
import {
  catchError,
  delay,
  forkJoin,
  lastValueFrom,
  map,
  Observable,
  of,
  tap
} from 'rxjs';

import { Dimension, DiscoveryApiModel, Metric, ReportsApiModel, TimeDimensionsTypes } from '../types/discovery-api.model';
import { MyDataSourceOptions, MyQuery, TestDataSourceResponseStatus, VARIABLE_QUERY } from '../types/types';

class QueryVariableSupport extends DataSourceVariableSupport<DatasourceService, MyQuery> {
  getDefaultQuery(): Partial<MyQuery> {
    return {
      reportLink: '',
      dimensions: [],
      metrics: [],
      filters: [],
      sortBys: []
    };
  }
}

export class DatasourceService extends DataSourceWithBackend<MyQuery, MyDataSourceOptions> {

  private static readonly DISCOVERY = 'discovery';
  private static readonly REPORTS = 'reports';
  private static readonly DATA = 'data';
  private static readonly MILLISECONDS_IN_SECOND = 1000;
  private static readonly DISCOVERY_CACHE_RETURN_DELAY = 100;
  private static readonly cachedDiscoveryAPIMap = new Map<string, DiscoveryApiModel>();

  constructor(protected readonly instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    this.variables = new QueryVariableSupport();
  }

  static discoveryApi(id: number, targetUrl: string): Observable<DiscoveryApiModel> {
    if (DatasourceService.cachedDiscoveryAPIMap.has(targetUrl)) {
      return of(DatasourceService.cachedDiscoveryAPIMap.get(targetUrl) as DiscoveryApiModel)
        .pipe(
          delay(DatasourceService.DISCOVERY_CACHE_RETURN_DELAY)
        );
    }

    return DatasourceService.makeBackendSrvCall<DiscoveryApiModel>({
      url: `${DatasourceService.getBackendDataSourceUrl(id)}/${DatasourceService.DISCOVERY}`,
      params: {
        targetUrl
      }
    }).pipe(
      tap(data => DatasourceService.cachedDiscoveryAPIMap.set(targetUrl, data))
    );
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
        map(({ data }) => data)
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
    const { scopedVars } = request;
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
      const interpolatedBody = !isEmpty(scopedVars) ? JSON.parse(getTemplateSrv().replace(JSON.stringify(body), scopedVars)) : body;

      return forkJoin([
        getBackendSrv()
          .fetch<Record<string, any>>({
            method: 'POST',
            url: `${DatasourceService.getBackendDataSourceUrl(this.id)}/${DatasourceService.DATA}`,
            data: {
              body: interpolatedBody,
              from: from.toISOString(),
              to: to.toISOString()
            },
            params: {
              targetUrl: reportLink
            },
            hideFromInspector: false
          }),
        DatasourceService.discoveryApi(this.id, reportLink || '')
      ]).pipe(
        map(([ { data: { data } }, discoveryApiModel ]) => ({
          data: [ this.convertToDataFrame(data, discoveryApiModel, refId, dimensions) ]
        }))
      );
    });

    return forkJoin([ ...dataObservables ])
      .pipe(
        map(data => ({ data: data.map(singleQuery => singleQuery.data).flat() }))
      );
  }

  private convertToDataFrame(data: Record<string, any>[], { dimensions, metrics }: DiscoveryApiModel, refId: string, selectedDimensions?: string[]) {
    const fieldsData = [ ...dimensions, ...metrics ];

    const frame = new MutableDataFrame({
      fields: uniq(data?.map(row => Object.keys(row)).flat()).map(dataKey => {
        const fieldData = fieldsData.find(({ name }) => name === dataKey);
        const dataFrame = {
          name: dataKey,
          refId
        };

        return fieldData ? {
          ...dataFrame,
          type: this.getFieldDataType(fieldData)
        } : dataFrame;
      })
    });

    if (refId === VARIABLE_QUERY) {
      frame.fields.forEach(field => {
        if (selectedDimensions?.includes(field.name) && field.type !== FieldType.time) {
          field.type = FieldType.string;
        }
      });

      const stringFields = frame.fields.filter(({ type }) => type === FieldType.string);
      const firstStringDimension = selectedDimensions?.find(dimension => stringFields.find(({ name }) => name === dimension));
      const variableField = stringFields.find(field => field.name === firstStringDimension);

      if (variableField) {
        frame.fields = frame.fields.filter(({ type }) => type !== FieldType.string);
        frame.fields.push(variableField);
      }
    }

    data?.forEach(row => frame.add(row));

    const hasTimeField = frame.fields.find(field => field.type === FieldType.time);

    if (hasTimeField) {
      for (let i = 0; i < hasTimeField.values.length; i++) {
        hasTimeField.values.set(i, hasTimeField.values.get(i) * DatasourceService.MILLISECONDS_IN_SECOND)
      }
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

  private getFieldDataType({ type }: Dimension | Metric): FieldType {
    if (TimeDimensionsTypes.includes(type)) {
      return FieldType.time;
    }

    return type.toLowerCase() === FieldType.string ? FieldType.string : FieldType.number;
  };
}

