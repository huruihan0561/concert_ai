package com.concert.vo;

import lombok.Data;
import java.io.Serializable;

/**
 * 统一的API响应结果类
 */
@Data
public class Result<T> implements Serializable {
    private static final long serialVersionUID = 1L;

    private boolean success;
    private int code;
    private String message;
    private T data;

    private Result(boolean success, int code, String message, T data) {
        this.success = success;
        this.code = code;
        this.message = message;
        this.data = data;
    }

    /**
     * 成功响应
     */
    public static <T> Result<T> ok() {
        return new Result<>(true, 200, "success", null);
    }

    /**
     * 成功响应，带数据
     */
    public static <T> Result<T> ok(T data) {
        return new Result<>(true, 200, "success", data);
    }

    /**
     * 成功响应，带数据和自定义消息
     */
    public static <T> Result<T> ok(String message, T data) {
        return new Result<>(true, 200, message, data);
    }

    /**
     * 失败响应
     */
    public static <T> Result<T> error() {
        return new Result<>(false, 500, "error", null);
    }

    /**
     * 失败响应，带错误信息
     */
    public static <T> Result<T> error(String message) {
        return new Result<>(false, 500, message, null);
    }

    /**
     * 失败响应，带错误码和错误信息
     */
    public static <T> Result<T> error(int code, String message) {
        return new Result<>(false, code, message, null);
    }
}