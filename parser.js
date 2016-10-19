var parse = {
    evaluation: function (argv) {
        var $ = /^\s*\{(.*)\}$/.exec(argv[0])
        if (!$) {
            return null
        }
        argv.shift()
        return {
            type: "evaluation",
            body: $[1]
        }
    },
    conditional: function (argv) {
        if (argv.length < 3) {
            return null
        }
        return {
            type: 'condition',
            selector: argv.shift(),
            operation: argv.shift(),
            comparator: argv.shift()
        }
    },
    selector: function (argv) {
        return {
            type: 'selector',
            selector: argv.shift()
        }
    },
    extractor: function (argv) {
        return parse.evaluation(argv) || parse.selector(argv)
    },
    keyword: function (token) {
        return /^when|and|header|flattened|include|exclude$/.test(token)
    }
}

module.exports = function (argv) {
    var ast = [], proto = {}, body, extractor, instance, name, field, visited
    field = proto
    while (argv.length != 0) {
        visited = true
        var keyword = argv.shift()
        switch (keyword) {
        case 'when':
            field = {}
            for (var key in proto) {
                field[key] = Array.isArray(proto[key]) ? proto[key].slice() : proto[key]
            }
            ast.push(field)
            field.when = parse.evaluation(argv) || parse.conditional(argv)
            break
        case 'and':
            field.when = {
                type: 'and',
                one: field.when,
                two:  parse.evaluation(argv) || parse.conditional(argv)
            }
            break
        case 'header':
            field.header = {
                format: ~argv[0].indexOf('%') ? argv.shift() : null,
                selectors: []
            }
            while (argv.length != 0 && !parse.keyword(argv[0])) {
                extractor = parse.extractor(argv)
                field.header.selectors.push(extractor)
            }
            break
        case 'flattened':
            field.flattened || (field.flattened = [])
            while (argv.length != 0 && !parse.keyword(argv[0])) {
                if ($ = /^([^:]+):(.*)$/.exec(argv[0])) {
                    name = $[1]
                    argv[0] = $[2]
                } else {
                    name = argv[0]
                }
                field.flattened.push({
                    name: name,
                    extractor: parse.extractor(argv)
                })
            }
            break
        case 'include':
            field.include || (field.include = [])
            while (argv.length != 0 && !parse.keyword(argv[0])) {
                if ($ = /^([^:]+):(.*)$/.exec(argv[0])) {
                    name = $[1]
                    argv[0] = $[2]
                } else {
                    name = argv[0]
                }
                field.include.push({
                    name: name,
                    extractor: parse.extractor(argv)
                })
            }
        }
    }
    if (visited && ast.length == 0) {
        ast.push(proto)
    }
    return ast
}
