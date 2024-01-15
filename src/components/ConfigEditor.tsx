import React, { ChangeEvent } from 'react';
import { InlineField, Input } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { MyDataSourceOptions } from '../types';

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

export function ConfigEditor(props: Props) {
  const { options } = props;

  const onClientSecretChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = props;
    const jsonData = {
      ...options.jsonData,
      clientSecret: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  const onHostChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = props;
    const jsonData = {
      ...options.jsonData,
      host: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  const onAccessTokenChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = props;
    const jsonData = {
      ...options.jsonData,
      accessToken: event.target.value,
    };
    // console.log('host: ' + event.target.value);
    onOptionsChange({ ...options, jsonData });
  };

  const onClientTokenChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = props;
    const jsonData = {
      ...options.jsonData,
      clientToken: event.target.value,
    };
    // console.log('host: ' + event.target.value);
    onOptionsChange({ ...options, jsonData });
  };


  const { jsonData } = options;


  return (
    <div className="gf-form-group">
      <InlineField  label="Akamai Client Secret" labelWidth={20}>
        <Input
          onChange={onClientSecretChange}
          value={jsonData.clientSecret || ''}
          placeholder="Enter client secret"
          width={40}
        />
      </InlineField>
      <InlineField label="Host" labelWidth={20}>
        <Input
          value={jsonData.host || ''}
          placeholder="Enter host"
          width={40}
          onChange={onHostChange}
        />
      </InlineField>
      <InlineField label="Access Token" labelWidth={20}>
        <Input
            value={jsonData.accessToken || ''}
            placeholder="Enter access token"
            width={40}
            onChange={onAccessTokenChange}
        />
      </InlineField>
      <InlineField label="Client Token" labelWidth={20}>
        <Input
            value={jsonData.clientToken || ''}
            placeholder="Enter client token"
            width={40}
            onChange={onClientTokenChange}
        />
      </InlineField>
    </div>
  );
}
