package com.concert.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("演唱会攻略系统 API 文档")
                        .description("SpringDoc 接口文档 - 提供演唱会管理、购票攻略、用户管理等功能")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("开发团队")
                                .email("support@concert.com")
                                .url("https://github.com/concert"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("http://springdoc.org"))
                        .termsOfService("http://swagger.io/terms/"))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")
                                .description("开发环境")
                ));
    }
}