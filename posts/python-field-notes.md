# Python 学习手册：从语法到并发

> 这篇文章由早期的 `zong.py` 课堂笔记重新整理而成。旧稿把知识点藏在层层函数和注释里；现在按“能查、能跑、能避坑”的方式重写，并修正了过时 API、拼写和若干概念错误。

## 1. 输入、输出与变量

Python 使用 `#` 写单行注释。三引号创建的是多行字符串，虽然常被临时当作注释，但更准确的用途是文档字符串。

```python
name = input("你的名字：")       # input 的结果总是字符串
age = int(input("你的年龄："))

print(name, age, sep=" / ")
print(f"{name} 明年 {age + 1} 岁")
print(f"圆周率约为 {3.1415926:.2f}")
```

变量名可由字母、数字和下划线组成，不能以数字开头，也不能使用关键字。Python 严格区分大小写。常用基础类型有 `int`、`float`、`bool`、`complex`、`str` 和 `NoneType`；可用 `type(value)` 查看类型，用 `isinstance(value, int)` 判断类型。

## 2. 运算、判断与循环

```python
a, b = 7, 3
print(a + b, a - b, a * b)
print(a / b)   # 真除法
print(a // b)  # 向下取整除法
print(a % b, a ** b)

score = 86
level = "优秀" if score >= 85 else "继续加油"

for index, value in enumerate(["a", "b", "c"], start=1):
    print(index, value)
```

比较运算符包括 `== != < <= > >=`；逻辑运算使用 `and`、`or`、`not`。`break` 结束当前循环，`continue` 跳过本轮。`range(start, stop, step)` 不包含 `stop`。

海象运算符 `:=` 会在表达式中赋值，适合避免重复计算，但不等同于普通赋值语句：

```python
while (line := input("输入内容，留空退出：")):
    print(line)
```

位运算 `& | ^ ~ << >>` 面向整数的二进制位，通常用于掩码、协议和底层数据处理，不要与逻辑运算混用。

## 3. 字符串

字符串不可变，任何“修改”都会得到新字符串。

```python
text = "  Hello, Python  "
clean = text.strip()

print(clean.lower())
print(clean.replace("Python", "World"))
print(clean.startswith("Hello"))
print(clean[0:5])
print("-".join(["2026", "09", "08"]))
```

常用查询方法有 `find`、`index` 和 `count`。`find` 找不到时返回 `-1`，`index` 找不到会抛出 `ValueError`。分割行的方法是 `splitlines()`，交换大小写是 `swapcase()`。

文本与字节之间要明确编码：

```python
raw = "你好".encode("utf-8")
text = raw.decode("utf-8")
```

## 4. 列表、元组、字典与集合

- `list`：有序、可变，可重复。
- `tuple`：有序、不可变，可重复。
- `dict`：键值映射；键必须可哈希。
- `set`：无重复元素，适合集合运算。
- `frozenset`：不可变集合，可作为字典键。

```python
numbers = [3, 1, 2]
numbers.append(4)
numbers.sort()                 # 原地修改
new_numbers = sorted(numbers, reverse=True)  # 返回新列表

profile = {"name": "Rhys", "level": 1}
profile["level"] += 1
language = profile.get("language", "Python")

left, right = {1, 2, 3}, {3, 4}
print(left & right)  # 交集 {3}
print(left | right)  # 并集
print(left - right)  # 差集
```

推导式适合表达简洁的数据变换：

```python
squares = [n * n for n in range(10) if n % 2 == 0]
lengths = {word: len(word) for word in ["wind", "sea", "star"]}
```

## 5. 可变对象、赋值与拷贝

赋值不会自动复制对象，只会让新变量指向同一个对象。浅拷贝只复制外层容器，深拷贝递归复制内部对象。

```python
import copy

original = [[1], [2]]
shallow = copy.copy(original)
deep = copy.deepcopy(original)

original[0].append(9)
print(shallow)  # 内层共享，能看到 9
print(deep)     # 完全独立
```

不要用可变对象作默认参数：

```python
def append_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items
```

## 6. 函数、参数与作用域

```python
def report(name, score=0, *notes, passed=True, **extra):
    """演示位置、默认、可变与关键字参数。"""
    return {
        "name": name,
        "score": score,
        "notes": notes,
        "passed": passed,
        **extra,
    }
```

`*args` 收集额外位置参数，`**kwargs` 收集额外关键字参数。调用时，`*sequence` 和 `**mapping` 可用于拆包。

