import { Field, InlineField, Input, TextArea } from '@grafana/ui';
import { camelCase, isEmpty } from 'lodash';
import React, { ChangeEvent, useState } from 'react';

import { inputWidth, labelWidth, Secret, secretsNames } from './types';
import { DataSourceProps } from '../../types/types';
import './ConfigEditor.css';

export function ConfigEditor({ options, onOptionsChange }: DataSourceProps) {

  const [ credentialsTextAreaInvalid, setCredentialsTextAreaInvalid ] = useState<boolean>(false);
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
      .map(line => line.trim().split(/\s=\s(.*)/s))
      .map(([ name, secret ]) => ({ [ camelCase(name) ]: secret }))
      .reduce((prev, next) => ({ ...prev, ...next }), {});

    const entries = Object.entries(secrets);
    const isCredentialsTextAreaInvalid = entries.length !== secretsNames.length || entries
      .some(([ name, secret ]) => !secretsNames.includes(name as Secret) || isEmpty(secret));
    setCredentialsTextAreaInvalid(isCredentialsTextAreaInvalid);

    if (!isCredentialsTextAreaInvalid) {
      const jsonData = {
        ...options.jsonData,
        ...secrets
      };

      onOptionsChange({ ...options, jsonData });
    }
  };

  const { jsonData: { clientSecret, host, clientToken, accessToken } } = options;

  return (
    <div className="gf-form-group">
      <div className="credentials__container">
        <Field label="Information" description="Paste credentials here to auto fill form below">
          <TextArea
            className="credentials__textarea"
            name="credentialsTextArea"
            invalid={credentialsTextAreaInvalid}
            onChange={onCredentialsTextAreaChange}/>
        </Field>
      </div>
      <hr/>
      <InlineField
        label="Akamai Client Secret"
        labelWidth={labelWidth}>
        <Input
          onChange={onClientSecretChange}
          value={clientSecret || ''}
          placeholder="Enter client secret"
          width={inputWidth}
        />
      </InlineField>
      <InlineField
        label="Host"
        labelWidth={labelWidth}>
        <Input
          value={host || ''}
          placeholder="Enter host"
          width={inputWidth}
          onChange={onHostChange}
        />
      </InlineField>
      <InlineField
        label="Access Token"
        labelWidth={labelWidth}>
        <Input
          value={accessToken || ''}
          placeholder="Enter access token"
          width={inputWidth}
          onChange={onAccessTokenChange}
        />
      </InlineField>
      <InlineField
        label="Client Token"
        labelWidth={labelWidth}>
        <Input
          value={clientToken || ''}
          placeholder="Enter client token"
          width={inputWidth}
          onChange={onClientTokenChange}
        />
      </InlineField>
    </div>
  );
}
