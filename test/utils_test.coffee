if typeof Blueprint == 'undefined'
  Blueprint = require('../src')
describe 'Utilities', ->
  it 'Can Run Empty Promise', (done) ->
    promise = new (Blueprint.__utilities.promise)
    promise.send()
    done()
    
  
