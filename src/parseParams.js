

var tokens = [
    {
        re: /^\$([\w@]+)/,   //var
        parse: function(e, s)
        {
            parseModifiers(parseVar(s, e, RegExp.$1), e);
        }
    },
    {
        re: /^\$([\w@]+)/,   //var
        parse: function(e, s)
        {
            parseModifiers(parseVar(s, e, RegExp.$1), e);
        }
    },
    {
        re: /^(true|false)/i,  //bool
        parse: function(e, s)
        {
            parseText(e.token.match(/true/i) ? '1' : '', e.tree);
        }
    },
    {
        re: /^'([^'\\]*(?:\\.[^'\\]*)*)'/, //single quotes
        parse: function(e, s)
        {
            parseText(evalString(RegExp.$1), e.tree);
            parseModifiers(s, e);
        }
    },
    {
        re: /^"([^"\\]*(?:\\.[^"\\]*)*)"/,  //double quotes
        parse: function(e, s)
        {
            var v = evalString(RegExp.$1);
            var isVar = v.match(tokens[0].re);
            if (isVar)
            {
                var eVar = {token:isVar[0], tree:[]};
                parseVar(v, eVar, isVar[1]);
                if (eVar.token.length == v.length)
                {
                    e.tree.push( eVar.tree[0] );
                    return;
                }
            }
            parseText.parseEmbeddedVars = true;
            e.tree.push({
                type: 'plugin',
                name: '__quoted',
                params: {__parsed: parse(v,[])}
            });
            parseText.parseEmbeddedVars = false;
            parseModifiers(s, e);
        }
    },
    {
        re: /^(\w+)\s*[(]([)]?)/,  //func()
        parse: function(e, s)
        {
            var fnm = RegExp.$1;
            var noArgs = RegExp.$2;
            var params = parseParams(noArgs?'':s,/^\s*,\s*/);
            parseFunc(fnm, params, e.tree);
            e.value += params.toString();
            parseModifiers(s.slice(params.toString().length), e);
        }
    },
    {
        re: /^\s*\(\s*/,  //expression in parentheses
        parse: function(e, s)
        {
            var parens = [];
            e.tree.push(parens);
            parens.parent = e.tree;
            e.tree = parens;
        }
    },
    {
        re: /^\s*\)\s*/,
        parse: function(e, s)
        {
            if (e.tree.parent) //it may be the end of func() or (expr)
            {
                e.tree = e.tree.parent;
            }
        }
    },
    {
        re: /^\s*(\+\+|--)\s*/,
        parse: function(e, s)
        {
            if (e.tree.length && e.tree[e.tree.length-1].type == 'var')
            {
                parseOperator(RegExp.$1, 'post-unary', 1, e.tree);
            }
            else
            {
                parseOperator(RegExp.$1, 'pre-unary', 1, e.tree);
            }
        }
    },
    {
        re: /^\s*(==|!=|===|!==)\s*/,
        parse: function(e, s)
        {
            parseOperator(RegExp.$1, 'binary', 6, e.tree);
        }
    },
    {
        re: /^\s+(eq|ne|neq)\s+/i,
        parse: function(e, s)
        {
            var op = RegExp.$1.replace(/ne(q)?/,'!=').replace(/eq/,'==');
            parseOperator(op, 'binary', 6, e.tree);
        }
    },
    {
        re: /^\s*!\s*/,
        parse: function(e, s)
        {
            parseOperator('!', 'pre-unary', 2, e.tree);
        }
    },
    {
        re: /^\s+not\s+/i,
        parse: function(e, s)
        {
            parseOperator('!', 'pre-unary', 2, e.tree);
        }
    },
    {
        re: /^\s*(=|\+=|-=|\*=|\/=|%=)\s*/,
        parse: function(e, s)
        {
            parseOperator(RegExp.$1, 'binary', 10, e.tree);
        }
    },
    {
        re: /^\s*(\*|\/|%)\s*/,
        parse: function(e, s)
        {
            parseOperator(RegExp.$1, 'binary', 3, e.tree);
        }
    },
    {
        re: /^\s+mod\s+/i,
        parse: function(e, s)
        {
            parseOperator('%', 'binary', 3, e.tree);
        }
    },
    {
        re: /^\s*(\+|-)\s*/,
        parse: function(e, s)
        {
            if (!e.tree.length || e.tree[e.tree.length-1].name == 'operator')
            {
                parseOperator(RegExp.$1, 'pre-unary', 4, e.tree);
            }
            else
            {
                parseOperator(RegExp.$1, 'binary', 4, e.tree);
            }
        }
    },
    {
        re: /^\s*(<=|>=|<>|<|>)\s*/,
        parse: function(e, s)
        {
            parseOperator(RegExp.$1.replace(/<>/,'!='), 'binary', 5, e.tree);
        }
    },
    {
        re: /^\s+(lt|lte|le|gt|gte|ge)\s+/i,
        parse: function(e, s)
        {
            var op = RegExp.$1.replace(/lt/,'<').replace(/l(t)?e/,'<=').replace(/gt/,'>').replace(/g(t)?e/,'>=');
            parseOperator(op, 'binary', 5, e.tree);
        }
    },
    {
        re: /^\s+(is\s+(not\s+)?div\s+by)\s+/i,
        parse: function(e, s)
        {
            parseOperator(RegExp.$2?'div_not':'div', 'binary', 7, e.tree);
        }
    },
    {
        re: /^\s+is\s+(not\s+)?(even|odd)(\s+by\s+)?\s*/i,
        parse: function(e, s)
        {
            var op = RegExp.$1 ? ((RegExp.$2=='odd')?'even':'even_not') : ((RegExp.$2=='odd')?'even_not':'even');
            parseOperator(op, 'binary', 7, e.tree);
            if (!RegExp.$3)
            {
                parseText('1', e.tree);
            }
        }
    },
    {
        re: /^\s*(&&)\s*/,
        parse: function(e, s)
        {
            parseOperator(RegExp.$1, 'binary', 8, e.tree);
        }
    },
    {
        re: /^\s*(\|\|)\s*/,
        parse: function(e, s)
        {
            parseOperator(RegExp.$1, 'binary', 9, e.tree);
        }
    },
    {
        re: /^\s+and\s+/i,
        parse: function(e, s)
        {
            parseOperator('&&', 'binary', 11, e.tree);
        }
    },
    {
        re: /^\s+xor\s+/i,
        parse: function(e, s)
        {
            parseOperator('xor', 'binary', 12, e.tree);
        }
    },
    {
        re: /^\s+or\s+/i,
        parse: function(e, s)
        {
            parseOperator('||', 'binary', 13, e.tree);
        }
    },
    {
        re: /^#(\w+)#/,  //config variable
        parse: function(e, s)
        {
            var eVar = {token:'$smarty',tree:[]};
            parseVar('.config.'+RegExp.$1, eVar, 'smarty');
            e.tree.push( eVar.tree[0] );
            parseModifiers(s, e);
        }
    },
    {
        re: /^\s*\[\s*/,   //array
        parse: function(e, s)
        {
            var params = parseParams(s, /^\s*,\s*/, /^('[^'\\]*(?:\\.[^'\\]*)*'|"[^"\\]*(?:\\.[^"\\]*)*"|\w+)\s*=>\s*/);
            parsePluginFunc('__array',params,e.tree);
            e.value += params.toString();
            var paren = s.slice(params.toString().length).match(/\s*\]/);
            if (paren)
            {
                e.value += paren[0];
            }
        }
    },
    {
        re: /^[\d.]+/, //number
        parse: function(e, s)
        {
            parseText(e.token, e.tree);
            parseModifiers(s, e);
        }
    },
    {
        re: /^\w+/, //static
        parse: function(e, s)
        {
            parseText(e.token, e.tree);
            parseModifiers(s, e);
        }
    }
];

/**
 * 解析params参数
 * @param  {string} text 参数文本
 * @return {Object}      参数列表
 */
function parseParams(text) {
    text = trim(text.replace(/\n/g, ' '));
    var params = {};


}
