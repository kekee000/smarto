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
    'block': true,
    'capture': 1,
    'for': 1,
    'foreach': {
        parse: function (command, segments, tree) {
            command.params = parseParams(command.text);
            command.tree = [];
            parseTree(segments, command.tree);
            tree.push(command);
        }
    },
    'function': true,
    'if': 1,
    'literal': {
        parse: function (command, segments, tree) {
            command.type = TOKEN_TEXT;
            command.text = currentTemplate.slice(command.to, command.closeCommand.from);
            tree.push(command);
        }
    },
    'php': 1,
    'section': 1,
    'while': 1,
    'strip': {
        parse: function (command, segments, tree) {
            for (var i = 0, l = segments.length; i < l; i++) {
                if (segments[i].type === TOKEN_TEXT) {
                    segments[i].text = strip(segments[i].text);
                }
            }
            parseTree(segments, tree);
        }
    }
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
                    throw throwError('not support block tag:' + tag, index, template);
                }
                command.type = TOKEN_BLOCK;
                command.tag = tag;
                command.isClose = true;
            }
            // block开始
            else if (match = command.text.match(/^\w+(?:\s|$)/)) {
                tag = trim(match[0]);
                if (smartyBlocks[tag]) {
                    command.type = TOKEN_BLOCK;
                    command.tag = tag;
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
            throw throwError('unclosed command', index + ldelim.length, template);
        }
    }

    segments.push({
        type: TOKEN_TEXT,
        from: lastIndex,
        to: index
    });

    var tree = [];
    currentTemplate = template;
    parseTree(segments, tree);
    currentTemplate = null;
    return tree;
}


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

function parseVar(template, command) {

}

/**
 * 根据模板获取token列表
 * @param  {string} template 模板
 * @param  {Object} options  模板参数
 * @return {Array}          token数组
 */
function parseTree(segments, tree) {
    for (var i = 0; i < segments.length; i++) {
        var command = segments[i];
        if (command.type === TOKEN_TEXT) {
            command.text =  currentTemplate.slice(command.from, command.to);
            tree.push(command);
        }
        else if (command.type === TOKEN_VAR) {
            parseVar(command, tree);
        }
        else if (command.type === TOKEN_BLOCK) {
            var closeCommandIndex = getCloseCommandIndex(command.tag, segments, i + 1);
            command.closeCommand = segments[closeCommandIndex];
            // 对于特殊块需要单独处理
            if (typeof smartyBlocks[command.tag].parse === 'function') {
                smartyBlocks[command.tag].parse(command, segments.slice(i + 1, closeCommandIndex), tree);
            }
            else {
                command.params = parseParams(command.text);
                command.tree = [];
                parseTree(segments.slice(i + 1, closeCommandIndex), command.tree);
                tree.push(command);
            }
            i = closeCommandIndex;
        }
    }
}
