var Staccato = require('staccato')
var cadence = require('cadence')
var util = require('util')
var Wafer = require('wafer')

module.exports = cadence(function (async, emissions, input, output) {
    var loop = async(function () {
        async(function () {
            input.read(async())
        }, function (line) {
            if (line == null) {
                return [ loop.break ]
            }
            var json = JSON.parse(line.toString())
            for (var i = 0, I = emissions.length; i < I; i++) {
                if (emissions[i].when(json)) {
                    break
                }
            }
            if (i == I) return
            var formatted = [], separator = '', newline = ''
            var emission = emissions[i]
            if (emissions[i].header) {
                formatted.push(emissions[i].header(json))
                separator = ' '
                newline = '\n'
            }
            if (emissions[i].flattened) {
                var flattened = emissions[i].flattened(json)
                formatted.push(separator, Wafer.stringify(flattened))
                newline = '\n'
            }
            formatted.push(newline)
            json = emissions[i].include(json)
            var inspection = util
                .inspect(json, null, { depth: Infinity })
                .split('\n')
                .map(function (line) {
                    return '  ' + line
                })
                .join('\n')
            formatted.push(inspection)
            formatted.push('\n')
            output.write(formatted.join(''), async())
        })
    })()
})
