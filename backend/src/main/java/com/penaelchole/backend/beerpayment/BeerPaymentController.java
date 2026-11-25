package com.penaelchole.backend.beerpayment;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.penaelchole.backend.common.BaseEntityController;

@RestController
@RequestMapping("/api/entities/CervezaPago")
public class BeerPaymentController
        extends BaseEntityController<BeerPaymentRequest, BeerPaymentResponse, BeerPaymentPatch> {

    public BeerPaymentController(BeerPaymentService service) {
        super(service, BeerPaymentPatch::from);
    }
}
