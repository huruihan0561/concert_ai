package com.concert.config;

import com.concert.agent.ConcertTools;
import com.concert.agent.MusicTools;
import com.concert.agent.PlanningTools;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.client.RestTemplate;

@Configuration
public class SpringAIConfig {

    @Value("${spring.ai.openai.api-key}")
    private String apiKey;

    @Value("${spring.ai.openai.base-url}")
    private String baseUrl;

    @Bean
    @Primary
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public OpenAiChatModel openAiChatModel() {
        OpenAiApi openAiApi = new OpenAiApi(baseUrl, apiKey);
        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .model("deepseek-chat")
                .temperature(0.8)
                .maxTokens(4000)
                .build();
        return OpenAiChatModel.builder()
                .openAiApi(openAiApi)
                .defaultOptions(options)
                .build();
    }

    @Bean
    public ChatClient chatClient(OpenAiChatModel openAiChatModel) {
        return ChatClient.builder(openAiChatModel).build();
    }

    @Bean
    public ToolCallbackProvider musicToolsProvider(MusicTools musicTools) {
        return MethodToolCallbackProvider.builder().toolObjects(musicTools).build();
    }

    @Bean
    public ToolCallbackProvider planningToolsProvider(PlanningTools planningTools) {
        return MethodToolCallbackProvider.builder().toolObjects(planningTools).build();
    }

    @Bean
    public ToolCallbackProvider concertToolsProvider(ConcertTools concertTools) {
        return MethodToolCallbackProvider.builder().toolObjects(concertTools).build();
    }

    @Bean
    public ToolCallbackProvider allToolsProvider(
            ToolCallbackProvider musicToolsProvider,
            ToolCallbackProvider planningToolsProvider,
            ToolCallbackProvider concertToolsProvider) {
        return MethodToolCallbackProvider.builder()
                .toolObjects(
                        musicToolsProvider,
                        planningToolsProvider,
                        concertToolsProvider)
                .build();
    }
}