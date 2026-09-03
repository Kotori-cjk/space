const studyItems = [
  "字节序与十六进制表示", "位级运算与逻辑运算", "无符号数与补码", "C 中的强制类型转换",
  "整数加法、乘法与溢出", "右移与移位边界", "IEEE 754 单精度/半精度", "错题回顾"
];

const questions = [
  { id: "q01", topic: "字节表示", source: "练习题 2.12", title: "最低有效字节", prompt: "令 x = 0x87654321。保留 x 的最低有效字节，其他位全置 0，结果是多少？", answers: ["0x00000021", "0x21", "21"], display: "0x00000021", explanation: "最低有效字节是最低 8 位 0x21；其余位清零。" },
  { id: "q02", topic: "字节表示", source: "练习题 2.12", title: "其余字节取补", prompt: "令 x = 0x87654321。除最低有效字节外，其他位都取补，最低有效字节不变，结果是多少？", answers: ["0x789abc21", "789abc21"], display: "0x789ABC21", explanation: "0x87、0x65、0x43 分别按位取补得到 0x78、0x9A、0xBC，0x21 不变。" },
  { id: "q03", topic: "字节表示", source: "练习题 2.12", title: "最低有效字节置 1", prompt: "令 x = 0x87654321。将 x 的最低有效字节全部置 1，其他字节不变，结果是多少？", answers: ["0x876543ff", "876543ff"], display: "0x876543FF", explanation: "最低字节由 0x21 改为 0xFF，高 3 个字节保持 0x876543。" },
  { id: "q04", topic: "位级运算", source: "icsnote", title: "按位与", prompt: "计算 0x69 & 0x55 的结果。", answers: ["0x41", "41"], display: "0x41", explanation: "0x69 为 0110 1001，0x55 为 0101 0101；逐位与得到 0100 0001。" },
  { id: "q05", topic: "位级运算", source: "icsnote", title: "按位异或", prompt: "计算 0x69 ^ 0x55 的结果。", answers: ["0x3c", "3c"], display: "0x3C", explanation: "逐位不同为 1：0110 1001 ^ 0101 0101 = 0011 1100。" },
  { id: "q06", topic: "位级运算", source: "练习题 2.13", title: "仅用 bis 实现 OR", prompt: "已知 bis(x, m) 在 m 为 1 的位将 x 置 1。填写 bool_or 中 result = 后的表达式，实现 x | y。", code: "int bool_or(int x, int y) {\n    int result = ______;\n    return result;\n}", answers: ["bis(x,y)"], display: "bis(x, y)", explanation: "bis 的效果正是把掩码 y 中为 1 的位设为 1，因此等价于 x | y。" },
  { id: "q07", topic: "位级运算", source: "练习题 2.13", title: "仅用 bis/bic 实现 XOR", prompt: "填写 bool_xor 中 result = 后的表达式，实现 x ^ y。可调用 bis 与 bic。", code: "int bool_xor(int x, int y) {\n    int result = ______;\n    return result;\n}", answers: ["bis(bic(x,y),bic(y,x))", "bic(bis(x,y),bic(x,bic(x,y)))"], display: "bis(bic(x, y), bic(y, x))", explanation: "bic(x,y) 保留仅 x 为 1 的位，bic(y,x) 保留仅 y 为 1 的位；二者取 OR 正是异或。" },
  { id: "q08", topic: "无符号数", source: "2.2 节", title: "4 位无符号数", prompt: "4 位位向量 [1011] 按无符号数解释，十进制值是多少？", answers: ["11"], display: "11", explanation: "权重为 8、4、2、1，1011 = 8 + 2 + 1 = 11。" },
  { id: "q09", topic: "补码", source: "2.2 节", title: "4 位补码", prompt: "4 位位向量 [1011] 按补码解释，十进制值是多少？", answers: ["-5", "－5"], display: "-5", explanation: "最高位权重为 -8，其余为 0、2、1，因此值为 -8 + 2 + 1 = -5。" },
  { id: "q10", topic: "类型转换", source: "2.2 节", title: "补码转无符号", prompt: "将 4 位补码整数 -3 转为同位宽无符号数，结果是多少？", answers: ["13"], display: "13", explanation: "负补码数转换为无符号值时加上 2^w：-3 + 16 = 13。" },
  { id: "q11", topic: "类型转换", source: "2.2 节", title: "无符号转补码", prompt: "将 4 位无符号数 13 转为同位宽补码整数，结果是多少？", answers: ["-3", "－3"], display: "-3", explanation: "13 的最高位为 1，所以补码值是 13 - 2^4 = -3。" },
  { id: "q12", topic: "移位", source: "2.2 节", title: "算术右移", prompt: "把 8 位补码 0xD4 做算术右移 2 位，结果（仍写为 8 位十六进制）是多少？", answers: ["0xf5", "f5"], display: "0xF5", explanation: "0xD4 = 1101 0100，算术右移用符号位 1 补高位：1111 0101 = 0xF5。" },
  { id: "q13", topic: "移位", source: "2.2 节", title: "逻辑右移", prompt: "把 8 位位模式 0xD4 做逻辑右移 2 位，结果（仍写为 8 位十六进制）是多少？", answers: ["0x35", "35"], display: "0x35", explanation: "逻辑右移用 0 补高位：1101 0100 变为 0011 0101。" },
  { id: "q14", topic: "整数运算", source: "2.3 节", title: "无符号加法截断", prompt: "4 位无符号数中，14 + 5 的截断结果是多少？", answers: ["3"], display: "3", explanation: "14 + 5 = 19；4 位无符号数模 16 截断，19 mod 16 = 3。" },
  { id: "q15", topic: "整数运算", source: "2.3 节", title: "补码加法截断", prompt: "4 位补码中，7 + 3 的截断结果（十进制）是多少？", answers: ["-6", "－6"], display: "-6", explanation: "10 的 4 位模式为 1010；按 4 位补码解释为 -8 + 2 = -6。" },
  { id: "q16", topic: "C 转换", source: "icsnote", title: "有符号/无符号比较", prompt: "在典型 32 位 int、unsigned int 环境，C 表达式 -1 < 0U 的值是 true 还是 false？", answers: ["false", "假", "0"], display: "false", explanation: "比较前 -1 会转换为 unsigned int，即 UINT_MAX；UINT_MAX < 0U 为假。" },
  { id: "q17", topic: "位级运算", source: "2.1 节", title: "清除最低位的 1", prompt: "表达式 x & (x - 1) 的效果是：清除 x 中哪一位的 1？请简答。", answers: ["最低位", "最低的1", "最低有效1位", "最低有效位的1", "最低有效的1位"], display: "清除最低有效的 1 位", explanation: "x-1 会把最低有效的 1 变成 0，并将其后的 0 变成 1；与原 x 相与后，只有该最低有效 1 被清除。" },
  { id: "q18", topic: "溢出检测", source: "练习题 2.36", title: "用更宽类型检查乘法", prompt: "在 int 为 32 位时，先计算 int64_t p = (int64_t)x * y;。要判断 x*y 是否未溢出，return 后应填写什么比较表达式？", answers: ["p==(int)p"], display: "p == (int)p", explanation: "若 64 位精确乘积转换回 int 后仍与原乘积相同，说明它在 int 的表示范围内。" },
  { id: "q19", topic: "IEEE 754", source: "icsnote", title: "单精度规格化最小指数", prompt: "IEEE 754 单精度规格化数的最小实际指数 E_min 是多少？", answers: ["-126", "－126"], display: "-126", explanation: "单精度阶码有 8 位，偏置为 127；规格化数最小阶码字段为 1，所以 E_min = 1 - 127 = -126。" },
  { id: "q20", topic: "IEEE 754", source: "icsnote", title: "NaN 的判定", prompt: "IEEE 754 中，阶码全为 1 且小数字段非 0 表示什么？", answers: ["nan", "非数", "不是一个数"], display: "NaN", explanation: "阶码全 1、小数非 0 是 NaN；若小数为 0 才表示正/负无穷。" },
  { id: "q21", topic: "IEEE 754", source: "icsnote", title: "单精度最小正规格化值", prompt: "IEEE 754 单精度最小的正规格化正数用 2 的幂表示是多少？", answers: ["2^-126", "2的-126次方", "2的−126次方"], display: "2^-126", explanation: "最小规格化指数为 -126，隐含有效数为 1.0，因此值为 1.0×2^-126。" },
  { id: "q22", topic: "IEEE 754", source: "icsnote", title: "9.5 的单精度编码", prompt: "十进制 9.5 的 IEEE 754 单精度位模式（十六进制）是多少？", answers: ["0x41180000", "41180000"], display: "0x41180000", explanation: "9.5 = 1.0011×2^3；阶码为 3+127=130，尾数为 0011 后补 0，组合得 0x41180000。" },
  { id: "q23", topic: "IEEE 754", source: "练习题 2.87", title: "半精度 512", prompt: "IEEE 754 半精度（1 符号位、5 阶码位、10 小数位）中，512.0 的十六进制编码是多少？", answers: ["0x6000", "6000"], display: "0x6000", explanation: "512 = 1.0×2^9；偏置 15，阶码字段为 24（二进制 11000），小数为 0。" },
  { id: "q24", topic: "IEEE 754", source: "练习题 2.87", title: "半精度负零", prompt: "IEEE 754 半精度中，-0 的十六进制编码是多少？", answers: ["0x8000", "8000"], display: "0x8000", explanation: "负零只有符号位为 1，阶码与小数字段都为 0。" },
  { id: "q25", topic: "字节序", source: "2.1 节", title: "小端字节序", prompt: "32 位数 0x12345678 在小端机器中按低地址到高地址依次存放的字节是什么？用空格分隔。", answers: ["78 56 34 12", "0x78 0x56 0x34 0x12"], display: "78 56 34 12", explanation: "小端法先存最低有效字节，因此地址递增方向依次为 78、56、34、12。" },
  { id: "q26", topic: "字符表示", source: "练习题 2.7", title: "字符串的字节表示", prompt: "ASCII 字符串 \"12345\" 不含结尾 NUL 时，按十六进制写出 5 个字符字节。用空格分隔。", answers: ["31 32 33 34 35", "0x31 0x32 0x33 0x34 0x35"], display: "31 32 33 34 35", explanation: "ASCII 中 '1' 到 '5' 的编码依次为 0x31 到 0x35；strlen 不计结尾的 NUL。" }
];

