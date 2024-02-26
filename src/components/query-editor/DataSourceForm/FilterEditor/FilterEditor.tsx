import { SelectableValue } from '@grafana/data';
import { InlineField, Input, Select, TagsInput } from '@grafana/ui';
import { first } from 'lodash';
import React, { Fragment, JSX } from 'react';

import { splitByComma } from '../../../../utils/utils';
import { FilterQueryFormModel, mediumLabelWidth, shortLabelWidth } from '../FormTypes';

export interface FilterQueryEditorProps {
  model: FilterQueryFormModel;
  names: SelectableValue<string>[];
  operators: SelectableValue<string>[];
  multiExpressions: boolean;
  onChange: (query: FilterQueryFormModel) => void;
}

export function FilterEditor({ model, names, operators, multiExpressions, onChange }: FilterQueryEditorProps): JSX.Element {
  const ExpressionField = multiExpressions ?
    <InlineField>
      <TagsInput
        placeholder="Expressions"
        width={mediumLabelWidth}
        tags={model.expressions}
        onChange={expressions => onChange({ ...model, expressions: splitByComma(expressions) })}
      />
    </InlineField> :
    <InlineField>
      <Input
        placeholder="Expression"
        width={mediumLabelWidth}
        value={first(model.expressions)}
        onChange={event => onChange({ ...model, expressions: [ (event.target as any).value ] })}
      />
    </InlineField>;

  return (
    <Fragment>
      <InlineField>
        <Select
          placeholder="Name"
          isClearable={false}
          options={names}
          width={shortLabelWidth}
          value={model.name}
          onChange={name => onChange({ ...model, name })}
        />
      </InlineField>

      <InlineField>
        <Select
          placeholder="Operator"
          isClearable={false}
          width={shortLabelWidth}
          options={operators}
          value={model.operator}
          onChange={operator => onChange({ ...model, operator })}
        />
      </InlineField>

      {ExpressionField}
    </Fragment>
  );
}
