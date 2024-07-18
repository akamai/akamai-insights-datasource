import { CascaderOption } from '@grafana/ui';

import {
  enumToSelectableValues,
  prettyEnum,
  splitByComma,
  stringsToSelectableValues,
  toCascaderOption,
  toSelectableValues
} from './utils';

const expectedSelectableValues = [
  { label: 'test1', value: 'test1' },
  { label: 'test2', value: 'test2' }
];

enum TestEnum {
  VALUE1 = 'TEST_VALUE_1',
  VALUE2 = 'VALUE_2',
  VALUE3 = 'VALUE3',
  VALUE4 = 'value',
}

describe('given utils', () => {
  describe('and toSelectableValues', () => {
    it('should convert array to SelectableValue[]', () => {
      expect(toSelectableValues([ { name: 'test1' }, { name: 'test2' } ]))
        .toEqual(expectedSelectableValues);
    });

    it('should convert empty array', () => {
      expect(toSelectableValues([]))
        .toEqual([]);
    });
  });

  describe('and stringsToSelectableValues', () => {
    it('should convert array to SelectableValue[]', () => {
      expect(stringsToSelectableValues([ 'test1', 'test2' ]))
        .toEqual(expectedSelectableValues);
    });

    it('should convert empty array', () => {
      expect(stringsToSelectableValues([]))
        .toEqual([]);
    });

    it('should convert array to SelectableValue[] with custom label mapper', () => {
      expect(stringsToSelectableValues([ 'test1', 'test2' ], val => val.toUpperCase()))
        .toEqual([
          { label: 'TEST1', value: 'test1' },
          { label: 'TEST2', value: 'test2' }
        ]);
    });
  });

  describe('and enumToSelectableValues', () => {
    it('should convert enum to SelectableValue[]', () => {
      expect(enumToSelectableValues(TestEnum))
        .toEqual([
          { value: TestEnum.VALUE1, label: 'Test value 1' },
          { value: TestEnum.VALUE2, label: 'Value 2' },
          { value: TestEnum.VALUE3, label: 'Value3' },
          { value: TestEnum.VALUE4, label: 'Value' }
        ]);
    });
  });

  describe('and prettyEnum', () => {
    it('should convert enum value to pretty strings', () => {
      expect(prettyEnum(TestEnum.VALUE1)).toEqual('Test value 1');
      expect(prettyEnum(TestEnum.VALUE2)).toEqual('Value 2');
      expect(prettyEnum(TestEnum.VALUE3)).toEqual('Value3');
      expect(prettyEnum(TestEnum.VALUE4)).toEqual('Value');
    });
  });

  describe('and splitByComma', () => {
    it('should convert list of comma separated values to flat list', () => {
      const expressions = [
        '', // should remove empty
        'single',
        'another-value',
        'regex.*[a-z]',
        '1,2,3,,5,2,' // should remove empty and duplicates
      ];
      expect(splitByComma(expressions)).toEqual([
        'single',
        'another-value',
        'regex.*[a-z]',
        '1',
        '2',
        '3',
        '5'
      ]);
    });
  });

  describe('and toCascaderOption', () => {
    it('should create CascaderOption', () => {
      const options = {
        value: 'www.test.com',
        label: 'Test',
        items: [
          {
            value: 'www.innerTest.com'
          } as CascaderOption
        ]
      };
      expect(toCascaderOption(options)).toEqual({
        value: 'www.test.com',
        label: 'Test',
        items: [
          {
            value: 'www.innerTest.com',
            label: 'www.innerTest.com',
            items: []
          }
        ]
      });
    });
  });
});
