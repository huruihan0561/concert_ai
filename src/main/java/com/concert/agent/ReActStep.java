package com.concert.agent;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.io.Serializable;
import java.time.Instant;

/**
 * ReAct 推理链路中的单一步骤
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReActStep implements Serializable {

    /** 步骤序号（从1开始） */
    private int step;

    /** 步骤类型：thought（思考）/ tool_call（工具调用）/ tool_result（工具结果）/ final（最终回答） */
    private String type;

    /** 该步骤的描述文字 */
    private String description;

    /** 工具名称（仅 tool_call 类型有值） */
    private String toolName;

    /** 工具参数（JSON 字符串，仅 tool_call 类型有值） */
    private String toolArgs;

    /** 工具返回结果（仅 tool_result 类型有值） */
    private String toolResult;

    /** 该步骤的原始文本 */
    private String rawText;

    /** 发生时间戳 */
    private long timestamp;

    /** 是否为当前进行中步骤 */
    private boolean active;

    public static ReActStep thought(int step, String description, String rawText) {
        return ReActStep.builder()
                .step(step)
                .type("thought")
                .description(description)
                .rawText(rawText)
                .timestamp(System.currentTimeMillis())
                .active(true)
                .build();
    }

    public static ReActStep toolCall(int step, String toolName, String toolArgs, String rawText) {
        return ReActStep.builder()
                .step(step)
                .type("tool_call")
                .description("调用工具: " + toolName)
                .toolName(toolName)
                .toolArgs(toolArgs)
                .rawText(rawText)
                .timestamp(System.currentTimeMillis())
                .active(true)
                .build();
    }

    public static ReActStep toolResult(int step, String toolName, String toolResult, boolean active) {
        return ReActStep.builder()
                .step(step)
                .type("tool_result")
                .description("「" + toolName + "」执行完成")
                .toolName(toolName)
                .toolResult(toolResult)
                .timestamp(System.currentTimeMillis())
                .active(active)
                .build();
    }

    public static ReActStep finalAnswer(int step, String rawText) {
        return ReActStep.builder()
                .step(step)
                .type("final")
                .description("最终回答")
                .rawText(rawText)
                .timestamp(System.currentTimeMillis())
                .active(false)
                .build();
    }

    public static ReActStep error(int step, String errorMsg) {
        return ReActStep.builder()
                .step(step)
                .type("error")
                .description("执行异常")
                .rawText(errorMsg)
                .timestamp(System.currentTimeMillis())
                .active(false)
                .build();
    }
}
