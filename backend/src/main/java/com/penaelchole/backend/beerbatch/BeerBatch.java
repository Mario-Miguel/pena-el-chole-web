package com.penaelchole.backend.beerbatch;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.penaelchole.backend.common.ApiName;
import com.penaelchole.backend.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;

@Entity
public class BeerBatch extends BaseEntity {

    @ApiName("cantidad")
    @Column(nullable = false)
    private Integer quantity;

    @ApiName("consumido_ajuste")
    private Integer consumedAdjustment;

    @ApiName("coste")
    @Column(nullable = false)
    private BigDecimal cost;

    @ApiName("fecha")
    @Column(nullable = false)
    private LocalDate date;

    @ApiName("notas")
    private String notes;

    @ApiName("stock_minimo")
    private Integer minimumStock;

    @ApiName("tipo")
    private String type;

    protected BeerBatch() {
    }

    public BeerBatch(
            Integer quantity,
            Integer consumedAdjustment,
            BigDecimal cost,
            LocalDate date,
            String notes,
            Integer minimumStock,
            String type) {
        this.quantity = quantity;
        this.consumedAdjustment = consumedAdjustment;
        this.cost = cost;
        this.date = date;
        this.notes = notes;
        this.minimumStock = minimumStock;
        this.type = type;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Integer getConsumedAdjustment() {
        return consumedAdjustment;
    }

    public void setConsumedAdjustment(Integer consumedAdjustment) {
        this.consumedAdjustment = consumedAdjustment;
    }

    public BigDecimal getCost() {
        return cost;
    }

    public void setCost(BigDecimal cost) {
        this.cost = cost;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Integer getMinimumStock() {
        return minimumStock;
    }

    public void setMinimumStock(Integer minimumStock) {
        this.minimumStock = minimumStock;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    // null = el campo no venía en el JSON (no se toca)
    // Optional.empty() = venía con valor null
    public void applyChanges(BeerBatchPatch changes) {
        if (changes.quantity() != null) {
            setQuantity(changes.quantity()
                    .orElseThrow(() -> new IllegalArgumentException("La cantidad no puede estar vacía")));
        }

        if (changes.consumedAdjustment() != null) {
            setConsumedAdjustment(changes.consumedAdjustment().orElse(null));
        }

        if (changes.cost() != null) {
            setCost(changes.cost()
                    .orElseThrow(() -> new IllegalArgumentException("El coste no puede estar vacío")));
        }

        if (changes.date() != null) {
            setDate(changes.date()
                    .orElseThrow(() -> new IllegalArgumentException("La fecha no puede estar vacía")));
        }

        if (changes.notes() != null) {
            setNotes(changes.notes().orElse(null));
        }

        if (changes.minimumStock() != null) {
            setMinimumStock(changes.minimumStock().orElse(null));
        }

        if (changes.type() != null) {
            setType(changes.type().orElse(null));
        }
    }
}
