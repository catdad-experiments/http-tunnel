/* eslint-disable no-console */
process.title = 'http tunnel client';
const fetch = require('node-fetch');
const socketProxy = require('../lib/socket-proxy.js');

const handler = ({ name, d: localPort, h: serverHost, p: serverPort  }) => {
  (async () => {
    const res = await fetch(`http://${serverHost}:${serverPort}/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'client',
        name
      })
    });

    const str = await res.text();

    if (!res.ok) {
      throw new Error(`error response: ${res.status} \n\n ${str}`);
    }

    const { port } = JSON.parse(str);

    socketProxy(`${serverHost}:${port}`, `localhost:${localPort}`);
    console.log(`${serverHost}:${port} -> localhost:${localPort}`);
  })().then(() => {}).catch(err => {
    console.log('client failed to start');
    console.log(err);
    process.exit(1);
  });
};

module.exports = {
  command: 'client [options]',
  describe: 'start a publicly accessible server',
  builder: (yargs) => {
    yargs
    .option('name', {
      type: 'string',
      alias: 'n',
      describe: 'unique name that identifies this tunnel'
    })
    .option('port', {
      type: 'number',
      alias: 'd',
      default: 8000,
      describe: 'local port that is serving traffic to the tunnel'
    })
    .option('server-host', {
      type: 'string',
      alias: 'h',
      default: 'localhost',
      describe: 'hostname of server used to establish the tunnel'
    })
    .options('server-port', {
      type: 'number',
      alias: 'p',
      default: 80,
      describe: 'port of server used to establish the tunnel'
    });
  },
  handler
};
