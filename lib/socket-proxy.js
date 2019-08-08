const net = require('net');

module.exports = (fromAddress, toAddress) => {
  // parse "80" and "localhost:80" or even "42mEANINg-life.com:80"
  const addrRegex = /^(([a-zA-Z\-\.0-9]+):)?(\d+)$/;

  var addr = {
    from: addrRegex.exec(fromAddress),
    to: addrRegex.exec(toAddress)
  };

  if (!addr.from || !addr.to) {
    throw new Error('incorrect to or from address');
  }

  net.createServer((from) => {
    const to = net.createConnection({
      host: addr.to[2],
      port: addr.to[3]
    });
    from.pipe(to);
    to.pipe(from);
  }).listen(addr.from[3], addr.from[2]);
};
