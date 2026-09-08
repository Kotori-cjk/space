const strategies = [
  { id: 'truth', tag: 'BOOLEAN', title: '真值表合成', short: '每一位都是一个小逻辑门', when: '需求说的是“同时”“至少一个”“不同”“相等”这类逐位关系。', chain: ['把一句话写成单个位的 0/1 表。', '观察哪些输入组合应产生 1。', '再用 AND、OR、NOT、XOR 等组合覆盖这些组合。'], watch: '不要先盯着整数字面值；先只研究第 i 位。' },
  { id: 'select', tag: 'SELECT', title: '掩码选择', short: '让 0 / 全 1 掩码充当开关', when: '一个整体条件决定保留“方案 A”还是“方案 B”。', chain: ['先把条件正规化为 0 或 1。', '扩展成全 0 或全 1 的选择掩码。', 'A 只在掩码为 1 时留下，B 只在补掩码为 1 时留下。'], watch: '一个普通的 0/1 不能直接逐位选择整字，先把它扩展成一整片掩码。' },
  { id: 'field', tag: 'FIELD', title: '字段搬运', short: '选中 → 对齐 → 放回', when: '只读、清除、替换或交换某一个字节 / 字段。', chain: ['画出字段的起点和宽度。', '用宽度相同的全 1 掩码选中它。', '移到低位处理；放回前先清出目标位置。'], watch: '字段外的位是最重要的不变量：最终必须保持原样。' },
  { id: 'shift', tag: 'MOVE', title: '移动后清理', short: '移位不等于你想要的移动', when: '需求涉及对齐、缩放、取高位，或右移后的补位规则。', chain: ['先确认算术含义还是纯位串含义。', '写清移动后哪些位置必须补 0，哪些要保留符号。', '若硬件操作多留下了位，用掩码清理。'], watch: '检查移位量 0 和接近字长的情况；不要默认右移就是逻辑右移。' },
  { id: 'neighbor', tag: 'RELATION', title: '邻位关系', short: '先标记关系，再扩散影响', when: '一个位是否改变取决于它的左邻、右邻或固定距离的伙伴。', chain: ['用移动副本把相关位置对齐。', '用逐位 AND / XOR 标出满足关系的位置。', '把标记移回受影响的位置，最后合并。'], watch: '画 5 到 8 位的小例子，确认“左 / 右”与位编号方向没有颠倒。' },
  { id: 'count', tag: 'COUNT', title: '分层定位 / 计数', short: '用 16 → 8 → 4 … 缩小范围', when: '需要找第一处变化、前缀长度、最高有效位或连续段。', chain: ['先问大半区是否全满足条件。', '满足则累积该块大小，并把下一个候选区移到高位。', '重复二分，最后处理最小单元与全满足特例。'], watch: '全 0、全 1 和“变化刚好在块边界”必须单独演练。' },
  { id: 'compare', tag: 'SIGNED', title: '符号分类再比较', short: '异号时不要做危险的减法', when: '需求是有符号大小关系、同号判断或不等关系。', chain: ['先提取符号并把输入分成同号 / 异号。', '异号时，符号本身已经决定顺序。', '同号时才分析差值或等价条件。'], watch: '相等是独立边界；“差值非负”不自动等于“严格大于”。' },
  { id: 'overflow', tag: 'RANGE', title: '溢出守卫', short: '比较运算前后的符号关系', when: '先做加减或倍增，再根据是否越界选择结果。', chain: ['写出数学运算会经过哪些中间值。', '用操作数与结果的符号关系判断是否越界。', '先构造正常结果和替代结果，最后用掩码选择。'], watch: '最小负数没有普通的相反数；所有最大 / 最小值都要亲自代入。' },
  { id: 'round', tag: 'ROUND', title: '商、余数与偏置', short: '先拆整除部分，再决定小数部分', when: '需要按 2 的幂缩小并要求“向 0”或特定舍入。', chain: ['把数分成高位商和低位余数。', '商先按移位得到；余数保留用于判断误差。', '仅在需要时对特定符号加偏置，再合并贡献。'], watch: '负数右移通常向负无穷靠近，不等于向 0；恰好一半要按规则检查。' },
  { id: 'float', tag: 'FLOAT', title: '拆包、分类、再封包', short: '符号 / 阶码 / 尾数分开思考', when: '输入是 IEEE 754 位表示，目标是缩放、转换或分类。', chain: ['先拆出 sign、exp、frac 三段。', '区分零、非规格化、规格化、无穷 / NaN。', '对每一类做变换、处理舍入，再按字段装回。'], watch: '阶码临界值会跨过规格化边界；舍入可能让尾数进位并推高阶码。' }
];

