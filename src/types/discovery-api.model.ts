import { DataQuery } from '@grafana/schema';

export interface DiscoveryApiModel extends DataQuery {
  metrics: Metric[];
  dimensions: Dimension[];
  defaults: Defaults;
}

export interface ReportsApiModel {
  reports: Report[]
}

export interface Report {
  reportName: string;
  reportLink: string;
}

export interface Metric {
  name: string;
  type: DataType;
}

export interface Dimension {
  name: string;
  type: DataType;
  filterable: boolean;
  filterType: string;
  authorizable: boolean;
  filterEnumValues?: string[];
}

export interface Defaults {
  defaultTimeRange?: DefaultTimeRange;
  defaultMetrics?: string[];
  defaultDimensions?: string[];
  defaultSortBys?: DefaultSortBy[];
}

export interface DefaultTimeRange {
  start: string;
  end: string;
}

export interface DefaultSortBy {
  name: string;
  sortOrder: 'ASCENDING' | 'DESCENDING';
}

export const initialModel: DiscoveryApiModel = {
  metrics: [],
  dimensions: [],
  defaults: {},
  refId: ''
};

export enum DataType {
  STRING = 'STRING',
  LONG = 'LONG',
  DOUBLE = 'DOUBLE',
  TIMESTAMP_SEC = 'TIMESTAMP_SEC',
  DATE_ISO8601 = 'DATE_ISO8601',
  TIMESTAMP_MS = 'TIMESTAMP_MS'
}

export const TimeDimensionsTypes = [ DataType.TIMESTAMP_SEC, DataType.DATE_ISO8601, DataType.TIMESTAMP_MS ];
