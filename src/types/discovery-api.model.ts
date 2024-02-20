import { DataQuery } from '@grafana/schema';

export interface DiscoveryApiModel extends DataQuery {
  metrics: Metric[];
  dimensions: Dimension[];
  defaults: Defaults[];
}

export interface Metric {
  name: string;
  type: string;
}

export interface Dimension {
  name: string;
  type: string;
  filterable: boolean;
  filterType: string;
  authorizable: boolean;
  filterEnumValues?: string[];
}

export interface Defaults {
  defaultTimeRange: DefaultTimeRange;
  defaultMetrics: string[];
  defaultDimensions: string[];
  defaultSortBys: DefaultSortBy[];
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
  defaults: [],
  refId: ''
};
