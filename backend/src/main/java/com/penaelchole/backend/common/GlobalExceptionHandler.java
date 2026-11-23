package com.penaelchole.backend.common;

import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.hibernate.exception.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

import com.penaelchole.backend.auth.InvalidCredentialsException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Nombre de la constraint de Postgres -> mensaje para el usuario
    private static final Map<String, String> CONSTRAINT_MESSAGES = Map.of(
            "user_account_username_key", "Ese usuario ya existe",
            "user_account_member_id_key", "Ese integrante ya tiene una cuenta");

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> badRequest(IllegalArgumentException e) {
        return Map.of("message", Objects.requireNonNullElse(e.getMessage(), "Not valid request"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> validationError(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                // Solo el mensaje: el nombre del campo Java (en inglés) no es el que ve el
                // frontend
                .map(f -> f.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return Map.of("message", msg);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, String> notFound(ResourceNotFoundException e) {
        return Map.of("message", Objects.requireNonNullElse(e.getMessage(), "Not found"));
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> methodValidation(HandlerMethodValidationException e) {
        String msg = e.getAllErrors().stream()
                .map(MessageSourceResolvable::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return Map.of("message", msg);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public Map<String, String> unauthorized(InvalidCredentialsException e) {
        return Map.of("message", e.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public Map<String, String> forbidden(AccessDeniedException e) {
        return Map.of("message", Objects.requireNonNullElse(e.getMessage(), "No tienes permiso"));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, String> conflict(DataIntegrityViolationException e) {
        // El detalle completo va al log (para ti), nunca al cliente
        log.warn("Violación de integridad: {}", e.getMostSpecificCause().getMessage());

        String message = "No se puede completar: entra en conflicto con otros datos";
        if (e.getCause() instanceof ConstraintViolationException cve && cve.getConstraintName() != null)
            message = CONSTRAINT_MESSAGES.getOrDefault(cve.getConstraintName(), message);
        return Map.of("message", message);
    }

}
