import { DataSourceJsonData, DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { DataQuery } from '@grafana/schema';

export interface MyQuery extends DataQuery {
  reportFamily?: string;
  queryText?: string;
  reportName?: string;
  dimensionsName?: string;
  metricsName?: string;
  constant: number;
}

export const DEFAULT_QUERY: Partial<MyQuery> = {
  constant: 6.5
};

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {
  clientSecret?: string;
  host?: string;
  accessToken?: string;
  clientToken?: string;
  dataSource?: string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface MySecureJsonData {
  apiKey?: string;
}

export interface DataSourceProps extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}