const methodExamples = { truth: { title: '三路传感器投票位', prompt: '每一位代表一个房间：三路传感器中至少两路报警时，该位才置 1。先写单个位的真值表。', hint: '把“至少两路”拆成三种“两两同时为 1”的情况，再思考如何合并。' }, select: { title: '优先级配置混合', prompt: '两张掩码 P、Q 决定每一位优先取配置 A、B 或默认 C；P 优先于 Q。', hint: '先写 P=1、P=0且Q=1、两者都为0 三种区域，再为每个候选字分配区域。' }, field: { title: '状态字中的温度字段', prompt: '一个 16 位状态字的第 5–9 位要替换为新读数，其他位原样返回。', hint: '分成“清空目标区域”和“新字段对齐并放回”，最后检查字段外不变量。' }, shift: { title: '无符号采样窗', prompt: '一串 12 位采样值要右移 k 位，左边补 0；底层只能提供带符号右移。', hint: '先预测带符号右移会多出什么，再反过来为这些多出的位设计清理掩码。' }, neighbor: { title: '灯带中的孤立亮点', prompt: '保留没有相邻亮灯的 1，清掉属于连续段的亮灯。', hint: '移动副本把左右邻居对齐；先得到“有邻居”的位置标记，再处理原位。' }, count: { title: '有效前缀定位', prompt: '找最高位开始连续为 0 的长度，不能线性扫描。', hint: '把“高半区是否全 0”当成一次决策，随后把候选区缩到 16、8、4…位。' }, compare: { title: '双阈值报警', prompt: '判断有符号读数是否严格落在两个阈值之间，阈值可能异号。', hint: '先让每次比较按同号 / 异号分类，别把可能溢出的差值当成唯一依据。' }, overflow: { title: '饱和增益', prompt: '读数经固定倍增后若越界，输出同方向的边界值。', hint: '写下未越界时输入与中间结果必须保持的符号关系，再准备正常与边界两类候选。' }, round: { title: '负数分频器', prompt: '采样值按 16 缩小后要求朝 0 截断，且不能让先倍增的中间量溢出。', hint: '把高位商和低位余数拆开；余数只在需要修正负数截断方向时参与。' }, float: { title: '浮点位模式缩放', prompt: '输入是单精度位模式，要缩放并在极小值处保持 IEEE 754 语义。', hint: '先拆 sign / exp / frac，再按零、非规格化、规格化、特殊值分支思考。' } };
const practices = [
  { topic: '真值表', title: '设备状态字：给每一位写一个“差异指示灯”', prompt: '两个 8 位传感器快照到来。某一位只有在两次读数不同才亮灯。先不写表达式，第一步怎么做？', correct: 'truth', options: ['列出单个位的四种输入组合，标出哪些组合应该亮。', '先把整个字转换成十进制，再比较大小。', '先判断两次快照是否完全相等。', '从最高位向最低位逐个累加。'], skeleton: '目标是逐位“不同”。先完成一个 bit 的真值表；该表再被同一个逻辑运算并行复制到所有位。边界用完全相同、完全相反和只有一位不同的快照验证。' },
  { topic: '掩码选择', title: '通信帧：根据单个开关选择整段默认配置', prompt: '一个配置位决定采用蓝色配置字还是橙色配置字，两个配置字都要逐位完整保留。第一步怎么建模？', correct: 'select', options: ['把该配置位扩展为全 0 或全 1 的字掩码，再分支保留。', '把两个配置字相加，开关为 0 时再减去。', '只取配置位所在的那一位，其他位自然会保留。', '先反转两个配置字以避免冲突。'], skeleton: '一个 bit 只能表达“是 / 否”，而不是直接携带整字。先构造覆盖整字的选择掩码，再让两个候选字在互补区域通过；全 0 与全 1 是必测边界。' },
  { topic: '字段操作', title: '状态包：只替换中间的 3 位模式，其余位不许动', prompt: '你需要把一个状态字中央的 3 位替换为新模式，但标题位和保留位必须保持原样。分析的起点是什么？', correct: 'field', options: ['先画出这 3 位的范围，构造该宽度的掩码。', '直接把新模式与旧状态字做 OR。', '把整个状态字右移到最低位后直接返回。', '先检查旧状态字的正负。'], skeleton: '把任务分为“清出目标字段”和“新字段对齐后放回”。不变量是字段外的位与原状态字相同；测试字段位于最低端、最高端以及新模式全 0 的情形。' },
  { topic: '移动与补位', title: '协议窗口：右移后左侧必须全为 0', prompt: '一个无符号标志串要右移若干位，左端无论原来是什么都必须补 0。面对可能带符号的机器整数，先检查什么？', correct: 'shift', options: ['先确认底层右移会不会复制符号，再为左端设计清理掩码。', '只要使用右移，左端一定会补 0。', '先把数和 0 做 XOR。', '先统计所有 1 的个数。'], skeleton: '先区分数值意义与位串意义。若底层把最高位向右复制，就不能直接相信结果；验证最高位为 1、移位量为 0，以及接近字长的情况。' },
  { topic: '邻位关系', title: '灯带清理：连续点亮的灯都应被标记', prompt: '一条二进制灯带中，任一盏灯只要与相邻灯同时亮，就需要被标记。你最先应构造什么？', correct: 'neighbor', options: ['把灯带移动一格得到对齐副本，用它标记“相邻同时为 1”的位置。', '将灯带转成十进制并检查是否为偶数。', '只提取最高位，因为它决定灯带。', '为每一盏灯都编写一个条件分支。'], skeleton: '先用移动把“邻居”对到同一列，再逐位得到关系标记；随后把标记扩散回两端。用只有一个 1、恰有一对相邻 1、长串 1 和端点相邻情况检验方向。' },
  { topic: '分层定位', title: '前缀协议：寻找开头连续保持“有效”的位段', prompt: '一个 32 位有效标记中，要知道从最高位开始连续满足条件的长度。禁止线性扫描时，哪种思路最稳？', correct: 'count', options: ['先检查高 16 位整体，再检查 8、4、2、1 位，逐层缩小范围。', '把所有位相加后除以 32。', '只检查最高位和最低位。', '先把该数取反并直接返回。'], skeleton: '这不是“数一数”，而是“定位第一次变化”。每次确定一个 2 的幂大小的块是否完全满足，并把候选区移到高位；必须单测全满足与全不满足。' },
  { topic: '有符号比较', title: '温度差：先判断两个补码数是否一正一负', prompt: '需要判断两个有符号测量值的大小。直接计算差值在极值处可能越界。第一步优先怎样分支？', correct: 'compare', options: ['先按符号相同 / 不同分类；异号时直接由符号决定顺序。', '始终只看相减结果的符号。', '先把两个数按位 OR。', '只判断最低位是否相同。'], skeleton: '异号比较不需要做减法：正数必大于负数。同号时才有资格使用差值关系，并需要把相等单独排除；最小负数、最大正数和相等值都是必测点。' },
  { topic: '范围保护', title: '增益控制：倍增后若超出表示范围就钳在边界', prompt: '一个有符号传感器读数要经过固定倍增；如果越出可表示范围，必须输出对应方向的边界值。分析时，最可靠的溢出证据是什么？', correct: 'overflow', options: ['比较操作数与中间结果的符号关系，再用掩码在正常值和边界值间选择。', '只要结果的最低位为 0，就一定没有溢出。', '把结果取反即可恢复到范围内。', '先忽略边界值，通常输入不会到那里。'], skeleton: '先写清“未越界时，哪些符号关系必须保持”。构造正常结果与正、负两个边界候选后，选择掩码使它们互斥通过；最大正数、最小负数和刚刚越界的输入必须亲测。' },
  { topic: '范围与舍入', title: '压缩采样：缩小后必须朝 0 截断', prompt: '有符号读数按 8 缩小后要求朝 0 截断。直接右移会在负数上偏向更小的数。你首先要保留哪一部分信息？', correct: 'round', options: ['把商和低位余数分开；余数决定是否需要对负数加偏置。', '只保留最高位，因为其余位都会丢弃。', '先对整个数取反再右移。', '仅测试正数，负数规律相同。'], skeleton: '移位给出主体商，低位余数告诉你是否存在被截断的小数。对负数先加与移位宽度相关的偏置可朝 0 修正；要测可整除、不可整除和恰好临界余数。' },
  { topic: '浮点字段', title: '读数缩放：输入是 IEEE 754 位模式，不是普通整数', prompt: '你拿到的是一个单精度浮点数的位模式，要完成一次缩放。哪些类型绝不能用同一条规则草率处理？', correct: 'float', options: ['先拆 sign、exp、frac，并区分零、非规格化、规格化、无穷 / NaN。', '把 32 位模式当作普通有符号整数直接右移。', '只修改符号位，因为缩放不影响其他位。', '先检查最低位是否为 1。'], skeleton: '浮点位模式必须先分类：阶码全 0、全 1 和中间值的语义不同。缩放时还要关注规格化边界与舍入进位；使用零、最小非规格化、边界规格化和 NaN 验证。' }
];

