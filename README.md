# node-flex-serve-proxy

A Proxy Add-On for [node-flex-serve](https://github.com/cdupetit/node-flex-serve)

## Getting Started

To begin, you'll need to install `node-flex-serve-proxy`:

```console
$ npm install node-flex-serve-proxy
```

## `node-flex-serve-proxy` Config

In a node-flex-serve config file add the addons config

### addons([options])

#### proxy

Type: `Object`

Options for initializing and controlling the [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware#options).

#### add

Please see [Add-On Features](#add-on-features).

## Add-on Features

Luckily, flexibility baked into `node-flex-serve` makes it a snap to add-on features.
You can leverage this by using the `add` option. The value of the option should
be a `Function` matching the following signature:

```js
add: (app, middleware, options) => {
  // ...
}
```

### `add` Function Parameters

- `app` The underlying Koa app
- `middleware` An object containing accessor functions to the `koa-static` middleware.
- `options` - The internal options object used by `node-flex-serve`

Import the add on middleware

```js
const nodeServeProxy = require('node-flex-serve-proxy');
```

```js
add: (app, middleware, options) => {
  // since we're manipulating the order of middleware added, we need to handle
  // adding these two internal middleware functions.
  middleware.content();

  nodeServeProxy.proxy(app, options);
}
```

## Event Handling

You can configure the `onListening` function in the node-flex-serve configuration to handle the server on `upgrade` event.

```js
on: {
  listening: nodeServeProxy.onListening,
}
```

## Example

A Node Flex Serve Config file using Proxy Add-On could look like this :

```js
const nodeServeProxy = require('node-flex-serve-proxy');

module.exports = {
  context: __dirname,
  addons: {
    proxy: {
      '/gitapi': {
        target: 'http://api.github.com',
        pathRewrite: {
          '^/gitapi': '',
        },
        changeOrigin: true,
      },
      '/swapi': {
        target: 'https://swapi.co/api',
        pathRewrite: {
          '^/swapi': '',
        },
        changeOrigin: true,
      },
    },
    add: (app, middleware, options) => {
      middleware.content();
      nodeServeProxy.proxy(app, options);
    },
  },
  on: {
    listening: nodeServeProxy.onListening,
  },
};
```

## Contributing

We welcome your contributions! Please have a read of
[CONTRIBUTING.md](CONTRIBUTING.md) for more information on how to get involved.

## License

#### [MIT](./LICENSE)
