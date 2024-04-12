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

  it('should update all fields when credentials are pasted into textarea', () => {
    const options: any = {
      jsonData: {}
    };
    const onOptionsChange = jest.fn();

    const { container } = render(
      <ConfigEditor options={options} onOptionsChange={onOptionsChange}/>
    );

    fireEvent.change(container.querySelector('[name="credentialsTextArea"]') as Element, {
      target: {
        value: `client_secret = test=
                host = test.net
                access_token = test-123
                client_token = test-test`
      }
    });

    expect(onOptionsChange).toHaveBeenCalledWith({
      jsonData: {
        clientSecret: 'test=',
        host: 'test.net',
        accessToken: 'test-123',
        clientToken: 'test-test'
      }
    });
  });

  it('should mark textarea as invalid and not update form when credentials are in wrong format', () => {
    const options: any = {
      jsonData: {}
    };
    const onOptionsChange = jest.fn();

    const tree = render(
      <ConfigEditor options={options} onOptionsChange={onOptionsChange}/>
    );
    const textArea = tree.container.querySelector('[name="credentialsTextArea"]') as Element;

    fireEvent.change(textArea, {
      target: {
        value: `clientsecret = test=
                host = test.net
                accesstoken = test-123
                client_token = test-test`
      }
    });

    expect(onOptionsChange).not.toHaveBeenCalled();
    expect(tree).toMatchSnapshot();
  });
});
