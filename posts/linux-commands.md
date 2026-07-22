# Linux 命令行技巧：让日常操作快人一步

命令行是 Linux 的灵魂。掌握这些技巧，能让你在服务器操作、日志分析、脚本编写中事半功倍。

## 一、文件查找与定位

### find — 灵活的搜索

```bash
# 查找最近 7 天修改的 Python 文件
find . -name "*.py" -mtime -7

# 查找大于 100MB 的文件
find /var/log -type f -size +100M

# 查找并删除所有 __pycache__ 目录
find . -type d -name "__pycache__" -exec rm -rf {} +
```

### fd — find 的现代替代品

```bash
fd "pattern"              # 按文件名搜索
fd -e py                  # 搜索 .py 文件
fd --changed-within 24h   # 最近24小时修改的文件
```

### ripgrep (rg) — 代码搜索神器

```bash
# 比 grep 快很多，自动忽略 .gitignore
rg "async def" --type py
rg "TODO" -l               # 只列文件名
rg "error" -C 3            # 显示上下文各3行
```

## 二、文本处理

### awk — 瑞士军刀

```bash
# 打印第1列和第3列
awk '{print $1, $3}' access.log

# 按列求和
awk '{sum += $2} END {print sum}' data.txt

# 统计每个 IP 的访问次数（Top 10）
awk '{count[$1]++} END {for (ip in count) print ip, count[ip]}' access.log \
  | sort -k2 -rn | head -10
```

### sed — 流编辑器

```bash
sed 's/old/new/g' file.txt         # 替换文本
sed '/^$/d' file.txt                # 删除空行
sed -i 's/http/https/g' config.yaml # 原地修改文件
```

### jq — JSON 处理

```bash
cat data.json | jq .
curl -s https://api.example.com/users | jq '.users[] | {name, email}'
cat data.json | jq '.[] | select(.age > 18)'
```

## 三、系统监控与诊断

```bash
htop                # 实时查看系统资源（比 top 更友好）
du -sh * | sort -h  # 当前目录各文件/文件夹大小
ncdu                # 交互式磁盘分析
ss -tlnp            # 查看监听端口
lsof -i :8080       # 谁在用 8080 端口
ps aux --sort=-%mem | head  # 内存占用 TOP 10
kill -9 $(lsof -t -i:3000)  # 杀掉占用 3000 端口的进程
```

## 四、实用快捷键（bash/zsh）

```
Ctrl + R      历史命令搜索（必学！）
Ctrl + A      跳到行首
Ctrl + E      跳到行尾
Ctrl + U      清除光标前的内容
Ctrl + K      清除光标后的内容
Ctrl + L      清屏
!!            重复上一条命令
!$            上一条命令的最后一个参数
```

## 五、批量操作

```bash
# 重命名多个文件
for f in *.jpg; do mv "$f" "prefix_$f"; done

# 并行执行任务（GNU parallel）
cat urls.txt | parallel -j 4 'curl -s {} > {#}.html'

# 创建多个目录
mkdir -p project/{src,tests,docs,data}
```

## 六、推荐安装的现代 CLI 工具

| 工具 | 替代 | 特点 |
|------|------|------|
| `bat` | cat | 语法高亮、行号 |
| `fd` | find | 更快更直观 |
| `ripgrep` | grep | 极速搜索 |
| `zoxide` | cd | 智能跳转 |
| `fzf` | — | 模糊搜索一切 |
| `tldr` | man | 命令示例速查 |

```bash
# Ubuntu/Debian 一键安装
sudo apt install bat fd-find ripgrep fzf tldr

# macOS
brew install bat fd ripgrep fzf tldr zoxide
```

学习命令行的关键是**多用**。遇到重复操作时，停下来想想能不能用一行命令搞定。