// 题干均为原题的复习摘要；编号与第二章练习题一一对应。
const catalogRows = [
  ["十六进制/二进制互换", "完成给定十六进制与二进制串的互相转换。"],
  ["2 的幂", "补全若干 2^n 的十进制与十六进制表示。"],
  ["小数的进制转换", "补全十进制、二进制、十六进制三栏的对应值。"],
  ["十六进制算术", "直接在十六进制下完成加、减与和 2 的幂相加。"],
  ["字节序", "给定 0x87654321，分别列出小端与大端机器的字节输出。"],
  ["十六进制串匹配", "将两个十六进制数转换后，找出位串的匹配关系。"],
  ["show_bytes 输出", "说明 show_bytes 对 short、float、指针和字符串会输出什么。"],
  ["位级布尔运算", "对给定 8 位 a、b，补全 ~、&、|、^ 的结果表。"],
  ["颜色的位表示", "用 RGB 位向量解释补色与按位运算得到的颜色。"],
  ["异或交换", "逐步说明 XOR 交换程序为什么能交换两个不同位置的值。"],
  ["原地交换的别名问题", "解释 reverse_array 在 x、y 指向同一位置时为何失败，并修正边界。"],
  ["字节掩码表达式", "写出保留/取补/置 1 最低有效字节的 C 表达式。"],
  ["仅用 bis 与 bic", "用 bis、bic 分别实现按位 OR 和 XOR。"],
  ["逻辑与位级运算", "计算给定 x、y 下位级与逻辑运算表达式的值。"],
  ["相等性判定", "只用位级与逻辑运算写出 is_equal 的表达式。"],
  ["移位比较", "补全 x<<3、逻辑右移与算术右移的结果表。"],
  ["4 位表示", "把若干 4 位十六进制位模式分别解释为无符号和补码数。"],
  ["机器码中的立即数", "将汇编中的十六进制位模式与候选十进制常数匹配。"],
  ["补码转无符号", "依据 T2U 的规则完成给定位模式的转换表。"],
  ["转换函数性质", "用补码/无符号转换公式解释题中等式成立的条件。"],
  ["有符号与无符号比较", "给每个 C 比较表达式判断结果类型和值。"],
  ["截断与符号扩展", "说明 16 位与 32 位之间转换后数值如何变化。"],
  ["补码与无符号关系", "完成给定 w 位位模式的 U2T/T2U 变换。"],
  ["补码取反", "证明/说明 -x 与 ~x+1 的关系及 Tmin 特例。"],
  ["补码范围", "推导 w 位补码最大值、最小值以及对应的位模式。"],
  ["无符号数范围", "写出 w 位无符号数的范围和最大值的位表示。"],
  ["无符号加法", "补全不同 w 位无符号加法的和与截断结果。"],
  ["补码加法", "补全不同 w 位补码加法的和、位模式和溢出情况。"],
  ["加法溢出分类", "按正溢出、负溢出和不溢出分类给定加法。"],
  ["无符号比较陷阱", "分析带 unsigned 的比较表达式为何得到意外结果。"],
  ["倒计时循环", "修正 unsigned 循环变量导致的永不终止循环。"],
  ["截断乘法", "说明补码截断乘法和无符号截断乘法的位模式关系。"],
  ["乘法的位级解释", "由低/高 w 位推导补码乘积的截断结果。"],
  ["乘法结果表", "完成无符号和补码乘法的完整结果与截断列。"],
  ["乘法溢出检测", "证明以 (x*y)/x 判断乘法是否溢出的局限/条件。"],
  ["64 位检测乘法溢出", "使用 int64_t 精确乘积并判断转换回 int 是否保持数值。"],
  ["乘以常数", "把乘以给定常数写成移位和加减的组合。"],
  ["除以 2 的幂", "补全有符号数除以 2^k 的移位表达式及舍入。"],
  ["有符号除法舍入", "构造 bias，使负数向零舍入而不是向负无穷舍入。"],
  ["乘 3 再除 4", "实现 mul3div4，同时避免中间乘法溢出。"],
  ["乘 3/4", "实现 threefourths，分别处理舍入与中间溢出。"],
  ["浮点数的位字段", "给出符号、阶码、小数字段，写出 V 的数值。"],
  ["特殊浮点值", "根据 IEEE 754 位字段辨认零、非规格化、无穷和 NaN。"],
  ["IEEE 单精度数值", "从位模式推导规格化/非规格化单精度数的值。"],
  ["浮点表示比较", "比较两个指定浮点格式的范围、精度与可表示值。"],
  ["浮点舍入", "将格式 A 的数舍入到格式 B，并指出向上/下舍入。"],
  ["浮点乘法", "按 IEEE 754 规格化、舍入和溢出规则完成乘法表。"],
  ["浮点加法", "对齐指数并完成给定浮点格式的加法。"],
  ["扩展精度", "计算扩展精度格式的最小非规格化、最小规格化和最大规格化数。"],
  ["半精度浮点", "完成半精度格式下给定值的 Hex、M、E、V、D 表。"],
  ["小型浮点格式", "比较两个 9 位浮点格式可表示的值和舍入结果。"],
  ["浮点 C 表达式", "判断给定 int/float/double 表达式恒真、恒假或依赖条件。"],
  ["浮点宏", "用浮点常量和宏定义构造正无穷、负无穷与负零。"],
  ["浮点表达式的恒真性", "对给定 int、float、double 表达式逐项判断真伪并给出反例。"],
  ["show_bytes 实验", "编译运行 show_bytes，观察整数、浮点和指针的字节表示。"],
  ["数组元素字节", "扩展 show_bytes，打印数组元素并解释地址连续性。"],
  ["字节序检测", "实现 is_little_endian，返回当前机器是否为小端。"],
  ["生成全 1 字", "仅用给定类型宽度，构造所有位为 1 的 word。"],
  ["replace_byte", "实现 replace_byte(x,i,b)，将第 i 字节替换为 b。"],
  ["位模式判定", "分别判断任一位、任一最低字节、任一最高字节是否为 1。"],
  ["算术右移检测", "实现 int_shifts_are_arithmetic，判定本机 int 右移规则。"],
  ["逻辑/算术右移模拟", "只用算术右移实现逻辑右移，或反向模拟。"],
  ["奇数位测试", "实现 any_odd_one，判断任意奇数编号位是否为 1。"],
  ["奇偶校验", "实现 odd_ones，判断 x 中 1 的个数是否为奇数。"],
  ["最高位 1", "实现 leftmost_one，生成只保留最高有效 1 的掩码。"],
  ["int 宽度检测", "不用 sizeof，判断 int 是否恰为 32 位。"],
  ["低位掩码", "实现 lower_one_mask(n)，生成低 n 位为 1 的掩码。"],
  ["循环左移", "实现 rotate_left(x,n)，正确处理 n=0 和边界。"],
  ["可表示位数", "实现 fits_bits(x,n)，判断 x 能否由 n 位补码表示。"],
  ["字节符号扩展", "实现 xbyte(word,bytenum)，提取指定字节并符号扩展。"],
  ["int 复制", "解释并实现 copy_int，保证值复制不受指针别名影响。"],
  ["饱和加法", "实现 saturating_add，溢出时返回 Tmin 或 Tmax。"],
  ["减法溢出检测", "实现 tsub_ok，检测 x-y 是否发生补码溢出。"],
  ["无符号高位乘积", "由 signed_high_prod 推导 unsigned_high_prod。"],
  ["calloc 溢出", "实现安全 calloc：乘积溢出时不能分配错误大小。"],
  ["移位乘法化简", "将题给乘法表达式改写为只含移位与加减的形式。"],
  ["2 的幂除法", "实现 divide_power2，对负数按 C 的向零规则舍入。"],
  ["mul3div4", "实现 (x*3)/4，不能因 x*3 产生错误溢出。"],
  ["threefourths", "实现 x*3/4，并分别处理大数与负数。"],
  ["移位除法边界", "分析并修正对 Tmin 等边界值的移位除法实现。"],
  ["整数除法等价式", "找出将乘法与除法重排后不再等价的情况。"],
  ["无符号算术反例", "构造并解释无符号运算中看似自然但不成立的等式。"],
  ["补码乘法推导", "用高、低位乘积关系推导题给乘法结果。"],
  ["除以 2 的幂的边界", "分析 Tmin、负奇数等边界下的移位除法舍入。"],
  ["小型浮点编码", "由给定符号、阶码和尾数字段计算数值并比较编码。"],
  ["浮点精度", "确定给定浮点格式的相邻可表示数与舍入方向。"],
  ["浮点比较的位级条件", "推导在排除 NaN 后使用无符号位模式比较浮点数的条件。"],
  ["float 与 int 转换", "跟踪 float→int、int→float 转换的舍入、溢出和精度损失。"],
  ["float_le", "只用无符号整数操作实现浮点小于等于比较（非 NaN）。"],
  ["浮点精度界限", "求 float/double 能连续精确表示整数的最大范围。"],
  ["浮点指数函数", "实现 fpwr2(x)，返回 2.0^x 的单精度位级表示。"],
  ["float_negate", "实现浮点取负；NaN 必须原样返回。"],
  ["float_absval", "实现绝对值；NaN 必须原样返回。"],
  ["float_twice", "实现 2*f；正确处理非规格化、规格化、无穷与 NaN。"],
  ["float_half", "实现 0.5*f；正确处理向偶数舍入和非规格化。"],
  ["float_f2i", "实现 (int)f；NaN/溢出返回 0x80000000。"],
  ["float_i2f", "实现 (float)i 的位级表示，正确处理舍入。"]
];

