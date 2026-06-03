package com.concert.service;

import com.aliyun.oss.OSS;
import com.aliyun.oss.model.ObjectMetadata;
import com.concert.config.AliyunOssConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OssService {

    private final OSS ossClient;
    @Qualifier("aliyunOssConfig")  // 指定Bean名称
    private final AliyunOssConfig ossConfig;

    /**
     * 上传文件到OSS
     * @param data 文件字节数组
     * @param folder 文件夹路径（如：user_photos/、generated/）
     * @param fileName 文件名
     * @return 文件访问URL
     */
    public String uploadFile(byte[] data, String folder, String fileName) {
        try {
            String objectName = folder + fileName;

            // 设置元数据
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(data.length);
            metadata.setContentType(getContentType(fileName));
            metadata.setContentDisposition("inline");

            // 上传
            try (InputStream inputStream = new ByteArrayInputStream(data)) {
                ossClient.putObject(ossConfig.getBucketName(), objectName, inputStream, metadata);
            }

            // 返回URL
            String url = ossConfig.getCustomDomain() != null && !ossConfig.getCustomDomain().isEmpty()
                    ? ossConfig.getCustomDomain() + "/" + objectName
                    : "https://" + ossConfig.getBucketName() + "." + ossConfig.getEndpoint() + "/" + objectName;

            log.info("文件上传成功: {}", url);
            return url;

        } catch (Exception e) {
            log.error("OSS上传失败", e);
            throw new RuntimeException("文件上传失败: " + e.getMessage());
        }
    }

    /**
     * 上传MultipartFile到OSS
     */
    public String uploadFile(MultipartFile file, String folder) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".jpg";
        String fileName = UUID.randomUUID().toString() + extension;
        return uploadFile(file.getBytes(), folder, fileName);
    }

    /**
     * 生成带时间戳的文件名
     */
    public String generateFileName(String prefix, String suffix) {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String timestamp = String.valueOf(System.currentTimeMillis());
        return prefix + "_" + date + "_" + timestamp + suffix;
    }

    /**
     * 根据文件名获取ContentType
     */
    private String getContentType(String fileName) {
        if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (fileName.endsWith(".png")) {
            return "image/png";
        } else if (fileName.endsWith(".gif")) {
            return "image/gif";
        }
        return "application/octet-stream";
    }
}