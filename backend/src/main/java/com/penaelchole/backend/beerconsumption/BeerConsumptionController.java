package com.penaelchole.backend.beerconsumption;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.penaelchole.backend.common.BaseEntityController;

@RestController
@RequestMapping("/api/entities/ConsumoCerveza")
public class BeerConsumptionController
        extends BaseEntityController<BeerConsumptionRequest, BeerConsumptionResponse, BeerConsumptionPatch> {

    public BeerConsumptionController(BeerConsumptionService service) {
        super(service, BeerConsumptionPatch::from);
    }

}
