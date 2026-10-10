/*
 * 个人主页内容配置
 * 只需要修改这份文件，就能更新页面上的所有主要文案。
 * 链接暂时没有时，把 href 留空即可。
 */
window.PERSONAL_SITE = {
  name: "伍嘉俊",
  initials: "Wu",
  role: "学生",
  location: "中国 · 可远程合作",
  status: "开放新合作",
  email: "2310015839@qq.com",

  hero: {
    eyebrow: "无名之辈",
    intro: "学学学。"
  },

  about: {
    paragraphs: [
      "08年本科在读，会python，cpp编程语言，git操作，算法学习中",
      ""
    ],
    quote: "今天不努力明天见不到vivian。"
  },

  work: {
    intro: "一个基于 Streamlit 与 DeepSeek API 构建的 AI 聊天机器人项目。",
    projects: [
      {
        title: "AI 聊天伴侣",
        meta: "AI project · Python · Streamlit",
        description: "连接 DeepSeek 大模型的聊天伴侣，支持自定义昵称与性格、流式回复、上下文记忆，以及历史会话的本地保存、切换与删除。",
        tags: ["Python", "Streamlit", "DeepSeek", "AI Chat"],
        cover: "./assets/projects/ai-chat-companion-cover.png",
        link: "",
        source: "ai-chat-companion"
      },
      {
        title: "抖音自动点赞",
        meta: "Automation · Python · 图像识别",
        description: "基于 OpenCV 模板匹配与 PyAutoGUI 的抖音指定用户自动点赞机器人，支持中文路径截图、高分屏 DPI 感知、高匹配度循环滚动定位并自动点赞。",
        tags: ["Python", "OpenCV", "PyAutoGUI", "图像识别", "自动化"],
        cover: "./assets/projects/douyin-like-cover.jpg",
        link: "",
        source: "douyin-like"
      }
    ]
  },

  experience: {
    items: [
      {
        period: "2008 — 现在",
        title: "学生",
        organization: "红旗实小/玉海实验/瑞安十中/JUST",
        description: "学习中。"
      }
    ]
  },

  // 每日学习页面的前端管理口令。仅用于访客只读模式，不替代服务器权限验证。
  // 公开部署前请务必修改此口令。默认口令：wjj20080112
  learning: {
    adminCode: "wjj20080112"
  },
  contact: {
    intro: "欢迎联系我。"
  },

  // 链接不需要时直接删除对应项目；微信使用 copy 字段，点击后可复制。
  socials: [
    { label: "GitHub", icon: "github", text: "GitHub @wjjvv", href: "https://github.com/wjjvv" },
    { label: "微信", icon: "wechat", text: "微信 2310015839", copy: "2310015839", copyName: "微信" },
    { label: "Email", href: "mailto:2310015839@qq.com" }
  ]
};
