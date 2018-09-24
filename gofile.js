const go = require('go')

go.fs.readdirSync('scripts')
  .map(filename => require(`./scripts/${filename}`))
  .forEach(script => go.registerCommand(script))
