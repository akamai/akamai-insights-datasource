import { SelectableValue } from '@grafana/data';
import {
  Alert,
  Button,
  InlineField,
  InlineFieldRow,
  MultiSelect,
  VerticalGroup
} from '@grafana/ui';
import { isEmpty, isNil } from 'lodash';
import React, { JSX, useState } from 'react';

import { FilterEditorRow } from './FilterEditor/FilterEditorRow';
import { FilterFormModel, mediumLabelWidth, shortLabelWidth, SortByFormModel } from './FormTypes';
import { ListField } from './ListField/ListField';
import { SortByEditorRow } from './SortEditor/SortByEditorRow';
import { DatasourceService } from '../../../services/datasource.service';
import { FormService } from '../../../services/form.service';
import { DiscoveryApiModel } from '../../../types/discovery-api.model';
import { MyQuery } from '../../../types/types';
import { stringsToSelectableValues, toSelectableValues } from '../../../utils/utils';

interface DataSourceFormProps {
  model: DiscoveryApiModel,
  datasource: DatasourceService,
  query: MyQuery,
  onRunQuery: () => void,
  onChange: (value: MyQuery) => void
}

export function DataSourceForm({ query, onChange, onRunQuery, model }: DataSourceFormProps): JSX.Element {
  const { defaults: { defaultMetrics = [], defaultDimensions = [], defaultSortBys= [] } } = model;
  const dimensionsOptions = toSelectableValues(model.dimensions);
  const defaultDimensionsOptions = defaultDimensions ? stringsToSelectableValues(defaultDimensions) : [];
  const metricsOptions = toSelectableValues(model.metrics);
  const defaultMetricsOptions = defaultMetrics ? stringsToSelectableValues(defaultMetrics) : [];
  const dimensionsValues = FormService.toValues(dimensionsOptions);
  const metricsValues = FormService.toValues(metricsOptions);
  const defaultSortBysOptions = defaultSortBys ? FormService.toSortBysFormModel(defaultSortBys, dimensionsValues, metricsValues) : [];

  const [ dimensions, setDimensions ] = useState<SelectableValue[]>(
    model.dimensions ? !isNil(query.dimensions) ? stringsToSelectableValues(FormService.getIntersectedModelOptions(query.dimensions, model.dimensions)) : defaultDimensionsOptions : []);
  const [ metrics, setMetrics ] = useState<SelectableValue[]>(
    model.metrics ? !isNil(query.metrics) ? stringsToSelectableValues(FormService.getIntersectedModelOptions(query.metrics, model.metrics)) : defaultMetricsOptions : []);
  const [ filters, setFilters ] = useState<FilterFormModel[]>(model.metrics || model.dimensions ? FormService.toFilterFormModels(query.filters, dimensionsValues, metricsValues) : []);
  const [ sortBys, setSortBys ] = useState<SortByFormModel[]>(
    model.metrics && model.dimensions ? !isNil(query.sortBys) ? FormService.toSortBysFormModel(query.sortBys, dimensionsValues, metricsValues) : defaultSortBysOptions : []
  );
  const [ applyDisabled, setApplyDisabled ] = useState<boolean>(isEmpty(dimensions) && isEmpty(metrics));
  const [ defaultValuesInfoVisible, setDefaultValuesInfoVisible ] = useState(!query.dimensions && !query.metrics);

  const onClear = () => {
    setDimensions([]);
    setMetrics([]);
    setFilters([]);
    setSortBys([]);
    onFormChange([], []);
  };
  const onRestoreDefault = () => {
    setMetrics(defaultMetricsOptions);
    setDimensions(defaultDimensionsOptions);
    setSortBys(defaultSortBysOptions);
    onFormChange(defaultDimensionsOptions, defaultMetricsOptions);
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
    setDefaultValuesInfoVisible(false);
  };
  const onFormChange = (selectedDimensions: SelectableValue<string>[], selectedMetrics: SelectableValue<string>[]) => {
    setApplyDisabled(isEmpty(selectedDimensions) && isEmpty(selectedMetrics));
    setDefaultValuesInfoVisible(false);
  };

  return (
    <div>
      {defaultValuesInfoVisible &&
        <Alert title="Default values" severity="info">
          <VerticalGroup>
            Default values have been set for the form since the panel was opened for the first time or data for query was not saved.
          </VerticalGroup>
        </Alert>
      }
      <InlineField
        label="Dimensions"
        labelWidth={shortLabelWidth}
        tooltip="Array of dimensions for grouping results (i.e.['time5minutes', 'cpcode']). Maximum number of dimensions: 4.">
        <MultiSelect
          isClearable={true}
          width={mediumLabelWidth}
          options={dimensionsOptions}
          value={dimensions}
          allowCustomValue={true}
          onChange={values => {
            setDimensions(values);
            onFormChange(values, metrics);
          }}
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
          allowCustomValue={true}
          onChange={values => {
            setMetrics(values);
            onFormChange(dimensions, values);
          }}
        />
      </InlineField>

      <ListField
        fieldLabel="Filters"
        fieldTooltip="Filters used to narrow down the results of the data. Filters are specified in terms of dimensions or metrics."
        resource="Filter"
        rows={filters}
        onChange={values => {
          setFilters(values);
          onFormChange(dimensions, metrics);
        }}
        modelProvider={() => FormService.creteEmptyFilter(dimensionsOptions[ 0 ])}
        Editor={(filterModel, index, onSingleFilterChange) =>
          <FilterEditorRow
            key={index}
            model={filterModel}
            dimensions={dimensionsOptions}
            metrics={metricsOptions}
            discoveryApiModel={model}
            onChange={updatedFilterModel => onSingleFilterChange(updatedFilterModel, index)}
          />}
      />

      <ListField
        fieldLabel="Sort Bys"
        fieldTooltip="Set sortBy settings for multiple columns. If not specified, the default values are used."
        resource="Sort By"
        rows={sortBys}
        onChange={values => {
          setSortBys(values);
          onFormChange(dimensions, metrics);
        }}
        modelProvider={() => FormService.creteEmptySortBy(dimensions[ 0 ])}
        Editor={(sortByModel, index, onSingleSortByChange) =>
          <SortByEditorRow
            key={index}
            model={sortByModel}
            dimensions={dimensions}
            metrics={metrics}
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
        <InlineField disabled={applyDisabled}>
          <Button
            type="submit"
            variant="primary"
            onClick={onApply}>
            Apply
          </Button>
        </InlineField>
        <InlineField>
          <Button
            type="reset"
            variant="secondary"
            onClick={onRestoreDefault}>
            Restore defaults
          </Button>
        </InlineField>
      </InlineFieldRow>
    </div>
  );
}