const datalabTransfers = [
  { sourcePuzzle: 'bitXnor', strategy: 'truth', focus: '受限逻辑门合成', title: '三路传感器的恰有两路报警位', prompt: '给定三张等宽报警位图 P、Q、R。对每一位，只有恰好两路为 1 时输出 1。请在只允许 NOR 与 NOT 的条件下先写出单个位真值表，再规划中间量。', limits: '每一位并行；只允许 NOR / NOT；不写循环。', analysis: '这是更高阶的布尔合成：先用真值表列出三个为真的输入组合，再用 NOR 的函数完备性逐层实现。', edges: '000、111、每一种恰有两路为 1、以及仅一路为 1。' },
  { sourcePuzzle: 'bitConditional', strategy: 'select', focus: '逐位优先选择', title: '三层优先级的配置融合', prompt: '每一位由掩码 P、Q 决定优先取配置 A、B 或默认 C：P 为 1 时取 A；否则 Q 为 1 时取 B；否则取 C。请先设计三个互斥的选择区域。', limits: 'P、Q 都是整字掩码；不可使用条件分支。', analysis: '比两路选择多一层优先级；关键是先使三块掩码互斥，再让每个候选字只在自己的区域通过。', edges: 'P/Q 全 0、全 1、完全重叠，以及每位的三种选择区域。' },
  { sourcePuzzle: 'byteSwap', strategy: 'field', focus: '多字段重排', title: '遥测包的四个半字节轮换', prompt: '32 位遥测包有 8 个半字节。把编号为 1、3、5、7 的四个半字节循环右移一格，其余四个半字节必须保持原样。先画出字段位置与搬运路径。', limits: '只能用掩码、移位与组合；禁止临时数组。', analysis: '难点从两字段交换升级为稀疏字段的循环置换：逐个抽取、对齐、清空目标并重组。', edges: '四个被搬运字段相同、全部为 0、全部为 1，以及未选字段的保持性。' },
  { sourcePuzzle: 'logicalShift', strategy: 'shift', focus: '可变移位的补位清理', title: '窗口右移后的顶部标志清理', prompt: '一个 32 位位串用带符号右移实现右移 n 位。结果高 n 位必须补 0，但另外保留原最低两位作为校验标志。请先分别描述移动区与保留区。', limits: 'n 可取 0 到 29；禁止无符号类型转换。', analysis: '比单纯逻辑右移多了“移动结果与固定字段并存”：先构造补零掩码，再独立处理需保留的位段。', edges: 'n=0、n=1、n=29、原最高位为 1、最低两位的四种组合。' },
  { sourcePuzzle: 'cleanConsecutive1', strategy: 'neighbor', focus: '长度阈值的局部关系', title: '仅清除长度至少为三的亮灯段', prompt: '对一个位串，清除属于任何连续 1 长度不少于 3 的位置；孤立 1 与恰好成对的 11 必须保留。请先构造“位于三连段中”的标记。', limits: '只用移位与逐位逻辑；不扫描。', analysis: '比相邻关系多一层：需要把左右两个对齐关系合并，确认每个位置是否参与任意三连窗口。', edges: '0、1、11、111、1111，以及跨最高位或最低位的段。' },
  { sourcePuzzle: 'leftBitCount', strategy: 'count', focus: '前缀模式的分层定位', title: '符号重复前缀长度', prompt: '计算从最高位起与符号位相同的连续位数，不包含第一个不同位。也就是说，既能处理前导 0，也能处理前导 1。请设计 16→8→4→2→1 的定位方案。', limits: '禁止循环；一次只检查一个 2 的幂大小块。', analysis: '在前导 1 计数外增加了符号归一化：先让“与符号一致”转为统一的目标模式，再分层定位。', edges: '全 0、全 1、最高位后立刻变化、变化恰在 16/8/4 位边界。' },
  { sourcePuzzle: 'counter1To5', strategy: 'truth', focus: '受限条件与等价判断', title: '八档模式的无分支环回', prompt: '输入保证在 0 到 7。若值等于 7 则返回 0，否则返回值加 2 后对 8 取模。禁止条件、比较与 XOR；先规划如何表示“等于 7”。', limits: '仅用 NOT、AND、OR、加法与逻辑非。', analysis: '核心仍是受限运算下的相等判断与条件选择，但状态空间扩大且需要处理环回。', edges: '0、5、6、7；尤其验证 7 不会与普通加法路径混淆。' },
  { sourcePuzzle: 'sameSign', strategy: 'compare', focus: '符号分类与零语义', title: '严格同号但零不归类', prompt: '若两个补码数同为正或同为负则返回 1；只要任一个为 0 就返回 0。请先给出符号与零的分类表。', limits: '不使用比较运算符；结果必须是 0 或 1。', analysis: '比单纯同号增加了零这个独立类别：符号位相同只是必要条件，还要排除零。', edges: '+/+、-/-、+/-、0/+、0/-、0/0。' },
  { sourcePuzzle: 'satMul3', strategy: 'overflow', focus: '多步饱和运算', title: '五倍增益的饱和输出', prompt: '计算 32 位补码读数的五倍；若数学结果越界，按方向钳到对应边界。请先写出需要观察哪些中间结果的符号关系。', limits: '不能使用乘法或分支；允许移位、加法和掩码选择。', analysis: '五倍会经过多次组合，不能只检查最终一步；先证每一步的安全条件，再统一选择正常值或边界值。', edges: '0、1、-1、刚好安全的正负边界、第一次中间步骤越界的输入。' },
  { sourcePuzzle: 'isGreater', strategy: 'compare', focus: '跨符号区间判断', title: '开闭区间的安全成员测试', prompt: '判断有符号 x 是否满足 lower < x ≤ upper，三个数的符号任意。直接连做两次减法可能越界；请先把每次比较拆成异号与同号情形。', limits: '禁止比较运算符；结果为 0 或 1。', analysis: '从单次严格比较提升到两个不同开闭边界；每个比较都要独立避免差值溢出。', edges: 'x=lower、x=upper、三者异号、最小负数与最大正数。' },
  { sourcePuzzle: 'subOK', strategy: 'overflow', focus: '复合算术的逐步安全性', title: '两阶段校准是否每步安全', prompt: '设备固定按先 x-y、后加 z 的顺序校准。判断这两步是否都不会在 32 位补码中溢出；数学上最终值可表示并不代表中间安全。', limits: '不实际使用更宽整数；只用符号关系推断。', analysis: '单次减法溢出检测扩展为两次不同运算；先检查减法结果，再把它作为下一步加法的操作数。', edges: 'y 为最小负数、第一步刚越界、第一步安全但第二步越界、全部为 0。' },
  { sourcePuzzle: 'trueFiveEighths', strategy: 'round', focus: '溢出安全的比例与向零截断', title: '十三除十六的校准器', prompt: '计算 (13x)/16 并要求朝 0 截断；x 可为任意 32 位补码数，禁止先直接计算 13x。请拆分高位商与低位余数。', limits: '不使用乘除；中间量不得依赖溢出。', analysis: '比例更大且分母更细，要求你把商、余数和符号偏置分别处理，再在安全范围内合并贡献。', edges: '正负可整除、正负有余数、最小负数、接近最大正数。' },
  { sourcePuzzle: 'float_half', strategy: 'float', focus: '多次缩放与渐进下溢', title: '单精度位模式除以四', prompt: '输入为单精度浮点位模式。返回其除以四的位模式；NaN 保持原样，遇到规格化边界与非规格化数时必须正确舍入到偶数。', limits: '按位字段操作；允许分支；不调用浮点运算。', analysis: '比一次减半多跨过一个潜在边界：拆包后要决定连续两次缩放是否合并处理，并保留足够的舍入信息。', edges: 'NaN、无穷、±0、最小规格化数、最小非规格化数、尾部恰好半舍。' },
  { sourcePuzzle: 'float_i2f', strategy: 'float', focus: '无符号整数到浮点的舍入', title: '无符号 32 位计数转单精度', prompt: '把无符号 32 位计数器的数值转换为单精度浮点位模式，使用最近偶数舍入。请先定位最高有效 1，并说明何时尾数进位会推高阶码。', limits: '不使用浮点类型；结果以位模式返回。', analysis: '正数范围扩展到最高位为 1 的无符号区域，重点从绝对值转为最高位定位、截断尾部与舍入进位。', edges: '0、2 的幂、刚超过 24 位精度的数、恰好半舍、最大无符号值。' },
  { sourcePuzzle: 'float64_f2i', strategy: 'float', focus: '双精度范围判定与截断', title: '双精度位模式到带符号 32 位的安全转换', prompt: '输入为双精度位模式；若其朝 0 截断后不能表示成 32 位补码整数，返回指定错误模式，否则返回整数位模式。请按阶码区间先分类。', limits: '输入高低 32 位分开给出；不使用 double 类型。', analysis: '难点是先由阶码排除绝对值小于 1、越界和特殊值，再仅对可表示区间对齐尾数并施加符号。', edges: '±0、绝对值小于 1、2^31 边界、NaN、无穷、负数截断。' },
  { sourcePuzzle: 'float_negpwr2', strategy: 'float', focus: '指数边界与非规格化构造', title: '构造 3×2^(-k) 的单精度位模式', prompt: '给定整数 k，生成正数 3×2^(-k) 的单精度位模式；过大时下溢到 0，过小时仍要正确给出可表示的规格化或非规格化数。请先划分指数区间。', limits: '不使用浮点常量或浮点计算；按字段构造。', analysis: '常数尾数不再是 0，因而除了指数边界，还要确认 1.5 的尾数在规格化与非规格化区域如何对齐。', edges: '刚进入非规格化、最小可表示非零、下溢为 0、普通规格化值。' }
];
const coverage = [
  ['逐位逻辑', '从真值表合成 AND / OR / XOR / NOT 关系', 'truth'],
  ['条件选择', '把 0/1 条件扩展为整字掩码', 'select'],
  ['字段读写', '提取、清空、替换、搬运指定字段', 'field'],
  ['移位语义', '区分逻辑右移、算术右移与补位', 'shift'],
  ['局部关系', '把邻位或定距位对齐后进行标记', 'neighbor'],
  ['前缀与定位', '用分层块检查替代线性扫描', 'count'],
  ['有符号关系', '先按符号分类，再分析同号情形', 'compare'],
  ['范围保护', '检测中间结果是否越界，并选择边界输出', 'overflow'],
  ['截断与舍入', '保留余数信息，处理向 0 的取整', 'round'],
  ['浮点编码', '拆包、分类、变换、舍入、封包', 'float']
];

