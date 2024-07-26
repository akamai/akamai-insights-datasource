import { DataSourceJsonData, DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { DataQuery } from '@grafana/schema';

export interface MyQuery extends DataQuery {
  reportLink?: string;
  dimensions?: string[];
  metrics?: string[];
  filters?: FilterQuery[];
  sortBys?: SortByQuery[];
}

export interface FilterQuery {
  metricName?: string;
  dimensionName?: string;
  operator?: string;
  expressions?: ExpressionType[];
  expression?: ExpressionType;
}

export interface SortByQuery {
  name?: string;
  sortOrder?: string;
}

export type ExpressionType = string | number;

export interface MyDataSourceOptions extends DataSourceJsonData {
  clientSecret?: string;
  host?: string;
  accessToken?: string;
  clientToken?: string;
}

export interface DataSourceProps extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

export enum TestDataSourceResponseStatus {
  Success = 'success',
  Error = 'error'
}

export interface NameAware {
  name: string
}

export interface Enum {
  [id: string]: string;
}

export const API_URL = '/reporting-api/v2/reports/';

export const VARIABLE_QUERY = 'variable-query';
