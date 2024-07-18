import { DataSourcePlugin } from '@grafana/data';

import { ConfigEditor } from './components/config-editor/ConfigEditor';
import { QueryEditor } from './components/query-editor/QueryEditor';
import { DatasourceService } from './services/datasource.service';
import { MyDataSourceOptions, MyQuery } from './types/types';

export const plugin = new DataSourcePlugin<DatasourceService, MyQuery, MyDataSourceOptions>(DatasourceService)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
