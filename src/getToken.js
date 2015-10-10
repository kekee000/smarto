/**
 * @file token解析
 * @author mengke01(kekee000@gmail.com)
 */

var TOKEN_TOKEN = 0; // token块
var TOKEN_TEXT = 1; // 文本块
var TOKEN_BLOCK = 2; // 块
var TOKEN_VAR = 3; // 变量
var TOKEN_FUNC = 5; // 函数

var smartyBlocks = {
    'block': 1,
    'capture': 1,
    'for': 1,
    'foreach': 1,
    'function': 1,
    'if': 1,
    'literal': 1,
    'php': 1,
    'section': 1,
    'while': 1
};

/**
 * 根据模板获取token列表
 * @param  {string} template 模板
 * @param  {Object} options  模板参数
 * @return {Array}          token数组
 */
function getToken(template, options) {
    var ldelim = options.left_delimiter;
    var rdelim = options.right_delimiter;
    var index;
    var rIndex;
    var lastIndex = 0;
    var segments = [];

    while ((index = template.indexOf(ldelim, lastIndex)) >= 0) {
        if ((rIndex = template.indexOf(rdelim, index)) > 0) {
            segments.push({
                type: TOKEN_TEXT,
                from: lastIndex,
                to: index
            });

            var command = {
                type: TOKEN_TOKEN,
                from: index,
                to: rIndex,
                text: template.slice(index + ldelim.length, rIndex)
            };
            var match;
            var tag;

            // 变量
            if (command.text[0] === '$') {
                command.type = TOKEN_VAR;
            }
            // block结束
            else if (command.text[0] === '/') {
                tag = trim(command.text.slice(1));
                if (!smartyBlocks[tag]) {
                    throw throwError('not support block tag:' + tag, template, index);
                }
                command.type = TOKEN_BLOCK;
                command.tag = tag;
                command.close = true;
            }
            // block开始
            else if (match = command.text.match(/^\w+\s/)) {
                tag = trim(match[0]);
                if (smartyBlocks[tag]) {
                    command.type = TOKEN_BLOCK;
                    command.text = command.text.slice(tag.length);
                }
            }

            segments.push(command);

            lastIndex = rIndex + rdelim.length;
        }
        else {
            throw throwError('unclosed comment', template, index + ldelim.length);
        }
    }

    segments.push({
        type: TOKEN_TEXT,
        from: lastIndex,
        to: index
    });

    var tree = [];
    getTree(segments, tree);
    console.log(template);
}


function getTree() {

}
