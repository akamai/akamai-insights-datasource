import { QueryEditorProps } from '@grafana/data';
import { Cascader, CascaderOption, Icon } from '@grafana/ui';
import { isEmpty } from 'lodash';
import React, { useLayoutEffect, useState } from 'react';

import { DataSourceForm } from './DataSourceForm/DataSourceForm';
import { DatasourceService } from '../../services/datasource.service';
import { DatasourcesCascaderService } from '../../services/datasources-cascader.service';
import { initialModel } from '../../types/discovery-api.model';
import { MyDataSourceOptions, MyQuery } from '../../types/types';

type Props = QueryEditorProps<DatasourceService, MyQuery, MyDataSourceOptions>;

export function QueryEditor({ query, onChange, onRunQuery, datasource }: Props) {
  const cascaderSeparator = ' > ';
  const [ model, setState ] = useState(initialModel);
  const [ dataSource, setDataSource ] = useState<string>('');
  const [ isDataSourceLoading, setIsDataSourceLoading ] = useState(false);
  const [ isReportListLoading, setIsReportListLoading ] = useState(true);
  const [ cascaderOptions, setCascaderOptions ] = useState([] as CascaderOption[]);

  const onDataSourceOptionChange = (value: string) => {
    query.reportLink = value;
    setDataSource(value || '');

    if (value) {
      setIsDataSourceLoading(true);
      DatasourceService.discoveryApi(datasource.id, value).subscribe({
        next: data => setState(data),
        complete: () => setIsDataSourceLoading(false)
      });
    }
  };

  useLayoutEffect(() => {
    const subscription = DatasourceService.reportsApi(datasource.id).subscribe({
      next: data => {
        setCascaderOptions(DatasourcesCascaderService.getCascaderOptions(data));
        onDataSourceOptionChange(query.reportLink || '');
        setIsReportListLoading(false);
      },
      error: () => {
        setCascaderOptions([]);
        setIsReportListLoading(false);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ datasource.id ]);

  return (
    <>
      {(() => !isReportListLoading ?
        <Cascader
          initialValue={dataSource ? DatasourcesCascaderService.getDataSourceParts(dataSource).join(cascaderSeparator) : ''}
          placeholder="Select report data source"
          allowCustomValue={true}
          options={cascaderOptions}
          changeOnSelect={false}
          onSelect={onDataSourceOptionChange}
          displayAllSelectedLevels={true}
          separator={cascaderSeparator}
        />
        : <><Icon name="fa fa-spinner"/> Fetching...</>
      )()}
      <hr/>
      {(() => !isDataSourceLoading && !isEmpty(model.metrics) && !isEmpty(model.dimensions) ?
        <DataSourceForm
          model={model}
          query={query}
          onChange={onChange}
          onRunQuery={onRunQuery}
          datasource={datasource}
        /> :
        isDataSourceLoading ? <><Icon name="fa fa-spinner"/> Fetching...</> : ''
      )()}
    </>
  );
}
