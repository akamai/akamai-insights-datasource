import { SelectableValue } from '@grafana/data';
import { InlineField, InlineFieldRow, Select } from '@grafana/ui';
import React, { JSX } from 'react';

import '../../../../styles/styles.css';
import { FilterEditor } from './FilterEditor';
import { FormService } from '../../../../services/form.service';
import { DiscoveryApiModel } from '../../../../types/discovery-api.model';
import {
  FilterFormModel,
  FilterType,
  filterTypeOptions,
  metricOperatorOptions,
  shortLabelWidth
} from '../FormTypes';

interface FilterEditorProps {
  model: FilterFormModel;
  discoveryApiModel: DiscoveryApiModel;
  dimensions: SelectableValue<string>[];
  metrics: SelectableValue<string>[];
  onChange: (value: FilterFormModel) => void;
  style?: Partial<CSSStyleDeclaration>
}

function getFilterEditor(type: string | undefined,
                         dimensions: SelectableValue<string>[],
                         metrics: SelectableValue<string>[],
                         model: FilterFormModel,
                         discoveryApiModel: DiscoveryApiModel,
                         onChange: (query: FilterFormModel) => void): JSX.Element {
  switch (type) {
    case FilterType.Dimension:
      return (
        <FilterEditor
          model={model.query}
          names={dimensions}
          operators={FormService.getDimensionsOperatorsOptions(model, discoveryApiModel)}
          multiExpressions={true}
          onChange={query => onChange({ ...model, query })}
        />
      );
    case FilterType.Metric:
      return (
        <FilterEditor
          model={model.query}
          names={metrics}
          operators={metricOperatorOptions}
          multiExpressions={false}
          onChange={query => onChange({ ...model, query })}
        />
      );
    default:
      return <InlineField><span>Not implemented yet</span></InlineField>;
  }
}

export function FilterEditorRow({ model, discoveryApiModel, dimensions, metrics, onChange }: FilterEditorProps): JSX.Element {
  const Editor = getFilterEditor(model.type?.value, dimensions, metrics, model, discoveryApiModel, onChange);

  const changeFilterTypeQuery = (type: SelectableValue<string>): void => {
    let updatedModel = {} as FilterFormModel;

    if (type.value === FilterType.Dimension) {
      updatedModel = FormService.creteEmptyFilter(dimensions[ 0 ]);
    } else if (type.value === FilterType.Metric) {
      updatedModel = FormService.creteEmptyFilter(metrics[ 0 ]);
    }

    onChange({ ...updatedModel, type });
  };

  return (
    <InlineFieldRow className="padding-left-20">
      <InlineField>
        <Select
          isClearable={false}
          width={shortLabelWidth}
          options={filterTypeOptions}
          value={model.type}
          onChange={changeFilterTypeQuery}
        />
      </InlineField>

      {Editor}
    </InlineFieldRow>
  );
}
