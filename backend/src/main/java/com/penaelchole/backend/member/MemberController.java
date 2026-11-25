package com.penaelchole.backend.member;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.penaelchole.backend.common.BaseEntityController;

/**
 * Endpoints REST de Member. Contrato en backend/API.md, sección "Entities".
 */
@RestController
@RequestMapping("/api/entities/Integrante")
public class MemberController extends BaseEntityController<MemberRequest, MemberResponse, MemberPatch> {

    public MemberController(MemberService service) {
        super(service, MemberPatch::from);
    }

}
