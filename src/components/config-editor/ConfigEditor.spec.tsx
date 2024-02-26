import { fireEvent, render } from '@testing-library/react';
import React from 'react';

import { ConfigEditor } from './ConfigEditor';

describe('ConfigEditor component', () => {
  it('should trigger onOptionsChange when one of inputs has changed', () => {
    const options: any = {
      jsonData: {
        clientToken: 'testToken'
      }
    };
    const onOptionsChange = jest.fn();

    const { getByPlaceholderText } = render(
      <ConfigEditor options={options} onOptionsChange={onOptionsChange}/>
    );

    fireEvent.change(getByPlaceholderText('Enter host'), { target: { value: 'akamai.com' } });

    expect(onOptionsChange).toHaveBeenCalledWith({
      jsonData: {
        clientToken: 'testToken',
        host: 'akamai.com'
      }
    });
  });
});
