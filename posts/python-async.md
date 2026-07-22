# Python 异步编程：asyncio 从入门到实战

Python 的异步编程模型围绕 `asyncio` 展开。理解它对于构建高性能的 Web 服务、爬虫、数据处理管道至关重要。

## 同步 vs 异步：直观理解

假设你去咖啡店点三杯咖啡：

- **同步**：点一杯 → 等着做好 → 点下一杯 → 等着做好 → 点下一杯 → 等着做好
- **异步**：三杯一起点 → 在等待时刷手机 → 三杯陆续做好

```python
import asyncio

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

asyncio.run(main())
```

## 核心概念

### 1. 协程（Coroutine）

用 `async def` 定义的函数。调用它不会立即执行，而是返回一个协程对象，需要被 `await` 或被事件循环调度。

### 2. 事件循环（Event Loop）

整个异步程序的心脏。它不断地检查哪些任务可以执行，在任务之间切换，确保 CPU 不会空转等待 I/O。

### 3. 可等待对象（Awaitable）

可以用于 `await` 的三种类型：协程、Task（任务）、Future（未来值）。

## 实战：异步 HTTP 请求

```python
import asyncio
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
    print(f"\n获取了 {len(results)} 个响应")

asyncio.run(main())
```

这个例子中，三个 HTTP 请求是并发发出的，总耗时约等于最慢的那个请求，而不是三个请求之和。

## 常见陷阱

- **忘记 await** — `async` 函数不 await 就不会执行
- **在协程中调用同步阻塞函数** — 会阻塞整个事件循环，应该用 `loop.run_in_executor()` 把阻塞操作放到线程池
- **混用 async 和 sync** — 不要在 async 函数中调用 `time.sleep()`，用 `await asyncio.sleep()`
- **过度并发** — 用 `asyncio.Semaphore` 限制并发数，避免被目标服务器限流

## 最佳实践

1. **I/O 密集型 → asyncio**（网络请求、文件读写、数据库查询）
2. **CPU 密集型 → 多进程**（计算、图像处理、机器学习推理）
3. **混合场景** → asyncio + ProcessPoolExecutor

掌握了 asyncio，你就能写出既优雅又高性能的 Python 代码。它是现代 Python Web 框架（FastAPI、BlackSheep）的基础，也是爬虫框架（httpx + asyncio）的核心驱动力。
