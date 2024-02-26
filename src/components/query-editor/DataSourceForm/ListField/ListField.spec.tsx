import { Input } from '@grafana/ui';
import React from 'react';
import renderer from 'react-test-renderer';

import { ListField } from './ListField';

describe('ListField component', () => {
  it('should render list with custom row Editor', () => {
    const rows: string[] = [ 'value 1', 'value 2' ] ;
    const onChange = jest.fn();

    const tree = renderer.create(
      <ListField
        fieldLabel="List label"
        fieldTooltip="List tooltip"
        resource="resource"
        modelProvider={() => ''}
        rows={rows}
        Editor={(value, index) => <Input key={index} value={value}/>}
        onChange={onChange}/>
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });
});
