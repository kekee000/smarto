{$tplData.baseDir}

{strip}
strip

{*移除注释*}
{*
    移除多行
    注释
*}

strip
{/strip}

{$tplData.hash = [
    'a' => 'aaaa',
    'b' => 'bbbb'
]}

<ul>
{foreach $tplData.hash as $key => $value}
    <li>{$key}:{$value}</li>
{/foreach}
</ul>

<ul>
{foreach $tplData.list as $item}
    <li>{$item|escape:'html'}</li>
{/foreach}
</ul>


<ul>
{for $i = 1 to 10 step 1}
    <li>{$i}</li>
{/for}
</ul>


{function name="func" class="aaaa"}
{foreach $hash as $key => $value}
    <span class="{$class}">{$key}:{$value}</span>
{/foreach}
{/function}

{call name="func" hash=$tplData.hash}

{func hash=`$tplData.hash|array_slice:1`}

{block name="content"}

{/block}
