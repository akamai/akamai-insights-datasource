import { SelectableValue } from '@grafana/data';
import { InlineField, InlineFieldRow, Select } from '@grafana/ui';
import React, { JSX } from 'react';
import '../../../../styles/styles.css';

import { SortByEditor } from './SortByEditor';
import { FormService } from '../../../../services/form.service';
import {
  FilterType,
  filterTypeOptions,
  shortLabelWidth,
  SortByFormModel
} from '../FormTypes';

interface SortByEditorProps {
  model: SortByFormModel;
  dimensions: SelectableValue<string>[];
  metrics: SelectableValue<string>[];
  onChange: (value: SortByFormModel) => void
}

function getSortByEditor(type: string | undefined,
                         dimensions: SelectableValue<string>[],
                         metrics: SelectableValue<string>[],
                         model: SortByFormModel,
                         onChange: (query: SortByFormModel) => void): JSX.Element {
  switch (type) {
    case FilterType.Dimension:
      return (
        <SortByEditor
          model={model.query}
          names={dimensions}
          onChange={query => onChange({ ...model, query })}
        />
      );
    case FilterType.Metric:
      return (
        <SortByEditor
          model={model.query}
          names={metrics}
          onChange={query => onChange({ ...model, query  })}
        />
      );
    default:
      return <InlineField><span>Not implemented yet</span></InlineField>;
  }
}

export function SortByEditorRow({ model, dimensions, metrics, onChange }: SortByEditorProps): JSX.Element {
  const Editor = getSortByEditor(model.type?.value, dimensions, metrics, model, onChange);

  const changeFilterTypeQuery = (type: SelectableValue<string>): void => {
    let updatedModel = {} as SortByFormModel;

    if (type.value === FilterType.Dimension) {
      updatedModel = FormService.creteEmptySortBy(dimensions[ 0 ]);
    } else if (type.value === FilterType.Metric) {
      updatedModel = FormService.creteEmptySortBy(metrics[ 0 ]);
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
