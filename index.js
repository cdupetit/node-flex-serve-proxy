const proxy = require('http-proxy-middleware');

const normalizeOptionsProxy = (options) => {
  if (options && options.addons && options.addons.proxy) {
    const proxyConfigOrCallback = options.addons.proxy;
    let proxyConfig;

    if (typeof proxyConfigOrCallback === 'function') {
      proxyConfig = proxyConfigOrCallback();
    } else {
      proxyConfig = proxyConfigOrCallback;
    }

    if (!Array.isArray(proxyConfig)) {
      // eslint-disable-next-line no-param-reassign
      options.addons.proxy = Object.keys(proxyConfig).map((context) => {
        let proxyOptions;
        // For backwards compatibility reasons.
        const correctedContext = context
          .replace(/^\*$/, '**')
          .replace(/\/\*$/, '');

        if (typeof proxyConfig[context] === 'string') {
          proxyOptions = {
            context: correctedContext,
            target: proxyConfig[context],
          };
        } else {
          proxyOptions = Object.assign({}, proxyConfig[context]);
          proxyOptions.context = correctedContext;
        }
        proxyOptions.logLevel = proxyOptions.logLevel || 'warn';

        return proxyOptions;
      });
    }
  }
};

const getMiddlewareProxy = (proxyConfig) => {
  const context = proxyConfig.context || proxyConfig.path;

  // It is possible to use the `bypass` method without a `target`.
  // However, the proxy middleware has no use in this case, and will fail to instantiate.
  if (proxyConfig.target) {
    return proxy(context, proxyConfig);
  }
  return null;
};

module.exports.onListening = (data) => {
  const { server, options } = data;
  if (
    server &&
    options &&
    options.addons &&
    options.addons.proxy &&
    Array.isArray(options.addons.proxy.wsProxies)
  ) {
    options.addons.proxy.wsProxies.forEach((wsProxy) => {
      server.on('upgrade', wsProxy.upgrade);
    });
    delete options.addons.proxy.wsProxies; // eslint-disable-line no-param-reassign
  }
};

module.exports.proxy = (app, options) => {
  if (options && options.addons && options.addons.proxy) {
    normalizeOptionsProxy(options);

    options.addons.proxy.wsProxies = []; // eslint-disable-line no-param-reassign
    options.addons.proxy.forEach((proxyConfigOrCallback) => {
      let proxyConfig;
      let proxyMiddleware;

      if (typeof proxyConfigOrCallback === 'function') {
        proxyConfig = proxyConfigOrCallback();
      } else {
        proxyConfig = proxyConfigOrCallback;
      }

      proxyMiddleware = getMiddlewareProxy(proxyConfig);
      if (proxyConfig.ws) {
        options.addons.proxy.wsProxies.push(proxyMiddleware);
      }

      const middleware = (ctx, next) =>
        new Promise((resolve, reject) => {
          if (typeof proxyConfigOrCallback === 'function') {
            const newProxyConfig = proxyConfigOrCallback();
            if (newProxyConfig !== proxyConfig) {
              proxyConfig = newProxyConfig;
              proxyMiddleware = getMiddlewareProxy(proxyConfig);
            }
          }
          const bypass = typeof proxyConfig.bypass === 'function';
          const bypassUrl =
            (bypass && proxyConfig.bypass(ctx, proxyConfig)) || false;

          if (bypassUrl) {
            ctx.req.url = bypassUrl; // eslint-disable-line no-param-reassign
            resolve(next());
          } else if (proxyMiddleware) {
            proxyMiddleware(ctx.req, ctx.res, (err) => {
              if (err) reject(err);
              else resolve(next());
            });
          } else {
            resolve(next());
          }
        });

      app.use(middleware);
    });
    if (!options.addons.proxy.wsProxies.length) {
      delete options.addons.proxy.wsProxies; // eslint-disable-line no-param-reassign
    }
  }
};
