package com.penaelchole.backend.achievement;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.penaelchole.backend.common.BaseEntityController;

@RestController
@RequestMapping("/api/entities/Logro")
public class AchievementController
        extends BaseEntityController<AchievementRequest, AchievementResponse, AchievementPatch> {

    public AchievementController(AchievementService service) {
        super(service, AchievementPatch::from);
    }

}
