package com.penaelchole.backend.notification;

import java.time.Instant;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.penaelchole.backend.common.BaseEntityService;
import com.penaelchole.backend.common.Filters;
import com.penaelchole.backend.common.ListQuery;
import com.penaelchole.backend.common.ResourceNotFoundException;

@Service
public class NotificationService
        implements BaseEntityService<NotificationRequest, NotificationResponse, NotificationPatch> {

    private final NotificationRepository repository;

    public NotificationService(NotificationRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> list(ListQuery query) {
        return repository
                .findAll(Filters.<Notification>byEquality(query.filters()), query.toPageable(Notification.class))
                .map(NotificationResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationResponse get(String id) {
        Notification notification = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notificacion no encontrada"));
        return NotificationResponse.from(notification);
    }

    @Override
    @Transactional
    public NotificationResponse insert(NotificationRequest request) {
        Notification notification = NotificationService.toEntity(request);
        return NotificationResponse.from(repository.saveAndFlush(notification));
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public List<NotificationResponse> bulkInsert(List<NotificationRequest> request) {
        List<Notification> notifications = request.stream().map(NotificationService::toEntity).toList();
        return repository.saveAllAndFlush(notifications).stream().map(NotificationResponse::from).toList();
    }

    @Override
    @Transactional
    public NotificationResponse update(String id, NotificationPatch changes) {
        Notification notification = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notificacion no encontrada"));
        notification.applyChanges(changes);
        return NotificationResponse.from(notification);
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(String id) {
        repository.deleteById(id);
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void bulkDelete(List<String> ids) {
        repository.deleteAllById(ids);
    }

    private static Notification toEntity(NotificationRequest request) {
        Notification notification = new Notification(
                Boolean.TRUE.equals(request.archived()),
                request.archiveDate(),
                request.publishDate() != null ? request.publishDate() : Instant.now(),
                request.readBy(),
                request.message(),
                request.type(),
                request.title());

        return notification;
    }

}
