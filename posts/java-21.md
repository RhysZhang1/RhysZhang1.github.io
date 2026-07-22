# Java 21 你不能忽视的新特性

Java 21 于 2023 年 9 月发布，是一个 LTS（长期支持）版本。如果说 Java 8 引入了函数式编程，那么 Java 21 带来了**虚拟线程**和**模式匹配**这两大范式革新。

## 1. 虚拟线程（Virtual Threads）— JEP 444

这是 Java 21 最重要的特性。虚拟线程是**轻量级线程**，由 JVM 管理而非操作系统，创建成本极低。

### 传统线程 vs 虚拟线程

```java
// 传统平台线程 — 一个请求一个线程
// 线程池有限，高并发时会阻塞
ExecutorService executor = Executors.newFixedThreadPool(200);
executor.submit(() -> handleRequest());

// 虚拟线程 — 可以轻松创建百万个
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    executor.submit(() -> handleRequest());
}

// 或者直接创建
Thread.startVirtualThread(() -> {
    System.out.println("Hello from virtual thread!");
});
```

**关键特性：**

- 虚拟线程遇到 I/O 阻塞时会自动"挂起"，释放底层平台线程
- 创建成本几乎为零（不像平台线程需要约 1MB 栈空间）
- 不需要线程池——用完即弃，由 JVM GC 回收
- 完美适配"一个请求一个线程"的编程模型

> "Virtual Threads 让你可以用简单的同步代码处理百万级并发。"

## 2. 模式匹配（Pattern Matching）

### Switch 的模式匹配（JEP 441）

```java
// Java 17 之前
Object obj = getSomeValue();
if (obj instanceof String s) {
    System.out.println("字符串长度: " + s.length());
} else if (obj instanceof Integer i) {
    System.out.println("整数 + 1 = " + (i + 1));
}

// Java 21 — 用 switch 优雅处理
String result = switch (obj) {
    case String s   -> "字符串: " + s.toUpperCase();
    case Integer i  -> "整数: " + (i * i);
    case List<?> l  -> "列表有 " + l.size() + " 个元素";
    case null       -> "是 null";
    default         -> "未知类型";
};
```

### Record 模式（JEP 440）

```java
record Point(int x, int y) {}
record Line(Point start, Point end) {}

Object shape = new Line(new Point(0, 0), new Point(10, 20));

// 嵌套解构！
if (shape instanceof Line(Point(int x1, int y1), Point(int x2, int y2))) {
    System.out.printf("线段: (%d,%d) → (%d,%d)%n", x1, y1, x2, y2);
}
```

## 3. Record 类型

一行代码定义不可变数据类，自动生成构造器、getter、equals()、hashCode()、toString()：

```java
public record User(String name, int age, String email) {}

var user = new User("张三", 28, "zhangsan@example.com");
System.out.println(user.name());
System.out.println(user);  // User[name=张三, age=28, email=zhangsan@example.com]
```

## 4. 其他值得关注的特性

- **Sequenced Collections** — 有序集合的统一接口
- **String Templates（预览）** — 字符串插值的原生支持
- **Scoped Values（预览）** — 线程局部变量的现代替代
- **Foreign Function & Memory API** — 安全的本地内存和外部函数调用

## 升级建议

如果你的项目还在用 Java 8 或 11：

1. 先从 Java 8 → Java 17（上一个 LTS），再→ Java 21
2. 用虚拟线程替换传统线程池
3. 把 instanceof + if-else 链改为 switch 模式匹配
4. 用 Record 替代简单的 POJO / DTO

Java 21 是一次质的飞跃。它让 Java 在保持向后兼容的同时，拥有了不输 Kotlin、Go 的现代开发体验。
