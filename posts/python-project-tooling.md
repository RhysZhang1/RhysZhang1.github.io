# Python 项目工具链：用 uv + Ruff + Pyright 打造现代化开发环境

告别缓慢的 pip 和繁杂的配置。用 uv 管理包、Ruff 做 lint/format、Pyright 做类型检查，体验极速 Python 开发。

## 工具链全家桶

| 用途 | 传统工具 | 现代工具 | 语言 |
|------|----------|----------|------|
| 包管理 | pip + venv + pip-tools | **uv** | Rust |
| 代码检查 | flake8 / pylint | **Ruff** | Rust |
| 代码格式化 | black + isort | **Ruff** | Rust |
| 类型检查 | mypy | **Pyright** | TypeScript |
| 测试 | unittest | **pytest** | Python |

## 第一步：项目初始化

```bash
uv init my-awesome-project
cd my-awesome-project
```

项目结构：

```
my-awesome-project/
├── pyproject.toml
├── uv.lock
├── README.md
└── src/
    └── my_awesome_project/
        └── __init__.py
```

## 第二步：添加核心依赖

```bash
uv add fastapi uvicorn pydantic httpx    # 运行时依赖
uv add --dev pytest ruff pyright          # 开发依赖
```

体验一下 uv 的速度：添加 FastAPI（含 20+ 个传递依赖），uv 的解析 + 下载 + 安装全过程只需约 2 秒。用 pip 至少需要 30 秒以上。

## 第三步：配置 Ruff（lint + format）

在 `pyproject.toml` 中添加：

```toml
[tool.ruff]
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
ignore = ["E501"]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
```

运行 Ruff：

```bash
uv run ruff check src/          # 检查代码
uv run ruff check --fix src/    # 自动修复
uv run ruff format src/         # 格式化代码
```

## 第四步：配置 Pyright（类型检查）

```toml
[tool.pyright]
include = ["src"]
exclude = ["**/__pycache__", "tests"]
typeCheckingMode = "strict"
```

```bash
uv run pyright src/
```

## 第五步：Makefile — 一键运行

```makefile
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

all: format lint check test
```

```bash
make all    # 一条命令搞定所有检查
```

## 第六步：CI/CD 配置（GitHub Actions）

```yaml
# .github/workflows/ci.yml
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
      - run: uv run pytest tests/ -v
```

## 速度对比实测

在一个包含 30 个源文件、200+ 依赖的中型项目上：

- **uv sync**（冷缓存）：~3 秒 vs **pip install**：~55 秒
- **ruff check**（全项目）：~0.05 秒 vs **flake8**：~3 秒
- **ruff format**：~0.03 秒 vs **black + isort**：~1.5 秒

> 整体下来，从敲下 `uv sync` 到所有检查通过，不超过 5 秒。这在以前至少要等 1 分钟。

## 总结

现代 Python 工具链的精髓是：**用最快的工具，专注写代码本身**。uv + Ruff + Pyright 这个组合，让你拥有接近 Rust/Go 的开发体验，同时保持 Python 的灵活和生态优势。

如果你还在用 pip + flake8 + black 的老三样，现在就是升级的最佳时机。
