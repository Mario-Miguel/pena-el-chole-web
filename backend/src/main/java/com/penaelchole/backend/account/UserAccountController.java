package com.penaelchole.backend.account;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.penaelchole.backend.common.BaseEntityController;

@RestController
@RequestMapping("/api/entities/SesionUsuario")
public class UserAccountController
        extends BaseEntityController<UserAccountRequest, UserAccountResponse, UserAccountPatch> {

    public UserAccountController(UserAccountService service) {
        super(service, UserAccountPatch::from);
    }

}
