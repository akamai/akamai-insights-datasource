import {
  IconButton,
  InlineField,
  InlineFieldRow
} from '@grafana/ui';
import React, { Fragment, JSX } from 'react';

import { ListIconsRow } from '../../../common/styled/ListIconsRow';
import { shortLabelWidth } from '../FormTypes';

export interface ListFieldProps<T> {
  fieldLabel: string;
  fieldTooltip?: any;
  resource: string;
  rows: T[];
  modelProvider: () => T;
  onChange: (list: T[]) => void;
  Editor: (model: T, index: number, onChange: (updatedModel: T, index: number) => void) => JSX.Element;
}

export function ListField<T>({ fieldLabel, fieldTooltip, resource, rows, modelProvider, onChange, Editor }: ListFieldProps<T>): JSX.Element {
  const onAdd = () => onChange([ ...rows, modelProvider() ]);

  const onRemoveAll = () => onChange([]);

  const onRemove = (index: number) => {
    const listCopy = [ ...rows ];
    listCopy.splice(index, 1);

    onChange(listCopy);
  };

  const onChangeSingle = (updatedModel: T, index: number) => {
    onChange(rows.map((model, i) => {
      if (i === index) {
        return {
          ...model,
          ...updatedModel
        };
      }

      return model;
    }));
  };
  
  return (
    <Fragment>
      <InlineFieldRow>
        <InlineField
          label={fieldLabel}
          tooltip={fieldTooltip}
          labelWidth={shortLabelWidth}>
          <ListIconsRow>
            {rows?.length ? <IconButton name="trash-alt" tooltip="Remove all" onClick={onRemoveAll}/> : ''}
            <IconButton
              name="plus-circle"
              tooltip={`Add new ${resource}`}
              onClick={onAdd}
            />
          </ListIconsRow>
        </InlineField>
      </InlineFieldRow>

      {rows.map((model, index) => (
        <InlineFieldRow key={index}>
          { Editor(model, index, updated => onChangeSingle(updated, index)) }

          <InlineField>
            <ListIconsRow>
              <IconButton
                name="minus-circle"
                tooltip={`Remove ${resource}`}
                onClick={() => onRemove(index)}
              />
            </ListIconsRow>
          </InlineField>
        </InlineFieldRow>)
      )}
    </Fragment>
  );
}
