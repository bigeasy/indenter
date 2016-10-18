# Not real examples, sorting out the langauge.

cat log.txt | indent
    require 'tz'
    when 'qualified ~ /paxos#.*/'
        header '%s>' 'qualified'
        include 'request=$request' 'response=$response'
    when 'qualified = paxos#name'
        include '{ new Date($.when).toISOString() }(when)'

# TODO Rename `include` to `json`.
cat log.txt | indent
    when 'name' ~ 'paxos'
        header '%s>' '$(qualified)'
        flattened 'request: request',
        include 'request: request' 'response: response'
    when 'qualified' <> 'paxos#name'
        include 'when: { new Date($("when")[0]).toISOString() }'
    when '{ /paxos/.test($("name")) }'
