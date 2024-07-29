import { SelectableValue } from '@grafana/data';
import { first, intersection, isEmpty, isUndefined, set } from 'lodash';

import {
  authorizableOrEnumFiltersOperatorOptions,
  dimensionOperatorOptions,
  FilterFormModel,
  FilterType,
  filterTypeOptions,
  filterTypeOptionsMap,
  FilterValueType,
  SortByFormModel,
  sortByOrderOptions
} from '../components/query-editor/DataSourceForm/FormTypes';
import { Dimension, DiscoveryApiModel, Metric } from '../types/discovery-api.model';
import { ExpressionType, FilterQuery, SortByQuery } from '../types/types';
import { prettyEnum, stringToSelectableValue } from '../utils/utils';

export class FormService {

  private static readonly VARIABLE_REGEX = /\${.+}/gm;

  static creteEmptyFilter(defaultDimension: SelectableValue<string>): FilterFormModel {
    return {
      type: filterTypeOptions[ 0 ],
      query: {
        name: defaultDimension,
        operator: dimensionOperatorOptions[ 0 ],
        expressions: []
      }
    };
  }

  static creteEmptySortBy(defaultDimension: SelectableValue<string>): SortByFormModel {
    return {
      type: filterTypeOptions[ 0 ],
      query: {
        name: defaultDimension,
        sortOrder: sortByOrderOptions[ 0 ]
      }
    };
  }

  static toValues(values: SelectableValue<string>[]): string[] {
    return values.map(({ value }) => value as string)
      .filter(value => value);
  };

  static toFilterFormModels(filterQueries: FilterQuery[] | undefined = [],
                            dimensions: string[],
                            metrics: string[]): FilterFormModel[] {
    return filterQueries?.map(query => {
      const filterName = query.dimensionName || query.metricName;
      const filterType = FormService.guessFilterType(filterName, dimensions, metrics);

      return filterType ? {
        type: filterTypeOptionsMap[ filterType ][ 0 ],
        query: {
          name: filterName ? stringToSelectableValue(filterName) : undefined,
          operator: query.operator ? stringToSelectableValue(query.operator, prettyEnum) : undefined,
          expressions: (query.expressions?.length ? query.expressions : [ query.expression ])
            .filter(val => !isUndefined(val))
            .map(exp => `${exp}`)
        }
      } : {} as FilterFormModel;
    }).filter(val => !isEmpty(val));
  }

  static toSortBysFormModel(filterQueries: SortByQuery[] | undefined = [],
                            dimensions: string[],
                            metrics: string[]): SortByFormModel[] {
    return filterQueries?.map(query => {
      const filterType = FormService.guessFilterType(query.name, dimensions, metrics);

      return filterType ? {
        type: filterTypeOptionsMap[ filterType ][ 0 ],
        query: {
          name: query.name ? stringToSelectableValue(query.name) : undefined,
          sortOrder: query.sortOrder ? stringToSelectableValue(query.sortOrder, prettyEnum) : undefined
        }
      } : {} as SortByFormModel;
    }).filter(val => !isEmpty(val));
  }

  static guessFilterType(value: string | undefined, dimensions: string[], metric: string[]): FilterType | undefined {
    if (isUndefined(value)) {
      return undefined;
    }

    if (dimensions.includes(value)) {
      return FilterType.Dimension;
    }

    if (metric.includes(value)) {
      return FilterType.Metric;
    }

    return undefined;
  }

  static toFilterQueries(rows: FilterFormModel[]): FilterQuery[] {
    return rows.map(({ type, query: { name, operator, expressions } }) => {
      const result: Partial<FilterQuery> = {
        operator: operator?.value
      };

      if (type.value === FilterType.Dimension) {
        set(result, 'dimensionName', name?.value);
        set(result, 'expressions', FormService.toExpressions(expressions));
      } else if (type.value === FilterType.Metric) {
        set(result, 'metricName', name?.value);
        set(result, 'expression', FormService.toExpression(first(expressions)));
      }

      return result;
    });
  }

  private static toExpressions(expressions: string[] | undefined = []): ExpressionType[] {
    return expressions.map(exp => FormService.toExpression(exp));
  }

  private static toExpression(expression: string | undefined = ''): ExpressionType {
    let potentialNumber = Number(expression);

    return !isNaN(potentialNumber) ? potentialNumber : expression;
  }

  static toSortByQueries(rows: SortByFormModel[]): SortByQuery[] {
    return rows.map(({ query: { name, sortOrder } }) => ({
      name: name?.value,
      sortOrder: sortOrder?.value
    }));
  }

  static getDimensionsOperatorsOptions({ query: { name } }: FilterFormModel, discoveryApiModel: DiscoveryApiModel): SelectableValue[] {
    const model = discoveryApiModel.dimensions.find(filter => filter.name === name?.value);
    return model?.filterType === FilterValueType.Enum || model?.authorizable ? authorizableOrEnumFiltersOperatorOptions : dimensionOperatorOptions;
  }

  static getIntersectedModelOptions(queryOptions: string[], modelOptions: Dimension[] | Metric[]): string[] {
    const queryVariables = queryOptions.filter(value => FormService.VARIABLE_REGEX.test(value));
    return [ ...intersection(queryOptions, modelOptions.map(({ name }) => name)), ...(queryVariables || []) ];
  }

}
