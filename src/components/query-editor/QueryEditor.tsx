import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { Icon, InlineField, Select } from '@grafana/ui';
import { isEmpty } from 'lodash';
import React, { useLayoutEffect, useState } from 'react';

import { DatasourceService } from '../../services/datasource.service';
import { initialModel } from '../../types/discovery-api.model';
import { MyDataSourceOptions, MyQuery } from '../../types/types';
import { stringToSelectableValue } from '../../utils/utils';
import { DataSourceForm } from './DataSourceForm/DataSourceForm';

type Props = QueryEditorProps<DatasourceService, MyQuery, MyDataSourceOptions>;

export function QueryEditor({ query, onChange, onRunQuery, datasource }: Props) {
  const [ model, setState ] = useState(initialModel);
  const [ dataSources, setDataSources ] = useState<SelectableValue[]>([]);
  const [ dataSource, setDataSource ] = useState<string>('');

  const onDataSourceOptionChange = ({ value }: SelectableValue<string>) => {
    query.reportLink = value;
    setDataSource(value || '');

    if (value) {
      DatasourceService.discoveryApi(datasource.id, value).subscribe({
        next: data => setState(data)
      });
    }
  };

  useLayoutEffect(() => {
    const subscription = DatasourceService.reportsApi(datasource.id).subscribe({
      next: data => {
        setDataSources(data.reports.map(({ reportLink }) => stringToSelectableValue(reportLink)));
        onDataSourceOptionChange({ value: query.reportLink });
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ datasource.id ]);

  return (
    <>
      <InlineField
        label="Data Source"
        labelWidth={20}>
        <Select
          value={dataSource}
          options={dataSources}
          placeholder="Select data source"
          width={40}
          onChange={onDataSourceOptionChange}>
        </Select>
      </InlineField>
      { (() => !isEmpty(model.metrics) && !isEmpty(model.dimensions) ?
        <DataSourceForm
          model={model}
          query={query}
          onChange={onChange}
          onRunQuery={onRunQuery}
          datasource={datasource}
        /> :
        !isEmpty(dataSource) ? <><Icon name="fa fa-spinner"/> Fetching...</> : ''
      )()}
    </>
  );
}
