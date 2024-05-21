import { DataType, DiscoveryApiModel } from '../../types/discovery-api.model';

export const discoveryTrafficModel: DiscoveryApiModel = {
  metrics: [
    {
      name: 'edgeBytesSum',
      type: DataType.LONG
    },
    {
      name: 'edgeHitsSum',
      type: DataType.LONG
    },
    {
      name: 'edgeResponseBytesSum',
      type: DataType.LONG
    },
    {
      name: 'edgeRequestBytesSum',
      type: DataType.LONG
    },
    {
      name: 'originBytesSum',
      type: DataType.LONG
    },
    {
      name: 'originHitsSum',
      type: DataType.LONG
    },
    {
      name: 'originResponseBytesSum',
      type: DataType.LONG
    },
    {
      name: 'originRequestBytesSum',
      type: DataType.LONG
    },
    {
      name: 'midgressBytesSum',
      type: DataType.LONG
    },
    {
      name: 'midgressHitsSum',
      type: DataType.LONG
    },
    {
      name: 'midgressResponseBytesSum',
      type: DataType.LONG
    },
    {
      name: 'midgressRequestBytesSum',
      type: DataType.LONG
    },
    {
      name: 'offloadedHitsPercentage',
      type: DataType.DOUBLE
    },
    {
      name: 'offloadedBytesPercentage',
      type: DataType.DOUBLE
    },
    {
      name: 'offloadedRequestBytesPercentage',
      type: DataType.DOUBLE
    },
    {
      name: 'offloadedResponseBytesPercentage',
      type: DataType.DOUBLE
    }
  ],
  dimensions: [
    {
      name: 'time5minutes',
      type: DataType.TIMESTAMP_SEC,
      filterable: true,
      filterType: 'TEXT',
      authorizable: false
    },
    {
      name: 'time1hour',
      type: DataType.TIMESTAMP_SEC,
      filterable: true,
      filterType: 'TEXT',
      authorizable: false
    },
    {
      name: 'time1day',
      type: DataType.TIMESTAMP_SEC,
      filterable: true,
      filterType: 'TEXT',
      authorizable: false
    },
    {
      name: 'cpcode',
      type: DataType.LONG,
      filterable: true,
      filterType: 'TEXT',
      authorizable: true
    },
    {
      name: 'hostname',
      type: DataType.STRING,
      filterable: true,
      filterType: 'TEXT',
      authorizable: false
    },
    {
      name: 'responseCode',
      type: DataType.LONG,
      filterable: true,
      filterType: 'TEXT',
      authorizable: false
    },
    {
      name: 'responseClass',
      type: DataType.STRING,
      filterable: true,
      filterType: 'ENUM',
      filterEnumValues: [
        '0xx',
        '1xx',
        '2xx',
        '3xx',
        '4xx',
        '5xx',
        '6xx'
      ],
      authorizable: false
    },
    {
      name: 'responseStatus',
      type: DataType.STRING,
      filterable: true,
      filterType: 'ENUM',
      filterEnumValues: [
        'error',
        'success'
      ],
      authorizable: false
    },
    {
      name: 'httpMethod',
      type: DataType.STRING,
      filterable: true,
      filterType: 'ENUM',
      filterEnumValues: [
        'get_head',
        'put_post'
      ],
      authorizable: false
    },
    {
      name: 'deliveryType',
      type: DataType.STRING,
      filterable: true,
      filterType: 'ENUM',
      filterEnumValues: [
        'non_secure',
        'secure'
      ],
      authorizable: false
    },
    {
      name: 'cacheability',
      type: DataType.STRING,
      filterable: true,
      filterType: 'ENUM',
      filterEnumValues: [
        'cacheable',
        'non_cacheable'
      ],
      authorizable: false
    },
    {
      name: 'ipVersion',
      type: DataType.STRING,
      filterable: true,
      filterType: 'ENUM',
      filterEnumValues: [
        'ipv4',
        'ipv6'
      ],
      authorizable: false
    },
    {
      name: 'httpProtocol',
      type: DataType.STRING,
      filterable: true,
      filterType: 'ENUM',
      filterEnumValues: [
        'http1.1',
        'https1.1',
        'http2',
        'http3'
      ],
      authorizable: false
    }
  ],
  defaults: {
    defaultTimeRange: {
      start: 'now - 19min',
      end: 'now - 9min 1sec'
    },
    defaultMetrics: [
      'edgeHitsSum',
      'edgeBytesSum'
    ],
    defaultDimensions: [
      'hostname',
      'responseCode'
    ],
    defaultSortBys: [
      {
        name: 'hostname',
        sortOrder: 'ASCENDING'
      },
      {
        name: 'edgeHitsSum',
        sortOrder: 'DESCENDING'
      }
    ]
  },
  refId: '1'
};
