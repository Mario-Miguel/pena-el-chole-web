package com.penaelchole.backend.appconfig;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.penaelchole.backend.common.BaseEntityController;
import com.penaelchole.backend.common.DeleteManyRequest;
import com.penaelchole.backend.common.ListQuery;

import tools.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/entities/AppConfig")
public class AppConfigController implements BaseEntityController<AppConfigRequest, AppConfigResponse> {
    private final AppConfigService service;

    public AppConfigController(AppConfigService service) {
        this.service = service;
    }

    @Override
    public List<AppConfigResponse> list(ListQuery query) {
        return service.list(query);
    }

    @Override
    public AppConfigResponse get(String id) {
        return service.get(id);
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public AppConfigResponse insert(AppConfigRequest request) {
        return service.insert(request);
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public List<AppConfigResponse> bulkCreate(List<AppConfigRequest> request) {
        return service.bulkInsert(request);
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public AppConfigResponse update(String id, JsonNode changes) {
        return service.update(id, AppConfigPatch.from(changes));
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
