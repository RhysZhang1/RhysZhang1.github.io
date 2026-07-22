/**
 * 博客文章数据
 * 添加新文章只需在数组中添加一个新对象即可
 *
 * 字段说明:
 *   id      - 唯一标识，用于 URL 路由
 *   title   - 文章标题
 *   date    - 发布日期 (YYYY-MM-DD)
 *   summary - 简短摘要（列表页展示）
 *   tags    - 标签数组
 *   content - 文章正文 (支持 HTML)
 */
const BLOG_POSTS = [
  {
    id: 'uv-guide',
    title: 'uv 入门指南：下一代 Python 包管理器',
    date: '2026-07-20',
    summary: 'uv 是 Astral 团队用 Rust 编写的超快速 Python 包管理器，比 pip 快 10-100 倍。本文从安装到实战带你全面上手。',
    tags: ['Python', 'uv', '工具'],
    content: `
      <p><strong>uv</strong> 是由 Astral 团队（也是 Ruff 的开发者）用 Rust 编写的 Python 包和项目管理器。它的目标是取代 pip、pip-tools、virtualenv、poetry 等多个工具，提供一个<strong>统一且极速</strong>的体验。</p>

      <h2>为什么需要 uv？</h2>

      <p>Python 的包管理一直被人诟病碎片化：pip 只管安装，virtualenv 管隔离，pip-tools 管锁定，poetry 管依赖解析……每个工具各司其职，但组合使用很繁琐。</p>

      <p>uv 的几个关键优势：</p>

      <ul>
        <li><strong>极快</strong> — 用 Rust 编写，依赖解析和安装速度比 pip 快 10-100 倍</li>
        <li><strong>统一</strong> — 一个工具管理虚拟环境、依赖安装、依赖锁定</li>
        <li><strong>兼容</strong> — 完全兼容 pip 的接口，可以直接替代 pip</li>
        <li><strong>可靠</strong> — 使用与 Rust Cargo 类似的解析器，避免依赖冲突</li>
      </ul>

      <h2>安装</h2>

      <pre><code># macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# 使用 pip 安装
pip install uv

# 验证安装
uv --version</code></pre>

      <h2>基本用法</h2>

      <h3>1. 替代 pip install</h3>

      <pre><code># 安装单个包
uv pip install requests

# 从 requirements.txt 安装
uv pip install -r requirements.txt

# 安装到指定 Python 版本
uv pip install --python 3.12 django</code></pre>

      <h3>2. 创建虚拟环境</h3>

      <pre><code># 创建虚拟环境（比 venv 快很多）
uv venv

# 指定 Python 版本
uv venv --python 3.12

# 激活环境（Windows）
.venv\\Scripts\\activate

# 激活环境（Linux/macOS）
source .venv/bin/activate</code></pre>

      <h3>3. 项目管理（uv 的杀手级功能）</h3>

      <pre><code># 初始化一个新项目
uv init my-project
cd my-project

# 添加依赖
uv add requests flask

# 添加开发依赖
uv add --dev pytest black ruff

# 运行脚本
uv run python main.py

# 锁定依赖
uv lock</code></pre>

      <h2>uv vs pip 速度对比</h2>

      <p>安装 Django + DRF + Celery + 常用依赖（约 50 个包，冷缓存）：</p>

      <ul>
        <li>pip: ~45 秒</li>
        <li>uv: ~2.5 秒</li>
        <li><strong>快约 18 倍</strong></li>
      </ul>

      <blockquote>
        <p>"uv 让 Python 的包管理体验终于赶上了 Rust 和 Go 的水平。"</p>
      </blockquote>

      <h2>常用命令速查</h2>

      <pre><code>uv pip install &lt;package&gt;        # 安装包
uv pip uninstall &lt;package&gt;      # 卸载包
uv pip list                      # 列出已安装的包
uv pip freeze > requirements.txt # 导出依赖
uv venv                          # 创建虚拟环境
uv add &lt;package&gt;                 # 添加项目依赖
uv remove &lt;package&gt;              # 移除项目依赖
uv run &lt;command&gt;                 # 在项目环境中运行命令
uv lock                          # 锁定依赖版本
uv sync                          # 同步依赖（安装缺失的）</code></pre>

      <h2>迁移建议</h2>

      <p>对于新项目，直接用 <code>uv init</code> + <code>uv add</code> 开始。对于现有项目：</p>

      <ol>
        <li>先用 <code>uv pip install -r requirements.txt</code> 替代 <code>pip install</code></li>
        <li>逐步引入 <code>uv.lock</code> 来锁定依赖版本</li>
        <li>用 <code>uv run</code> 替代直接执行脚本，确保环境正确</li>
      </ol>

      <p>uv 正在快速迭代中。截止 2026 年 7 月，它已经成为 Python 官方推荐的包管理工具之一。如果你还没试过，现在就是最好的时机。</p>
    `
  },
  {
    id: 'python-async',
    title: 'Python 异步编程：asyncio 从入门到实战',
    date: '2026-07-18',
    summary: '深入理解 Python 的 asyncio 库，掌握协程、事件循环、任务调度的核心概念与实际应用。',
    tags: ['Python', '异步'],
    content: `
      <p>Python 的异步编程模型围绕 <code>asyncio</code> 展开。理解它对于构建高性能的 Web 服务、爬虫、数据处理管道至关重要。</p>

      <h2>同步 vs 异步：直观理解</h2>

      <p>假设你去咖啡店点三杯咖啡：</p>

      <ul>
        <li><strong>同步</strong>：点一杯 → 等着做好 → 点下一杯 → 等着做好 → 点下一杯 → 等着做好</li>
        <li><strong>异步</strong>：三杯一起点 → 在等待时刷手机 → 三杯陆续做好</li>
      </ul>

      <pre><code>import asyncio

async def make_coffee(name, seconds):
    print(f"☕ 开始制作 {name}")
    await asyncio.sleep(seconds)   # 模拟等待
    print(f"✅ {name} 完成！")
    return f"{name} 做好了"

async def main():
    # 并发执行三个任务
    results = await asyncio.gather(
        make_coffee("拿铁", 3),
        make_coffee("美式", 2),
        make_coffee("卡布奇诺", 4),
    )
    print(results)

asyncio.run(main())</code></pre>

      <h2>核心概念</h2>

      <h3>1. 协程（Coroutine）</h3>
      <p>用 <code>async def</code> 定义的函数。调用它不会立即执行，而是返回一个协程对象，需要被 <code>await</code> 或被事件循环调度。</p>

      <h3>2. 事件循环（Event Loop）</h3>
      <p>整个异步程序的心脏。它不断地检查哪些任务可以执行，在任务之间切换，确保 CPU 不会空转等待 I/O。</p>

      <h3>3. 可等待对象（Awaitable）</h3>
      <p>可以用于 <code>await</code> 的三种类型：协程、Task（任务）、Future（未来值）。</p>

      <h2>实战：异步 HTTP 请求</h2>

      <pre><code>import asyncio
import aiohttp

async def fetch_url(session, url):
    async with session.get(url) as resp:
        data = await resp.json()
        print(f"✅ {url} — {resp.status}")
        return data

async def main():
    urls = [
        "https://api.github.com",
        "https://api.github.com/users/python",
        "https://api.github.com/repos/rust-lang/rust",
    ]
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_url(session, url) for url in urls]
        results = await asyncio.gather(*tasks)
    print(f"\\n获取了 {len(results)} 个响应")

asyncio.run(main())</code></pre>

      <p>这个例子中，三个 HTTP 请求是并发发出的，总耗时约等于最慢的那个请求，而不是三个请求之和。</p>

      <h2>常见陷阱</h2>

      <ul>
        <li><strong>忘记 await</strong> — <code>async</code> 函数不 await 就不会执行</li>
        <li><strong>在协程中调用同步阻塞函数</strong> — 会阻塞整个事件循环，应该用 <code>loop.run_in_executor()</code> 把阻塞操作放到线程池</li>
        <li><strong>混用 async 和 sync</strong> — 不要在 async 函数中调用 <code>time.sleep()</code>，用 <code>await asyncio.sleep()</code></li>
        <li><strong>过度并发</strong> — 用 <code>asyncio.Semaphore</code> 限制并发数，避免被目标服务器限流</li>
      </ul>

      <h2>最佳实践</h2>

      <ol>
        <li><strong>I/O 密集型 → asyncio</strong>（网络请求、文件读写、数据库查询）</li>
        <li><strong>CPU 密集型 → 多进程</strong>（计算、图像处理、机器学习推理）</li>
        <li><strong>混合场景</strong> → asyncio + ProcessPoolExecutor</li>
      </ol>

      <p>掌握了 asyncio，你就能写出既优雅又高性能的 Python 代码。它是现代 Python Web 框架（FastAPI、BlackSheep）的基础，也是爬虫框架（httpx + asyncio）的核心驱动力。</p>
    `
  },
  {
    id: 'java-21',
    title: 'Java 21 你不能忽视的新特性',
    date: '2026-07-15',
    summary: '虚拟线程（Virtual Threads）、模式匹配（Pattern Matching）、Record 类型……Java 21 是继 Java 8 之后最重要的 LTS 版本。',
    tags: ['Java', '后端'],
    content: `
      <p>Java 21 于 2023 年 9 月发布，是一个 LTS（长期支持）版本。如果说 Java 8 引入了函数式编程，那么 Java 21 带来了<strong>虚拟线程</strong>和<strong>模式匹配</strong>这两大范式革新。</p>

      <h2>1. 虚拟线程（Virtual Threads）— JEP 444</h2>

      <p>这是 Java 21 最重要的特性。虚拟线程是<strong>轻量级线程</strong>，由 JVM 管理而非操作系统，创建成本极低。</p>

      <h3>传统线程 vs 虚拟线程</h3>

      <pre><code>// 传统平台线程 — 一个请求一个线程
// 线程池有限，高并发时会阻塞
ExecutorService executor = Executors.newFixedThreadPool(200);
executor.submit(() -> handleRequest());

// 虚拟线程 — 可以轻松创建百万个
// 每个请求一个虚拟线程，代码简洁，资源占用低
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    executor.submit(() -> handleRequest());
}

// 或者直接创建
Thread.startVirtualThread(() -> {
    System.out.println("Hello from virtual thread!");
});</code></pre>

      <p><strong>关键特性：</strong></p>
      <ul>
        <li>虚拟线程遇到 I/O 阻塞时会自动"挂起"，释放底层平台线程去执行其他任务</li>
        <li>创建成本几乎为零（不像平台线程需要约 1MB 栈空间）</li>
        <li>不需要线程池——用完即弃，由 JVM 的垃圾回收回收</li>
        <li>完美适配"一个请求一个线程"的编程模型，不需要 Reactive 那一套</li>
      </ul>

      <blockquote>
        <p>"Virtual Threads 让你可以用简单的同步代码处理百万级并发，不用再被 CompletableFuture 嵌套地狱折磨。"</p>
      </blockquote>

      <h2>2. 模式匹配（Pattern Matching）</h2>

      <h3>Switch 的模式匹配（JEP 441）</h3>

      <pre><code>// Java 17 之前
Object obj = getSomeValue();
if (obj instanceof String s) {
    System.out.println("字符串长度: " + s.length());
} else if (obj instanceof Integer i) {
    System.out.println("整数 + 1 = " + (i + 1));
} else if (obj instanceof List<?> list) {
    System.out.println("列表大小: " + list.size());
}

// Java 21 — 用 switch 优雅处理
String result = switch (obj) {
    case String s   -> "字符串: " + s.toUpperCase();
    case Integer i  -> "整数: " + (i * i);
    case List<?> l  -> "列表有 " + l.size() + " 个元素";
    case null       -> "是 null";
    default         -> "未知类型";
};</code></pre>

      <h3>Record 模式（JEP 440）</h3>

      <pre><code>record Point(int x, int y) {}
record Line(Point start, Point end) {}

Object shape = new Line(new Point(0, 0), new Point(10, 20));

// 嵌套解构！
if (shape instanceof Line(Point(int x1, int y1), Point(int x2, int y2))) {
    System.out.printf("线段: (%d,%d) → (%d,%d)%n", x1, y1, x2, y2);
}</code></pre>

      <h2>3. Record 类型</h2>

      <p>Record 是 Java 14 引入的不可变数据载体，在 Java 21 中被广泛使用：</p>

      <pre><code>// 一行代码定义一个不可变的数据类
// 自动生成：构造器、getter、equals()、hashCode()、toString()
public record User(String name, int age, String email) {}

var user = new User("张三", 28, "zhangsan@example.com");
System.out.println(user.name());  // 访问器
System.out.println(user);         // User[name=张三, age=28, email=zhangsan@example.com]</code></pre>

      <h2>4. 其他值得关注的特性</h2>

      <ul>
        <li><strong>Sequenced Collections</strong> — 新增了有序集合的统一接口</li>
        <li><strong>String Templates（预览）</strong> — 字符串插值的原生支持</li>
        <li><strong>Scoped Values（预览）</strong> — 线程局部变量的现代替代</li>
        <li><strong>Foreign Function & Memory API</strong> — 安全的本地内存和外部函数调用</li>
      </ul>

      <h2>升级建议</h2>

      <p>如果你的项目还在用 Java 8 或 11：</p>
      <ol>
        <li>先从 Java 8 → Java 17（上一个 LTS），再→ Java 21</li>
        <li>用虚拟线程替换传统线程池（减少代码复杂度）</li>
        <li>把传统的 instanceof + if-else 链改为 switch 模式匹配</li>
        <li>用 Record 替代简单的 POJO / DTO</li>
      </ol>

      <p>Java 21 是一次质的飞跃。它让 Java 在保持向后兼容的同时，拥有了不输 Kotlin、Go 的现代开发体验。</p>
    `
  },
  {
    id: 'linux-commands',
    title: 'Linux 命令行技巧：让日常操作快人一步',
    date: '2026-07-12',
    summary: '从文件查找、文本处理到系统监控，分享 20+ 个实用 Linux 命令技巧，提升你的工作效率。',
    tags: ['Linux', 'Shell'],
    content: `
      <p>命令行是 Linux 的灵魂。掌握这些技巧，能让你在服务器操作、日志分析、脚本编写中事半功倍。</p>

      <h2>一、文件查找与定位</h2>

      <h3>find — 灵活的搜索</h3>
      <pre><code># 查找最近 7 天修改的 Python 文件
find . -name "*.py" -mtime -7

# 查找大于 100MB 的文件
find /var/log -type f -size +100M

# 查找并删除所有 __pycache__ 目录
find . -type d -name "__pycache__" -exec rm -rf {} +</code></pre>

      <h3>fd — find 的现代替代品</h3>
      <pre><code># 更友好的语法（需要安装：apt install fd-find 或 brew install fd）
fd "pattern"              # 按文件名搜索
fd -e py                  # 搜索 .py 文件
fd --changed-within 24h   # 最近24小时修改的文件</code></pre>

      <h3>ripgrep (rg) — 代码搜索神器</h3>
      <pre><code># 在代码中搜索（比 grep 快很多，自动忽略 .gitignore）
rg "async def" --type py
rg "TODO" -l               # 只列文件名
rg "error" -C 3            # 显示上下文各3行</code></pre>

      <h2>二、文本处理</h2>

      <h3>awk — 瑞士军刀</h3>
      <pre><code># 打印第1列和第3列
awk '{print $1, $3}' access.log

# 按列求和
awk '{sum += $2} END {print sum}' data.txt

# 统计每个 IP 的访问次数
awk '{count[$1]++} END {for (ip in count) print ip, count[ip]}' access.log | sort -k2 -rn | head -10</code></pre>

      <h3>sed — 流编辑器</h3>
      <pre><code># 替换文本
sed 's/old/new/g' file.txt

# 删除空行
sed '/^$/d' file.txt

# 原地修改文件（macOS 需要加 ''）
sed -i 's/http/https/g' config.yaml</code></pre>

      <h3>jq — JSON 处理</h3>
      <pre><code># 格式化 JSON
cat data.json | jq .

# 提取字段
curl -s https://api.example.com/users | jq '.users[] | {name: .name, email: .email}'

# 过滤
cat data.json | jq '.[] | select(.age > 18)'</code></pre>

      <h2>三、系统监控与诊断</h2>

      <pre><code># 实时查看系统资源（比 top 更友好）
htop

# 磁盘使用情况
du -sh * | sort -h          # 当前目录各文件/文件夹大小
ncdu                        # 交互式磁盘分析

# 网络连接
ss -tlnp                    # 查看监听端口
lsof -i :8080               # 谁在用 8080 端口

# 进程管理
ps aux --sort=-%mem | head  # 内存占用 TOP 10
kill -9 $(lsof -t -i:3000)  # 杀掉占用 3000 端口的进程</code></pre>

      <h2>四、实用技巧</h2>

      <h3>快捷键（bash/zsh）</h3>
      <pre><code>Ctrl + R      历史命令搜索（必学！）
Ctrl + A      跳到行首
Ctrl + E      跳到行尾
Ctrl + U      清除光标前的内容
Ctrl + K      清除光标后的内容
Ctrl + L      清屏
!!            重复上一条命令
!$            上一条命令的最后一个参数</code></pre>

      <h3>批量操作</h3>
      <pre><code># 重命名多个文件（给所有 .jpg 加前缀）
for f in *.jpg; do mv "$f" "prefix_$f"; done

# 并行执行任务（GNU parallel）
cat urls.txt | parallel -j 4 'curl -s {} > {#}.html'

# 创建多个目录
mkdir -p project/{src,tests,docs,data}</code></pre>

      <h2>五、推荐安装的工具</h2>

      <table style="width:100%;border-collapse:collapse;">
        <tr><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd;">工具</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd;">替代</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd;">特点</th></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd;"><code>bat</code></td><td style="padding:8px;border-bottom:1px solid #ddd;">cat</td><td style="padding:8px;border-bottom:1px solid #ddd;">语法高亮、行号</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd;"><code>fd</code></td><td style="padding:8px;border-bottom:1px solid #ddd;">find</td><td style="padding:8px;border-bottom:1px solid #ddd;">更快更直观</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd;"><code>ripgrep</code></td><td style="padding:8px;border-bottom:1px solid #ddd;">grep</td><td style="padding:8px;border-bottom:1px solid #ddd;">极速搜索</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd;"><code>zoxide</code></td><td style="padding:8px;border-bottom:1px solid #ddd;">cd</td><td style="padding:8px;border-bottom:1px solid #ddd;">智能跳转</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd;"><code>fzf</code></td><td style="padding:8px;border-bottom:1px solid #ddd;">—</td><td style="padding:8px;border-bottom:1px solid #ddd;">模糊搜索一切</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd;"><code>tldr</code></td><td style="padding:8px;border-bottom:1px solid #ddd;">man</td><td style="padding:8px;border-bottom:1px solid #ddd;">命令示例速查</td></tr>
      </table>

      <p>这些工具可以用一行命令安装：</p>
      <pre><code># Ubuntu/Debian
sudo apt install bat fd-find ripgrep fzf tldr

# macOS
brew install bat fd ripgrep fzf tldr zoxide</code></pre>

      <p>学习命令行的关键是<strong>多用</strong>。遇到重复操作时，停下来想想：能不能用一行命令搞定？久而久之，你会发现自己也成了别人眼中的"命令行高手"。</p>
    `
  },
  {
    id: 'vim-advanced',
    title: 'Vim 高级技巧：打造你的专属编辑工作流',
    date: '2026-07-08',
    summary: '超越基本操作，掌握 Vim 的宏录制、多窗口管理、插件生态和 Neovim 配置，让编辑效率再上一个台阶。',
    tags: ['Vim', '工具', '效率'],
    content: `
      <p>掌握了 Vim 的基础操作后，下一步就是深入那些能真正改变编辑效率的高级功能。</p>

      <h2>文本对象（Text Objects）</h2>

      <p>Vim 最强大的功能之一。文本对象让你可以按"语义单元"来操作文本：</p>

      <pre><code>ciw       change  inner  word         # 修改当前单词
ci"        change  inner  "..."        # 修改引号内的内容
ci(        change  inner  (...)        # 修改括号内的内容
da[        delete  a      [...]        # 删除方括号包括括号本身
yi{        yank    inner  {...}        # 复制花括号内的内容
vat        visual  a      tag          # 选择整个 HTML/XML 标签</code></pre>

      <blockquote>
        <p>记住公式：<strong>操作符 + 范围 + 文本对象</strong>。比如 <code>ci(</code> = change + inner + parentheses。</p>
      </blockquote>

      <h2>1. 宏（Macro）— 自动化重复操作</h2>

      <p>宏可以记录一系列操作并在多行上重放，是批量处理的利器。</p>

      <pre><code>qa         开始录制宏到寄存器 a
...        执行你要重复的操作
q          停止录制
@a         执行宏 a
@@         重复上一次宏
5@a        执行宏 a 5 次
:norm! @a  在选中的每一行上执行宏 a</code></pre>

      <p><strong>实战例子：</strong>给 100 行 Python 代码加上类型注解前缀</p>

      <pre><code>qa          # 开始录制
I           # 跳到行首插入
# type:     # （插入注释）
j           # 下一行
q           # 停止
100@a       # 在接下来的 100 行上执行</code></pre>

      <h2>2. 多窗口与多文件</h2>

      <pre><code>:sp file.py        水平分割窗口打开文件
:vsp file.py       垂直分割窗口打开文件
Ctrl+w h/j/k/l    在窗口间移动
Ctrl+w =          等分窗口大小
Ctrl+w _          最大化当前窗口高度
Ctrl+w |          最大化当前窗口宽度

# 标签页管理
:tabe file.py     在新标签页中打开文件
gt                下一个标签页
gT                上一个标签页</code></pre>

      <h2>3. 寄存器（Registers）</h2>

      <pre><code>:reg              查看所有寄存器内容
"ayy              复制当前行到 a 寄存器
"ap               粘贴 a 寄存器的内容
"+y               复制到系统剪贴板
"+p               从系统剪贴板粘贴
"*y               复制到选择缓冲区（Linux）</code></pre>

      <h2>4. 搜索与替换进阶</h2>

      <pre><code>/pattern          向前搜索
?pattern          向后搜索
n                 下一个匹配
N                 上一个匹配
*                 搜索光标下的单词（向前）
#                 搜索光标下的单词（向后）

# 替换
:%s/old/new/g     全文替换
:%s/old/new/gc    全文替换（逐个确认）
:10,20s/old/new/g 在第 10-20 行替换

# 正则替换（给所有行首加序号）
:%s/^/\\=line('.') . '. '</code></pre>

      <h2>5. Neovim 与插件推荐</h2>

      <p>如果你还在用原生 Vim，强烈推荐迁移到 <strong>Neovim</strong>。它内置 LSP 支持、Treesitter 语法高亮、Lua 配置等现代化特性。</p>

      <p><strong>推荐插件组合（2026 年）：</strong></p>

      <ul>
        <li><strong>lazy.nvim</strong> — 插件管理器，按需加载，启动飞快</li>
        <li><strong>nvim-treesitter</strong> — 精确的语法高亮和代码分析</li>
        <li><strong>telescope.nvim</strong> — 模糊查找文件、buffer、符号</li>
        <li><strong>nvim-lspconfig</strong> — 代码补全、跳转定义、重命名</li>
        <li><strong>nvim-cmp</strong> — 自动补全框架</li>
        <li><strong>conform.nvim</strong> — 代码格式化（替代 null-ls）</li>
        <li><strong>gitsigns.nvim</strong> — Git 状态显示在编辑器中</li>
      </ul>

      <h2>6. 我的 ~/.vimrc 精选配置</h2>

      <pre><code>" === 基础设置 ===
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
nnoremap &lt;leader&gt;w :w&lt;CR&gt;        " 空格+w 保存
nnoremap &lt;leader&gt;q :q&lt;CR&gt;        " 空格+q 退出
nnoremap &lt;leader&gt;e :Ex&lt;CR&gt;       " 空格+e 文件浏览器</code></pre>

      <h2>学习路线图</h2>

      <ol>
        <li><strong>第 1 周：</strong>完成 <code>vimtutor</code>，掌握 hjkl、i、Esc、:wq</li>
        <li><strong>第 2 周：</strong>学习文本对象（ciw、ci"、da[）— 这是效率跃升的关键</li>
        <li><strong>第 3 周：</strong>掌握宏录制和寄存器</li>
        <li><strong>第 4 周：</strong>配置 Neovim + LSP，获得 IDE 级别的功能</li>
        <li><strong>长期：</strong>每天发现一个新命令，不断优化配置</li>
      </ol>

      <p>Vim 不是一天学会的，它是一段旅程。投入时间越多，回报越大。</p>
    `
  },
  {
    id: 'python-project-tooling',
    title: 'Python 项目工具链：用 uv + Ruff + Pyright 打造现代化开发环境',
    date: '2026-07-05',
    summary: '告别缓慢的 pip 和繁杂的配置。用 uv 管理包、Ruff 做 lint/format、Pyright 做类型检查，体验极速 Python 开发。',
    tags: ['Python', 'uv', '工具'],
    content: `
      <p>Python 的工具链在过去两年发生了革命性变化。新一代工具全部用 Rust 重写，速度提升了一到两个数量级。本文带你搭建一套 2026 年最先进的 Python 开发环境。</p>

      <h2>工具链全家桶</h2>

      <table style="width:100%;border-collapse:collapse;">
        <tr><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd;">用途</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd;">传统工具</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd;">现代工具</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd;">语言</th></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd;">包管理</td><td style="padding:8px;border-bottom:1px solid #ddd;">pip + venv + pip-tools</td><td style="padding:8px;border-bottom:1px solid #ddd;"><strong>uv</strong></td><td style="padding:8px;border-bottom:1px solid #ddd;">Rust</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd;">代码检查</td><td style="padding:8px;border-bottom:1px solid #ddd;">flake8 / pylint</td><td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Ruff</strong></td><td style="padding:8px;border-bottom:1px solid #ddd;">Rust</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd;">代码格式化</td><td style="padding:8px;border-bottom:1px solid #ddd;">black + isort</td><td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Ruff</strong></td><td style="padding:8px;border-bottom:1px solid #ddd;">Rust</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd;">类型检查</td><td style="padding:8px;border-bottom:1px solid #ddd;">mypy</td><td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Pyright</strong></td><td style="padding:8px;border-bottom:1px solid #ddd;">TypeScript</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd;">测试</td><td style="padding:8px;border-bottom:1px solid #ddd;">unittest</td><td style="padding:8px;border-bottom:1px solid #ddd;"><strong>pytest</strong></td><td style="padding:8px;border-bottom:1px solid #ddd;">Python</td></tr>
      </table>

      <h2>第一步：项目初始化</h2>

      <pre><code># 创建项目
uv init my-awesome-project
cd my-awesome-project

# 项目结构
# my-awesome-project/
# ├── pyproject.toml
# ├── uv.lock
# ├── README.md
# └── src/
#     └── my_awesome_project/
#         └── __init__.py</code></pre>

      <h2>第二步：添加核心依赖</h2>

      <pre><code># 运行时依赖
uv add fastapi uvicorn pydantic httpx

# 开发依赖
uv add --dev pytest ruff pyright</code></pre>

      <p><strong>体验一下 uv 的速度：</strong>添加 FastAPI（含 20+ 个传递依赖），uv 的解析 + 下载 + 安装全过程只需约 2 秒。用 pip 至少需要 30 秒以上。</p>

      <h2>第三步：配置 Ruff（lint + format）</h2>

      <p>在 <code>pyproject.toml</code> 中添加：</p>

      <pre><code>[tool.ruff]
target-version = "py312"
line-length = 100

[tool.ruff.lint]
select = [
    "E",   # pycodestyle errors
    "F",   # pyflakes
    "I",   # isort
    "N",   # pep8-naming
    "UP",  # pyupgrade
    "B",   # flake8-bugbear
    "SIM", # flake8-simplify
    "RUF", # Ruff-specific rules
]
ignore = ["E501"]  # line too long (handled by formatter)

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
skip-magic-trailing-comma = false</code></pre>

      <p>运行 Ruff：</p>

      <pre><code># 检查代码
uv run ruff check src/

# 自动修复
uv run ruff check --fix src/

# 格式化代码
uv run ruff format src/</code></pre>

      <h2>第四步：配置 Pyright（类型检查）</h2>

      <p>在 <code>pyproject.toml</code> 中添加：</p>

      <pre><code>[tool.pyright]
include = ["src"]
exclude = ["**/__pycache__", "tests"]
typeCheckingMode = "strict"
reportUnnecessaryTypeIgnoreComment = true</code></pre>

      <pre><code># 运行类型检查
uv run pyright src/</code></pre>

      <h2>第五步：Makefile — 一键运行</h2>

      <pre><code># Makefile
.PHONY: lint format check test

lint:
	uv run ruff check src/

format:
	uv run ruff format src/

check:
	uv run ruff check src/
	uv run pyright src/

test:
	uv run pytest tests/ -v

all: format lint check test</code></pre>

      <pre><code># 一条命令搞定所有检查
make all</code></pre>

      <h2>第六步：CI/CD 配置（GitHub Actions）</h2>

      <pre><code># .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v3
      - run: uv sync
      - run: uv run ruff check src/
      - run: uv run pyright src/
      - run: uv run pytest tests/ -v</code></pre>

      <h2>速度对比实测</h2>

      <p>在一个包含 30 个源文件、200+ 依赖的中型项目上：</p>

      <ul>
        <li><strong>uv sync</strong>（冷缓存）：~3 秒 vs <strong>pip install</strong>：~55 秒</li>
        <li><strong>ruff check</strong>（全项目）：~0.05 秒 vs <strong>flake8</strong>：~3 秒</li>
        <li><strong>ruff format</strong>：~0.03 秒 vs <strong>black + isort</strong>：~1.5 秒</li>
      </ul>

      <blockquote>
        <p>整体下来，从敲下 <code>uv sync</code> 到所有检查通过，不超过 5 秒。这在以前至少要等 1 分钟。</p>
      </blockquote>

      <h2>总结</h2>

      <p>现代 Python 工具链的精髓是：<strong>用最快的工具，专注写代码本身</strong>。uv + Ruff + Pyright 这个组合，让你拥有接近 Rust/Go 的开发体验，同时保持 Python 的灵活和生态优势。</p>

      <p>如果你还在用 pip + flake8 + black 的老三样，现在就是升级的最佳时机。</p>
    `
  }
];
