// Jest setup provided by Grafana scaffolding
import './.config/jest-setup';
import { MessageChannel } from 'node:worker_threads';
import { TextEncoder } from 'node:util';

global.TextEncoder = TextEncoder;
global.MessageChannel = MessageChannel;
const portal = require('/Users/mzuber/Projects/akamai-insights-datasource/node_modules/@grafana/ui/dist/cjs/components/Portal/Portal.cjs');
const portalContainer = document.body || document.createElement('div');
portal.getPortalContainer = () => portalContainer;
