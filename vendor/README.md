# Fluent runtime

`fluent/*.js` are unmodified ES modules from `@fluent/bundle` 0.19.1, Apache-2.0,
https://registry.npmjs.org/@fluent/bundle/-/bundle-0.19.1.tgz.
Upstream: https://github.com/projectfluent/fluent.js.

The upstream modules are kept intact rather than transformed into a second bundle. Both frontends
ship these local assets; no runtime dependency on a CDN. `fluent-bundle.js` is the common entry point.
