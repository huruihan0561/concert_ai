-- 1. 演唱会表
CREATE TABLE concert (
                         id BIGINT PRIMARY KEY AUTO_INCREMENT comment '主键ID',
                         singer VARCHAR(100) NOT NULL COMMENT '歌手',
                         city VARCHAR(50) NOT NULL COMMENT '城市',
                         venue VARCHAR(200) COMMENT '场馆',
                         venue_address VARCHAR(300) COMMENT '场馆地址',
                         venue_latitude DECIMAL(10,6) COMMENT '场馆纬度',
                         venue_longitude DECIMAL(10,6) COMMENT '场馆经度',
                         show_time DATETIME NOT NULL COMMENT '演出时间',
                         doors_open_time DATETIME COMMENT '入场时间',
                         ticket_price VARCHAR(50) COMMENT '票价区间',
                         status VARCHAR(20) COMMENT '售票状态',
                         image_url VARCHAR(500) COMMENT '海报图'
);

-- 2. 城市信息表
CREATE TABLE city_info (
                           id BIGINT PRIMARY KEY AUTO_INCREMENT comment '主键ID',
                           city_name VARCHAR(50) NOT NULL UNIQUE COMMENT '城市名',
                           province VARCHAR(50) COMMENT '省份',
                           latitude DECIMAL(10,6) COMMENT '纬度',
                           longitude DECIMAL(11,6) COMMENT '经度',
                           description TEXT COMMENT '城市简介'
);

-- 3. 酒店表
CREATE TABLE hotel (
                       id BIGINT PRIMARY KEY AUTO_INCREMENT comment '主键ID',
                       city_id BIGINT NOT NULL COMMENT '城市ID',
                       hotel_name VARCHAR(200) NOT NULL comment '名称',
                       address VARCHAR(300) NOT NULL comment '地址',
                       image_url VARCHAR(500) COMMENT '图片',
                       star_rating INT COMMENT '星级 1-5',
                       price_range VARCHAR(50) COMMENT '价格区间',
                       latitude DECIMAL(10,6) comment '经度',
                       longitude DECIMAL(11,6) comment '纬度',
                       distance_to_venue_km DECIMAL(6,2) COMMENT '距场馆公里数',
                       FOREIGN KEY (city_id) REFERENCES city_info(id)
);

-- 4. 景点表
CREATE TABLE scenic (
                        id BIGINT PRIMARY KEY AUTO_INCREMENT comment '主键ID',
                        city_id BIGINT NOT NULL comment '城市ID',
                        spot_name VARCHAR(200) NOT NULL comment '景点名称',
                        image_url VARCHAR(500) COMMENT '图片',
                        category VARCHAR(20) COMMENT '自然/人文/娱乐/购物',
                        address VARCHAR(300) comment '地址',
                        ticket_price VARCHAR(50) comment '票价',
                        open_time VARCHAR(100) comment '开放时间',
                        duration VARCHAR(50) COMMENT '建议游玩时长',
                        popularity INT DEFAULT 0 COMMENT '热门度',
                        FOREIGN KEY (city_id) REFERENCES city_info(id)
);

-- 5. 餐饮推荐表
CREATE TABLE food_recommendation (
                                     id BIGINT PRIMARY KEY AUTO_INCREMENT comment '主键ID',
                                     city_id BIGINT NOT NULL comment '城市ID',
                                     restaurant_name VARCHAR(200) NOT NULL comment '餐厅名称',
                                     image_url VARCHAR(500) COMMENT '图片',
                                     cuisine VARCHAR(50) COMMENT '菜系',
                                     address VARCHAR(300) comment '地址',
                                     price_range VARCHAR(50) comment '价格范围',
                                     rating INT DEFAULT 3 COMMENT '1-5',
                                     features TEXT COMMENT '特色菜JSON',
                                     FOREIGN KEY (city_id) REFERENCES city_info(id)
);

-- 6. 交通方案表
CREATE TABLE transportation_option (
                                       id BIGINT PRIMARY KEY AUTO_INCREMENT comment '主键ID',
                                       from_city VARCHAR(50) NOT NULL COMMENT '出发城市',
                                       to_city VARCHAR(50) NOT NULL COMMENT '到达城市',
                                       option_type VARCHAR(20) NOT NULL COMMENT '出行方式：train/flight/car',
                                       departure_time DATETIME NOT NULL comment '出发时间',
                                       arrival_time DATETIME NOT NULL comment '到达时间',
                                       price DECIMAL(10,2) comment '价格',
                                       provider VARCHAR(100) COMMENT '运营商',
                                       seat_type VARCHAR(50) comment '座位类型'
);

