package com.penaelchole.backend.notification;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.penaelchole.backend.common.BaseEntityController;
import com.penaelchole.backend.common.DeleteManyRequest;
import com.penaelchole.backend.common.ListQuery;

import tools.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/entities/Notificacion")
public class NotificationController implements BaseEntityController<NotificationRequest, NotificationResponse> {
    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @Override
    public List<NotificationResponse> list(ListQuery query) {
        return service.list(query);
    }

    @Override
    public NotificationResponse get(String id) {
        return service.get(id);
    }

    @Override
    public NotificationResponse insert(NotificationRequest request) {
        return service.insert(request);
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public List<NotificationResponse> bulkCreate(List<NotificationRequest> request) {
        return service.bulkInsert(request);
    }

    @Override
    public NotificationResponse update(String id, JsonNode changes) {
        return service.update(id, NotificationPatch.from(changes));
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
