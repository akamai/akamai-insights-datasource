import { FormService } from './form.service';
import {
  authorizableOrEnumFiltersOperatorOptions,
  DimensionOperator,
  dimensionOperatorOptions,
  FilterType,
  filterTypeOptions,
  MetricOperator,
  metricOperatorOptions,
  SortByOrder,
  sortByOrderOptions
} from '../components/query-editor/DataSourceForm/FormTypes';
import { discoveryTrafficModel } from '../test/mocks/mock-discovery-api-model';
import { mockDimensionsOptions } from '../test/mocks/mock-selectable-values';
import { FilterQuery, SortByQuery } from '../types/types';
import { stringToSelectableValue } from '../utils/utils';

const dimensionOption = stringToSelectableValue(FilterType.Dimension);
const metricOption = stringToSelectableValue(FilterType.Metric);
const cpcodeOption = stringToSelectableValue('cpcode');
const edgeHitsSumOption = stringToSelectableValue('edgeHitsSum');
const defaultDimensionOptions = mockDimensionsOptions[ 0 ];

describe('given FormService', () => {
  describe('given creteEmptyFilter', () => {
    it('should return empty model', () => {
      expect(FormService.creteEmptyFilter(defaultDimensionOptions)).toEqual({
        type: filterTypeOptions[ 0 ],
        query: {
          name: defaultDimensionOptions,
          operator: dimensionOperatorOptions[ 0 ],
          expressions: []
        }
      });
    });
  });

  describe('given creteEmptySortBy', () => {
    it('should return empty model', () => {
      expect(FormService.creteEmptySortBy(defaultDimensionOptions)).toEqual({
        type: filterTypeOptions[ 0 ],
        query: {
          name: defaultDimensionOptions,
          sortOrder: sortByOrderOptions[ 0 ]
        }
      });
    });
  });
  
  describe('and toValues', () => {
    it('should convert to list of strings', () => {
      expect(FormService.toValues([
        { label: 'Test 1', value: 'test1' },
        { label: 'Test 2', value: 'test2' }
      ])).toEqual([
        'test1',
        'test2'
      ]);
    });
  });

  describe('given toFilterFormModels', () => {
    it('should convert to form model', () => {
      const filters: FilterQuery[] = [
        {
          dimensionName: 'DIM1',
          operator: DimensionOperator.InList,
          expressions: [ 'value' ]
        },
        {
          metricName: 'MET2',
          operator: MetricOperator.Equal,
          expression: 100
        }
      ];
      const dimensions = [ 'DIM1', 'DIM2' ];
      const metrics = [ 'MET1', 'MET2' ];

      expect(FormService.toFilterFormModels(filters, dimensions, metrics)).toEqual([
        {
          type: dimensionOption,
          query: {
            name: stringToSelectableValue('DIM1'),
            operator: dimensionOperatorOptions[ 0 ],
            expressions: [ 'value' ]
          }
        },
        {
          type: metricOption,
          query: {
            name: stringToSelectableValue('MET2'),
            operator: metricOperatorOptions[ 0 ],
            expressions: [ '100' ]
          }
        }
      ]);
    });
  });

  describe('given toSortBysFormModel', () => {
    it('should convert to form model', () => {
      const sortBys: SortByQuery[] = [
        {
          name: 'DIM1',
          sortOrder: SortByOrder.Ascending
        },
        {
          name: 'MET2',
          sortOrder: SortByOrder.Descending
        }
      ];
      const dimensions = [ 'DIM1', 'DIM2' ];
      const metrics = [ 'MET1', 'MET2' ];

      expect(FormService.toSortBysFormModel(sortBys, dimensions, metrics)).toEqual([
        {
          type: dimensionOption,
          query: {
            name: stringToSelectableValue('DIM1'),
            sortOrder: sortByOrderOptions[ 0 ]
          }
        },
        {
          type: metricOption,
          query: {
            name: stringToSelectableValue('MET2'),
            sortOrder: sortByOrderOptions[ 1 ]
          }
        }
      ]);
    });
  });

  describe('and guessFilterType', () => {
    const dimensions = [ 'dim1', 'dim2' ];
    const metrics = [ 'met1', 'met2' ];
    const testScenarios = [
      {
        value: undefined,
        expected: undefined
      },
      {
        value: 'dim3',
        expected: undefined
      },
      {
        value: 'met3',
        expected: undefined
      },
      {
        value: 'dim1',
        expected: FilterType.Dimension
      },
      {
        value: 'met2',
        expected: FilterType.Metric
      }
    ];

    testScenarios.forEach(({ value, expected }) => {
      describe(`given value ${value}`, () => {
        it(`should return ${expected}`, () => {
          expect(FormService.guessFilterType(value, dimensions, metrics)).toEqual(expected);
        });
      });
    });
  });

  describe('and toFilterQueries', () => {
    it('should convert to list of filters queries', () => {
      expect(FormService.toFilterQueries([
        {
          type: dimensionOption,
          query: {
            name: cpcodeOption,
            operator: stringToSelectableValue(DimensionOperator.InList),
            expressions: [ 'cpcode1', 'cpcode2' ]
          }
        },
        {
          type: metricOption,
          query: {
            name: edgeHitsSumOption,
            operator: stringToSelectableValue(MetricOperator.GreaterThan),
            expressions: [ '1234' ]
          }
        }
      ])).toEqual([
        {
          dimensionName: 'cpcode',
          operator: DimensionOperator.InList,
          expressions: [ 'cpcode1', 'cpcode2' ]
        },
        {
          metricName: 'edgeHitsSum',
          operator: MetricOperator.GreaterThan,
          expression: 1234
        }
      ]);
    });
  });

  describe('and toSortByQueries', () => {
    it('should convert to list of sortBys', () => {
      expect(FormService.toSortByQueries([
        {
          type: dimensionOption,
          query: {
            name: cpcodeOption,
            sortOrder: stringToSelectableValue(SortByOrder.Ascending)
          }
        },
        {
          type: metricOption,
          query: {
            name: edgeHitsSumOption,
            sortOrder: stringToSelectableValue(SortByOrder.Descending)
          }
        }
      ])).toEqual([
        {
          name: 'cpcode',
          sortOrder: SortByOrder.Ascending
        },
        {
          name: 'edgeHitsSum',
          sortOrder: SortByOrder.Descending
        }
      ]);
    });
  });

  describe('and getDimensionsOperatorsOptions', () => {
    const scenarios = [
      {
        description: 'when filter type is ENUM',
        name: 'responseStatus',
        expected: authorizableOrEnumFiltersOperatorOptions
      },
      {
        description: 'when filter is authorizable',
        name: 'cpcode',
        expected: authorizableOrEnumFiltersOperatorOptions
      },
      {
        description: 'when filter type is TEXT and is not authorizable',
        name: 'responseCode',
        expected: dimensionOperatorOptions
      }
    ];

    scenarios.forEach(({ description, name, expected }) => {
      describe(description, () => {
        it('should return proper operators list', () => {
          expect(FormService.getDimensionsOperatorsOptions({
            type: stringToSelectableValue(FilterType.Dimension),
            query: {
              name: stringToSelectableValue(name)
            }
          }, discoveryTrafficModel )).toEqual(expected);
        });
      });
    });
  });

  describe('given getInteresctedModelOptions', () => {
    it('should return non empty array when there is an intersection', () => {
      expect(FormService.getIntersectedModelOptions([ 'responseCode', 'cpcode' ], discoveryTrafficModel.dimensions))
        .toEqual([ 'responseCode', 'cpcode' ]);
    });

    it('should include query variables in intersection', () => {
      expect(FormService.getIntersectedModelOptions([ 'responseCode', 'cpcode', '${hostname}' ], discoveryTrafficModel.dimensions))
        .toEqual([ 'responseCode', 'cpcode', '${hostname}' ]);
    });

    it('should return empty array when there is no intersection', () => {
      expect(FormService.getIntersectedModelOptions([ 'test' ], discoveryTrafficModel.dimensions))
        .toEqual([]);
    });
  });
});
