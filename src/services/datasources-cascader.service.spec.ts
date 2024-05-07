import { DatasourcesCascaderService } from './datasources-cascader.service';
import { mockReportsApi } from '../test/mocks/mock-reports-api';

describe('DatasourcesCascaderService', () => {
  describe('given getCascaderOptions', () => {
    describe('when reports data in non empty', () => {
      it('should return reports data as CascaderOption[]', () => {
        expect(DatasourcesCascaderService.getCascaderOptions(mockReportsApi))
          .toEqual(
            [
              {
                label: 'delivery',
                value: 'delivery',
                items:
                  [
                    {
                      label: 'traffic',
                      value: 'traffic',
                      items: [
                          {
                            items: [],
                            label: 'emissions',
                            value: '/reporting-api/v2/reports/delivery/traffic/emissions'
                          },
                          {
                            items: [],
                            label: 'current-ui',
                            value: '/reporting-api/v2/reports/delivery/traffic/current-ui'
                          }
                      ]
                    }
                  ]
              },
              {
                label: 'test',
                value: 'test',
                items:
                  [
                    {
                      label: 'traffic',
                      value: 'traffic',
                      items: [
                          {
                            items: [],
                            label: 'test',
                            value: '/reporting-api/v2/reports/test/traffic/test'
                          }
                      ]
                    }
                  ]
              },
              {
                label: 'analytics',
                value: 'analytics',
                items:
                  [
                    {
                      label: 'cdn-observability',
                      value: 'cdn-observability',
                      items:
                        [
                          {
                            items: [],
                            label: 'poc',
                            value: '/reporting-api/v2/reports/analytics/cdn-observability/poc'
                          }
                        ]
                    }
                  ]
              }
            ]
          );
      });
    });

    describe('when reports data is empty', () => {
      it('should return empty array', () => {
        expect(DatasourcesCascaderService.getCascaderOptions({ reports: [] })).toEqual([]);
      });
    });
  });

  describe('given getDataSourceParts', () => {
    it('should return parts of report path', () => {
      expect(DatasourcesCascaderService.getDataSourceParts(mockReportsApi.reports[ 0 ].reportLink))
        .toEqual([ 'delivery', 'traffic', 'emissions' ]);
    });
  });

});
  
