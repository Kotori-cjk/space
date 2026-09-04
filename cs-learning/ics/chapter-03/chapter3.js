const studyItems = [
  "AT&T 操作数顺序与寄存器", "数据传送、扩展与 leaq", "条件码、跳转与条件传送", "循环与 switch 的反编译",
  "过程调用约定与栈帧", "数组、指针与矩阵寻址", "结构体、联合体与对齐", "浮点寄存器与调用约定"
];

const questions = [
  { id: "c3q01", topic: "寄存器", source: "icsnote", title: "整数返回值", prompt: "按 x86-64 System V 调用约定，整数/指针返回值放在哪个 64 位寄存器？", answers: ["%rax", "rax"], display: "%rax", explanation: "整数和指针的返回值使用 %rax；浮点返回值才使用 %xmm0。" },
  { id: "c3q02", topic: "寄存器", source: "icsnote", title: "第四个整型参数", prompt: "按 x86-64 System V 调用约定，第四个整型/指针参数放在哪个寄存器？", answers: ["%rcx", "rcx"], display: "%rcx", explanation: "前六个整型/指针参数依次是 %rdi、%rsi、%rdx、%rcx、%r8、%r9。" },
  { id: "c3q03", topic: "调用约定", source: "icsnote", title: "调用者保存寄存器", prompt: "下列寄存器中，哪个是调用者保存寄存器：%rbx 还是 %r10？", answers: ["%r10", "r10"], display: "%r10", explanation: "%r10、%r11 属于调用者保存；%rbx、%rbp、%r12–%r15 属于被调用者保存。" },
  { id: "c3q04", topic: "数据传送", source: "icsnote", title: "movl 的高位", prompt: "执行 movl 写入 64 位寄存器的低 32 位后，高 32 位会被置为什么？", answers: ["0", "零", "全0"], display: "0", explanation: "写入 32 位寄存器会自动将同一 64 位寄存器的高 32 位清零。" },
  { id: "c3q05", topic: "寻址", source: "练习题 3.6", title: "leaq 不读内存", prompt: "leaq 7(%rax,%rax,8), %rdx 在 x=%rax 时计算出的值是什么？", answers: ["7+9x", "9x+7"], display: "7 + 9x", explanation: "有效地址为 D(Rb,Ri,S)=D+Rb+S×Ri，因此是 7+x+8x。" },
  { id: "c3q06", topic: "条件码", source: "icsnote", title: "cmp 的计算", prompt: "指令 cmpq S1, S2 为设置条件码而计算哪个表达式？", answers: ["s2-s1", "S2-S1"], display: "S2 - S1", explanation: "AT&T 语法中源操作数在前：cmp 只计算 S2-S1 并更新条件码，不保存结果。" },
  { id: "c3q07", topic: "条件码", source: "icsnote", title: "TEST 的含义", prompt: "指令 testq S1, S2 为设置条件码而计算哪个表达式？", answers: ["s2&s1", "s1&s2", "S2&S1"], display: "S2 & S1", explanation: "TEST 执行按位与但不保存结果，常用于测试零值或掩码位。" },
  { id: "c3q08", topic: "条件跳转", source: "icsnote", title: "有符号大于", prompt: "有符号条件跳转 jg 成立时，ZF 与 SF/OF 应满足什么？", answers: ["zf=0且sf=of", "zf=0andsf=of", "ZF=0 且 SF=OF"], display: "ZF = 0 且 SF = OF", explanation: "jg 表示有符号大于：非零且没有符号溢出造成的比较方向翻转。" },
  { id: "c3q09", topic: "条件跳转", source: "icsnote", title: "无符号高于", prompt: "无符号条件跳转 ja 成立时，CF 与 ZF 应满足什么？", answers: ["cf=0且zf=0", "cf=0andzf=0", "CF=0 且 ZF=0"], display: "CF = 0 且 ZF = 0", explanation: "ja/above 使用无符号条件码：既无借位/进位，也不相等。" },
  { id: "c3q10", topic: "调用约定", source: "icsnote", title: "寄存器参数数目", prompt: "x86-64 System V 最多用多少个寄存器传递整型/指针参数？", answers: ["6", "六"], display: "6", explanation: "前六个使用 %rdi、%rsi、%rdx、%rcx、%r8、%r9；其余参数经栈传递。" },
  { id: "c3q11", topic: "调用约定", source: "icsnote", title: "第七个参数", prompt: "整型/指针参数多于六个时，第七个参数通过哪里传递？", answers: ["栈", "stack"], display: "栈", explanation: "第七个及其后的参数由调用者放在栈上的参数构造区。" },
  { id: "c3q12", topic: "过程调用", source: "icsnote", title: "callq 的栈动作", prompt: "callq 执行时压入栈顶的是什么？", answers: ["返回地址", "return address", "下一条指令地址"], display: "紧随 call 的下一条指令地址", explanation: "call 把返回地址压栈后跳到目标；ret 再从栈顶取出该地址。" },
  { id: "c3q13", topic: "过程调用", source: "icsnote", title: "ret 的作用", prompt: "ret 指令从栈顶弹出什么并跳转到那里？", answers: ["返回地址", "return address"], display: "返回地址", explanation: "ret 取出栈顶保存的返回地址，并将其装入程序计数器。" },
  { id: "c3q14", topic: "结构体", source: "对齐规则", title: "结构体总大小", prompt: "在 x86-64 下，struct { char c; int i; short s; } 的总大小（字节）是多少？", answers: ["12"], display: "12", explanation: "c 位于偏移 0；为 i 填充到偏移 4，i 占 4 字节，s 位于偏移 8；末尾再填充到最大对齐 4 的倍数，总计 12。" },
  { id: "c3q15", topic: "汇编", source: "练习题 3.11", title: "异或清零", prompt: "xorl %eax, %eax 执行后，%rax 的值是多少？", answers: ["0", "零"], display: "0", explanation: "x^x 恒为 0；又因为写 %eax 会零扩展到 %rax，所以整个 %rax 为 0。" }
];

