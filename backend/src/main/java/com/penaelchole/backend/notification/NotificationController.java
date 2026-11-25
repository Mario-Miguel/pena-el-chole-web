package com.penaelchole.backend.notification;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.penaelchole.backend.common.BaseEntityController;

@RestController
@RequestMapping("/api/entities/Notificacion")
public class NotificationController
        extends BaseEntityController<NotificationRequest, NotificationResponse, NotificationPatch> {

    public NotificationController(NotificationService service) {
        super(service, NotificationPatch::from);
    }

}
