# ConcertAI 项目长期记忆

## 项目定位
演唱会管家 AI 平台，AI 角色名"小团团"，与美团合作，提供演唱会一站式服务。

## 核心技术栈
- 后端：Spring Boot 3.4.0 + Java 17 + Spring AI 1.0.0-M6 + DeepSeek-Chat
- ORM：MyBatis Plus 3.5.12 + MySQL（concert_db）
- 缓存：Redis（会话、提醒、ReAct 链路）
- 前端：React 18 + Vite 5 + Tailwind CSS + Three.js + react-markdown
- 运行端口：后端 8081 / 前端 5175 / API Base: `/concert/api`

## Agent 路由逻辑
```
hasIdentity=true & singer!=null & concertId!=null  → ConcertOrchestratorAgent（ReAct 循环）
hasIdentity=true & singer!=null & concertId==null  → DedicatedConcertAgent
hasIdentity=false 或无                             → GeneralAssistantAgent
```

## 数据库表
concert / user_follow_concert / user_reminder / hotel / scenic / city_info / playlist

## Redis Key 规范
- `chat:session:{sessionId}` - 对话历史
- `orch:session:{sessionId}` - UserSession 上下文（TTL 72h）
- `react_trace:{sessionId}` - ReAct 推理链路（TTL 10min）
- `reminder:user:{userId}` - 动态提醒队列

## 座位图配置文件
`src/main/resources/seatmap_configs/{concertId}.json`

## 工具注册
SpringAIConfig 中注册 musicToolsProvider + planningToolsProvider + concertToolsProvider，合并为 allToolsProvider Bean。

## 提醒定时任务
- ActiveReminderScheduler: 每天 10:00 cron，查 7 天内演唱会推送提醒
- SmartReminderScheduler: 每5分钟生成提醒，每1分钟发送待发提醒

## 前端页面路由
/ 首页、/concerts 列表、/concerts/:id 详情、/agent AI助手、/profile 个人、/reminders 提醒、/music 音乐播放器