function topicForExercise(number) {
  if (number <= 5) return "进制与字节序";
  if (number <= 16) return "位级运算";
  if (number <= 36) return "整数表示与运算";
  if (number <= 54) return "浮点表示与运算";
  if (number <= 69) return "C 位级编程";
  if (number <= 80) return "整数程序题";
  if (number <= 91) return "IEEE 754";
  return "浮点位级编程";
}
function answerPageForExercise(number) {
  if (number === 1) return 133;
  if (number <= 5) return 134;
  if (number <= 11) return 135;
  if (number <= 16) return 136;
  if (number <= 21) return 137;
  if (number <= 26) return 138;
  if (number <= 31) return 139;
  if (number <= 36) return 140;
  if (number <= 41) return 141;
  if (number <= 46) return 142;
  if (number <= 52) return 143;
  return 144;
}
const catalogExercises = catalogRows.map(([title, prompt], index) => {
  const number = index + 1;
  return { number, title, prompt, topic: topicForExercise(number), answerPage: number <= 54 ? answerPageForExercise(number) : null };
});

const keys = { checks: "ics-ch2-checks", answers: "ics-ch2-answers", outcomes: "ics-ch2-outcomes" };
let activeTopic = "全部";
let storedAnswers = readStore(keys.answers, {});
let outcomes = readStore(keys.outcomes, {});

