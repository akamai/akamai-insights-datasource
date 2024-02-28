import { InlineField, Input } from '@grafana/ui';
import React, { FormEvent, JSX } from 'react';

import { shortLabelWidth } from '../FormTypes';

export interface NumberFieldProps {
  fieldLabel: string;
  fieldTooltip?: any;
  inputWidth?: number;
  model: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
}

export function NumberField({ fieldLabel, fieldTooltip, inputWidth, model, min, max, onChange }: NumberFieldProps): JSX.Element {
  const onInputChange = (event?: FormEvent<HTMLInputElement>) => {
    const value = Number((event?.target as any).value);
    onChange(!isNaN(value) ? value : undefined);
  };

  return (
    <InlineField
      label={fieldLabel}
      labelWidth={shortLabelWidth}
      tooltip={fieldTooltip}>
      <Input
        type="number"
        min={min}
        max={max}
        value={model}
        width={inputWidth}
        onChange={event => onInputChange(event)}
      />
    </InlineField>
  );
}
