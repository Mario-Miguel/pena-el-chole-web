package com.penaelchole.backend.common;

import java.util.List;
import java.util.function.Function;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;

import jakarta.validation.Valid;
import tools.jackson.databind.JsonNode;

public abstract class BaseEntityController<T, R, P> {

    private final BaseEntityService<T, R, P> service;
    private final Function<JsonNode, P> patchParse;

    public BaseEntityController(BaseEntityService<T, R, P> service,
            Function<JsonNode, P> patchParse) {
        this.service = service;
        this.patchParse = patchParse;
    }

    @GetMapping
    public List<R> list(ListQuery query) {
        return service.list(query);
    }

    @GetMapping("/{id}")
    public R get(@PathVariable String id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public R insert(@Valid @RequestBody T request) {
        return service.insert(request);
    }

    @PostMapping("/bulk")
    @ResponseStatus(HttpStatus.CREATED)
    public List<R> bulkCreate(@Valid @RequestBody List<T> request) {
        return service.bulkInsert(request);
    }

    @PatchMapping("/{id}")
    public R update(@PathVariable String id, @RequestBody JsonNode changes) {
        return service.update(id, patchParse.apply(changes));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        service.delete(id);
    }

    @PostMapping("/delete-many")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void bulkDelete(@Valid @RequestBody DeleteManyRequest request) {
        service.bulkDelete(request.ids());
    }
}
