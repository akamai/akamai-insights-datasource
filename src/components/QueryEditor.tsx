import React, { ChangeEvent } from 'react';
import { InlineField, Input } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from '../datasource';
import { MyDataSourceOptions, MyQuery } from '../types';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export function QueryEditor({ query, onChange, onRunQuery }: Props) {

  const onDimensionChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, dimensionsName: event.target.value });
    // executes the query
    onRunQuery();
  };

  const onMetricChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange({ ...query, metricsName: event.target.value });
        // executes the query
        onRunQuery();
    };

  const { dimensionsName,
      metricsName
  } = query;

  return (
    <div className="gf-form">
      <InlineField label="Dimensions" tooltip="Dimensions" labelWidth={16}>
        <Input onChange={onDimensionChange}  value={dimensionsName} width={28} type="string"  />
      </InlineField>
    {  <InlineField label="Metrics" labelWidth={16} tooltip="Metric">
        <Input onChange={onMetricChange}  value={metricsName} />
      </InlineField>}
    </div>
  );
}