const catalogRows = [
  ["操作数形式", "根据寄存器、立即数和内存操作数写出值与类型。"], ["指令后缀", "为给定 mov 指令确定合适的 b/w/l/q 后缀。"], ["非法传送指令", "找出给定汇编中操作数类型、大小或内存到内存传送错误。"], ["数据传送与类型", "为给定 src_t/dst_t 选择正确的数据传送与扩展指令。"], ["逆向三变量赋值", "由内存读写汇编恢复 C 中 x、y、z 的赋值关系。"], ["leaq 地址计算", "计算给定 leaq 指令的算术结果。"], ["leaq 组合算术", "由多条 leaq 指令恢复 C 表达式。"], ["算术指令效果", "跟踪给定算术/逻辑指令的目的位置与结果。"], ["移位计数", "解释为何可用 %cl 指定移位量并恢复函数语义。"], ["基本算术反编译", "将简单算术汇编恢复为 C 语句序列。"],
  ["清零寄存器", "解释 xorl reg,reg 与 mov $0,reg 的结果和代码长度差异。"], ["无符号除法", "由 divq 调用约定恢复商和余数的存储过程。"], ["CMP 的类型推断", "由比较指令后缀与跳转条件推断数据类型。"], ["TEST 的类型推断", "由 test/条件码推断有符号或无符号比较类型。"], ["PC 相对跳转", "根据指令字节与位移计算条件、无条件跳转目标。"], ["短路条件", "从汇编控制流恢复含指针检查的 C 短路逻辑。"], ["if 的 goto 翻译", "比较两种 if→goto 翻译规则及无 else 时的选择。"], ["嵌套条件", "由分支汇编补全嵌套 if/else 中缺失表达式。"], ["分支预测", "计算预测错误的代价并解释条件分支的影响。"], ["条件传送除法", "解释 cmov 如何选择负数除法所需的偏置。"],
  ["条件传送嵌套分支", "恢复由 cmov 实现的嵌套条件代码。"], ["阶乘溢出", "确定 int/long 阶乘首次溢出的 n 并解释检测方法。"], ["循环的优化", "由优化后的循环汇编恢复变量和循环不变式。"], ["while 循环", "从跳转到中间的汇编恢复 while 循环。"], ["guarded-do", "恢复 guarded-do 翻译的循环并解释优化差异。"], ["位奇偶性循环", "由移位和异或循环恢复其计算的位级性质。"], ["goto 阶乘", "将 goto 风格阶乘程序转写为结构化循环。"], ["位反转循环", "解释 64 次迭代如何构造输入的位镜像。"], ["for 与 continue", "修复 naïve for→while 翻译中 continue 导致的无限循环。"], ["switch 跳转表", "由跳转表推断 case 范围、默认分支与合并分支。"],
  ["switch 反编译", "根据跳转表与分支块补全 C switch。"], ["过程调用跟踪", "跟踪 call/ret、寄存器与栈的状态变化。"], ["混合大小参数", "由寄存器和访存宽度推断函数参数及指针类型。"], ["被调用者保存", "分析递归函数中保存寄存器与局部变量的栈布局。"], ["递归过程", "由递归汇编恢复基例、递归调用和返回表达式。"], ["数组元素大小", "由索引缩放与数组总大小确定元素类型、大小和地址。"], ["short 数组", "完成 short 数组表达式、地址、值和汇编语句表。"], ["矩阵寻址", "由 leaq 和比例因子推导二维数组的行列数量。"], ["多维数组地址", "按行优先公式计算指定数组元素地址。"], ["对角线赋值优化", "解释优化后的对角线遍历及步长来源。"],
  ["嵌套结构体", "确定结构体字段偏移、总大小并恢复字段访问代码。"], ["链表求和", "由遍历汇编恢复链表节点布局和求和函数。"], ["联合体成员", "根据访问表达式和汇编确定 union 成员类型与偏移。"], ["结构体布局", "完成多个结构体的字段偏移、总大小和对齐表。"], ["重排字段", "重排字段以减少填充，给出新的布局和总大小。"], ["缓冲区溢出", "追踪 get_line 后的栈状态，并分析覆盖返回地址的后果。"], ["ASLR 与 nop sled", "估计地址随机化范围及覆盖 nop sled 所需尝试次数。"], ["栈保护器", "比较有/无 canary 的栈布局并解释保护效果。"], ["alloca 对齐", "分析动态栈分配、向下对齐和局部数组地址。"], ["浮点转换代码", "由 SSE/AVX 转换指令确定变量的读写类型。"],
  ["转换指令选择", "为给定 src_t/dst_t 选择浮点/整数转换指令。"], ["浮点参数传递", "按 ABI 确定混合整型与浮点参数使用的寄存器。"], ["浮点签名推断", "由 XMM 与通用寄存器操作推断函数参数类型。"], ["浮点表达式反编译", "逐条解释转换、乘法、除法并恢复 C 表达式。"], ["浮点常数", "从常量位模式与 XMM 操作识别绝对值、负号和零。"], ["浮点比较", "解释 NaN 下的条件码与 jp 等条件跳转。"], ["浮点条件分支", "由浮点比较汇编恢复带条件的 C 函数。"],
  ["decode2 反编译", "根据给定 decode2 汇编写出等价的 C 函数。"], ["128 位乘法", "解释三个乘法如何实现两个有符号 64 位数的 128 位乘积。"], ["位掩码循环", "由 loop 汇编恢复其位测试、累积和循环终止逻辑。"], ["cread_alt 条件传送", "写出与 cread 等价、可编译为条件传送而非跳转的 C 函数。"], ["switch3 逆向工程", "依据图 3-52 的汇编补全枚举 switch3 的各 case 与 default。"], ["switch_prob 跳转表", "根据跳转表地址和反汇编代码补全 switch_prob 的 C 主体。"],
  ["三维数组寻址", "扩展三维数组地址公式，并由汇编求出 R、S、T。"], ["矩阵转置维度", "由转置循环的指针步长和边界条件确定矩阵维度 M。"], ["变长矩阵列和", "由 sum_col 汇编反推 NR(n) 与 NC(n) 的定义。"],
  ["结构体传参与返回", "分析 process/eval 的栈帧，说明结构体参数与返回值如何传递。"], ["结构体数组布局", "由 setVal 的字段偏移推断 A、B 以及两个结构体布局。"], ["受限声明反推", "由目标文件反汇编确定 CNT 和 a_struct 的完整声明。"], ["联合体链表访问", "求 union ele 的字段偏移和大小，并补全 proc 中缺失表达式。"], ["good_echo", "实现能处理任意长度输入行、并检查错误条件的 good_echo。"], ["alloca 变长栈帧", "根据 aframe 的 C 代码和汇编分析帧指针、alloca 与局部数组布局。"], ["浮点范围：条件跳转", "用一次浮点比较和条件跳转编写与 find_range 等价的汇编。"], ["浮点范围：条件传送", "用一次浮点比较和条件传送编写与 find_range 等价的汇编。"], ["C99 复数调用", "根据 complex 示例函数说明复数参数和返回值的调用约定。"]
];

