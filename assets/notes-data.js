window.NOTE_ITEMS = [
  {
    "id": "prompt-engineering",
    "title": "Prompt 工程",
    "meta": "AI · Prompt",
    "description": "思维链、ReAct、结构化输出与 Open API 参数",
    "tags": [
      "Prompt",
      "ReAct",
      "结构化输出"
    ],
    "markdown": "# prompt 工程\n\n## 提升正确率\n\n### 基础范式\n\n* **思维链（chain of thought）**：请一步一步分析（分析过程）\n* **自洽性**：同样的prompt跑多次，投票选出最终结果\n* **思维树**：树形展开，按节点分析\n\n### Agent Prompt\n\n* ReAct Prompt（推理加行动）\n\n  * Thought：当前推理思考\n\n  * Action：下一步要执行的操作\n\n  * Observation：工具或环境返回的结果\n\n  * ```\n    Thought: 需要查找关于某公司的信息\n    Action: Search[\"公司名称\"] \n    Observation: 返回公司简介信息 \n    \n    Thought: 已获得基础信息，现在需要总结并回答\n    Action: Final Answer[公司简介总结]\n    ```\n\n* Tool Prompt\n\n  * 工具名称\n\n  * 功能描述\n\n  * 输入参数说明\n\n  * 输出格式说明\n\n  * ```\n    可用工具：\n    Tool: Search \n    描述：用于搜索互联网信息 \n    输入：查询关键词（字符串） \n    输出：搜索结果摘要列表 \n    Tool: Calculator \n    描述：执行数学计算 \n    输入：数学表达式（字符串） \n    输出：计算结果\n    ```\n\n    \n\n* Reflection Prompt\n\n  * 请检查以上回答是否存在逻辑错误或遗漏的信息，如有，请进行修正。\n  * 进阶\n    1. 生成初始答案 \n    2. 进行自我评估 \n    3. 修正错误 \n    4. 生成最终答案\n\n### 模板设计\n\n| 原则                  | 说明                                                         |\n| --------------------- | ------------------------------------------------------------ |\n| 固定字段名称          | 字段名一旦确定不应随意变化，程序依赖字段名进行解析           |\n| 限制格式变化          | 避免多余的解释文字、代码块标记（如 ```json）、额外注释       |\n| 避免过深嵌套          | 嵌套层级过深会增加解析复杂度和模型生成错误概率，保持结构适度简洁 |\n| 提供默认值 / 空值处理 | 明确字段缺失时的默认行为，如 \"value\": null 或 \"value\": \"\"    |\n\n### 结构化输出\n\n* JSON 输出控制\n\n```\n请分析以下用户问题，并返回 JSON 结果：\n\n用户问题：{user_question} \n输出格式： \n{  \n\t\"intent\": \"\",  \n\t\"confidence\": \"\",  \n\t\"reply\": \"\" \n}\n```\n\n* Schema 约束\n\n```\n请根据用户问题判断意图，并按照以下 Schema 返回结果： \nSchema： \n{  \n\t\"intent\": \"string，用户意图，可选值：查询/投诉/闲聊\",  \n\t\"confidence\": \"number，0-1 之间的置信度\",  \n\t\"need_human_support\": \"boolean，是否需要人工介入\" \n\t}\n```\n\n* 输出校验\n\n```\ntry:    \n\tresult = json.loads(model_output)    \n\tvalidate_schema(result, expected_schema) \nexcept (JSONDecodeError, SchemaValidationError):    # 重新请求模型生成，或使用备用逻辑    \t\tresult = fallback_handler()\n```\n\n### 伪代码\n\n## 防止prompt攻击\n\n* **prompt注入分类器**（判断prompt）\n\n* **直接在输入中防护**\n* **调用Open Api识别**\n\n## Open Api参数\n\n* **temperature**=1：生成结果的多样性0-2之间，越大越随机\n* **seed**=None：随机种子，指定具体值后，temperature=0时，每次生成结果一致\n\n* **stream**=False：数据流式输出\n* **top_p**=1：随机采样时，只考虑前百分之多少token\n* **n**=1：一次返回多少次结果\n* **max_tokens**:=100每条结果最多几个token（超过截断）\n* **presence_penalty**=0:对出现过的token的概率进行降权\n* **frequency_penalty**=0:对出现过的token根据其出现过的频次，对其的概率进行降权\n* **logit_bias**={}：对指定的token的采集概率手工加/降权"
  },
  {
    "id": "python",
    "title": "Python",
    "meta": "编程 · Python",
    "description": "文件读写、编码处理与 os 模块常用操作",
    "tags": [
      "Python",
      "文件处理",
      "os 模块"
    ],
    "markdown": "# python \n\n## 文件处理\n\n1. ```python\n   1. 打开文件\n   \n   ​    file_object=open('info.txt','rb')  #读取二进制\n   \n   2. 读取文件内容\n   \n   ​    data=file_object.read()\n   \n   3. 关闭文件\n   \n   ​    file_object.close()\n        text=data.decode('utf-8')\n        print(text)\n   \n      \n   ```\n\n   \n\n```\nfile_object=open('info.txt',mode='rt',)\n```\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n## os模块\n\n* import os\n\n1. 重命名\n\n   1. os.rename('2.txt','3.txt')\n   2. os.renames('2.txt','3.txt')"
  },
  {
    "id": "network-basics",
    "title": "网络基础速记",
    "meta": "计算机基础 · 网络",
    "description": "OSI 七层、TCP 握手挥手、DNS 与 CDN",
    "tags": [
      "OSI",
      "TCP",
      "DNS"
    ],
    "markdown": "# osi\n\n1.  **应用层 **：提供用户与网络的接口，支持协议\n2.  **表示层**：处理数据的格式转换\n3. **会话层**：负责建立，管理和终止设备间的会话\n4. **传输层**：提供端到端的数据传输，可靠传输建立会话  不可靠传输  流量控制\n5. **网络层**：寻址和路由选择\n6. **数据链路层**：数据如何封装 添加物理层地址 MAC\n7. **物理层**：物理介质\n\n# ssh\n\n* 一种网络协议，主要用于在不安全的网络中提供安全的远程登录和其他网络服务。\n\n# MAC\n\n* 网卡地址，生产时写在硬件内部。\n\n# IP\n\n* 每个连接到互联网的设备都需要一个IP地址，确保信息能够准确送达\n\n# TCP/UDP\n\n* **TCP**（传输控制协议）：一种面向连接的、可靠的、基于字节流的传输层通信协议。\n* **UDP**（用户数据报协议）：一种无连接的传输层协议，提供面向事务的简单不可靠信息传输服务。\n\n# TCP 三次握手和四次挥手\n\n1. 三次握手：\n   1. 客户端向服务器发送一个SYN报文段，其中包含ISN，用于标志数据包的顺序。\n   2. 服务器收到SYN报文段后，验证是否合法，合法则回复SYN-ACK报文段。\n   3. 客户端收到SYN-ACK报文段后，验证服务器IP和端口，若合法，则发送ACK确定报文。\n2. 四次挥手：\n   1. 客户端或服务端决定关闭连接时，发送FIN结束报文，表示不再发送数据。\n   2. 对方收到FIN报文后，回复ACK确定报文，表示已收到关闭请求。\n   3. 被动关闭方完成数据传输后，发送FIN报文段，请求关闭连接。\n   4. 主动关闭方收到FIN报文后，回复ACK确定报文段，表示已收到关闭请求。\n\n# DNS\n\n* 域名系统\n* 将域名与IP地址相互映射\n\n# CDN\n\n*　通过在全球分布节点缓存网站内容，让用户从最近的服务器获取数据，从而显著降低延迟、提升访问速度和稳定性的网络技术。"
  },
  {
    "id": "llm-agent",
    "title": "大模型（Agent）",
    "meta": "AI · LLM",
    "description": "RAG 流程、OpenAI 调用、向量与 LangChain",
    "tags": [
      "RAG",
      "LangChain",
      "Embedding"
    ],
    "markdown": "# 大模型（Agent）\n\n## 机器学习\n\n* 监督学习\n* 非监督学习\n* 强化学习\n* 深度学习\n\n## RAG\n\n* **RAG**：（提供背景知识）检索增强生成，通过实时检索相关文档或信息，作为上下文输入到生成模型中，从而提高生成结果的时效性和准确性\n* 作用：减少幻觉，增加时效性，提升专业领域回答质量\n\n1. 数据预处理：（离线）\n   1. 知识库构建\n   2. 文档分块（chunks）：方便检索\n   3. 向量化处理（embedding）：将文本转化成向量，并存储在向量数据库\n2. 检索阶段\n   1. 查询处理：将问题转换成向量，在向量库中进行相似度检索\n   2. 重排序：对检索结果进行相似度排序，选择最相关的片段作为输入\n3. 生成阶段\n   1. 上下文组装：与检索到的文本片段与用户问题结合，形成增强上下文输入\n   2. 生成回答\n\n****\n\n**RAG三步骤**\n\n* Index索引（存），Retrieval检索（找），Generation生成（答）\n\n****\n\n**向量数据库**\n\n1. 召回（快速筛选）【基于关键词匹配/基于语义向量】\n2. 重排\n\n## Open AI\n\n**client.chat.completion.create**\n\n* model：选择所用模型\n* messages：提供给模型的消息\n  * 类型：list，可包含多个字典消息\n  * 每个字典两个key\n    * role：角色\n    * content：内容\n* system：设定助手整体行为，角色和规则，为对话提供上下文框架\n* assistant：代表AI助手的回答，可以在代码中人为设定\n* user：代表用户，发送问题\n\n可以通过 print（response. choice[0].message. content）输出回答\n\n## 向量\n\n向量的计算：文本嵌入过程（可借助文本嵌入模型实现（text-embedding-v1 ））\n\n余弦相似度：计算余弦值\n\n## LangChain\n\n* AIMessage：相当于（assistant）\n* HumanMessage：相当于（user）\n* SystemMessage：相当于（system）\n\n## chain\n\n* 模型输入：PromptValue或字符串或序列（BaseMessage，list，tuple，str，dict）\n* 模型输出：AIMessage\n* 提示词模板输入：要求是字典\n* 提示词模板输出：PromptValue对象\n* StrOutputParser：AIMessage输入，str输出\n* JsonOutputParser：AIMessage输入，dict输出"
  },
  {
    "id": "computer-network",
    "title": "计算机网络",
    "meta": "计算机基础 · 网络",
    "description": "TCP/IP、IP 编址、子网划分与数据链路层",
    "tags": [
      "TCP/IP",
      "子网划分",
      "数据链路层"
    ],
    "markdown": "# 计算机网络\n\n## 计算机网络概述\n\n* 数字化，网络化，信息化\n* 网络（许多计算机连接在一起）（节点，链路）\n* 互联网（许多网络连接在一起）\n* 因特网（全球最大的互联网）\n  * 主机之间的通信方式（客户端服务器方式CS/对等方式P2P）\n  * 数据交换\n    * 电路交换（交换机，会占线，数据量大的实时传输）（连接建立，数据传输，连接释放）\n    * 分组交换（报文分多段）（路由器的存储转发功能）\n    * 报文交换（比分组长，时间长）\n* 3层isp\n* ISOCI因特网协会，RTP因特网研究部，IESG因特网工程部  \n* 作用范围：WAN/MAN/LAN/PAN（个人区域网）\n  * 不单单从覆盖区域区分LAN/WAN\n    * 局域网自己购买/自己维修/带宽固定 100m以内\n    * 广域网花钱买服务/花钱买带宽\n* 使用者：公用网/专用网\n* 拓扑结构：总线型/环形/星型/树形/网状\n* 交换方式\n* 工作方式：资源子网/通信子网/接入网\n* 速率：主机在数字信道上传输数据位数的速率\n* 带宽：数字信道所能传输的最高速率\n* 吞吐量：单位时间通过某个网络的数据量（总的）\n* 时延：发送时延/传播时延/处理时延/排队时延\n* 时延带宽积=传播时延*带宽\n* 往返时间：RTT\n* 利用率\n* OSI 7层\n  1. 应用层：能够产生网络流量能够和用户交互的程序\n  2. 表示层：加密 压缩 开发人员\n  3. 会话层：服务和客户端产生的会话 查木马  netstat -nb\n  4. 传输层：可靠传输建立会话  不可靠传输  流量控制\n  5. 网络层：IP地址编址 选择最佳路径\n  6. 数据链路层：数据如何封装 添加物理层地址 MAC\n  7. 物理层：电压  接口标准\n* 网络排错：从底层到高层\n* 网络安全和OSI参考模型\n  * 物理层安全\n  * 数据链路层安全  ADSL  AP密码\n  * 网络层安全\n  * 应用层安全  SQL注入漏洞   上传漏洞\n* TCP/IP协议\n  * 应用层\n  * 运输层\n  * 网络层\n  * 数据链路层\n  * 物理层\n    1. 机械特性：接口形状，大小，引线数\n    2. 电气特性：电压\n    3. 功能特性：1/0\n    4. 过程特性：规定连接时各部件的工作步骤\n* 集线器\n* 网桥：记忆功能\n* 交换机\n* 路由器\n* mac （physical address）\n  * 6字节（48bit）mac地址\n  * 前三个：组织唯一标识符   后三个：网络接口标识符\n  * 48位全为1是是广播地址\n  * ipconfig / all 产看mac地址\n  * 通过arp广播获取的mac地址，属于动态缓存（存储时间2分钟）\n  * arp -a 【主机地址】：查询arp缓存\n  * arp -d 【主机地址】：删除arp缓存\n  * arp -s 主机地址 MAC地址：增加一条缓存（静态缓存，存储时间长）\n* IP地址\n  * 包括：网络标识（网络ID）/主机标识（主机ID）\n  * 同一网段计算机，网络ID相同\n  * 网段：IP地址与子网掩码按位与的结果\n  * 主机位为255时是广播，主机位全为0表示网段\n  * A类地址以0开头，第一个字节代表网络ID（1~126）\n  * B类地址以10开头，前两个字节代表网络ID（128-191，0-255）\n  * C类地址以110开头，前三个字节代表网络ID（192-223，0-255，0-255）\n  * 127.0.0.1本机地址\n* 子网划分\n  * 等长子网划分/变长子网划分\n* 超网：连续多个网段合并成更大的网段\n* 路由\n  * 非直连网段通过静态路由（小规模）/动态路由（大规模）\n* 公网IP/私网IP\n  * 私网IP地址可以重复\n  * 公网私网联系要通过NAT转换\n* 单工通信\n  * 信号只能往一个方向传输\n\n* 半双工通信\n  * 信号可以双向传输，同一时间只能往一个方向传输\n\n* 全双工通信\n  * 信号同时可以双向传输\n\n* 链路：从一个节点到另一个相邻节点的物理线路\n* 数据链路\n  * 不同类型的数据链路，所用的通信协议可能不同\n  * 广播信道：CSMA/CD协议（同轴电缆/集线器）\n  * 点对点信道：PPP协议（两个路由器之间的信道)\n  * 1. 封装成帧\n       1. 最大传输单元MTU：规定所能传输的帧的数据上限\n       2. 帧的数据部分：网络层传递下来的数据报\n       3. 帧开始符/结束符\n       4. 以太网的MTU为1500字节\n    2. 透明传输\n    3. 差错检验\n       1. FCS\n  * CSMA/CD协议\n    * 载波侦听多路访问/冲突检测\n    * 传输的帧是以太网帧\n\n  * PPP协议\n    * Address字段：点到点形同虚设，不需要mac\n    * Control字段\n    * Protocol字段：内部用到的协议类型\n    * 帧开始符，帧结束符"
  },
  {
    "id": "git",
    "title": "Git",
    "meta": "工具 · Git",
    "description": "本地库、分支管理与远程库常用命令",
    "tags": [
      "Git",
      "分支",
      "远程库"
    ],
    "markdown": "# git\n\n* git status   ：查看本地库状态\n* git add 文件名 ：添加至缓存区\n* git rm --cached ：文件名 删除缓存区文件\n* git commit -m： “版本信息” 文件名 提交至本地库\n* git reflog ：查看版本号\n* git log ：查看版本号和详细日志\n* git reset --hard ：版本号 版本穿梭\n* git branch -v ：查看分支\n* git branch 分支名 ：创建分支\n* git checkout 分支名 ：切换分支\n* git merge 分支名 ：合并分支将填入分支名合并至当前分支下，只修该合并的分支，合并来的不修改\n  * 文件合并冲突，进入文件修改后提交\n\n* git remote -v 查看远程库别名\n* git remote add 别名 创建别名\n* git push 别名 分支 提交至远程库\n* git pull 别名 分支 拉取至本地库\n* git clone 链接  克隆他人代码"
  },
  {
    "id": "linux",
    "title": "Linux",
    "meta": "系统 · Linux",
    "description": "常用命令、查找统计、管道重定向与 vim",
    "tags": [
      "Linux",
      "命令行",
      "vim"
    ],
    "markdown": "# Linux\n\n## 命令\n\n\n\n* ls\n  * -a 展示隐藏内容\n  * -l 以列表形式展示内容\n  * -h 要和-l一起使用，显示文件大小\n  * ls -lah 等于 ls -a -l -h\n* cd\n  * cd 【Linux路径】\n  * cd命令无选项，只有参数，表示要切换到哪个目录下\n  * cd命令直接执行，不写参数，表示回到用户的HOME目录下\n* pwd\n  * pwd命令，无选项，无参数，直接输入，查看当前的工作目录\n*　特殊路径符\n  *　．表示当前目录，cd./Desktop == cd Desktop\n  *　.. 表示上一级目录，cd..可以切换到上一级目录，cd../.. 切换到上两级目录\n  *　~ 表示HOME目录，cd ~可以切换到HOME  ，cd~/Desktop切换到HOME中的Desktop\n* mkdir\n  * mkdir dir 创建名为dir的文件夹\n  * -p 一次性创建多个层级目录   mkdir -p itcast/good/666\n* CTRL + L 清屏\n* touch\n  * touch test.txt  创建文件\n* cat\n  * cat test.txt 显示文件内容\n* more\n  * more text.txt 显示文件内容，可翻页（空格翻页，q退出）\n*  cp\n  * cp test1.txt test2.txt  复制1到2\n  * cp -r test1 test2 复制文件夹 \n* mv\n  * mv test.txt Desktop/ 将test放在Desktop文件夹下\n  * mv test1.txt test2.txt  将1改名为2（2不存在）\n  * mv test Desktop/ 将文件夹移动\n* rm\n  * rm test1.txt 删除文件\n  * rm -r test 删除文件夹\n  * rm -r test1 test2 删除多个文件夹\n  * 通配符\n    * test*，匹配任何以test开头的内容\n    * *test，匹配以test结尾的内容\n    * *test *，所有含test的内容\n* su - root +密码 变成超级管理员\n* exit 推出管理员模式\n* which（查程序）\n  * which cd 查找cd程序所在位置\n* find（查文件）\n  * find 起始路径 -name 被查找文件名\n  * find / -size +10k  在根目录查找大于10kb文件（k，M，G）\n* grep\n  * grep “hhh” test.txt  在文件里查找待有hhh的语句\n  * grep -n “hhh” test.txt 在文件里查找待有hhh的语句，并显示行号\n* wc\n  * wc  test.txt 统计文件里的bytes，字符数，行数，单词数\n  * wc -w  test.txt  统计单词数\n  * -c bytes数\n  * -m 字符数\n  * -l 行数\n  * -w 单词数\n* 管道符 |\n  * 将左边命令的结果作为右边的输入\n  * cat test.txt | grep “hhh” ==grep “hhh” test.txt\n* echo\n  * echo==print\n  * echo ` pwd  · 显示pwd的内容\n* 重定向符\n  * shift+.  将左侧的命令，覆盖写入到右侧\n  * echo “hello world” shift+.  test.txt \n  * shift+.   *2  将左侧的命令，追加写入到右侧\n* tail \n  * tail -5 test.txt 查看文件尾部5行内容\n  * tail -f test.txt 持续跟踪文件后10行内容（ CTRL +C 停止）\n\n* vi/vim\n  1. vim 文件路径\n  2. 命令模式时 按i进入输入模式\n  3. 输入模式时 按ESC进入命令模式\n  4. 命令模式时 按：进入底线命令模式\n  5. wq保存并退出\n\n* CTRL +C 强制停止，退出命令输入\n* CTRL +D退出用户登录，推出程序\n* history 显示历史输入命令\n* CTRL +R搜索命令\n* CTRL +a/e 跳到开头/结尾\n* yum\n  * install 安装\n  * remove 卸载\n  * search 搜索"
  }
];
