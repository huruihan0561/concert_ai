package com.concert.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class ImageStorageService {

    private final OssService ossService;
    private final boolean useOss;

    @Value("${image.storage.local-path:./uploads/}")
    private String localPath;

    @Value("${image.storage.access-url:http://localhost:8080/uploads/}")
    private String localAccessUrl;

    public ImageStorageService(OssService ossService,
                               @Value("${image.storage.use-oss:false}") boolean useOss) {
        this.ossService = ossService;
        this.useOss = useOss;
    }

    /**
     * 保存用户上传的图片
     */
    public String saveUserPhoto(MultipartFile file, Long userId) throws IOException {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String fileName = userId + "_" + date + "_" + System.currentTimeMillis() + ".jpg";

        if (useOss && ossService != null) {
            // 使用阿里云OSS
            return ossService.uploadFile(file.getBytes(), "user_photos/", fileName);
        } else {
            // 使用本地存储
            return saveToLocal(file.getBytes(), "user_photos/", fileName);
        }
    }

    /**
     * 保存生成的应援合照
     */
    public String saveGeneratedPhoto(byte[] imageData, String singer, Long userId) throws IOException {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String fileName = userId + "_" + singer + "_" + date + "_" + System.currentTimeMillis() + ".jpg";

        if (useOss && ossService != null) {
            // 使用阿里云OSS
            return ossService.uploadFile(imageData, "generated/", fileName);
        } else {
            // 使用本地存储
            return saveToLocal(imageData, "generated/", fileName);
        }
    }

    /**
     * 保存到本地
     */
    private String saveToLocal(byte[] data, String folder, String fileName) throws IOException {
        Path uploadPath = Paths.get(localPath + folder);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(fileName);
        Files.write(filePath, data);

        log.info("文件已保存到本地: {}", filePath);
        return localAccessUrl + folder + fileName;
    }

    /**
     * 获取静态资源访问路径
     */
    public String getStaticUrl(String relativePath) {
        if (relativePath == null) return null;
        if (relativePath.startsWith("http")) return relativePath;
        return localAccessUrl + relativePath;
    }
}