const { EVENT_NAMES } = require('./events');

const SYNTAX = [
  ['declaring things', [
    [
      'function name(a, b) { ... }',
      'declares a function. parameters are untyped, its never function f(a: Player)',
      'function ${1:name}(${2:a, b}) {\n\t$3\n}',
    ],
    ['val name = value', 'declares an immutable value'],
    ['var name = value', 'declares a mutable value'],
    [
      '@Katton.command(name = "name", permission = "admin")',
      'registers a script command, run via /katton run <name>',
      '@Katton.command(name = "${1:name}", permission = "${2|admin,creative,all|}")\n' +
        'function $1(sender, args) {\n' +
        '\tsender.sendMessage("${3:hello!}")\n' +
        '}\n$0',
    ],
    [
      '@Katton.listen("event_name")',
      'registers an event listener',
      '@Katton.listen("${1|' + EVENT_NAMES.join(',') + '|}")\n' +
        'function ${2:onEvent}(event) {\n' +
        '\tval player = event.player\n' +
        '\tplayer.sendMessage("${3:hello!}")\n' +
        '}\n$0',
    ],
  ]],

  ['flow', [
    [
      'if (cond) { ... } else { ... }',
      'conditional branches',
      'if (${1:cond}) {\n\t$2\n} else {\n\t$3\n}',
    ],
    [
      'when (subject) { value -> { ... } else -> { ... } }',
      'a switch statement kinda',
      'when (${1:subject}) {\n\t${2:value} -> {\n\t\t$3\n\t}\n\telse -> {\n\t\t$4\n\t}\n}',
    ],
    [
      'for (i in 0..9) { ... }',
      'ascending range',
      'for (${1:i} in ${2:0..9}) {\n\t$3\n}',
    ],
    [
      'for (i in 10 downTo 1) { ... }',
      'descending range',
      'for (${1:i} in ${2:10} downTo ${3:1}) {\n\t$4\n}',
    ],
    [
      'for (x in someList) { ... }',
      'iterate a list, or a map (iterates its keys)',
      'for (${1:x} in ${2:someList}) {\n\t$3\n}',
    ],
    ['break', 'exits the nearest loop'],
    ['continue', 'skips to the next loop iteration'],
    ['return value', 'returns from the current function (value is optional)'],
  ]],

  ['values', [
    ['["red", "blue", "lime"]', 'a list literal'],
    ['{ "red": 1, "blue": 2 }', 'a map literal'],
    ['true / false / null', 'boolean and null literals'],
    ['"text " + 5', 'string concatenation via +'],
  ]],
];

module.exports = { SYNTAX };
