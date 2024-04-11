import { Field, InlineField, Input, TextArea } from '@grafana/ui';
import { camelCase } from 'lodash';
import React, { ChangeEvent } from 'react';

import { DataSourceProps } from '../../types/types';
import { Secret } from './types';

export function ConfigEditor({ options, onOptionsChange }: DataSourceProps) {

  const onInputChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const jsonData = {
      ...options.jsonData,
      [ fieldName ]: value
    };
    onOptionsChange({ ...options, jsonData });
  };

  const onClientSecretChange = (event: ChangeEvent<HTMLInputElement>) => onInputChange(event, Secret.ClientSecret);
  const onHostChange = (event: ChangeEvent<HTMLInputElement>) => onInputChange(event, Secret.Host);
  const onAccessTokenChange = (event: ChangeEvent<HTMLInputElement>) => onInputChange(event, Secret.AccessToken);
  const onClientTokenChange = (event: ChangeEvent<HTMLInputElement>) => onInputChange(event, Secret.ClientToken);
  const onCredentialsTextAreaChange = ({ target: { value } }: ChangeEvent<HTMLTextAreaElement>) => {
    const secrets = value
      .split('\n')
      .map(set => set.trim().split(/\s=\s(.*)/s))
      .map(([ name, secret ]) => ({ [ camelCase(name) ]: secret }))
      .reduce((prev, next) => ({ ...prev, ...next }), {});

    const jsonData = {
      ...options.jsonData,
      ...secrets
    };

    onOptionsChange({ ...options, jsonData });
  };

  const { jsonData: { clientSecret, host, clientToken, accessToken } } = options;

  return (
    <div className="gf-form-group">
      <div style={{ width: 640 }}>
        <Field label="Information" description="Paste credentials here to auto fill form below">
          <TextArea
            name="credentialsTextArea"
            onChange={onCredentialsTextAreaChange}/>
        </Field>
      </div>
      <hr/>
      <InlineField
        label="Akamai Client Secret"
        labelWidth={20}>
        <Input
          onChange={onClientSecretChange}
          value={clientSecret || ''}
          placeholder="Enter client secret"
          width={60}
        />
      </InlineField>
      <InlineField
        label="Host"
        labelWidth={20}>
        <Input
          value={host || ''}
          placeholder="Enter host"
          width={60}
          onChange={onHostChange}
        />
      </InlineField>
      <InlineField
        label="Access Token"
        labelWidth={20}>
        <Input
          value={accessToken || ''}
          placeholder="Enter access token"
          width={60}
          onChange={onAccessTokenChange}
        />
      </InlineField>
      <InlineField
        label="Client Token"
        labelWidth={20}>
        <Input
          value={clientToken || ''}
          placeholder="Enter client token"
          width={60}
          onChange={onClientTokenChange}
        />
      </InlineField>
    </div>
  );
}