const storageKey = 'bit-thinking-lab-v1';
const state = { completed: new Set(), practiceIndex: 0 };
const $ = (id) => document.getElementById(id);

function normalizeBinary(value) {
  const cleaned = value.replace(/[^01]/g, '').slice(-8);
  return cleaned.padStart(8, '0');
}

function binaryToNumber(value) {
  return Number.parseInt(value, 2);
}

function numberToBinary(value) {
  return (value & 255).toString(2).padStart(8, '0');
}

function renderBits(container, binary, editable, onFlip) {
  container.innerHTML = '';
  [...binary].forEach((digit, index) => {
    const element = document.createElement(editable ? 'button' : 'span');
    element.className = `bit ${digit === '1' ? 'one' : ''}`;
    element.textContent = digit;
    element.setAttribute('aria-label', `第 ${7 - index} 位：${digit}`);
    if (editable) {
      element.type = 'button';
      element.addEventListener('click', () => onFlip(index));
    }
    container.appendChild(element);
  });
}

function currentWords() {
  const a = normalizeBinary($('word-a').value);
  const b = normalizeBinary($('word-b').value);
  $('word-a').value = a;
  $('word-b').value = b;
  return { a, b, aNumber: binaryToNumber(a), bNumber: binaryToNumber(b) };
}

