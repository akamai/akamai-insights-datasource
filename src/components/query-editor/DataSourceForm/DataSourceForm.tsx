import { SelectableValue } from '@grafana/data';
import { Button, InlineField, InlineFieldRow, MultiSelect } from '@grafana/ui';
import React, { JSX, useState } from 'react';

import { DatasourceService } from '../../../services/datasource.service';
import { FormService } from '../../../services/form.service';
import { DiscoveryApiModel } from '../../../types/discovery-api.model';
import { MyQuery } from '../../../types/types';
import { stringsToSelectableValues, toSelectableValues } from '../../../utils/utils';
import { FilterEditorRow } from './FilterEditor/FilterEditorRow';
import { FilterFormModel, mediumLabelWidth, shortLabelWidth, SortByFormModel } from './FormTypes';
import { ListField } from './ListField/ListField';
import { SortByEditorRow } from './SortEditor/SortByEditorRow';

interface DataSourceFormProps {
  model: DiscoveryApiModel,
  datasource: DatasourceService,
  query: MyQuery,
  onRunQuery: () => void,
  onChange: (value: MyQuery) => void
}

export function DataSourceForm({ query, onChange, onRunQuery, model }: DataSourceFormProps): JSX.Element {
  const dimensionsOptions = toSelectableValues(model.dimensions);
  const metricsOptions = toSelectableValues(model.metrics);
  const dimensionsValues = FormService.toValues(dimensionsOptions);
  const metricsValues = FormService.toValues(metricsOptions);

  const [ dimensions, setDimensions ] = useState<SelectableValue[]>(model.dimensions ? stringsToSelectableValues(query.dimensions) : []);
  const [ metrics, setMetrics ] = useState<SelectableValue[]>(model.metrics ? stringsToSelectableValues(query.metrics) : []);
  const [ filters, setFilters ] = useState<FilterFormModel[]>(model.metrics && model.dimensions ? FormService.toFilterFormModels(query.filters, dimensionsValues, metricsValues) : []);
  const [ sortBys, setSortBys ] = useState<SortByFormModel[]>(model.metrics && model.dimensions ? FormService.toSortBysFormModel(query.sortBys, dimensionsValues, metricsValues) : []);

  const onClear = () => {
    setDimensions([]);
    setMetrics([]);
    setFilters([]);
    setSortBys([]);
  };

  const onApply = () => {
    const updatedQuery = {
      ...query
    };

    updatedQuery.dimensions = FormService.toValues(dimensions);
    updatedQuery.metrics = FormService.toValues(metrics);
    updatedQuery.filters = FormService.toFilterQueries(filters);
    updatedQuery.sortBys = FormService.toSortByQueries(sortBys);

    onChange(updatedQuery);
    onRunQuery();
  };

  return (
    <div>
      <InlineField
        label="Dimensions"
        labelWidth={shortLabelWidth}
        tooltip="Array of dimensions for grouping results (i.e.['time5minutes', 'cpcode']). Maximum number of dimensions: 4.">
        <MultiSelect
          isClearable={true}
          width={mediumLabelWidth}
          options={dimensionsOptions}
          value={dimensions}
          onChange={setDimensions}
        />
      </InlineField>

      <InlineField
        label="Metrics"
        labelWidth={shortLabelWidth}
        tooltip="Array of metrics requested (i.e.: ['edgeBytesSum', 'originHitsSum']).">
        <MultiSelect
          isClearable={true}
          width={mediumLabelWidth}
          options={metricsOptions}
          value={metrics}
          onChange={setMetrics}
        />
      </InlineField>

      <ListField
        fieldLabel="Filters"
        fieldTooltip="Filters used to narrow down the results of the data. Filters are specified in terms of dimensions or metrics."
        resource="Filter"
        rows={filters}
        onChange={setFilters}
        modelProvider={() => FormService.creteEmptyFilter(dimensionsOptions[ 0 ])}
        Editor={(filterModel, index, onSingleFilterChange) =>
          <FilterEditorRow
            key={index}
            model={filterModel}
            dimensions={dimensionsOptions}
            metrics={metricsOptions}
            onChange={updatedFilterModel => onSingleFilterChange(updatedFilterModel, index)}
          />}
      />

      <ListField
        fieldLabel="Sort Bys"
        fieldTooltip="Set sortBy settings for multiple columns. If not specified, the default values are used."
        resource="Sort By"
        rows={sortBys}
        onChange={setSortBys}
        modelProvider={() => FormService.creteEmptySortBy(dimensionsOptions[ 0 ])}
        Editor={(sortByModel, index, onSingleSortByChange) =>
          <SortByEditorRow
            key={index}
            model={sortByModel}
            dimensions={dimensionsOptions}
            metrics={metricsOptions}
            onChange={updatedSortByModel => onSingleSortByChange(updatedSortByModel, index)}
          />}
      />

      <InlineFieldRow>
        <InlineField>
          <Button
            fill="outline"
            type="reset"
            variant="destructive"
            onClick={onClear}>
            Clear
          </Button>
        </InlineField>
        <InlineField>
          <Button
            type="submit"
            variant="primary"
            onClick={onApply}>
            Apply
          </Button>
        </InlineField>
      </InlineFieldRow>
    </div>
  );
}
