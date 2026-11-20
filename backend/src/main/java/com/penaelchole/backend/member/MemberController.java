package com.penaelchole.backend.member;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.penaelchole.backend.common.ListQuery;

import jakarta.validation.Valid;
import tools.jackson.databind.JsonNode;

/**
 * Endpoints REST de Member. Contrato en backend/API.md, sección "Entities".
 */
@RestController
@RequestMapping("/api/entities/Integrante")
public class MemberController {

    private final MemberService service;

    public MemberController(MemberService service) {
        this.service = service;
    }

    // GET /api/entities/Integrante -> frontend: api.entities.Integrante.list()
    @GetMapping
    public List<MemberResponse> list(ListQuery query) {
        return service.list(query);
    }

    @GetMapping("/{id}")
    public MemberResponse get(@PathVariable String id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MemberResponse insert(@Valid @RequestBody MemberRequest request) {
        return service.insert(request);
    }

    @PostMapping("/bulk")
    @ResponseStatus(HttpStatus.CREATED)
    public List<MemberResponse> bulkCreate(@Valid @RequestBody List<MemberRequest> request) {
        return service.bulkInsert(request);
    }

    @PatchMapping("/{id}")
    public MemberResponse update(@PathVariable String id, @RequestBody JsonNode changes) {
        return service.update(id, MemberPatch.from(changes));
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