function topicForExercise(n) { if (n <= 15) return "数据传送与寻址"; if (n <= 31) return "控制流"; if (n <= 40) return "过程与数组"; if (n <= 49) return "数据结构与栈"; if (n <= 57) return "浮点代码"; return "综合/编程题"; }
function answerPageForExercise(n) {
  if (n <= 2) return 262;
  if (n <= 5) return 263;
  if (n <= 10) return 264;
  if (n <= 15) return 265;
  if (n <= 18) return 266;
  if (n <= 22) return 267;
  if (n <= 25) return 268;
  if (n <= 29) return 269;
  if (n <= 31) return 270;
  if (n <= 35) return 271;
  if (n <= 40) return 272;
  if (n <= 42) return 273;
  if (n <= 44) return 274;
  if (n <= 46) return 275;
  if (n <= 51) return 276;
  if (n <= 56) return 277;
  return 278;
}
const catalogExercises = catalogRows.map(([title, prompt], index) => { const number = index + 1; return { number, title, prompt, topic: topicForExercise(number), answerPage: number <= 57 ? answerPageForExercise(number) : null }; });

const keys = { checks: "ics-ch3-checks", answers: "ics-ch3-answers", outcomes: "ics-ch3-outcomes" };
let activeTopic = "全部";
let storedAnswers = readStore(keys.answers, {});
let outcomes = readStore(keys.outcomes, {});
function readStore(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function saveStore(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function normalize(value) { return value.trim().toLowerCase().replace(/[\s;，,。%]/g, "").replace(/−/g, "-"); }
function isCorrect(question, value) { const candidate = normalize(value); return question.answers.some(answer => normalize(answer) === candidate); }

function renderChecklist() { const host = document.querySelector("#checklist"); const checks = readStore(keys.checks, {}); host.replaceChildren(...studyItems.map((item, index) => { const label = document.createElement("label"); label.className = "check-item"; const input = document.createElement("input"); input.type = "checkbox"; input.checked = Boolean(checks[index]); input.addEventListener("change", () => { checks[index] = input.checked; saveStore(keys.checks, checks); }); label.append(input, document.createTextNode(item)); return label; })); }
function renderFilters() { const host = document.querySelector("#filters"); const topics = ["全部", ...new Set(questions.map(q => q.topic))]; host.replaceChildren(...topics.map(topic => { const button = document.createElement("button"); button.type = "button"; button.className = "filter-button"; button.textContent = topic; button.setAttribute("aria-pressed", String(topic === activeTopic)); button.addEventListener("click", () => { activeTopic = topic; renderFilters(); renderQuestions(); }); return button; })); }
function renderQuestions() { const host = document.querySelector("#questions"); const template = document.querySelector("#question-template"); const shown = questions.filter(q => activeTopic === "全部" || q.topic === activeTopic); document.querySelector("#visible-count").textContent = `显示 ${shown.length} 道题`; host.replaceChildren(...shown.map((question, index) => createQuestion(question, index))); }
function createQuestion(question, index) { const card = document.querySelector("#question-template").content.firstElementChild.cloneNode(true); card.querySelector(".question-number").textContent = `第 ${String(index + 1).padStart(2, "0")} 题`; card.querySelector(".topic-tag").textContent = question.topic; card.querySelector(".source-tag").textContent = question.source; card.querySelector(".question-title").textContent = question.title; card.querySelector(".question-prompt").textContent = question.prompt; const input = card.querySelector(".answer-input"); const button = card.querySelector(".check-button"); const result = card.querySelector(".result"); const explanation = card.querySelector(".explanation"); input.value = storedAnswers[question.id] ?? ""; card.querySelector(".correct-answer").textContent = question.display; card.querySelector(".explanation-text").textContent = question.explanation; const check = () => { const value = input.value; storedAnswers[question.id] = value; saveStore(keys.answers, storedAnswers); if (!normalize(value)) { result.textContent = "请先输入答案。"; result.className = "result incorrect"; explanation.hidden = true; return; } if (isCorrect(question, value)) { outcomes[question.id] = "correct"; result.textContent = "回答正确。"; result.className = "result correct"; explanation.hidden = true; } else { outcomes[question.id] = "incorrect"; result.textContent = "这次不对，查看解析后再试一次。"; result.className = "result incorrect"; explanation.hidden = false; } saveStore(keys.outcomes, outcomes); updateScore(); }; button.addEventListener("click", check); input.addEventListener("keydown", event => { if (event.key === "Enter") check(); }); return card; }
function renderCatalog() { const host = document.querySelector("#catalog"); const template = document.querySelector("#catalog-template"); document.querySelector("#catalog-count").textContent = `共 ${catalogExercises.length} 题`; host.replaceChildren(...catalogExercises.map(exercise => { const card = template.content.firstElementChild.cloneNode(true); card.querySelector(".catalog-number").textContent = `3.${exercise.number}`; card.querySelector(".catalog-title").textContent = exercise.title; card.querySelector(".catalog-prompt").textContent = exercise.prompt; card.querySelector(".catalog-kind").textContent = exercise.topic; const button = card.querySelector(".reference-button"); const reference = card.querySelector(".reference"); button.textContent = exercise.answerPage ? "查看课本标准答案" : "查看参考实现"; button.addEventListener("click", () => { const isHidden = reference.hidden; reference.hidden = !isHidden; button.textContent = isHidden ? "收起" : (exercise.answerPage ? "查看课本标准答案" : "查看参考实现"); if (!isHidden || reference.childElementCount) return; const note = document.createElement("p"); if (exercise.answerPage) { note.textContent = `下面是课本“练习题答案”中包含 3.${exercise.number} 附近题号的原始答案扫描；请按本卡片题号核对。`; const image = document.createElement("img"); image.src = `assets/chapter3-answer/chapter3-answer-${exercise.answerPage}.jpg`; image.alt = `课本第三章练习题答案，第 ${exercise.answerPage - 36} 页`; reference.append(note, image); } else { note.textContent = "这是汇编编写、代码设计或开放推导题，不以单行答案判错。请先完成题目所要求的函数/汇编与边界测试，再对照参考实现。"; const link = document.createElement("a"); link.href = `https://dreamanddead.github.io/CSAPP-3e-Solutions/chapter3/3.${exercise.number}/`; link.target = "_blank"; link.rel = "noreferrer"; link.textContent = `打开练习 3.${exercise.number} 的参考实现`; reference.append(note, link); } }); return card; })); }
function updateScore() { const correct = questions.filter(q => outcomes[q.id] === "correct").length; document.querySelector("#score").textContent = `${correct} / ${questions.length}`; document.querySelector("#score-detail").textContent = correct === 0 ? "开始第一题吧" : correct === questions.length ? "第三章核心题已完成" : `还差 ${questions.length - correct} 道`; }
document.querySelector("#reset-progress").addEventListener("click", () => { if (!window.confirm("清空第三章所有答题记录和已输入答案？学习清单会保留。")) return; storedAnswers = {}; outcomes = {}; saveStore(keys.answers, storedAnswers); saveStore(keys.outcomes, outcomes); renderQuestions(); updateScore(); });
renderChecklist(); renderFilters(); renderQuestions(); renderCatalog(); updateScore();
