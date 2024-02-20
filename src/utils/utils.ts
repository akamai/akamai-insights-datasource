import { SelectableValue } from '@grafana/data';

interface NameAware {
  name: string
}

export const toSelectableValues = (values: NameAware[]): SelectableValue[] => {
  return values.map(({ name }) => ({ label: name, value: name }));
};
