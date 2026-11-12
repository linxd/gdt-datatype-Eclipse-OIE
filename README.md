# GDT 数据类型（Eclipse OIE 版）

[![Build](https://github.com/matthydehoog/gdt-datatype-Eclipse-OIE/actions/workflows/build.yml/badge.svg)](https://github.com/matthydehoog/gdt-datatype-Eclipse-OIE/actions/workflows/build.yml)

一个用于 [Eclipse Open Integration Engine](https://openintegrationengine.org/) 的 **GDT 数据类型**（针对 **4.6.0** 和 **4.7.0** 测试），基于内置的 *EDI / X12* 数据类型建模。GDT（*Geräte-Daten-Träger*，"设备数据载体"）是 QMS（Qualitätsring Medizinische Software）在医疗测量设备（心电图仪、肺活量计、血压计等）与诊所计算机系统之间的接口。安装后，"GDT" 将出现在 Swing 客户端和 Web 管理器中 HL7 v2.x、EDI / X12 及其他数据类型旁边。

> 社区扩展。它不是 Eclipse OIE 项目的组成部分，不受其认可，也不受 QMS 认可。

## 功能概述

- 用于源连接器和目标连接器的 **GDT** 数据类型，在 **Swing 客户端**和 **Web 管理器**中均有属性配置面板。
- 将 GDT（接口描述版本 2.1）读取为 **XML**，并将 XML 写回 GDT。支持集合、重复出现的字段（`6220`、`8410` 等）、一个文件中的多个集合以及所有行结尾（CRLF、LF、CR）。
- **行长度自动计算**：XML 写入为 GDT 时自动计算，字段 `8100`（集合长度）同样自动计算。转换器可以从零构建集合而无需手动计数字符。
- **默认宽松解析。** 实际设备的输出超出规范允许的范围（参见[实际设备的输出](#实际设备的输出)）：错误的长度、多行的值、四位数字长度、六位数字的集合长度。所有这些都能被读取。*严格解析* 可拒绝它们。
- 用于报文列表和搜索的**元数据**：source = 发送方 GDT-ID（`8316`），type = 集合类型（`8000`，例如 `6310`），version = GDT 版本（`9218`）。
- 带有规范字段名称的**报文树描述**。Swing 客户端会显示它们；Web 管理器从 Web Support 1.1.0 起也会显示。
- **批处理**：包含多个集合的文件可拆分为每个集合一条报文。

## 安装

1. 从 [Releases](../../releases) 页面下载 `datatype-gdt-<version>.zip`（或自行构建，见下文）。
2. Settings -> Extensions -> **Install Extension**，选择 zip 文件，重启引擎。
3. 重启 Swing 客户端。在 Web 管理器中执行硬刷新（Ctrl+F5）。
4. 在通道中，打开源连接器的 **Set Data Types** 并选择 **GDT**。

如果安装程序因扩展已存在而拒绝，请先卸载旧版本并重启。

## XML 结构

GDT 集合是一个行列表。每行格式为 `LLLFFFFvalue`：三位数字表示行长度（包括这三位数字、字段编号和 CR LF），四位数字字段编号，以及值。

```
01380006300
014810000085
0178315PRAX_EDP
0178316LUFU_SYS
014921802.10
01030000
```

转换为

```xml
<GDT>
  <set type="6300" name="Root data request">
    <F8000 name="Set type">6300</F8000>
    <F8100 name="Set length">00085</F8100>
    <F8315 name="Receiver GDT-ID">PRAX_EDP</F8315>
    <F8316 name="Sender GDT-ID">LUFU_SYS</F8316>
    <F9218 name="GDT version">02.10</F9218>
    <F3000 name="Patient number / patient label">0</F3000>
  </set>
</GDT>
```

（引擎输出的 XML 为一行；此处为便于阅读添加了缩进。）包含多个集合的文件会生成多个 `set` 元素。

- 字段是以 **`F`** 加四位字段编号命名的元素：患者姓名为 `F3101`。
- 字段顺序即报文中的顺序。重复出现的字段（如 `6220`）会重复。
- `name` 属性来自规范，可关闭（*字段名称*）。XML 转回 GDT 时属性会被忽略，`type` 和长度数字同样被忽略。
- 字段值与报文中的完全一致，包括空格。这对 `6228`（格式化结果表）很重要。
- 值中包含换行符（如报告文本）时，它仍然是一个字段，XML 中用换行符（`\n`）表示。XML 转回 GDT 时会重新写为多行。
- 控制字符（低于空格，制表符和换行符除外）不能出现在 XML 中，会被省略。

[examples](examples) 中的示例文件是插件的实际输出。

## 设置

| 设置 | 含义 | 默认值 |
|---|---|---|
| 严格解析 | 拒绝行长度错误、集合长度（`8100`）错误或不以 `8000` 开头的集合 | 关闭 |
| 字段名称 | 将每个字段的名称作为属性添加到 XML | 开启 |
| 计算集合长度 | XML 写入为 GDT 时计算 `8100`，缺失时在 `8000` 后添加。关闭：按 XML 中的值写入 | 开启 |
| 行结尾 | XML 写入为 GDT 时的行结尾：CRLF、LF 或 CR。规范要求 CRLF | CRLF |
| 分组结果字段 | 将字段 `8410`（检验 ID）及其后续的 `8411`、`8420` 和 `8421` 嵌套在 `<result>` 元素中，一组连续结果嵌套在 `<results>` 元素中（参见[分组](#分组)） | 关闭 |
| 分组类别 | 将开放类别（名称字段 `6330`、`6332`、... 后跟内容字段 `6331`、`6333`、...）转为 `<category name="...">content</category>`，一组连续类别嵌套在 `<categories>` 元素中 | 关闭 |
| 合并结果文本 | 将连续的多个字段 `8480`（结果文本）合并为一个。某些设备将长文本拆分到多个 `8480` 字段中而不使用四位数字长度 | 关闭 |
| 批处理拆分方式（批处理） | *集合*：每个集合为一条报文。*JavaScript*：自定义拆分器。仅在连接器中 *Process Batch Files* 开启时使用 | 集合 |

### 分组

三个分组设置只改变 XML，不改变 GDT：XML 重新写入为 GDT 时，分组会还原为相同顺序的相同字段。开启 *分组结果字段* 后：

```xml
<results>
  <result>
    <F8410 name="Test ID">SYSMXTG</F8410>
    <F8411 name="Test name">Systole max day phase</F8411>
    <F8420 name="Result value">142</F8420>
    <F8421 name="Unit">mmHg</F8421>
  </result>
</results>
```

新的 `8410` 开始下一个 `result`；任何其他字段结束 `results` 组。开启 *分组类别* 后：

```xml
<categories>
  <category name="OrderID">356218126</category>
</categories>
```

写入为 GDT 时，类别从 `6330` 重新编号，按出现顺序排列。*合并结果文本* 将字段合并在一起，中间不添加任何内容；写入为 GDT 时文本成为一个字段（长文本时使用四位数字长度）。

### 长度

每行的长度始终会被计算，无论写入哪种行结尾，都按规范计算为 CR LF。值内的换行符也按 CR LF 计算。长度以字符计数，在 GDT 使用的单字节字符集中字符即字节。

## 实际设备的输出

规范来自 2001 年，设备并不严格遵守。以下是数据类型能读取的内容，基于一个睡眠研究设备（Noxturnal，NOX T3）超过 5000 个字段的文件：

| 设备的输出 | 数据类型的处理 |
|---|---|
| 行前的长度错误 | 忽略（除非开启 *严格解析*） |
| 值中包含换行符：只有第一行有长度和字段编号，后续行为纯文本 | 作为该字段的一部分读取，行间有换行符（`\n`） |
| 超过 990 字符的值使用四位数字长度（`1342`） | 当四位长度给出规范中的字段且三位读法（`134` 和字段 `2842`）不符合时，按四位长度读取 |
| 字段 `8100`（集合长度）为六位数字，值偏差几个字符 | 原样读取。写入时 `8100` 使用所需的位数，反映集合的实际长度 |

XML 写入为 GDT 时，超过 990 字符的值使用四位数字长度，与这些设备一致；规范为三位。字段最多可容纳 9990 个字符。关闭 *计算集合长度* 可按 XML 中的值写入 `8100`。

## 在通道中使用

读取设备留在目录中的文件（File Reader，入站数据类型 **GDT**）：

```javascript
var set = msg['set'][0];                            // the first set
var patient = set['F3101'].toString() + ', ' + set['F3102'].toString();
var test = set['F8402'].toString();                 // for example EKG01

// fields that occur more than once
for each (var line in set['F6220']) {
    logger.info(line.toString());
}
```

要写入 GDT，将目标出站数据类型设为 **GDT** 并让转换器生成 XML。您只需填写值：

```xml
<GDT>
  <set>
    <F8000>6301</F8000>
    <F8315>LUFU_SYS</F8315>
    <F8316>PRAX_EDP</F8316>
    <F9218>02.10</F9218>
    <F3000>${patientNumber}</F3000>
    <F3101>${lastName}</F3101>
    <F3102>${firstName}</F3102>
    <F3103>${birthDate}</F3103>
  </set>
</GDT>
```

行长度和 `8100` 在报文写入时自动添加。值中可包含换行符；它们会被写为多行。

集合之间的对应关系：

| 集合 | 方向 | 含义 |
|---|---|---|
| 6300 | 设备 -> 诊所系统 | 根数据请求。必须用 6301 应答 |
| 6301 | 诊所系统 -> 设备 | 根数据传输（患者信息） |
| 6302 | 诊所系统 -> 设备 | 新检验请求（`8402` 指明检验类型，例如 `EKG01`） |
| 6310 | 设备 -> 诊所系统 | 检验数据传输（结果） |
| 6311 | 诊所系统 -> 设备 | 检验数据展示 |

## 不安装插件：用 JavaScript 实现 gdtToXml

在无法安装扩展的环境中，[javascript/gdtToXml.js](javascript/gdtToXml.js) 可在转换器中用纯 JavaScript 读取 GDT，并生成与关闭 *字段名称* 时的数据类型相同的 XML。将该函数添加为代码模板（放在已为通道启用的库中），将源连接器的入站数据类型设为 **Raw**，并在第一个转换器步骤中这样开始：

```javascript
msg = gdtToXml(msg);
```

此后脚本与使用数据类型时相同，例如 `msg['set']['F3000']` 或 `msg['set']['categories']['category'].(@name == 'OrderID')`。分组设置作为选项通过第二个参数传入；每个省略的选项默认为**开启**：

```javascript
msg = gdtToXml(msg, {
    groupResults: true,     // Group Result Fields
    groupCategories: true,  // Group Categories
    joinResultsText: false  // Join Results Text
});
```

它读取 GDT 的方式与关闭 *严格解析* 时的数据类型相同：多行的值、错误的行长度、第一个 `8000` 之前的字段、字节顺序标记和文件结束标记。已在 [examples](examples)、三个 Noxturnal NOX T3 文件以及为边界情况制作的文件上，将选项的全部八种组合生成的 XML 与数据类型的输出进行了比较：结果一致。

它不做的事情：

- 写入 GDT。仅支持读取。
- *严格解析* 和 *字段名称*。
- 对四位数字长度使用字段表。998 个字符或更长的行按四位数字长度读取；数据类型还会检查哪种读法能得到已知字段，因此只有长度错误的长行才可能产生不同结果。
- 解码字节：与数据类型一样，将 File Reader 的编码设置为与字段 `9206` 匹配（Noxturnal 写入 `2`，即 `IBM437`）。

在 Rhino 中，`appendChild` 添加的是元素的副本，因此该函数始终使用文档中的子元素继续处理。修改时请牢记这一点。

## 字符集

字段 `9206` 指明文件编码方式：`1` = 7 位，`2` = IBM 代码页 437（规范默认），`3` = ISO 8859-1（ANSI，代码页 1252）。数据类型不解码字节；由**连接器**负责。将 File Reader（和 File Writer）的编码设置为匹配，例如 `IBM437` 或 `ISO-8859-1`。编码错误时，变音符号和重音符号会显示错误。

## 不包含的功能

- **串行接口**（规范附录 A：带 CRC-16 和 ACK/NAK 的数据块）。此数据类型读写 GDT 的*行*；请配合 File Reader / File Writer 或任何能传递完整报文的连接器使用。
- **字段内容检查**（日期、`3110` 的值、字段表中的长度）。仅检查行和集合的结构，且仅在严格模式下。
- 仅支持 2.1 接口描述的 GDT 版本。不在其中的字段与其他字段一样被读写，只是没有名称。

## 构建

1. 将引擎 jar 安装到本地 Maven 仓库，坐标与 `pom.xml` 期望一致（`com.mirth.connect:server-api`、`donkey-server`、`donkey-model`、`client`、`client-core`，版本 = `oie.version`），取自 `<OIE_HOME>/server-lib` 和 `<OIE_HOME>/client-lib`。
2. 使用引擎附带的 JDK 构建：

   ```bash
   mvn clean package
   ```

   生成 `target/datatype-gdt-<version>.zip`：

   ```
   datatype-gdt/
   ├── plugin.xml
   ├── datatype-gdt-shared.jar     （序列化器、属性：服务端和客户端共用）
   ├── datatype-gdt-server.jar     （批处理适配器）
   ├── datatype-gdt-client.jar     （Swing 插件）
   └── webadmin/                   （Web 管理器面板：plugin.json + web/plugin.js）
   ```

### GitHub 上

每次推送和拉取请求都由 [GitHub Actions](.github/workflows/build.yml) 针对 OIE 4.6.0（Java 17）和 4.7.0（Java 17 和 21）构建和测试。随后将 zip 安装到这两个版本的真实引擎中，部署一个通道并对 GDT 报文进行转换和拆分（即冒烟测试，参见[开发指南](docs/development.md#smoke-test)）。引擎 jar 取自[引擎自身的发布版](https://github.com/OpenIntegrationEngine/engine/releases)（经其公布的 SHA-256 校验）并缓存；每次构建的 zip 作为 artifact 保留。

### 发布

1. 在所有四个位置设置新版本：`pom.xml`、`src/main/resources/plugin.xml`（`pluginVersion`）、`oie.json` 和 `webadmin/plugin.json`。版本号不一致时构建会失败。
2. 提交，然后标记并推送标签：

   ```bash
   git tag v1.0.7
   git push origin v1.0.7
   ```

工作流构建标签并创建包含 zip 及其 SHA-256 的 GitHub Release。要自行编写发布说明，请先在 GitHub 上创建 Release（不带 zip）；工作流只会添加 zip 和校验和。

## 设计说明（面向开发者）

[开发指南](docs/development.md) 详细介绍了构建、解析器和 XML 转换、测试、CI 和发布。简而言之：

- **包名。** 类位于 `com.mirth.connect.plugins.datatypes.gdt`。引擎的 XStream 白名单在读取通道时只接受 `com.mirth.connect.*` 家族的类。
- **文件夹名 = `path`。** `plugin.xml` 中的 `path` 属性（`datatype-gdt`）必须等于扩展文件夹名。
- **空安全属性。** 引擎在读取已保存的通道时不运行构造函数，因此后来添加的设置为 null。`GDTSerializationProperties` 的 getter 会回退到默认值，默认为*开启*的设置为 `Boolean` 对象正是出于此原因。
- **两个半区。** `GDTParser` 将文本转为集合并由 `GDTReader` 转为 SAX 事件（GDT 到 XML）；`GDTXMLHandler` 收集 SAX 事件并写入带长度的行（XML 到 GDT）。读取器和处理器除了 `AbstractXMLReader` 外对引擎一无所知，因此解析可以独立测试。

## 许可证

[Mozilla Public License 2.0](LICENSE)。此数据类型的结构遵循 Open Integration Engine（Mirth Connect，Copyright (c) Mirth Corporation）的 EDI / X12 数据类型，同样采用 MPL 2.0 许可证。
