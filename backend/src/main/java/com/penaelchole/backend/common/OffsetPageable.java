package com.penaelchole.backend.common;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public record OffsetPageable(long offset, int limit, Sort sort) implements Pageable {
    public OffsetPageable {
        if (offset < 0 || limit < 1)
            throw new IllegalArgumentException("skip/limit no válidos");
    }

    @Override
    public long getOffset() {
        return offset;
    }

    @Override
    public int getPageSize() {
        return limit;
    }

    @Override
    public int getPageNumber() {
        return (int) (offset / limit);
    }

    @Override
    public Sort getSort() {
        return sort;
    }

    @Override
    public boolean hasPrevious() {
        return offset > 0;
    }

    @Override
    public Pageable next() {
        return new OffsetPageable(offset + limit, limit, sort);
    }

    @Override
    public Pageable previousOrFirst() {
        return new OffsetPageable(Math.max(0, offset - limit), limit, sort);
    }

    @Override
    public Pageable first() {
        return new OffsetPageable(0, limit, sort);
    }

    @Override
    public Pageable withPage(int page) {
        return new OffsetPageable((long) page * limit, limit, sort);
    }
}
