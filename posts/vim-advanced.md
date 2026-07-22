# Vim 高级技巧：打造你的专属编辑工作流

掌握了 Vim 的基础操作后，下一步就是深入那些能真正改变编辑效率的高级功能。

## 文本对象（Text Objects）

Vim 最强大的功能之一。文本对象让你按"语义单元"来操作文本：

```
ciw       change  inner  word         # 修改当前单词
ci"        change  inner  "..."        # 修改引号内的内容
ci(        change  inner  (...)        # 修改括号内的内容
da[        delete  a      [...]        # 删除方括号包括括号本身
yi{        yank    inner  {...}        # 复制花括号内的内容
vat        visual  a      tag          # 选择整个 HTML/XML 标签
```

> 记住公式：**操作符 + 范围 + 文本对象**。比如 `ci(` = change + inner + parentheses。

## 1. 宏（Macro）— 自动化重复操作

宏可以记录一系列操作并在多行上重放，是批量处理的利器。

```
qa         开始录制宏到寄存器 a
...        执行你要重复的操作
q          停止录制
@a         执行宏 a
@@         重复上一次宏
5@a        执行宏 a 5 次
:norm! @a  在选中的每一行上执行宏 a
```

**实战例子：** 给 100 行 Python 代码加上类型注解前缀

```
qa          # 开始录制
I           # 跳到行首插入
# type:     # 插入注释
j        # 下一行
q           # 停止
100@a       # 在接下来的 100 行上执行
```

## 2. 多窗口与多文件

```
:sp file.py        水平分割窗口打开文件
:vsp file.py       垂直分割窗口打开文件
Ctrl+w h/j/k/l    在窗口间移动
Ctrl+w =          等分窗口大小
Ctrl+w _          最大化当前窗口高度
Ctrl+w |          最大化当前窗口宽度

:tabe file.py     在新标签页中打开文件
gt                下一个标签页
gT                上一个标签页
```

## 3. 寄存器（Registers）

```
:reg              查看所有寄存器内容
"ayy              复制当前行到 a 寄存器
"ap               粘贴 a 寄存器的内容
"+y               复制到系统剪贴板
"+p               从系统剪贴板粘贴
```

## 4. 搜索与替换进阶

```
/pattern          向前搜索
?pattern          向后搜索
n / N             下一个/上一个匹配
*                 搜索光标下的单词
#                 搜索光标下的单词（向后）

:%s/old/new/g     全文替换
:%s/old/new/gc    全文替换（逐个确认）
:10,20s/old/new/g 在第 10-20 行替换
```

## 5. Neovim 与插件推荐

如果你还在用原生 Vim，强烈推荐迁移到 **Neovim**。它内置 LSP 支持、Treesitter 语法高亮、Lua 配置等现代化特性。

**推荐插件组合（2026 年）：**

- **lazy.nvim** — 插件管理器，按需加载，启动飞快
- **nvim-treesitter** — 精确的语法高亮和代码分析
- **telescope.nvim** — 模糊查找文件、buffer、符号
- **nvim-lspconfig** — 代码补全、跳转定义、重命名
- **nvim-cmp** — 自动补全框架
- **conform.nvim** — 代码格式化
- **gitsigns.nvim** — Git 状态显示在编辑器中

## 6. 我的 ~/.vimrc 精选配置

```vim
" === 基础设置 ===
set number              " 显示行号
set relativenumber      " 相对行号（方便跳转）
set cursorline          " 高亮当前行
set clipboard=unnamed   " 使用系统剪贴板
set mouse=a             " 允许鼠标操作
set ignorecase smartcase " 智能大小写搜索

" === 缩进 ===
set tabstop=4
set shiftwidth=4
set expandtab           " Tab 转空格
set autoindent

" === 好用的映射 ===
nnoremap <leader>w :w<CR>        " 空格+w 保存
nnoremap <leader>q :q<CR>        " 空格+q 退出
nnoremap <leader>e :Ex<CR>       " 空格+e 文件浏览器
```

## 学习路线图

1. **第 1 周：** 完成 `vimtutor`，掌握 hjkl、i、Esc、:wq
2. **第 2 周：** 学习文本对象（ciw、ci"、da[）— 效率跃升的关键
3. **第 3 周：** 掌握宏录制和寄存器
4. **第 4 周：** 配置 Neovim + LSP，获得 IDE 级别的功能
5. **长期：** 每天发现一个新命令，不断优化配置

Vim 不是一天学会的，它是一段旅程。投入时间越多，回报越大。
