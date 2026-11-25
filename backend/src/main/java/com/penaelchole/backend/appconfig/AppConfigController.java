package com.penaelchole.backend.appconfig;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.penaelchole.backend.common.BaseEntityController;

@RestController
@RequestMapping("/api/entities/AppConfig")
public class AppConfigController extends BaseEntityController<AppConfigRequest, AppConfigResponse, AppConfigPatch> {

    public AppConfigController(AppConfigService service) {
        super(service, AppConfigPatch::from);
    }

}
