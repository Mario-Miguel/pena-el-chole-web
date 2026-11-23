package com.penaelchole.backend.common;

import java.util.List;

public interface BaseEntityService<T, R, Q> {

    public List<R> list(ListQuery query);

    public R get(String id);

    public R insert(T request);

    public List<R> bulkInsert(List<T> request);

    public R update(String id, Q changes);

    public void delete(String id);

    public void bulkDelete(List<String> ids);

}