-- 7. 天气表
CREATE TABLE weather_info (
                              id BIGINT PRIMARY KEY AUTO_INCREMENT comment '主键ID',
                              city VARCHAR(50) NOT NULL comment '城市',
                              date DATE NOT NULL comment '日期',
                              weather VARCHAR(50) comment '天气',
                              temperature_high DECIMAL(5,1) comment '最高温度',
                              temperature_low DECIMAL(5,1) comment '最低温度',
                              dressing_advice VARCHAR(200) comment '穿衣建议'
);

-- 8.场馆3D模型数据表
CREATE TABLE venue_model_3d (
                                id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
                                venue_name VARCHAR(100) NOT NULL COMMENT '场馆名称',
                                venue_city VARCHAR(50) NOT NULL COMMENT '所在城市',
                                venue_address VARCHAR(300) COMMENT '详细地址',
                                venue_description TEXT COMMENT '场馆简介',
                                latitude DECIMAL(10, 6) COMMENT '场馆纬度',
                                longitude DECIMAL(11, 6) COMMENT '场馆经度',
                                model_type VARCHAR(20) DEFAULT 'gltf' COMMENT '模型类型: gltf/obj/fbx/usdz',
                                model_url VARCHAR(500) NOT NULL COMMENT '模型文件URL',
                                texture_url VARCHAR(500) COMMENT '纹理贴图URL',
                                thumbnail_url VARCHAR(500) COMMENT '缩略图URL（用于列表预览）',
                                panorama_url VARCHAR(500) COMMENT '全景图URL（可选，用于VR模式）',
                                seat_capacity INT COMMENT '总座位数',
                                layout_data TEXT COMMENT '座位布局数据(JSON格式)',
                                facility_positions TEXT COMMENT '设施位置(JSON格式)',
                                interaction_script TEXT COMMENT '自定义交互脚本(JS)',
                                enable_auto_rotate BOOLEAN DEFAULT TRUE COMMENT '是否允许自动旋转',
                                enable_zoom BOOLEAN DEFAULT TRUE COMMENT '是否允许缩放',
                                default_zoom_level DECIMAL(3,2) DEFAULT 1.0 COMMENT '默认缩放级别',
                                status VARCHAR(20) DEFAULT 'active' COMMENT '状态: active/inactive/building',
                                version INT DEFAULT 1 COMMENT '模型版本号',
                                INDEX idx_venue_name (venue_name),
                                INDEX idx_venue_city (venue_city),
                                INDEX idx_status (status)
);


-- 9.艺人歌单表
CREATE TABLE playlist (
                          id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
                          singer_name VARCHAR(100) NOT NULL COMMENT '歌手名',
                          song_list TEXT NOT NULL COMMENT '歌单(JSON: [{songName, artist, audioUrl, coverUrl}])',
                          source_platform VARCHAR(50) COMMENT '来源平台(网易云/QQ音乐)',
                          source_url VARCHAR(500) COMMENT '歌单链接',
                          INDEX idx_singer (singer_name)
) ;


