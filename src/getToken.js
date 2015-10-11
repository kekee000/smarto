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
    'while': 1,
    'strip': 1
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
                command.isClose = true;
            }
            // block开始
            else if (match = command.text.match(/^\w+\s/)) {
                tag = trim(match[0]);
                if (smartyBlocks[tag]) {
                    command.type = TOKEN_BLOCK;
                    command.text = command.text.slice(tag.length);
                }
            }
            else {
                command.type = TOKEN_FUNC;
            }

            segments.push(command);

            lastIndex = rIndex + rdelim.length;
        }
        else {
            throw throwError('unclosed command', template, index + ldelim.length);
        }
    }

    segments.push({
        type: TOKEN_TEXT,
        from: lastIndex,
        to: index
    });

    return getTree(template, segments, options);
}

var STATUS_STRIP = false; // 是否strip状态

function getCloseCommandIndex(tagName, segments, index) {
    var openCount = 0;
    for (var i = index, l = segments.length; i < l; i++) {
        if (segments[i].tag === tagName) {
            if (segments[i].isClose) {
                if (openCount) {
                    openCount--;
                }
                else {
                    return i;
                }
            }
            else {
                openCount++;
            }
        }
    }

    throw throwError('unclosed command' + tagName);
}

/**
 * 根据模板获取token列表
 * @param  {string} template 模板
 * @param  {Object} options  模板参数
 * @return {Array}          token数组
 */
function getTree(template, segments, options) {
    var tree = [];

    for (var i = 0; i < segments.length; i++) {
        var command = segments[i];
        if (command.type === TOKEN_TEXT) {
            command.text =  template.slice(command.from, command.to);
            // strip状态需要去除空格
            if (STATUS_STRIP) {
                command.text = trim(command.text);
            }
            tree.push(command);
        }
        else if (command.type === TOKEN_VAR) {
            parseVar(template, command);
        }
        else if (command.type === TOKEN_BLOCK) {
            var closeCommandIndex = getCloseCommandIndex(command.tag, segments, i + 1);
            if (command.tag === 'literal') {
                command.type = TOKEN_TEXT;
                command.from = command.to;
                command.to = segments[closeCommandIndex].from;
                command.text =  template.slice(command.from, command.to);
                tree.push(command);
                i = closeCommandIndex;
            }
            else {
                parseBlock(template, command);
            }
        }
    }
    return tree;
}