function bitReading(mode, count) {
  const readings = {
    and: ['AND：共同保留', '结果的某一位为 1，当且仅当 A 与 B 的同一位都是 1。它适合检验“同时满足”。', '逐位：resultᵢ = Aᵢ AND Bᵢ'],
    xor: ['XOR：差异探针', '结果的某一位为 1，当且仅当 A 与 B 的同一位不同。先做“每一位是否改变”的判断，就会自然想到它。', '逐位：resultᵢ = Aᵢ XOR Bᵢ'],
    mask: ['掩码：只让指定位置通过', 'B 中为 1 的位置像开着的闸门；B 中为 0 的位置会让 A 的对应位归零。观察字段外是否全部被清空。', '逐位：resultᵢ = Aᵢ AND maskᵢ'],
    shift: ['逻辑右移：移动并在左端补 0', `A 的位整体向低位移动 ${count} 格；左边出现的空位必须是 0。这里强调的是“位串”而不是带符号数值。`, '先写：哪些位来自旧位置？哪些位必须强制为 0？'],
    neighbor: ['邻位关系：对齐后再判断', '先把 A 向左移动一格；某位为 1 说明它和右邻原本都是 1。这个中间标记还只覆盖一端，若要影响两端需再传播一次。', '标记：resultᵢ = Aᵢ AND Aᵢ₋₁']
  };
  const [title, body, rule] = readings[mode];
  $('bit-reading').innerHTML = `<h3>${title}</h3><p>${body}</p><div class="micro-rule">${rule}</div><p class="tiny">自问：此刻观察的是 <strong>每一位的条件</strong>，还是整个整数的数值？混淆这两件事是最常见的起点错误。</p>`;
}