function readStore(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function saveStore(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function normalize(value) {
  return value.trim().toLowerCase().replace(/[\s;，,。]/g, "").replace(/−/g, "-");
}
function isCorrect(question, value) {
  const candidate = normalize(value);
  return question.answers.some(answer => normalize(answer) === candidate);
}

function renderChecklist() {
  const checklist = document.querySelector("#checklist");
  const checks = readStore(keys.checks, {});
  checklist.replaceChildren(...studyItems.map((item, index) => {
    const label = document.createElement("label");
    label.className = "check-item";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = Boolean(checks[index]);
    input.addEventListener("change", () => { checks[index] = input.checked; saveStore(keys.checks, checks); });
    label.append(input, document.createTextNode(item));
    return label;
  }));
}

function renderFilters() {
  const filters = document.querySelector("#filters");
  const topics = ["全部", ...new Set(questions.map(question => question.topic))];
  filters.replaceChildren(...topics.map(topic => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-button";
    button.textContent = topic;
    button.setAttribute("aria-pressed", String(topic === activeTopic));
    button.addEventListener("click", () => { activeTopic = topic; renderFilters(); renderQuestions(); });
    return button;
  }));
}

function renderQuestions() {
  const host = document.querySelector("#questions");
  const template = document.querySelector("#question-template");
  const shown = questions.filter(question => activeTopic === "全部" || question.topic === activeTopic);
  document.querySelector("#visible-count").textContent = `显示 ${shown.length} 道题`;
  host.replaceChildren(...shown.map((question, index) => createQuestion(question, index)));
}

function renderCatalog() {
  const host = document.querySelector("#catalog");
  const template = document.querySelector("#catalog-template");
  document.querySelector("#catalog-count").textContent = `共 ${catalogExercises.length} 题`;
  host.replaceChildren(...catalogExercises.map(exercise => {
    const card = template.content.firstElementChild.cloneNode(true);
    card.querySelector(".catalog-number").textContent = `2.${exercise.number}`;
    card.querySelector(".catalog-title").textContent = exercise.title;
    card.querySelector(".catalog-prompt").textContent = exercise.prompt;
    card.querySelector(".catalog-kind").textContent = exercise.topic;
    const button = card.querySelector(".reference-button");
    const reference = card.querySelector(".reference");
    button.textContent = exercise.answerPage ? "查看课本标准答案" : "查看参考实现";
    button.addEventListener("click", () => {
      const isHidden = reference.hidden;
      reference.hidden = !isHidden;
      button.textContent = isHidden ? "收起" : (exercise.answerPage ? "查看课本标准答案" : "查看参考实现");
      if (!isHidden || reference.childElementCount) return;
      if (exercise.answerPage) {
        const note = document.createElement("p");
        note.textContent = `下面是课本“练习题答案”第 ${exercise.answerPage - 36} 页的原始答案扫描。该页可能还包含相邻题号；请按本卡片题号核对。`;
        const image = document.createElement("img");
        image.src = `assets/answer-key/chapter2-answer-${exercise.answerPage}.jpg`;
        image.alt = `课本第二章练习题答案，第 ${exercise.answerPage - 36} 页`;
        reference.append(note, image);
      } else {
        const note = document.createElement("p");
        note.textContent = "这是代码设计或开放推导题，不以单行答案判错。参考实现应满足题干的输入范围、特殊值和溢出/舍入规则；先自行实现与测试，再对照完整参考实现。";
        const link = document.createElement("a");
        link.href = `https://dreamanddead.github.io/CSAPP-3e-Solutions/chapter2/2.${exercise.number}/`;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.textContent = `打开练习 2.${exercise.number} 的可运行参考实现`;
        reference.append(note, link);
      }
    });
    return card;
  }));
}

function createQuestion(question, index) {
  const card = document.querySelector("#question-template").content.firstElementChild.cloneNode(true);
  card.querySelector(".question-number").textContent = `第 ${String(index + 1).padStart(2, "0")} 题`;
  card.querySelector(".topic-tag").textContent = question.topic;
  card.querySelector(".source-tag").textContent = question.source;
  card.querySelector(".question-title").textContent = question.title;
  card.querySelector(".question-prompt").textContent = question.prompt;
  const code = card.querySelector(".question-code");
  if (question.code) { code.hidden = false; code.querySelector("code").textContent = question.code; }

  const input = card.querySelector(".answer-input");
  const button = card.querySelector(".check-button");
  const result = card.querySelector(".result");
  const explanation = card.querySelector(".explanation");
  input.value = storedAnswers[question.id] ?? "";
  card.querySelector(".correct-answer").textContent = question.display;
  card.querySelector(".explanation-text").textContent = question.explanation;

  const check = () => {
    const value = input.value;
    storedAnswers[question.id] = value;
    saveStore(keys.answers, storedAnswers);
    if (!normalize(value)) {
      result.textContent = "请先输入答案。";
      result.className = "result incorrect";
      explanation.hidden = true;
      return;
    }
    if (isCorrect(question, value)) {
      outcomes[question.id] = "correct";
      result.textContent = "回答正确。";
      result.className = "result correct";
      explanation.hidden = true;
    } else {
      outcomes[question.id] = "incorrect";
      result.textContent = "这次不对，查看解析后再试一次。";
      result.className = "result incorrect";
      explanation.hidden = false;
    }
    saveStore(keys.outcomes, outcomes);
    updateScore();
  };
  button.addEventListener("click", check);
  input.addEventListener("keydown", event => { if (event.key === "Enter") check(); });
  return card;
}

function updateScore() {
  const correct = questions.filter(question => outcomes[question.id] === "correct").length;
  document.querySelector("#score").textContent = `${correct} / ${questions.length}`;
  document.querySelector("#score-detail").textContent = correct === 0 ? "开始第一题吧" : correct === questions.length ? "第二章核心题已完成" : `还差 ${questions.length - correct} 道`;
}

document.querySelector("#reset-progress").addEventListener("click", () => {
  if (!window.confirm("清空所有答题记录和已输入答案？学习清单会保留。")) return;
  storedAnswers = {};
  outcomes = {};
  saveStore(keys.answers, storedAnswers);
  saveStore(keys.outcomes, outcomes);
  renderQuestions();
  updateScore();
});

renderChecklist();
renderFilters();
renderQuestions();
renderCatalog();
updateScore();
