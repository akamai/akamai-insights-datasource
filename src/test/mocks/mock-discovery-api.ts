export const discoveryTraffic = {
  'name': 'Akamai CDN traffic report data',
  'metrics': [
    {
      'name': 'edgeBytesSum',
      'type': 'LONG'
    },
    {
      'name': 'edgeHitsSum',
      'type': 'LONG'
    },
    {
      'name': 'edgeResponseBytesSum',
      'type': 'LONG'
    },
    {
      'name': 'edgeRequestBytesSum',
      'type': 'LONG'
    },
    {
      'name': 'originBytesSum',
      'type': 'LONG',
      'status': 'ALPHA'
    },
    {
      'name': 'originHitsSum',
      'type': 'LONG',
      'status': 'ALPHA'
    },
    {
      'name': 'originResponseBytesSum',
      'type': 'LONG',
      'status': 'ALPHA'
    },
    {
      'name': 'originRequestBytesSum',
      'type': 'LONG',
      'status': 'ALPHA'
    },
    {
      'name': 'midgressBytesSum',
      'type': 'LONG',
      'status': 'ALPHA'
    },
    {
      'name': 'midgressHitsSum',
      'type': 'LONG',
      'status': 'ALPHA'
    },
    {
      'name': 'midgressResponseBytesSum',
      'type': 'LONG',
      'status': 'ALPHA'
    },
    {
      'name': 'midgressRequestBytesSum',
      'type': 'LONG',
      'status': 'ALPHA'
    },
    {
      'name': 'offloadedHitsPercentage',
      'type': 'DOUBLE',
      'status': 'ALPHA'
    },
    {
      'name': 'offloadedBytesPercentage',
      'type': 'DOUBLE',
      'status': 'ALPHA'
    },
    {
      'name': 'offloadedRequestBytesPercentage',
      'type': 'DOUBLE'
    },
    {
      'name': 'offloadedResponseBytesPercentage',
      'type': 'DOUBLE'
    }
  ],
  'dimensions': [
    {
      'name': 'time5minutes',
      'type': 'TIMESTAMP_SEC',
      'filterable': true,
      'filterType': 'TEXT',
      'authorizable': false
    },
    {
      'name': 'time1hour',
      'type': 'TIMESTAMP_SEC',
      'filterable': true,
      'filterType': 'TEXT',
      'authorizable': false
    },
    {
      'name': 'time1day',
      'type': 'TIMESTAMP_SEC',
      'filterable': true,
      'filterType': 'TEXT',
      'authorizable': false
    },
    {
      'name': 'cpcode',
      'type': 'LONG',
      'filterable': true,
      'filterType': 'TEXT',
      'authorizable': true
    },
    {
      'name': 'hostname',
      'type': 'STRING',
      'filterable': true,
      'filterType': 'TEXT',
      'authorizable': false
    },
    {
      'name': 'responseCode',
      'type': 'LONG',
      'filterable': true,
      'filterType': 'TEXT',
      'authorizable': false
    },
    {
      'name': 'responseClass',
      'type': 'STRING',
      'filterable': true,
      'filterType': 'ENUM',
      'filterEnumValues': [
        '0xx',
        '1xx',
        '2xx',
        '3xx',
        '4xx',
        '5xx',
        '6xx'
      ],
      'authorizable': false
    },
    {
      'name': 'responseStatus',
      'type': 'STRING',
      'filterable': true,
      'filterType': 'ENUM',
      'filterEnumValues': [
        'error',
        'success'
      ],
      'authorizable': false
    },
    {
      'name': 'httpMethod',
      'type': 'STRING',
      'filterable': true,
      'filterType': 'ENUM',
      'filterEnumValues': [
        'get_head',
        'put_post'
      ],
      'authorizable': false
    },
    {
      'name': 'deliveryType',
      'type': 'STRING',
      'filterable': true,
      'filterType': 'ENUM',
      'filterEnumValues': [
        'non_secure',
        'secure'
      ],
      'authorizable': false
    },
    {
      'name': 'cacheability',
      'type': 'STRING',
      'filterable': true,
      'filterType': 'ENUM',
      'filterEnumValues': [
        'cacheable',
        'non_cacheable'
      ],
      'authorizable': false
    },
    {
      'name': 'ipVersion',
      'type': 'STRING',
      'filterable': true,
      'filterType': 'ENUM',
      'filterEnumValues': [
        'ipv4',
        'ipv6'
      ],
      'authorizable': false
    },
    {
      'name': 'httpProtocol',
      'type': 'STRING',
      'filterable': true,
      'filterType': 'ENUM',
      'filterEnumValues': [
        'http1.1',
        'https1.1',
        'http2',
        'http3'
      ],
      'authorizable': false
    }
  ],
  'defaults': {
    'defaultTimeRange': {
      'start': 'now - 19min',
      'end': 'now - 9min 1sec'
    },
    'defaultMetrics': [
      'edgeHitsSum',
      'edgeBytesSum'
    ],
    'defaultDimensions': [
      'hostname',
      'responseCode'
    ],
    'defaultSortBys': [
      {
        'name': 'hostname',
        'sortOrder': 'ASCENDING'
      },
      {
        'name': 'edgeHitsSum',
        'sortOrder': 'DESCENDING'
      }
    ]
  },
  'limits': {
    'maxDimensions': 4,
    'maxDateRangeInDays': 90,
    'maxRetentionInDays': 90,
    'textFilterMaxLength': 100,
    'dataPointsLimit': 50000
  },
  'links': [
    {
      'rel': 'self',
      'href': '/reporting-reports-executor-api/v2/reports/delivery/traffic/current',
      'describedBy': '/reporting-reports-executor-api/v2/reports/schema',
      'allow': [
        'GET'
      ]
    },
    {
      'rel': 'data',
      'href': '/reporting-reports-executor-api/v2/reports/delivery/traffic/current/data',
      'allow': [
        'POST'
      ]
    }
  ]
};
