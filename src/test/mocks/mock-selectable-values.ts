import { stringsToSelectableValues } from '../../utils/utils';

export const mockDimensionsOptions = stringsToSelectableValues([
  'time5Minutes',
  'time1Hour',
  'time1Day',
  'cpcode',
  'ipVersion',
  'httpMethod'
]);

export const mockMetricsOptions = stringsToSelectableValues([
  'edgeBytesSum',
  'edgeHitsSum',
  'edgeResponseBytesSum',
  'edgeRequestBytesSum',
  'originBytesSum',
  'originHitsSum',
  'midgressBytesSum',
  'midgressHitsSum',
  'hitsOffloadedPercentage',
  'bytesOffloadedPercentage'
]);
