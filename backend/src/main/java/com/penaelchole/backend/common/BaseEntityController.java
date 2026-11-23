package com.penaelchole.backend.common;

import java.util.List;

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

public interface BaseEntityController<R, T> {

    @GetMapping
    public List<T> list(ListQuery query);

    @GetMapping("/{id}")
    public T get(@PathVariable String id);

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public T insert(@Valid @RequestBody R request);

    @PostMapping("/bulk")
    @ResponseStatus(HttpStatus.CREATED)
    public List<T> bulkCreate(@Valid @RequestBody List<R> request);

    @PatchMapping("/{id}")
    public T update(@PathVariable String id, @RequestBody JsonNode changes);

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id);

    @PostMapping("/delete-many")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void bulkDelete(@Valid @RequestBody DeleteManyRequest request);
}