function updateBitStage() {
  const { a, b, aNumber, bNumber } = currentWords();
  const mode = $('bit-mode').value;
  const count = Number($('shift-count').value);
  let result;
  if (mode === 'and' || mode === 'mask') result = aNumber & bNumber;
  if (mode === 'xor') result = aNumber ^ bNumber;
  if (mode === 'shift') result = aNumber >>> count;
  if (mode === 'neighbor') result = aNumber & ((aNumber << 1) & 255);
  const resultBinary = numberToBinary(result);
  const isShift = mode === 'shift';
  $('word-b-wrap').hidden = isShift || mode === 'neighbor';
  $('shift-control').hidden = !isShift;
  $('shift-output').textContent = `${count} 位`;
  $('word-result').textContent = resultBinary;
  renderBits($('bits-a'), a, true, (index) => flipBit('word-a', index));
  renderBits($('bits-b'), b, true, (index) => flipBit('word-b', index));
  renderBits($('bits-result'), resultBinary, false);
  bitReading(mode, count);
}

function flipBit(inputId, index) {
  const bits = normalizeBinary($(inputId).value).split('');
  bits[index] = bits[index] === '1' ? '0' : '1';
  $(inputId).value = bits.join('');
  updateBitStage();
}

function renderStrategyDetail(strategy) {
  $('strategy-detail').innerHTML = `<p class="detail-kind">${strategy.tag}</p><h3>${strategy.title}</h3><p><strong>适合出现于：</strong>${strategy.when}</p><ol class="reasoning-list">${strategy.chain.map((step, index) => `<li><b>0${index + 1}</b><span>${step}</span></li>`).join('')}</ol><p class="watch-out">边界提醒：${strategy.watch}</p>`;
  const example = methodExamples[strategy.id]; $('strategy-detail').insertAdjacentHTML('beforeend', `<details class="method-example"><summary>示范题 · ${example.title}</summary><p>${example.prompt}</p><p><strong>分析提示：</strong>${example.hint}</p></details>`);
  document.querySelectorAll('.strategy-card').forEach((card) => card.setAttribute('aria-pressed', String(card.dataset.strategy === strategy.id)));
}

