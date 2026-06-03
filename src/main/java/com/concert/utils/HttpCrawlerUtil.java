package com.concert.utils;

import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Proxy;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
import java.util.concurrent.TimeUnit;

@Slf4j
public class HttpCrawlerUtil {

    private static final Random random = new Random();

    // User-Agent列表
    private static final List<String> USER_AGENTS = Arrays.asList(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0"
    );

    // 获取随机User-Agent
    public static String getRandomUserAgent() {
        return USER_AGENTS.get(random.nextInt(USER_AGENTS.size()));
    }

    // 使用Jsoup获取页面
    public static Document fetchDocument(String url, int timeout) throws IOException {
        return Jsoup.connect(url)
                .userAgent(getRandomUserAgent())
                .timeout(timeout)
                .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
                .header("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
                .header("Accept-Encoding", "gzip, deflate, br")
                .header("Connection", "keep-alive")
                .header("Upgrade-Insecure-Requests", "1")
                .followRedirects(true)
                .get();
    }

    // 使用RestTemplate发送GET请求
    public static String httpGet(String url) {
        try {
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(10000);
            factory.setReadTimeout(10000);

            RestTemplate restTemplate = new RestTemplate(factory);

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", getRandomUserAgent());
            headers.set("Accept", "application/json, text/plain, */*");
            headers.set("Accept-Language", "zh-CN,zh;q=0.9");
            headers.set("Referer", "https://www.google.com/");

            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("HTTP GET请求失败: {}", url, e);
        }
        return null;
    }

    // 使用RestTemplate发送POST请求
    public static String httpPost(String url, String requestBody) {
        try {
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(10000);
            factory.setReadTimeout(10000);

            RestTemplate restTemplate = new RestTemplate(factory);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("User-Agent", getRandomUserAgent());
            headers.set("Accept", "application/json");

            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("HTTP POST请求失败: {}", url, e);
        }
        return null;
    }

    // 随机延迟，避免请求过快
    public static void randomDelay(int minMillis, int maxMillis) {
        try {
            int delay = minMillis + random.nextInt(maxMillis - minMillis);
            TimeUnit.MILLISECONDS.sleep(delay);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    // 随机延迟（默认500-2000ms）
    public static void randomDelay() {
        randomDelay(500, 2000);
    }

    // 提取城市名称
    public static String extractCity(String venueOrAddress) {
        if (!StringUtils.hasText(venueOrAddress)) {
            return "未知城市";
        }

        // 常见城市列表
        String[] cities = {"北京", "上海", "广州", "深圳", "杭州", "南京", "成都", "重庆", "武汉",
                "西安", "苏州", "天津", "长沙", "郑州", "沈阳", "青岛", "宁波", "东莞",
                "无锡", "佛山", "合肥", "大连", "福州", "厦门", "哈尔滨", "济南", "温州",
                "南宁", "长春", "泉州", "石家庄", "贵阳", "南昌", "金华", "常州", "珠海",
                "惠州", "嘉兴", "南通", "中山", "太原", "昆明", "烟台", "兰州", "绍兴"};

        for (String city : cities) {
            if (venueOrAddress.contains(city)) {
                return city;
            }
        }

        return "未知城市";
    }

    // 清理文本
    public static String cleanText(String text) {
        if (!StringUtils.hasText(text)) {
            return "";
        }
        return text.trim().replaceAll("\\s+", " ").replaceAll("&nbsp;", " ");
    }
}
