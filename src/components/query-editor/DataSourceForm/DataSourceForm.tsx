import { InlineField, MultiSelect } from '@grafana/ui';
import React, { useState } from 'react';

import { DatasourceService } from '../../../services/datasource.service';
import { DiscoveryApiModel } from '../../../types/discovery-api.model';
import { MyQuery } from '../../../types/types';
import { toSelectableValues } from '../../../utils/utils';

interface DataSourceFormProps {
  model: DiscoveryApiModel,
  datasource: DatasourceService,
  query: MyQuery,
  onRunQuery: () => void,
  onChange: (value: MyQuery) => void
}

export function DataSourceForm({ query, onChange, onRunQuery, model }: DataSourceFormProps) {
  const [ dimensions, setDimensions ] = useState<any[]>([]);
  const [ metrics, setMetrics ] = useState<any[]>([]);

  const onDimensionChange = () => {
    onChange({ ...query, dimensions: dimensions.map(({ value }) => value) });
    onRunQuery();
  };

  const onMetricsChange = () => {
    onChange({ ...query, metrics: metrics.map(({ value }) => value) });
    onRunQuery();
  };

  const dimensionsOptions = toSelectableValues(model.dimensions);
  const metricsOptions = toSelectableValues(model.metrics);

  return (
    <div>
      <div>
        <InlineField
          label="Dimensions"
          labelWidth={50}>
          <MultiSelect
            options={dimensionsOptions}
            value={dimensions}
            onChange={values => {
              setDimensions(values);
              onDimensionChange();
            }}
          />
        </InlineField>
      </div>
      <div>
        <InlineField
          label="Metrics"
          labelWidth={50}>
          <MultiSelect
            options={metricsOptions}
            value={metrics}
            onChange={values => {
              setMetrics(values);
              onMetricsChange();
            }}
          />
        </InlineField>
      </div>
    </div>
  );
}
