package com.penaelchole.backend.beerbatch;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.penaelchole.backend.common.BaseEntityController;

@RestController
@RequestMapping("/api/entities/LoteCerveza")
public class BeerBatchController extends BaseEntityController<BeerBatchRequest, BeerBatchResponse, BeerBatchPatch> {
    public BeerBatchController(BeerBatchService service) {
        super(service, BeerBatchPatch::from);
    }
}
