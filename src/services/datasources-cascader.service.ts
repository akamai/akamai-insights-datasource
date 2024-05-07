import { CascaderOption } from '@grafana/ui';
import { groupBy } from 'lodash';

import { ReportsApiModel } from '../types/discovery-api.model';
import { API_URL } from '../types/types';
import { toCascaderOption } from '../utils/utils';

export class DatasourcesCascaderService {

  static getDataSourceParts(url: string): string[] {
    return url.replace(API_URL, '').split('/');
  }

  static getCascaderOptions(data: ReportsApiModel): CascaderOption[] {
    const reportData = data.reports
      .map(({ reportLink }) => reportLink)
      .map(reportLink => ({ reportLink, items: DatasourcesCascaderService.getDataSourceParts(reportLink) }));
    const groupedByDomain = groupBy(reportData, ({ items: [ domain ] }) => domain);
    const groupedByFamily = Object.keys(groupedByDomain).map(key => ({
      [ key ]: groupBy(groupedByDomain[ key ], ({ items: [ , family ] }) => family)
    }));

    return groupedByFamily.map(family => Object.keys(family)
      .map(key => toCascaderOption({
        value: key,
        items: Object.keys(family[ key ])
          .map(secondLevelKey => ({
            value: secondLevelKey,
            items: family[ key ][ secondLevelKey ]
              .map(({ reportLink, items: [ , , report ] }) => ({
                value: reportLink,
                label: report
              }))
          })) as CascaderOption[]
      })))
      .flat();
  };
}