-- 1. 薛之谦 “万兽之王” 巡回演唱会-洛阳站 (多场)
INSERT INTO concert (singer, city, venue, venue_address, venue_latitude, venue_longitude, show_time, doors_open_time, ticket_price, status, image_url)
VALUES
    ('薛之谦', '洛阳', '洛阳市奥林匹克中心体育场', '河南省洛阳市伊滨区孝文大道', 34.6193, 112.4543, '2026-06-12 19:30:00', '2026-06-12 17:30:00', '317-1717', '预售中', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522180534_48_1.jpg'),
    ('薛之谦', '洛阳', '洛阳市奥林匹克中心体育场', '河南省洛阳市伊滨区孝文大道', 34.6193, 112.4543, '2026-06-13 19:30:00', '2026-06-13 17:30:00', '317-1717', '预售中', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522180534_48_1.jpg'),
    ('薛之谦', '洛阳', '洛阳市奥林匹克中心体育场', '河南省洛阳市伊滨区孝文大道', 34.6193, 112.4543, '2026-06-14 19:30:00', '2026-06-14 17:30:00', '317-1717', '预售中', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522180534_48_1.jpg');

-- 2. 徐良 “时间折叠” 巡回演唱会-青岛站 (多场)
INSERT INTO concert (singer, city, venue, venue_address, venue_latitude, venue_longitude, show_time, doors_open_time, ticket_price, status, image_url)
VALUES
    ('徐良', '青岛', '青岛市民健身中心体育馆', '青岛市高新区火炬路318号', 36.3015, 120.2239, '2026-06-12 19:30:00', '2026-06-12 17:30:00', '380-1580', '预售中', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522180539_52_1.jpg'),
    ('徐良', '青岛', '青岛市民健身中心体育馆', '青岛市高新区火炬路318号', 36.3015, 120.2239, '2026-06-13 19:30:00', '2026-06-13 17:30:00', '380-1580', '预售中', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522180539_52_1.jpg'),
    ('徐良', '青岛', '青岛市民健身中心体育馆', '青岛市高新区火炬路318号', 36.3015, 120.2239, '2026-06-14 19:30:00', '2026-06-14 17:30:00', '380-1580', '预售中', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522180539_52_1.jpg');

-- 3. 汪苏泷 「明日世界」世界巡回演唱会-成都站 (多场)
INSERT INTO concert (singer, city, venue, venue_address, venue_latitude, venue_longitude, show_time, doors_open_time, ticket_price, status, image_url)
VALUES
    ('汪苏泷', '成都', '成都东安湖体育公园主体育场', '成都市龙泉驿区体育公园路', 30.6484, 104.2733, '2026-06-19 19:30:00', '2026-06-19 17:30:00', '380-1680', '预售中', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522180536_50_1.jpg'),
    ('汪苏泷', '成都', '成都东安湖体育公园主体育场', '成都市龙泉驿区体育公园路', 30.6484, 104.2733, '2026-06-20 19:30:00', '2026-06-20 17:30:00', '380-1680', '预售中', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522180536_50_1.jpg'),
    ('汪苏泷', '成都', '成都东安湖体育公园主体育场', '成都市龙泉驿区体育公园路', 30.6484, 104.2733, '2026-06-21 19:30:00', '2026-06-21 17:30:00', '380-1680', '预售中', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522180536_50_1.jpg');

-- 4. 马思唯 巡回演唱会-大连站
INSERT INTO concert (singer, city, venue, venue_address, venue_latitude, venue_longitude, show_time, doors_open_time, ticket_price, status, image_url)
VALUES
    ('马思唯', '大连', '大连体育中心体育馆', '大连市甘井子区岚岭路699号', 39.0134, 121.5928, '2026-07-04 19:30:00', '2026-07-04 17:30:00', '399-999', '预售中', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522172334_2668_12.jpg');

-- 5. 范玮琪 “我们之间的事” 巡回演唱会-长沙站
INSERT INTO concert (singer, city, venue, venue_address, venue_latitude, venue_longitude, show_time, doors_open_time, ticket_price, status, image_url)
VALUES
    ('范玮琪', '长沙', '长沙国际会展演艺中心', '长沙市国展路长沙国际会展中心', 28.1644, 113.1054, '2026-07-11 19:00:00', '2026-07-11 17:00:00', '380-1280', '预售中', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522172339_2670_12.jpg');

-- 6. 蔡依林 PLEASURE巡回演唱会-南昌站
INSERT INTO concert (singer, city, venue, venue_address, venue_latitude, venue_longitude, show_time, doors_open_time, ticket_price, status, image_url)
VALUES
    ('蔡依林', '南昌', '南昌国际体育中心体育场', '南昌市红谷滩新区三清山大道', 28.6407, 115.8241, '2026-07-11 19:00:00', '2026-07-11 17:00:00', '490-1690', '预售中', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522172640_2679_12.jpg');

-- 7. 大张伟 “大好时光” 演唱会-郑州站
INSERT INTO concert (singer, city, venue, venue_address, venue_latitude, venue_longitude, show_time, doors_open_time, ticket_price, status, image_url)
VALUES
    ('大张伟', '郑州', '郑州奥林匹克体育中心', '郑州市常西湖新区西四环', 34.7447, 113.5286, '2026-07-11 19:00:00', '2026-07-11 17:00:00', '233-1831', '缺货', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522172342_2672_12.jpg');

-- 8. 凤凰传奇「吉祥如意」巡回演唱会-南京站 (多场)
INSERT INTO concert (singer, city, venue, venue_address, venue_latitude, venue_longitude, show_time, doors_open_time, ticket_price, status, image_url)
VALUES
    ('凤凰传奇', '南京', '南京奥体中心体育场', '南京市建邺区江东中路222号', 32.0091, 118.7208, '2026-07-03 19:00:00', '2026-07-03 17:00:00', '380-1380', '预售中', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522172644_2681_12.jpg'),
    ('凤凰传奇', '南京', '南京奥体中心体育场', '南京市建邺区江东中路222号', 32.0091, 118.7208, '2026-07-04 19:00:00', '2026-07-04 17:00:00', '380-1380', '预售中', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522172644_2681_12.jpg'),
    ('凤凰传奇', '南京', '南京奥体中心体育场', '南京市建邺区江东中路222号', 32.0091, 118.7208, '2026-07-05 19:00:00', '2026-07-05 17:00:00', '380-1380', '预售中', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522172644_2681_12.jpg');

-- 9. 李荣浩「黑马」世界巡回演唱会-赣州站
INSERT INTO concert (singer, city, venue, venue_address, venue_latitude, venue_longitude, show_time, doors_open_time, ticket_price, status, image_url)
VALUES
    ('李荣浩', '赣州', '赣州市全民健身中心体育场', '赣州市蓉江新区赣南大道', 25.8073, 114.9259, '2026-07-18 19:00:00', '2026-07-18 17:00:00', '380-980', '预售中', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522172331_2666_12.jpg');

-- 10. 王力宏「最好的地方」世界巡回演唱会-长沙站 (多场)
INSERT INTO concert (singer, city, venue, venue_address, venue_latitude, venue_longitude, show_time, doors_open_time, ticket_price, status, image_url)
VALUES
    ('王力宏', '长沙', '长沙贺龙体育场', '长沙市天心区芙蓉中路二段188号', 28.1902, 112.9898, '2026-07-18 19:30:00', '2026-07-18 17:30:00', '380-1880', '预售中', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522180532_46_1.jpg'),
    ('王力宏', '长沙', '长沙贺龙体育场', '长沙市天心区芙蓉中路二段188号', 28.1902, 112.9898, '2026-07-19 19:30:00', '2026-07-19 17:30:00', '380-1880', '预售中', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522180532_46_1.jpg');

-- 11. 黄丽玲A-Lin「歌迹」巡回演唱会-北京站 (多场)
INSERT INTO concert (singer, city, venue, venue_address, venue_latitude, venue_longitude, show_time, doors_open_time, ticket_price, status, image_url)
VALUES
    ('黄丽玲', '北京', '华熙LIVE·五棵松', '北京市海淀区复兴路69号', 39.9124, 116.2745, '2026-07-18 19:00:00', '2026-07-18 17:00:00', '380-1380', '预售中', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522172747_2684_12.jpg'),
    ('黄丽玲', '北京', '华熙LIVE·五棵松', '北京市海淀区复兴路69号', 39.9124, 116.2745, '2026-07-19 19:00:00', '2026-07-19 17:00:00', '380-1380', '预售中', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522172747_2684_12.jpg');

-- 12. 陈粒「一粒」十周年巡回演唱会-中国香港站
INSERT INTO concert (singer, city, venue, venue_address, venue_latitude, venue_longitude, show_time, doors_open_time, ticket_price, status, image_url)
VALUES
    ('陈粒', '香港', '红磡香港体育馆', '香港九龙红磡畅运道9号', 22.3022, 114.1822, '2026-08-08 20:15:00', '2026-08-08 18:15:00', '488-988', '预售中', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522172753_2689_12.jpg');

-- 13. 邓紫棋 I AM GLORIA 世界巡回演唱会2.0-重庆站
INSERT INTO concert (singer, city, venue, venue_address, venue_latitude, venue_longitude, show_time, doors_open_time, ticket_price, status, image_url)
VALUES
    ('邓紫棋', '重庆', '重庆奥体中心体育场', '重庆市九龙坡区奥体路7号', 29.5317, 106.5037, '2026-08-22 19:00:00', '2026-08-22 17:00:00', '380-1580', '预售中', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522172637_2677_12.jpg');

-- 14. 梁静茹「Best, 茹果我不唱情歌」巡回演唱会-西安站
INSERT INTO concert (singer, city, venue, venue_address, venue_latitude, venue_longitude, show_time, doors_open_time, ticket_price, status, image_url)
VALUES
    ('梁静茹', '西安', '西安奥体中心体育场', '西安市国际港务区奥体大道2020号', 34.3743, 109.0621, '2026-09-05 19:30:00', '2026-09-05 17:30:00', '待定', '预售中', 'https://sxcloudplus.top/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260522172750_2686_12.jpg');

-- 15.张杰 开往1982世界巡回演唱会-新加坡站
INSERT INTO concert (singer, city, venue, venue_address, venue_latitude, venue_longitude, show_time, doors_open_time, ticket_price, status, image_url)
VALUES
    ('张杰', '新加坡', '新加坡室内体育馆', '2 Stadium Walk, 新加坡 397691', NULL, NULL, '2026-06-27 19:30:00', '2026-06-27 18:00:00', '880-1880', '预售中', 'https://sxcloudplus.top/75396061f4ce827e3086e8d25969f2dd.jpg');


INSERT INTO playlist (singer_name, song_list) VALUES
                                                  ('周杰伦', '["晴天","七里香","告白气球","夜曲","稻香","青花瓷","简单爱","双截棍"]'),
                                                  ('林俊杰', '["曹操","不为谁而作的歌","可惜没如果","修炼爱情","一千年以后","她说","美人鱼"]'),
                                                  ('邓紫棋', '["光年之外","泡沫","倒数","喜欢你","多远都要在一起","句号","摩天动物园"]'),
                                                  ('薛之谦', '["演员","丑八怪","绅士","刚刚好","意外","你还要我怎样","认真的雪"]'),
                                                  ('五月天', '["突然好想你","倔强","恋爱ing","温柔","知足","干杯","离开地球表面"]'),
                                                  ('陈奕迅', '["十年","富士山下","爱情转移","K歌之王","浮夸","好久不见","淘汰"]'),
                                                  ('张杰', '["逆战","天下","最美的太阳","明天过后","着魔","三生三世"]'),
                                                  ('蔡依林', '["日不落","舞娘","爱情36计","倒带","说爱你","特务J","大艺术家"]'),
                                                  ('李荣浩', '["模特","李白","年少有为","麻雀","乌梅子酱","不将就","爸爸妈妈"]'),
                                                  ('毛不易', '["消愁","像我这样的人","平凡的一天","借","东北民谣","不染","牧马城市"]'),
                                                  ('汪苏泷', '["不分手的恋爱","万有引力","后会无期","有点甜","苦笑"]'),
                                                  ('凤凰传奇', '["最炫民族风","月亮之上","自由飞翔","荷塘月色","我从草原来","山河图"]'),
                                                  ('梁静茹', '["勇气","暖暖","分手快乐","会呼吸的痛","宁夏","燕尾蝶","丝路"]'),
                                                  ('王力宏', '["唯一","龙的传人","大城小爱","改变自己","心跳","你不知道的事"]'),
                                                  ('大张伟', '["倍儿爽","穷开心","嘻唰唰","我的果汁分你一半","化蝶飞"]'),
                                                  ('陈粒', '["奇妙能力歌","易燃易爆炸","小半","历历万乡","走马","光"]'),
                                                  ('徐良', '["客官不可以","坏女孩","七秒钟的记忆","那时雨","红装"]'),
                                                  ('黄丽玲', '["以前以后","失恋无罪","幸福了然后呢","大大的拥抱"]'),
                                                  ('马思唯', '["R&B All Night","Made in China","暴风雨","黑马王子","豆瓣酱"]'),
                                                  ('范玮琪', '["最初的梦想","一个像夏天一个像秋天","最重要的决定","是非题"]');


CREATE TABLE `user` (
                        `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
                        `username` VARCHAR(50) COMMENT '用户名',
                        `avatar_url` VARCHAR(500) COMMENT '头像URL',
                        `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_follow_concert (
                                     id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                     user_id BIGINT NOT NULL,
                                     concert_id BIGINT NOT NULL,
                                     follow_time DATETIME DEFAULT CURRENT_TIMESTAMP
);
