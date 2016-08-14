const ato = require('arg-to-object').parse
const read = require('read')
const format = require('util').format
const scrappee = require('scrappee')
const EventEmitter = require('events')
const fs = require('fs')

QUIT = false
var options = ato({
  url: null,
  interactive: false,
  pipe: false,
  cached: false,
  ttl: 0,
  script: null,
  exit: false,
  out: '',
  stdout: false
})
var client = scrappee.client(options)

function scrapeOne(client, op) {
  
  if(typeof op.script === 'string' && client._selectors == null) {
    try {
      var s_module = require(op.script)
      client.select(s_module)
      console.log('Selector script exports:', Object.keys(s_module).join(', '))
    } catch(e) {
      console.log(e)
      process.exit()
    }
  }

  console.log('scraping', op.url)

  client.get(op.url).then((e, data) => {
    var filename = format('./test/%s.json', data.username)
    fs.writeFile(filename, JSON.stringify(data, null, 2)+'\n', (e) => {
      if(e) {
        console.error(e)
        process.exit()
      }
    })
  })
}

function getUrl(invoker, op) {
  read({prompt: '>'}, (e, res, isDef) => {
    if(e) {
      console.error(e)
      op.quit = true
    } else {
      if(options.pipe)
        res = "-url "+res
      op = ato(res, op)
    }
    invoker.emit('input', op)
  })
}

function InteractiveCli(client, options) {
  this.on('input', (op) => {
    if(op.exit) {
      console.log('goodbye!')
      process.exit()
    }
    scrapeOne(client, op)
    getUrl(this, options)
  })
  getUrl(this, options)
}
InteractiveCli.prototype = Object.create(EventEmitter.prototype)

console.log('@scrappee starting')
if(options.interactive) {
  const cli = new InteractiveCli(client, options)
} else {
  scrapeOne(client, options)
}