function renderStrategies() {
  const list = $('strategy-list');
  strategies.forEach((strategy) => {
    const button = document.createElement('button');
    button.className = 'strategy-card';
    button.type = 'button';
    button.dataset.strategy = strategy.id;
    button.innerHTML = `<small>${strategy.tag}</small><strong>${strategy.title}</strong><span>${strategy.short}</span>`;
    button.addEventListener('click', () => renderStrategyDetail(strategy));
    list.appendChild(button);
  });
  renderStrategyDetail(strategies[0]);
}

function renderPuzzleDetail(puzzle) { const strategy = strategies.find((item) => item.id === puzzle.strategy); $('puzzle-detail').innerHTML = `<span class="puzzle-source">考察点对应：${puzzle.sourcePuzzle}</span><h3>${puzzle.title}</h3><p>${puzzle.prompt}</p><div class="challenge-spec"><div><b>核心考察点</b>${puzzle.focus}</div><div><b>建议起手式</b>${strategy.title}</div><div><b>限制</b>${puzzle.limits}</div><div><b>先攻击的边界</b>${puzzle.edges}</div></div><details class="challenge-hint"><summary>查看推理线索</summary><p>${puzzle.analysis}</p></details>`; document.querySelectorAll('.puzzle-button').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.puzzle === puzzle.sourcePuzzle))); }
function renderPuzzleDeck() { const list = $('puzzle-list'); datalabTransfers.forEach((puzzle) => { const button = document.createElement('button'); button.className = 'puzzle-button'; button.type = 'button'; button.dataset.puzzle = puzzle.sourcePuzzle; button.innerHTML = `<small>${puzzle.sourcePuzzle}</small><strong>${puzzle.focus}</strong>`; button.addEventListener('click', () => renderPuzzleDetail(puzzle)); list.appendChild(button); }); renderPuzzleDetail(datalabTransfers[0]); }
function currentPractice() {
  return practices[state.practiceIndex];
}

