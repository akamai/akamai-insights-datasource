// Jest setup provided by Grafana scaffolding
import './.config/jest-setup';
import { MessageChannel } from 'node:worker_threads';
import { TextEncoder } from 'node:util';

global.TextEncoder = TextEncoder;

// React's scheduler uses MessageChannel; track and close the ports after each test file so that
// no render is scheduled after the jsdom environment has been torn down
const openChannels = [];
global.MessageChannel = class extends MessageChannel {
  constructor() {
    super();
    openChannels.push(this);
  }
};

afterAll(() => {
  openChannels.splice(0).forEach(({ port1, port2 }) => {
    port1.close();
    port2.close();
  });
});

const portal = require('/Users/mzuber/Projects/akamai-insights-datasource/node_modules/@grafana/ui/dist/cjs/components/Portal/Portal.cjs');
const portalContainer = document.body || document.createElement('div');
portal.getPortalContainer = () => portalContainer;
