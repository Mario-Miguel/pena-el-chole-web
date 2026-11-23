package com.penaelchole.backend.member;

import java.util.List;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.penaelchole.backend.common.BaseEntityController;
import com.penaelchole.backend.common.DeleteManyRequest;
import com.penaelchole.backend.common.ListQuery;

import jakarta.validation.Valid;
import tools.jackson.databind.JsonNode;

/**
 * Endpoints REST de Member. Contrato en backend/API.md, sección "Entities".
 */
@RestController
@RequestMapping("/api/entities/Integrante")
public class MemberController implements BaseEntityController<MemberRequest, MemberResponse> {

    private final MemberService service;

    public MemberController(MemberService service) {
        this.service = service;
    }

    // GET /api/entities/Integrante -> frontend: api.entities.Integrante.list()
    @Override
    public List<MemberResponse> list(ListQuery query) {
        return service.list(query);
    }

    @Override
    public MemberResponse get(@PathVariable String id) {
        return service.get(id);
    }

    @Override
    public MemberResponse insert(@Valid @RequestBody MemberRequest request) {
        return service.insert(request);
    }

    @Override
    public List<MemberResponse> bulkCreate(@Valid @RequestBody List<MemberRequest> request) {
        return service.bulkInsert(request);
    }

    @Override
    public MemberResponse update(@PathVariable String id, @RequestBody JsonNode changes) {
        return service.update(id, MemberPatch.from(changes));
    }

    @Override
    public void delete(@PathVariable String id) {
        service.delete(id);
    }

    @Override
    public void bulkDelete(@Valid @RequestBody DeleteManyRequest request) {
        service.bulkDelete(request.ids());
    }
}
