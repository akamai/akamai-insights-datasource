import { DataSourcePlugin } from '@grafana/data';

import { ConfigEditor } from './components/config-editor/ConfigEditor';
import { QueryEditor } from './components/query-editor/QueryEditor';
import { DataSource } from './datasource';
import { MyDataSourceOptions, MyQuery } from './types/types';

export const plugin = new DataSourcePlugin<DataSource, MyQuery, MyDataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
