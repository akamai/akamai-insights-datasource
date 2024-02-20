import { toSelectableValues } from './utils';

describe('given toSelectableValues', () => {
  it('should convert array to SelectableValue[]', () => {
    expect(toSelectableValues([ { name: 'test1' }, { name: 'test2' } ]))
      .toEqual([
        { label: 'test1', value: 'test1' },
        { label: 'test2', value: 'test2' }
      ]);
  });
});
