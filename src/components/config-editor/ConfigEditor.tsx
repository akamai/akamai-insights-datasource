import { InlineField, Input } from '@grafana/ui';
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

  const { jsonData: { clientSecret, host, clientToken, accessToken } } = options;

  return (
    <div className="gf-form-group">
      <InlineField
        label="Akamai Client Secret"
        labelWidth={20}>
        <Input
          onChange={onClientSecretChange}
          value={clientSecret || ''}
          placeholder="Enter client secret"
          width={40}
        />
      </InlineField>
      <InlineField
        label="Host"
        labelWidth={20}>
        <Input
          value={host || ''}
          placeholder="Enter host"
          width={40}
          onChange={onHostChange}
        />
      </InlineField>
      <InlineField
        label="Access Token"
        labelWidth={20}>
        <Input
          value={accessToken || ''}
          placeholder="Enter access token"
          width={40}
          onChange={onAccessTokenChange}
        />
      </InlineField>
      <InlineField
        label="Client Token"
        labelWidth={20}>
        <Input
          value={clientToken || ''}
          placeholder="Enter client token"
          width={40}
          onChange={onClientTokenChange}
        />
      </InlineField>
    </div>
  );
}
