import { SelectableValue } from '@grafana/data';
import { InlineField, Select } from '@grafana/ui';
import React, { Fragment, JSX } from 'react';

import { shortLabelWidth, sortByOrderOptions, SortByQueryFormModel } from '../FormTypes';

export interface SortByEditorProps {
  model: SortByQueryFormModel;
  names: SelectableValue<string>[];
  onChange: (query: SortByQueryFormModel) => void;
}

export function SortByEditor({ model, names, onChange }: SortByEditorProps): JSX.Element {
  return (
    <Fragment>
      <InlineField>
        <Select
          placeholder="Name"
          isClearable={false}
          width={shortLabelWidth}
          options={names}
          value={model.name}
          onChange={name => onChange({ ...model, name })}
        />
      </InlineField>

      <InlineField>
        <Select
          placeholder="Sort order"
          isClearable={false}
          width={shortLabelWidth}
          options={sortByOrderOptions}
          value={model.sortOrder}
          onChange={sortOrder => onChange({ ...model, sortOrder } )}
        />
      </InlineField>
    </Fragment>
  );
}
