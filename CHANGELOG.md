# Changelog

## 1.0.0 (Released)

Initial release.

## 1.0.1

Bugs fixed:
Fix vector-to-array-data-grafana9
DPS-31123 Fix operators list

## 1.2.8

DPS-46271 Fix security finding:
Authenticated users with low-privilege access (Grafana Viewer role) can supply an arbitrary external URL to override the
target Akamai host. When triggered, the plugin transmits active EdgeGrid authorization headers including the
client_token, access_token, and HMAC signature to the attacker-controlled endpoint.