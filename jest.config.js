// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';

const { grafanaESModules, nodeModulesToTransform } = require('./.config/jest/utils');

const extraESModules = [
  'marked',
];

module.exports = {
  ...require('./.config/jest.config'),
  moduleNameMapper: {
    ...require('./.config/jest.config').moduleNameMapper,
    '^react-calendar$': '<rootDir>/src/test/mocks/react-calendar.tsx',
    '^react-calendar/(.*)$': '<rootDir>/src/test/mocks/react-calendar.tsx',
  },
  transformIgnorePatterns: [nodeModulesToTransform([...grafanaESModules, ...extraESModules])],
};
