/* eslint-disable no-console */
process.title = 'http tunnel server';
const http = require('http');

const { Response } = require('node-fetch');
const socketProxy = require('../lib/socket-proxy.js');

const map = {};

const handler = (argv) => {
  const getPort = (() => {
    let nextPort = argv.f;
    const max = argv.t;

    return () => {
      if (nextPort === max) {
        throw new Error('no more free ports');
      }

      return nextPort++;
    };
  })();

  http.createServer(async (req, res) => {
    if (req.method !== 'POST' || !/^\/register\/?$/.test(req.url)) {
      res.writeHead(404);
      res.end();
      return;
    }

    try {
      const reqBuffer = await (new Response(req)).buffer();
      const { name, type } = JSON.parse(reqBuffer.toString());

      map[name] = map[name] || {};
      map[name][type] = map[name][type] || getPort();

      if (map[name].agent && map[name].client) {
        socketProxy(`localhost:${map[name].agent}`, map[name].client);
        console.log(`${name} --- localhost:${map[name].agent} -> ${map[name].client}`);
      }

      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ port: map[name][type] }));
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
