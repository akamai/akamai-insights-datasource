import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { Icon, InlineField, Select } from '@grafana/ui';
import { isEmpty } from 'lodash';
import React, { useLayoutEffect, useState } from 'react';

import { DataSourceForm } from './DataSourceForm/DataSourceForm';
import { shortLabelWidth } from './DataSourceForm/FormTypes';
import { DatasourceService } from '../../services/datasource.service';
import { initialModel } from '../../types/discovery-api.model';
import { MyDataSourceOptions, MyQuery } from '../../types/types';
import { stringToSelectableValue } from '../../utils/utils';

type Props = QueryEditorProps<DatasourceService, MyQuery, MyDataSourceOptions>;

export function QueryEditor({ query, onChange, onRunQuery, datasource }: Props) {
  const [ model, setState ] = useState(initialModel);
  const [ dataSources, setDataSources ] = useState<SelectableValue[]>([]);
  const [ dataSource, setDataSource ] = useState<string>('');
  const [ isLoading, setIsLoading ] = useState(false);

  const onDataSourceOptionChange = ({ value }: SelectableValue<string>) => {
    setIsLoading(true);
    query.reportLink = value;
    setDataSource(value || '');

    if (value) {
      DatasourceService.discoveryApi(datasource.id, value).subscribe({
        next: data => setState(data),
        complete: () => setIsLoading(false)
      });
    }
  };

  useLayoutEffect(() => {
    const subscription = DatasourceService.reportsApi(datasource.id).subscribe({
      next: data => {
        setDataSources(data.reports.map(({ reportLink }) => stringToSelectableValue(reportLink)));
        onDataSourceOptionChange({ value: query.reportLink });
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ datasource.id ]);

  return (
    <>
      {(() => !isEmpty(dataSources) ?
        <InlineField
          label="Report Data Source"
          labelWidth={shortLabelWidth}>
          <Select
            value={dataSource}
            options={dataSources}
            placeholder="Select report data source"
            onChange={onDataSourceOptionChange}>
          </Select>
        </InlineField> : <><Icon name="fa fa-spinner"/> Fetching...</>
      )()}
      <hr/>
      {(() => !isLoading && !isEmpty(model.metrics) && !isEmpty(model.dimensions) ?
        <DataSourceForm
          model={model}
          query={query}
          onChange={onChange}
          onRunQuery={onRunQuery}
          datasource={datasource}
        /> :
        isLoading ? <><Icon name="fa fa-spinner"/> Fetching...</> : ''
      )()}
    </>
  );
}
