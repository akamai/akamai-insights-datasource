import { SelectableValue } from '@grafana/data';

export const dataSourcesList = [ '/reports/delivery/traffic' ];

export const dataSources: SelectableValue<string>[] = dataSourcesList
  .map(dataSource => ({ value: dataSource, label: dataSource }));