名称查找遵循 LEGB：局部作用域、闭包作用域、全局作用域、内置作用域。修改外层函数的变量用 `nonlocal`，修改模块全局变量用 `global`；实际开发应尽量用返回值减少全局状态。

闭包会记住定义时的外层环境，装饰器则接收函数并返回新函数：

```python
from functools import wraps

def log_call(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        print(f"calling {fn.__name__}")
        return fn(*args, **kwargs)
    return wrapper

@log_call
def add(a, b):
    return a + b
```

## 7. 异常处理

只捕获能够处理的具体异常，不要用空的 `except:` 吞掉所有问题。

```python
try:
    value = int("42")
except ValueError as error:
    print(f"格式错误：{error}")
else:
    print(value)
finally:
    print("无论成功失败都会执行")
```

需要主动报告非法状态时使用 `raise`。异常大致分为语法错误与运行时异常；实际排查应先看回溯最末行的异常类型和信息，再沿调用栈定位来源。

## 8. 模块与包

一个 `.py` 文件就是模块，含有 `__init__.py` 的目录通常作为普通包使用。

```python
import math
from pathlib import Path

print(math.inf)
print(Path.cwd())

if __name__ == "__main__":
    print("仅在直接运行本文件时执行")
```

优先写明确的导入，避免 `from module import *`。第三方依赖应记录在项目配置中，并在虚拟环境里安装，不要把“当前电脑能导入”误认为项目已经可复现。

## 9. 类与对象

```python
class User:
    species = "human"  # 类属性

    def __init__(self, name):
        self.name = name  # 实例属性

    def greet(self):
        return f"你好，我是 {self.name}"

    @classmethod
    def anonymous(cls):
        return cls("匿名旅人")

    @staticmethod
    def valid_name(name):
        return bool(name.strip())

    def __str__(self):
        return self.name
```

封装在 Python 中更多依赖约定：单下划线 `_name` 表示内部使用；双下划线会触发名称改写，但不是安全边界。继承用于表达“是一个”的关系，组合常更灵活。子类扩展父类方法时可调用 `super()`。

多态的核心不是共同父类，而是对象支持所需操作；这也常被称为鸭子类型。`__str__`、`__iter__`、`__call__` 等双下划线方法让对象接入 Python 的语法协议。

## 10. 文件与目录

```python
from pathlib import Path

path = Path("notes.txt")
path.write_text("海风与星光", encoding="utf-8")
content = path.read_text(encoding="utf-8")

for child in Path.cwd().iterdir():
    print(child.name)
```

处理大文件时应逐行读取；处理图片等二进制文件时使用 `rb`、`wb`。`with open(...)` 会在离开代码块时可靠关闭文件。现代代码通常优先使用 `pathlib`，它比手工拼接路径更清楚，也更易跨平台。

## 11. 迭代器与生成器

可迭代对象能产生迭代器；迭代器实现 `__next__()`，耗尽时抛出 `StopIteration`。生成器是编写惰性迭代器的简洁方式。

```python
def countdown(start):
    while start > 0:
        yield start
        start -= 1

for number in countdown(3):
    print(number)

squares = (n * n for n in range(1_000_000))
```

生成器按需计算，适合流式数据和大数据集；它通常只能顺序消费一次。`enumerate(iterable, start=0)` 会产生 `(索引, 元素)`，`zip()` 则并行组合多个可迭代对象。

## 12. 线程、进程与任务池

- 线程共享进程内存，适合大量等待网络或磁盘的 I/O 任务。
- 进程拥有独立内存，适合绕开 GIL 执行 CPU 密集型 Python 计算，但通信成本更高。
- `concurrent.futures` 为线程池和进程池提供统一接口。

```python
from concurrent.futures import ThreadPoolExecutor

def fetch_like_task(number):
    return number * 2

with ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(fetch_like_task, range(8)))
```

共享可变数据需要锁；优先使用 `with lock:`，避免忘记释放造成死锁。线程 API 中应使用 `daemon`、`name` 等属性，而不是已经过时的 `setDaemon()`、`getName()`。启动多进程的入口必须放在 `if __name__ == "__main__":` 保护中，Windows 和使用 `spawn` 的环境尤其如此。

## 结语：把知识点变成能力

语法表适合查询，却不等于会编程。每学完一节，最好完成一个能运行的小任务：清洗文本、统计词频、整理目录、调用 API 或并发下载。遇到异常时保留最小复现，用类型、边界条件和回溯逐层排查。这样这份手册才会从“记过的内容”变成真正可调用的经验。
