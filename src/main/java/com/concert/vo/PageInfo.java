package com.concert.vo;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

/**
 * 分页响应结果类
 */
@Data
public class PageInfo<T> implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 当前页码
     */
    private long current;

    /**
     * 每页大小
     */
    private long size;

    /**
     * 总记录数
     */
    private long total;

    /**
     * 总页数
     */
    private long pages;

    /**
     * 数据列表
     */
    private List<T> records;
}