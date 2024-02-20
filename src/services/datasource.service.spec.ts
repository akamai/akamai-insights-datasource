import { DataSourcePluginMeta } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { of, throwError } from 'rxjs';

import { DatasourceService } from './datasource.service';

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

    DatasourceService.discoveryApi(1)
      .subscribe({
        next: data => {
          expect(data).toEqual([ 'test ' ]);
          done();
        }
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
});

