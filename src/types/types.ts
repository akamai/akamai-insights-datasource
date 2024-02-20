import { DataSourceJsonData, DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { DataQuery } from '@grafana/schema';

export interface MyQuery extends DataQuery {
  reportFamily?: string;
  queryText?: string;
  reportName?: string;
  dimensions?: string[];
  metrics?: string[];
  constant: number;
}

export interface MyDataSourceOptions extends DataSourceJsonData {
  clientSecret?: string;
  host?: string;
  accessToken?: string;
  clientToken?: string;
  dataSource?: string;
}

export interface DataSourceProps extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

export enum TestDataSourceResponseStatus {
  Success = 'success',
  Error = 'error'
}
