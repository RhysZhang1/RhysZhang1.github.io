# uv 入门指南：下一代 Python 包管理器

**uv** 是由 Astral 团队（也是 Ruff 的开发者）用 Rust 编写的 Python 包和项目管理器。它的目标是取代 pip、pip-tools、virtualenv、poetry 等多个工具，提供一个**统一且极速**的体验。

## 为什么需要 uv？

Python 的包管理一直被人诟病碎片化：pip 只管安装，virtualenv 管隔离，pip-tools 管锁定，poetry 管依赖解析……每个工具各司其职，但组合使用很繁琐。

uv 的几个关键优势：

- **极快** — 用 Rust 编写，依赖解析和安装速度比 pip 快 10-100 倍
- **统一** — 一个工具管理虚拟环境、依赖安装、依赖锁定
- **兼容** — 完全兼容 pip 的接口，可以直接替代 pip
- **可靠** — 使用与 Rust Cargo 类似的解析器，避免依赖冲突

## 安装

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# 使用 pip 安装
pip install uv

# 验证安装
uv --version
```

## 基本用法

### 1. 替代 pip install

```bash
# 安装单个包
uv pip install requests

# 从 requirements.txt 安装
uv pip install -r requirements.txt

# 安装到指定 Python 版本
uv pip install --python 3.12 django
```

### 2. 创建虚拟环境

```bash
# 创建虚拟环境（比 venv 快很多）
uv venv

# 指定 Python 版本
uv venv --python 3.12

# 激活环境（Windows）
.venv\Scripts\activate

# 激活环境（Linux/macOS）
source .venv/bin/activate
```

### 3. 项目管理（uv 的杀手级功能）

```bash
# 初始化一个新项目
uv init my-project
cd my-project

# 添加依赖
uv add requests flask

# 添加开发依赖
uv add --dev pytest black ruff

# 运行脚本
uv run python main.py

# 锁定依赖
uv lock
```

## uv vs pip 速度对比

安装 Django + DRF + Celery + 常用依赖（约 50 个包，冷缓存）：

- pip: ~45 秒
- uv: ~2.5 秒
- **快约 18 倍**

> "uv 让 Python 的包管理体验终于赶上了 Rust 和 Go 的水平。"

## 常用命令速查

```bash
uv pip install <package>        # 安装包
uv pip uninstall <package>      # 卸载包
uv pip list                      # 列出已安装的包
uv pip freeze > requirements.txt # 导出依赖
uv venv                          # 创建虚拟环境
uv add <package>                 # 添加项目依赖
uv remove <package>              # 移除项目依赖
uv run <command>                 # 在项目环境中运行命令
uv lock                          # 锁定依赖版本
uv sync                          # 同步依赖（安装缺失的）
```

## 迁移建议

对于新项目，直接用 `uv init` + `uv add` 开始。对于现有项目：

1. 先用 `uv pip install -r requirements.txt` 替代 `pip install`
2. 逐步引入 `uv.lock` 来锁定依赖版本
3. 用 `uv run` 替代直接执行脚本，确保环境正确

uv 正在快速迭代中。截止 2026 年 7 月，它已经成为 Python 官方推荐的包管理工具之一。如果你还没试过，现在就是最好的时机。
