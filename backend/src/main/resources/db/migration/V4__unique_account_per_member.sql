-- Cada integrante tiene como mucho una cuenta de acceso.
-- /api/auth/me busca la cuenta con findByMemberId, que falla si hay más de una.
-- UserAccountService.validate() ya lo comprueba; este índice es la última
-- defensa (peticiones simultáneas, varias cuentas del mismo integrante en un bulk).
CREATE UNIQUE INDEX user_account_member_id_key ON user_account (member_id);
