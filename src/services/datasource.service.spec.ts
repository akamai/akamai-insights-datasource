import { DataSourcePluginMeta, FieldType } from '@grafana/data';
import { BackendSrvRequest, getBackendSrv } from '@grafana/runtime';
import { of, throwError } from 'rxjs';

import { DatasourceService } from './datasource.service';
import { discoveryTraffic } from '../test/mocks/mock-discovery-api';
import { DataType, DiscoveryApiModel } from '../types/discovery-api.model';
import { VARIABLE_QUERY } from '../types/types';

jest.mock('@grafana/runtime');

describe('DatasourceService', () => {
  let service: DatasourceService;

  beforeEach(() => {
    service = new DatasourceService({
      access: 'direct',
      jsonData: {},
      meta: null as unknown as DataSourcePluginMeta,
      name: '',
      readOnly: false,
      type: '',
      uid: '',
      id: 1
    });
  });

  test('given discoveryApi', done => {
    // @ts-ignore
    getBackendSrv.mockImplementation(() => ({
      fetch: () => of({ data: [ 'test ' ] })
    }));

    DatasourceService.discoveryApi(1, '/reporting-reports-executor-api/v2/reports/delivery/traffic')
      .subscribe({
        next: data => {
          expect(data).toEqual([ 'test ' ]);
          done();
        }
      });
  });

  test('given reportsApi', done => {
    // @ts-ignore
    getBackendSrv.mockImplementation(() => ({
      fetch: () => of({ data: { reports: [] } })
    }));

    DatasourceService.reportsApi(1)
      .subscribe({
        next: data => {
          expect(data).toEqual({ reports: [] } );
          done();
        }
      });
  });

  describe('given query method', () => {
    describe('and no discovery api response is saved', () => {
      beforeEach(() => {
        // @ts-ignore
        DatasourceService.cachedDiscoveryAPIMap.clear();
      });

      test('when only 1 query is executed', done => {
        const target = {
          dimensions: [ 'time5minutes', 'hostname' ],
          metrics: [ 'edgeHitsSum' ],
          limit: 1000,
          reportLink: '/reporting-reports-executor-api/v2/reports/delivery/traffic',
          refId: 'A'
        };
        // @ts-ignore
        getBackendSrv.mockImplementation(() => ({
          fetch: (options: BackendSrvRequest) => {
            if (options.url.includes('discovery')) {
              return of({ data: discoveryTraffic });
            }

            return of({ data: { data: [ { edgeHitsSum: 1000, time5minutes: 1710155443, hostname: 'akamai.com' } ] } });
          }
        }));

        service.query({ targets: [ target ], range: {
            from: new Date('03-10-2024'),
            to: new Date('03-12-2024')
        } } as any)
          .subscribe({
            next: response => {
              // @ts-ignore
              expect(response.data[ 0 ].fields).toEqual([
                {
                  config: {},
                  name: 'edgeHitsSum',
                  refId: 'A',
                  type: 'number',
                  values: [
                    1000
                  ]
                },
                {
                  config: {},
                  name: 'time5minutes',
                  refId: 'A',
                  type: 'time',
                  values: [
                    1710155443000
                  ]
                },
                {
                  config: {},
                  name: 'hostname',
                  refId: 'A',
                  type: 'string',
                  values: [
                    'akamai.com'
                  ]
                }
              ]);
              done();
            }
          });
      });

      test('when multiple queries are executed', done => {
        const target = {
          dimensions: [ 'time5minutes' ],
          metrics: [ 'edgeHitsSum' ],
          limit: 1000,
          reportLink: '/reporting-reports-executor-api/v2/reports/delivery/traffic',
          refId: 'A'
        };
        // @ts-ignore
        getBackendSrv.mockImplementation(() => ({
          fetch: (options: BackendSrvRequest) => {
            if (options.url.includes('discovery')) {
              return of({ data: discoveryTraffic });
            }

            if (options.data.body.metrics.includes('edgeBytesSum')) {
              return of({ data: { data: [ { edgeBytesSum: 20000, time5minutes: 1710155443 } ] } });
            }

            return of({ data: { data: [ { edgeHitsSum: 1000, time5minutes: 1710155443 } ] } });
          }
        }));

        service.query({ targets: [ target, { ...target, refId: 'B', metrics: [ 'edgeBytesSum' ] } ], range: {
            from: new Date('03-10-2024'),
            to: new Date('03-12-2024')
        } } as any)
          .subscribe({
            next: response => {
              // @ts-ignore
              expect(response.data[ 0 ].fields).toEqual([
                {
                  config: {},
                  name: 'edgeHitsSum',
                  refId: 'A',
                  type: 'number',
                  values: [
                    1000
                  ]
                },
                {
                  config: {},
                  name: 'time5minutes',
                  refId: 'A',
                  type: 'time',
                  values: [
                    1710155443000
                  ]
                }
              ]);
              expect(response.data[ 1 ].fields).toEqual([
                {
                  config: {},
                  name: 'edgeBytesSum',
                  refId: 'B',
                  type: 'number',
                  values: [
                    20000
                  ]
                },
                {
                  config: {},
                  name: 'time5minutes',
                  refId: 'B',
                  type: 'time',
                  values: [
                    1710155443000
                  ]
                }
              ]);
              done();
            }
          });
      });
    });

    describe('and discovery api response is saved', () => {
      beforeEach(() => {
        // @ts-ignore
        DatasourceService.cachedDiscoveryAPIMap.set(
          '/reporting-reports-executor-api/v2/reports/delivery/traffic',
          discoveryTraffic as unknown as DiscoveryApiModel
        );
      });

      test('when query is executed', done => {
        const target = {
          dimensions: [ 'time5minutes', 'hostname' ],
          metrics: [ 'edgeHitsSum' ],
          limit: 1000,
          reportLink: '/reporting-reports-executor-api/v2/reports/delivery/traffic',
          refId: 'A'
        };
        // @ts-ignore
        getBackendSrv.mockImplementation(() => ({
          fetch: () => {
            return of({ data: { data: [ { edgeHitsSum: 1000, time5minutes: 1710155443, hostname: 'akamai.com' } ] } });
          }
        }));

        service.query({ targets: [ target ], range: {
            from: new Date('03-10-2024'),
            to: new Date('03-12-2024')
        } } as any)
          .subscribe({
            next: response => {
              // @ts-ignore
              expect(response.data[ 0 ].fields).toEqual([
                {
                  config: {},
                  name: 'edgeHitsSum',
                  refId: 'A',
                  type: 'number',
                  values: [
                    1000
                  ]
                },
                {
                  config: {},
                  name: 'time5minutes',
                  refId: 'A',
                  type: 'time',
                  values: [
                    1710155443000
                  ]
                },
                {
                  config: {},
                  name: 'hostname',
                  refId: 'A',
                  type: 'string',
                  values: [
                    'akamai.com'
                  ]
                }
              ]);
              done();
            }
          });
      });
    });

    describe('and query is triggered by variable panel', () => {
      beforeEach(() => {
        // @ts-ignore
        DatasourceService.cachedDiscoveryAPIMap.clear();
      });

      test('should filter results to return only one string field in frames', done => {
        const target = {
          dimensions: [ 'time5minutes', 'hostname', 'httpMethod' ],
          metrics: [ 'edgeHitsSum' ],
          limit: 1000,
          reportLink: '/reporting-reports-executor-api/v2/reports/delivery/traffic',
          refId: VARIABLE_QUERY
        };
        // @ts-ignore
        getBackendSrv.mockImplementation(() => ({
          fetch: (options: BackendSrvRequest) => {
            if (options.url.includes('discovery')) {
              return of({ data: discoveryTraffic });
            }

            return of({ data: { data: [ { edgeHitsSum: 1000, time5minutes: 1710155443, hostname: 'akamai.com', httpMethod: 'get_head' } ] } });
          }
        }));

        service.query({ targets: [ target ], range: {
            from: new Date('03-10-2024'),
            to: new Date('03-12-2024')
        } } as any)
          .subscribe({
              next: response => {
                // @ts-ignore
                expect(response.data[ 0 ].fields).toEqual([
                  {
                    config: {},
                    name: 'edgeHitsSum',
                    refId: VARIABLE_QUERY,
                    type: 'number',
                    values: [
                      1000
                    ]
                  },
                  {
                    config: {},
                    name: 'time5minutes',
                    refId: VARIABLE_QUERY,
                    type: 'time',
                    values: [
                      1710155443000
                    ]
                  },
                  {
                    config: {},
                    name: 'hostname',
                    refId: VARIABLE_QUERY,
                    type: 'string',
                    values: [
                      'akamai.com'
                    ]
                  }
                ]);
                done();
              }
          });
      });
    });
  });

  describe('given testDatasource', () => {
    test('when discovery api responds with 200 status', done => {
      // @ts-ignore
      getBackendSrv.mockImplementation(() => ({
        fetch: () => of({ data: [ 'test ' ] })
      }));

      service.testDatasource().then(data => {
        expect(data).toEqual({
          message: 'Data source is working properly.',
          status: 'success'
        });
        done();
      });
    });

    test('when discovery api responds with error', done => {
      // @ts-ignore
      getBackendSrv.mockImplementation(() => ({
        fetch: () => throwError(() => ({ status: 400 }))
      }));

      service.testDatasource().then(data => {
        expect(data).toEqual({
          message: 'Data source test failed. Check credentials and try again.',
          status: 'error'
        });
        done();
      });
    });
  });

  describe('given getFieldDataType', () => {
    const scenarios = [
      {
        type: DataType.LONG,
        expected: FieldType.number
      },
      {
        type: DataType.DOUBLE,
        expected: FieldType.number
      },
      {
        type: DataType.STRING,
        expected: FieldType.string
      },
      {
        type: DataType.TIMESTAMP_MS,
        expected: FieldType.time
      },
      {
        type: DataType.TIMESTAMP_SEC,
        expected: FieldType.time
      },
      {
        type: DataType.DATE_ISO8601,
        expected: FieldType.time
      }
    ];

    scenarios.forEach(({ type, expected }) => {
      it(`should return ${expected} when data of type ${type}`, () => {
        // @ts-ignore
        expect(service.getFieldDataType({ type })).toEqual(expected);
      });
    });
  });
});

