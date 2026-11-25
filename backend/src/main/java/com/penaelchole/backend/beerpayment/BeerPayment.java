package com.penaelchole.backend.beerpayment;

import java.math.BigDecimal;
import java.time.Instant;

import com.penaelchole.backend.common.ApiName;
import com.penaelchole.backend.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;

/**
 * Pago de cervezas de un integrante. Lo pagado por alguien es la suma de
 * "amount" de sus pagos sin archivar; las correcciones son importes negativos.
 */
@Entity
public class BeerPayment extends BaseEntity {

    /** id del Integrante (tabla member). null = invitados. */
    @ApiName("integrante_id")
    private String memberId;

    @ApiName("importe")
    @Column(nullable = false)
    private BigDecimal amount;

    @ApiName("fecha")
    private Instant date;

    @ApiName("notas")
    private String notes;

    @ApiName("archivado")
    @Column(nullable = false)
    private boolean archived;

    @ApiName("anio_archivo")
    private Integer archiveYear;

    protected BeerPayment() {
    }

    public BeerPayment(String memberId, BigDecimal amount, Instant date, String notes) {
        this.memberId = checkMemberId(memberId);
        this.amount = checkAmount(amount);
        this.date = date;
        this.notes = notes;
    }

    public String getMemberId() {
        return memberId;
    }

    public void setMemberId(String memberId) {
        this.memberId = checkMemberId(memberId);
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = checkAmount(amount);
    }

    public Instant getDate() {
        return date;
    }

    public void setDate(Instant date) {
        this.date = date;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public boolean isArchived() {
        return archived;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
    }

    public Integer getArchiveYear() {
        return archiveYear;
    }

    public void setArchiveYear(Integer archiveYear) {
        this.archiveYear = archiveYear;
    }

    // null = el campo no venía en el JSON (no se toca)
    // Optional.empty() = venía con valor null
    public void applyChanges(BeerPaymentPatch changes) {
        if (changes.memberId() != null) {
            setMemberId(changes.memberId().orElse(null));
        }

        if (changes.amount() != null) {
            setAmount(changes.amount().orElse(null));
        }

        if (changes.date() != null) {
            setDate(changes.date().orElse(null));
        }

        if (changes.notes() != null) {
            setNotes(changes.notes().orElse(null));
        }

        if (changes.archived() != null) {
            setArchived(changes.archived().orElse(false));
        }

        if (changes.archiveYear() != null) {
            setArchiveYear(changes.archiveYear().orElse(null));
        }
    }

    // Puede ser negativo (una corrección), pero no null ni 0
    private static BigDecimal checkAmount(BigDecimal amount) {
        if (amount == null || amount.signum() == 0) {
            throw new IllegalArgumentException("El importe no puede estar vacío ni ser 0");
        }
        return amount;
    }

    // null está permitido (invitados), pero "" no: sería un error del cliente
    private static String checkMemberId(String memberId) {
        if (memberId != null && memberId.isBlank()) {
            throw new IllegalArgumentException("El integrante no puede estar vacío");
        }
        return memberId;
    }
}
