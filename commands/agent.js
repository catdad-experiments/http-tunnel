/* eslint-disable no-console */
process.title = 'http tunnel agent';
const fetch = require('node-fetch');
const socketProxy = require('../lib/socket-proxy.js');

const handler = ({ name, c: dataHost, d: dataPort, h: serverHost, p: serverPort  }) => {
  (async () => {
    const res = await fetch(`http://${serverHost}:${serverPort}/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'agent',
        name
      })
    });

    const str = await res.text();

    if (!res.ok) {
      throw new Error(`error response: ${res.status} \n\n ${str}`);
    }

    const { port } = JSON.parse(str);

    socketProxy(`${dataHost}:${dataPort}`, `${serverHost}:${port}`);
    console.log(`${dataHost}:${dataPort} -> ${serverHost}:${port}`);
  })().then(() => {}).catch(err => {
    console.log('agent failed to start');
    console.log(err);
    process.exit(1);
  });
};

module.exports = {
  command: 'agent [options]',
  describe: 'start a publicly accessible server',
  builder: (yargs) => {
    yargs
    .option('name', {
      type: 'string',
      alias: 'n',
      describe: 'unique name that identifies this tunnel'
    })
    .option('data-host', {
      type: 'string',
      alias: 'c',
      default: 'localhost',
      describe: 'hostname where the tunnel will send traffic'
    })
    .option('data-port', {
      type: 'number',
      alias: 'd',
      default: 8000,
      describe: 'port where the tunnel will send traffic'
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