function renderPractice() {
  const practice = currentPractice();
  $('question-topic').textContent = practice.topic;
  $('question-title').textContent = practice.title;
  $('question-prompt').textContent = practice.prompt;
  $('answer-feedback').textContent = '';
  $('answer-feedback').className = '';
  $('reasoning-skeleton').hidden = true;
  const options = $('question-options');
  options.innerHTML = '<legend>先选你的分析起点</legend>';
  practice.options.forEach((option, index) => {
    const label = document.createElement('label');
    label.className = 'option';
    label.innerHTML = `<input type="radio" name="practice-option" value="${index}" /><span>${option}</span>`;
    options.appendChild(label);
  });
}

function updateCompletion() {
  const count = state.completed.size;
  $('progress-label').textContent = `${count} / ${practices.length} 个策略已识别`;
  $('progress-bar').style.width = `${(count / practices.length) * 100}%`;
  $('progress-bar').parentElement.setAttribute('aria-valuenow', String(count));
  document.querySelectorAll('.coverage-item').forEach((item) => item.classList.toggle('done', state.completed.has(item.dataset.strategy)));
  saveState();
}

function checkPractice() {
  const picked = document.querySelector('input[name="practice-option"]:checked');
  if (!picked) {
    $('answer-feedback').className = 'bad';
    $('answer-feedback').textContent = '先选一个“第一步”。这里考察的是建模方向，不是最终表达式。';
    return;
  }
  const practice = currentPractice();
  const correctStrategy = strategies.find((strategy) => strategy.id === practice.correct);
  const correct = Number(picked.value) === 0;
  $('answer-feedback').className = correct ? 'good' : 'bad';
  $('answer-feedback').textContent = correct ? `方向正确：先使用“${correctStrategy.title}”。` : '这一步会绕开问题真正的位级结构。回到需求，问“每一位或字段的关系是什么？”';
  if (correct) {
    state.completed.add(practice.correct);
    $('reasoning-skeleton').hidden = false;
    $('reasoning-skeleton').innerHTML = `<h4>推理骨架</h4><p>${practice.skeleton}</p>`;
    updateCompletion();
  }
}

function renderCoverage() {
  const grid = $('coverage-grid');
  coverage.forEach(([title, detail, id]) => {
    const card = document.createElement('article');
    card.className = 'coverage-item';
    card.dataset.strategy = id;
    card.innerHTML = `<b>${title}</b><span>${detail}</span>`;
    grid.appendChild(card);
  });
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    (saved.completed || []).forEach((id) => state.completed.add(id));
    ['goal', 'middle', 'invariant', 'boundary'].forEach((key) => {
      const element = $(`scratch-${key}`);
      element.value = saved.scratch?.[key] || '';
    });
    if (saved.theme === 'dark') document.documentElement.dataset.theme = 'dark';
  } catch { /* A fresh session starts cleanly. */ }
}

function saveState() {
  const scratch = {};
  ['goal', 'middle', 'invariant', 'boundary'].forEach((key) => { scratch[key] = $(`scratch-${key}`).value; });
  localStorage.setItem(storageKey, JSON.stringify({ completed: [...state.completed], scratch, theme: document.documentElement.dataset.theme || 'light' }));
  $('scratch-status').textContent = '已保存到当前浏览器。';
}

function bindEvents() {
  ['word-a', 'word-b'].forEach((id) => $(id).addEventListener('input', updateBitStage));
  $('bit-mode').addEventListener('change', updateBitStage);
  $('shift-count').addEventListener('input', updateBitStage);
  $('next-question').addEventListener('click', () => { state.practiceIndex = (state.practiceIndex + 1) % practices.length; renderPractice(); });
  $('check-answer').addEventListener('click', checkPractice);
  ['goal', 'middle', 'invariant', 'boundary'].forEach((key) => $(`scratch-${key}`).addEventListener('input', saveState));
  $('clear-scratch').addEventListener('click', () => {
    ['goal', 'middle', 'invariant', 'boundary'].forEach((key) => { $(`scratch-${key}`).value = ''; });
    saveState();
    $('scratch-status').textContent = '草稿已清空。';
  });
  $('theme-toggle').addEventListener('click', () => {
    document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    saveState();
  });
}

loadState();
renderStrategies();
renderPuzzleDeck();
renderCoverage();
renderPractice();
updateCompletion();
updateBitStage();
bindEvents();
