#!/usr/bin/env node

/*
    ___ usage ___ en_US ___
    usage: wafer parse <options>

    options:

        -o, --output         <string>   name of an output file
        -s, --syslog                    parse a leading syslog record
            --help                      display this message

    ___ $ ___ en_US ___

    ___ . ___
*/
require('arguable')(module, require('cadence')(function (async, program) {
    var Staccato = require('staccato')
    var byline = require('byline')
    var indent = require('./indent')
    var inquiry = require('inquiry')
    var sprintf = require('sprintf')

    program.helpIf(program.ultimate.help)

    var util = require('util')
    var parsed = require('./parser')(program.argv)
    console.log(util.inspect(parsed, null, { depth: Infinity }))
    function comparator (operation, coercion) {
        return new Function (
            'comparator',
                'comparator = ' + coercion + 'comparator\n' +
                'return function (value) {\n' +
                    'return ' + coercion + 'value ' + operation + ' comparator\n' +
                '}\n'
        )
    }
    function createCondition (when) {
        var select = inquiry(when.selector)
        var compare = comparator(when.operation, '')(when.comparator)
        return function (object) {
            return compare(select(object).shift() || null)
        }
    }
    function createExtractor (extractor) {
        switch (extractor.type) {
        case 'selector':
            var select = inquiry(extractor.selector)
            return function (json) {
                return select(json).shift() || null
            }
        }
    }
    function createHeader (header) {
        var selectors = header.selectors.map(function (selector) {
            switch (selector.type) {
            case 'selector':
                console.log(selector)
                select = inquiry(selector.selector)
                return function (json) {
                    return select(json).shift() || null
                }
            }
        })
        return function (json) {
            var vargs = selectors.map(function (selector) {
                return selector(json)
            })
            return sprintf(header.format, vargs)
        }
        return null
    }
    function createInclude (include) {
        var includers = include.map(function (include) {
            return {
                name: include.name,
                extractor: createExtractor(include.extractor)
            }
        })
        return function (json) {
            var included = {}
            includers.forEach(function (includer) {
                included[includer.name] = includer.extractor(json)
            })
            return included
        }
    }
    var emissions = parsed.map(function (emission) {
        var when, operation = {}, header = null, include = null, flattened = null
        if (emission.when == null) {
            when = function () { return true }
        } else switch (emission.when.type) {
        case 'condition':
            when = createCondition(emission.when)
            break
        }
        if (emission.header) {
            header = createHeader(emission.header)
        }
        if (emission.flattened) {
            flattened = createInclude(emission.flattened)
        }
        if (emission.include) {
            include = createInclude(emission.include)
        } else {
            include = function (json) { return json }
        }
        return {
            when: when,
            header: header,
            include: include,
            flattened: flattened
        }
    })

    var output = new Staccato(program.stdout)
    indent(emissions, new Staccato(byline(program.stdin)), output, async())
}))
