// GDT 数据类型 - Web 管理器的属性面板（对应 Swing
// DataTypeClientPlugin 属性）。与内置 EDI/X12 数据类型插件结构相同。
const PKG = "com.mirth.connect.plugins.datatypes.gdt";

const bool = (key, label, def, hint) => ({ key, label, type: "checkbox", default: def, hint });
const opt = (key, label, options, def, hint) => ({ key, label, type: "select", options, default: def, hint });
const code = (key, label, def, hint) => ({ key, label, type: "code", default: def, hint });

const BATCH_SCRIPT_HINT =
  "用于拆分批处理并返回下一条报文的 JavaScript 脚本。可访问 'reader'（一个 Java BufferedReader）；返回 null 或空值表示输入结束。仅在连接器启用"处理批处理"时使用。";

const DEF = {
  name: "GDT",
  label: "GDT",
  order: 72,
  propertiesClass: `${PKG}.GDTDataTypeProperties`,
  groups: [
    {
      key: "serializationProperties",
      label: "序列化",
      class: `${PKG}.GDTSerializationProperties`,
      fields: [
        bool("strict", "严格解析", false, "如果勾选，当行长度（前三位数字）或集合长度（字段 8100）错误，或集合不以字段 8000 开头时，GDT 报文将被拒绝。许多设备会产生这些错误，因此默认情况下它们会被忽略。"),
        bool("fieldNames", "字段名称", true, "如果勾选，GDT 规范中每个字段的名称将作为属性添加到 XML 中，例如 <F3101 name=\"Patient name\">。将 XML 转换为 GDT 时名称会被忽略。"),
        bool("calculateSetLength", "计算集合长度", true, "如果勾选，将 XML 转换为 GDT 时会计算字段 8100（集合长度），并在 XML 中没有时在字段 8000 之后添加。如果不勾选，8100 按 XML 中的值原样写入。每行的长度（前三位数字）始终会被计算。"),
        opt(
          "lineEnding",
          "行结尾",
          [
            { value: "CRLF", label: "CRLF" },
            { value: "LF", label: "LF" },
            { value: "CR", label: "CR" }
          ],
          "CRLF",
          "XML 转换为 GDT 时的行结尾方式。规范要求使用 CRLF。读取 GDT 时，CRLF、LF 和 CR 均被接受。"
        ),
        bool("groupResults", "分组结果字段", false, "如果勾选，重复的字段 8410（检验 ID）及其后续的字段 8411（检验名称）、8420（结果值）和 8421（单位）将嵌套在同一个 <result> 元素中，而不是作为集合的平级元素，一组连续的结果将被包裹在 <results> 元素中。新的 8410 结束当前 <result> 并开始下一个；任何其他字段结束整个 <results> 组。将 XML 转换为 GDT 时会把 <results> 还原为相同顺序的相同字段，因此 GDT 报文不会改变。"),
        bool("groupCategories", "分组类别", false, "如果勾选，开放类别（字段 6330、6332、...、6398 后跟类别名称，再跟字段 6331、6333、...、6399 后跟其内容，例如 OrderID）将变为 <category name=\"OrderID\">356218126</category>，而不是两个 F#### 字段，一组连续的类别将被包裹在 <categories> 元素中。将 XML 转换为 GDT 时会把 <categories> 还原为从 6330 重新编号的相同字段。"),
        bool("joinResultsText", "合并结果文本", false, "如果勾选，连续的多个字段 8480（结果文本）将按出现顺序合并为一个，中间不添加任何内容。某些设备将长文本拆分到多个 8480 字段中，而不是使用长行可拥有的四位数字长度。")
      ]
    },
    {
      key: "batchProperties",
      label: "批处理",
      class: `${PKG}.GDTBatchProperties`,
      fields: [
        opt(
          "splitType",
          "批处理拆分方式",
          [
            { value: "Set", label: "集合" },
            { value: "JavaScript", label: "JavaScript" }
          ],
          "Set",
          "拆分批处理报文的方法。集合：每个 GDT 集合（从字段 8000 开始）为一条报文。仅在连接器启用"处理批处理"时使用。"
        ),
        code("batchScript", "JavaScript", null, BATCH_SCRIPT_HINT)
      ]
    }
  ]
};

DEF.defaults = (version) => {
  const props = { "@class": DEF.propertiesClass, "@version": version };
  for (const group of DEF.groups) {
    const obj = { "@class": group.class, "@version": version };
    for (const f of group.fields) obj[f.key] = f.default ?? null;
    props[group.key] = obj;
  }
  return props;
};

export function register(platform) {
  platform.registerDataType(DEF.name, DEF);
}
