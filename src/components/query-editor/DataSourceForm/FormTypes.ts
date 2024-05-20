import { SelectableValue } from '@grafana/data';
import { groupBy } from 'lodash';

import { enumToSelectableValues, prettyEnum, stringsToSelectableValues } from '../../../utils/utils';

export const shortLabelWidth = 25;
export const mediumLabelWidth = 50;

export enum FilterType {
  Dimension = 'Dimension',
  Metric = 'Metric'
}

export const filterTypeOptions = enumToSelectableValues(FilterType);

export const filterTypeOptionsMap = groupBy(filterTypeOptions, 'value');

export interface FilterFormModel {
  type: SelectableValue<string>;
  query: FilterQueryFormModel;
}

export interface FilterQueryFormModel {
  name?: SelectableValue<string>;
  operator?: SelectableValue<string>;
  expressions?: string[];
}

export enum DimensionOperator {
  InList = 'IN_LIST',
  RegExp = 'REGEXP',
  BeginsWith = 'BEGINS_WITH',
  EndsWith = 'ENDS_WITH',
  Partial = 'PARTIAL',
  Exact = 'EXACT'
}

export enum FilterValueType {
  Text = 'TEXT',
  Enum = 'ENUM'
}

export const dimensionOperatorOptions = enumToSelectableValues(DimensionOperator);

export const authorizableOrEnumFiltersOperatorOptions = stringsToSelectableValues([ DimensionOperator.InList ], prettyEnum);

export enum MetricOperator {
  Equal = 'EQUAL',
  NotEqual = 'NOT_EQUAL',
  LessThan = 'LESS_THAN',
  GreaterThan = 'GREATER_THAN'
}

export const metricOperatorOptions = enumToSelectableValues(MetricOperator);

export interface SortByFormModel {
  type?: SelectableValue<string>;
  query: SortByQueryFormModel;
}

export interface SortByQueryFormModel {
  name?: SelectableValue<string>;
  sortOrder?: SelectableValue<string>;
}

export enum SortByOrder {
  Ascending = 'ASCENDING',
  Descending = 'DESCENDING'
}

export const sortByOrderOptions = enumToSelectableValues(SortByOrder);
