/* eslint-disable no-console */
process.title = 'http tunnel server';
const http = require('http');

const { Response } = require('node-fetch');
const socketProxy = require('../lib/socket-proxy.js');

const map = {};

const handler = (argv) => {
  http.createServer(async (req, res) => {
    if (req.method !== 'POST' || !/^\/register\/?$/.test(req.url)) {
      res.writeHead(404);
      res.end();
      return;
    }

    const getPort = (() => {
      let port = argv.f;
      const max = argv.t;

      return () => {
        if (port === max) {
          throw new Error('no more free ports');
        }

        return port++;
      };
    })();

    try {
      const reqBuffer = await (new Response(req)).buffer();
      const { name, type, address } = JSON.parse(reqBuffer.toString());

      map[name] = map[name] || {};
      map[name][type] = address;
      map[name].port = map[name].port || getPort();

      if (map[name].agent && map[name].client) {
        socketProxy(`localhost:${map[name].port}`, map[name].client);
        console.log(`named tunnel "${name}" started on ${map[name].port}`);
      }

      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ port: map[name].port }));
    } catch (e) {
      res.writeHead(500);
      res.end(e.toString());
    }
  }).listen(argv.port, () => {
    console.log(`Server is listening on port ${argv.port}`);
  });
};

module.exports = {
  command: 'server [options]',
  describe: 'start a publicly accessible server',
  builder: (yargs) => {
    yargs
    .option('port', {
      alias: 'p',
      type: 'number',
      default: 30000
    })
    .option('ports-from', {
      type: 'number',
      alias: 'f',
      default: 8000,
      describe: 'dedicated port range minimum sequential port number'
    })
    .option('ports-to', {
      type: 'number',
      alias: 't',
      default: 9000,
      describe: 'dedicated port range maximum sequential port number'
    });
  },
  handler
};
