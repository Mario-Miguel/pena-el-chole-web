package com.penaelchole.backend.account;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.penaelchole.backend.common.BaseEntityController;
import com.penaelchole.backend.common.DeleteManyRequest;
import com.penaelchole.backend.common.ListQuery;

import tools.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/entities/SesionUsuario")
public class UserAccountController implements BaseEntityController<UserAccountRequest, UserAccountResponse> {
    private final UserAccountService service;

    public UserAccountController(UserAccountService service) {
        this.service = service;
    }

    @Override
    public List<UserAccountResponse> list(ListQuery query) {
        return service.list(query);
    }

    @Override
    public UserAccountResponse get(String id) {
        return service.get(id);
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public UserAccountResponse insert(UserAccountRequest request) {
        return service.insert(request);
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserAccountResponse> bulkCreate(List<UserAccountRequest> request) {
        return service.bulkInsert(request);
    }

    @Override
    public UserAccountResponse update(String id, JsonNode changes) {
        return service.update(id, UserAccountPatch.from(changes));
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(String id) {
        service.delete(id);
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public void bulkDelete(DeleteManyRequest request) {
        service.bulkDelete(request.ids());
    }

}
