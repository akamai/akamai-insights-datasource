import { SelectableValue } from '@grafana/data';
import { CascaderOption } from '@grafana/ui';
import { isEmpty, uniq } from 'lodash';

import { Enum, NameAware } from '../types/types';

const identityFn = (value: any) => value;

export const toSelectableValues = (values: NameAware[]): SelectableValue<string>[] => {
  return values.map(({ name }) => stringToSelectableValue(name));
};

export const stringsToSelectableValues = (values: string[] | undefined = [], labelMapFn: (val: string) => string = identityFn): SelectableValue<string>[] => {
  return values.map(value => stringToSelectableValue(value, labelMapFn));
};

export const stringToSelectableValue = (value: string, labelMapFn: (val: string) => string = identityFn): SelectableValue<string> => {
  return { label: labelMapFn(value), value };
};

export const enumToSelectableValues = (input: Enum): SelectableValue[] => {
  return stringsToSelectableValues([ ...Object.values(input) ], prettyEnum);
};

export const prettyEnum = (s: string): string => {
  const result = s.replace(/_/g, ' ').toLowerCase();

  return result.charAt(0).toUpperCase() + result.slice(1);
};

export const splitByComma = (list: string[]): string [] => {
  return uniq(
    list
      .map(val => val.split(','))
      .flat()
      .filter(val => !isEmpty(val))
  );
};

export const toCascaderOption = ({ value, label, items = [] }: Partial<CascaderOption>): CascaderOption => {
  return {
    value,
    label: label ?? value,
    items: items?.map(toCascaderOption)
  };
};
