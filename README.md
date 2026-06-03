# 演唱会出行行程规划系统

## 项目概述

这是一个集成演唱会数据、酒店景点信息、交通规划、用户管理等功能的智能行程规划系统。系统采用现代化的微服务架构，集成了RabbitMQ消息队列、Elasticsearch搜索引擎、Redis缓存等高性能组件。

## 技术栈

### 后端技术
- **主框架**: Spring Boot 2.7.x
- **数据库**: MySQL 8.0+
- **ORM**: MyBatis Plus
- **缓存**: Redis
- **消息队列**: RabbitMQ
- **搜索引擎**: Elasticsearch
- **认证**: JWT
- **爬虫**: Jsoup + HttpClient

### 核心功能
- 🎤 **智能演唱会搜索** - 基于Elasticsearch的全文搜索和推荐
- 🏨 **酒店智能推荐** - 基于位置和预算的酒店匹配
- 🎯 **个性化行程规划** - 智能推荐算法优化出行体验
- 🚄 **综合交通方案** - 多平台交通数据整合
- 📊 **实时数据监控** - 爬虫数据质量监控和报警
- 🔔 **智能提醒系统** - 价格监控和出行提醒

## 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone [项目地址]

# 数据库准备
mysql -u root -p < src/main/resources/schema.sql

# 配置修改
# 修改 application.yml 中的数据库连接、Redis、RabbitMQ、Elasticsearch 配置
```

### 2. 启动服务

```bash
# 编译打包
mvn clean package

# 启动应用
java -jar target/concert-0.0.1-SNAPSHOT.jar

# 或使用开发环境
mvn spring-boot:run
```

### 3. 系统初始化

应用启动后会自动：
1. 创建数据库表结构
2. 启动演唱会数据爬虫
3. 初始化缓存和搜索索引

## API文档

### 用户管理
```
POST /api/user/register     - 用户注册
POST /api/user/login        - 用户登录
GET  /api/user/profile      - 获取用户信息
PUT  /api/user/preferences  - 更新用户偏好
```

### 演唱会管理
```
GET  /api/concerts           - 获取演唱会列表
GET  /api/concerts/search    - Elasticsearch全文搜索
GET  /api/concerts/singer/{singer} - 按歌手查询
GET  /api/concerts/city/{city}     - 按城市查询
GET  /api/concerts/recommended     - 推荐演唱会
GET  /api/concerts/search/ranking  - 搜索热度排行
```

### 行程规划
```
POST /api/plans            - 创建行程计划
GET  /api/plans/user/{userId} - 获取用户行程
GET  /api/plans/{id}       - 获取行程详情
PUT  /api/plans/{id}       - 更新行程
DELETE /api/plans/{id}     - 删除行程
```

## 核心架构

### 数据流架构
```
┌─────────────┐    ┌──────────────┐    ┌────────────────┐
│   爬虫系统   │───▶│  消息队列    │───▶│  数据处理中心  │
│             │    │ (RabbitMQ)   │    │                │
└─────────────┘    └──────────────┘    └─────────┬──────┘
                                                │
                                                ▼
┌─────────────┐    ┌──────────────┐    ┌────────────────┐
│   搜索引擎   │◀───│    缓存层    │◀───│  应用服务层    │
│ (Elasticsearch) │ (Redis)       │   (业务逻辑)    │
└─────────────┘    └──────────────┘    └────────────────┘
```

### 服务架构

#### 1. 数据采集层
- 多平台演唱会数据爬虫
- 酒店景点数据爬虫
- 交通数据API接入
- 数据质量监控

#### 2. 数据处理层
- 数据清洗和标准化
- 消息队列异步处理
- 缓存层优化性能
- 搜索引擎索引构建

#### 3. 业务逻辑层
- 用户管理服务
- 演唱会查询服务
- 智能推荐引擎
- 行程规划服务
- 通知提醒服务

#### 4. 接口服务层
- RESTful API
- WebSocket实时通知
- 文件上传下载
- 第三方API集成

## 配置说明

### application.yml 主要配置

```yaml
# 数据库配置
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/concert_db
    username: root
    password: 123456
  
  # Redis配置
  redis:
    host: localhost
    port: 6379
    
  # RabbitMQ配置
  rabbitmq:
    host: localhost
    port: 5672
    
  # Elasticsearch配置
  elasticsearch:
    uris: http://localhost:9200

# JWT配置
jwt:
  secret: concert-secret-key
  expiration: 86400000
```

## 部署方案

### 单机部署
```bash
# 1. 安装依赖服务
- MySQL 8.0
- Redis 6.x
- RabbitMQ 3.9
- Elasticsearch 7.x
- IK分词器

# 2. 配置环境
- 配置数据库连接
- 配置消息队列
- 配置搜索引擎

# 3. 启动应用
mvn spring-boot:run
```

### Docker部署
```bash
# 构建镜像
docker build -t concert-system .

# 运行容器
docker run -p 8080:8080 concert-system
```

## 性能优化

### 1. 缓存策略
- 演唱会数据缓存 30分钟
- 城市热门演唱会缓存 1小时
- 搜索热度排行榜缓存 24小时

### 2. 搜索优化
- Elasticsearch分词器优化
- 拼音+中文双重索引
- 搜索结果缓存

### 3. 爬虫优化
- 分布式爬虫架构
- 代理IP池
- 智能频率控制
- 失败重试机制

## 监控报警

### 系统监控
- Spring Boot Actuator
- 自定义指标收集
- 异常报警
- 性能监控

### 业务监控
- 爬虫数据质量监控
- 搜索性能指标
- 用户行为分析
- 系统可用性监控

## 开发规范

### 代码规范
- 遵循Google Java Style
- 统一的异常处理机制
- 完善的日志记录
- 单元测试覆盖

### 数据库规范
- 统一的命名规范
- 适当的索引设计
- 数据完整性约束
- 定期备份策略

## 扩展计划

### 短期计划（1-3个月）
- [ ] 酒店数据爬虫开发
- [ ] 景点美食数据接入
- [ ] 智能推荐算法优化
- [ ] 移动端API开发

### 中期计划（3-6个月）
- [ ] 微信小程序版本
- [ ] 第三方支付集成
- [ ] 用户评价系统
- [ ] 数据可视化大屏

### 长期计划（6-12个月）
- [ ] AI智能客服
- [ ] 个性化AI推荐
- [ ] 多语言支持
- [ ] 国际化部署

## 常见问题

### Q: 如何解决爬虫被反爬的问题？
A: 系统集成了多种反爬虫对策：
- IP代理池轮换
- User-Agent随机化
- 请求频率自适应
- 验证码识别处理

### Q: 如何保证搜索性能？
A: 通过多层优化保证性能：
- Elasticsearch集群部署
- Redis缓存热点数据
- 数据库查询优化
- 异步处理机制

### Q: 如何实现高可用？
A: 采用分布式架构：
- 服务无状态设计
- Redis集群
- RabbitMQ集群
- Elasticsearch集群

## 贡献指南

欢迎提交Pull Request！

1. Fork项目
2. 创建功能分支
3. 提交代码
4. 创建Pull Request

## 许可证

[MIT License](LICENSE)