#!/usr/bin/env python3
"""
Importa una copia de seguridad de la app antigua (Base44) a las tablas de PostgreSQL.

La copia es el JSON que genera la pantalla "Copia de seguridad" del frontend:
    { "meta": {...}, "entities": { "Integrante": [...], "SesionUsuario": [...], ... } }

El script NO se conecta a la base de datos: escribe SQL por la salida estándar y se
lo pasas a psql. Todo va en una transacción; si algo falla, no se cambia nada.

    cd backend
    python3 scripts/import_base44.py data/copia_chole_2026-11-15.json \
        | docker compose exec -T postgres psql -U pena -d pena -v ON_ERROR_STOP=1

Con --mapa se indica a qué integrante corresponde cada nombre de la cerveza
(CervezaEntrada y CervezaPago iban por nombre; ahora van por integrante_id):

    python3 scripts/import_base44.py data/copia.json --mapa data/mapa_cerveza.json

    { "Nombre en Base44": "<id del integrante>",   <- se apunta a ese integrante
      "Otro nombre": null,                         <- se apunta a invitados
      "Alguien de fuera": false }                  <- se descarta (con aviso)

Sin mapa, cada nombre se busca entre los integrantes (sin distinguir mayúsculas)
y "Invitados" va a invitados. Si un nombre no se encuentra o está repetido y
tiene cervezas o dinero pendientes, el script se para y dice qué nombres faltan.

Las tablas que importa se VACÍAN antes (TRUNCATE) y se rellenan con la copia.
Los avisos (filas que se saltan) salen por stderr.

Para importar una entidad nueva cuando crees su tabla: escribe una función
`import_<tabla>(entities)` que devuelva una lista de filas (dicts columna -> valor)
y añádela a IMPORTERS. El orden de IMPORTERS importa por las claves foráneas.

Necesita el paquete bcrypt (pip install bcrypt) para cifrar las contraseñas.
"""

import argparse
import json
import sys
import uuid
from collections import defaultdict
from datetime import date

import bcrypt

# Mismo coste que BCryptPasswordEncoder() de Spring (por defecto 10)
BCRYPT_ROUNDS = 10
ADMIN_USERNAME = "__admin__"


def warn(msg):
    print(f"AVISO: {msg}", file=sys.stderr)


# --- conversión de valores ---

def timestamp(value):
    """Base44 guarda las fechas en UTC sin zona: '2026-09-04T20:28:37.938000'."""
    if not value:
        return None
    if value.endswith("Z") or "+" in value[10:]:
        return value
    return value + "Z"


def base_columns(record):
    """Columnas de BaseEntity, comunes a todas las tablas."""
    return {
        "id": record["id"],
        "created_date": timestamp(record.get("created_date")),
        "updated_date": timestamp(record.get("updated_date") or record.get("created_date")),
        "created_by_id": record.get("created_by_id"),
    }


def to_int(value, default=None):
    """Base44 guarda a veces los números como texto ("2026") o con decimales."""
    if value is None or value == "":
        return default
    return int(float(value))


def to_money(value):
    return round(float(value or 0), 2)


def sql_literal(value):
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, (list, dict)):
        return sql_literal(json.dumps(value, ensure_ascii=False)) + "::jsonb"
    return "'" + str(value).replace("'", "''") + "'"


# --- importadores (uno por tabla) ---

def import_member(entities):
    rows = []
    for r in entities.get("Integrante", []):
        name = (r.get("nombre") or "").strip()
        if not name:
            warn(f"Integrante {r['id']} sin nombre: se salta")
            continue
        birth = r.get("fecha_nacimiento") or None
        if birth:
            date.fromisoformat(birth)  # falla aquí si el formato no es AAAA-MM-DD
        rows.append({
            **base_columns(r),
            "name": name,
            "category": r.get("categoria"),
            "role": r.get("cargo"),
            "beers": r.get("cervezas") or 0,
            "birth_date": birth,
        })
    return rows


def import_user_account(entities):
    members = {m["id"]: m for m in entities.get("Integrante", [])}

    # Varias cuentas del mismo integrante: se queda la que tiene avatar y, si no,
    # la modificada más recientemente (user_account.member_id es único).
    def preference(r):
        return (bool(r.get("avatar_url")), r.get("updated_date") or "")

    by_member = {}
    for r in entities.get("SesionUsuario", []):
        member_id = r.get("integrante_id")
        if member_id == ADMIN_USERNAME:
            # El admin no es una cuenta: su contraseña va en app.admin.password-hash
            continue
        if member_id not in members:
            warn(f"Cuenta {r['id']}: el integrante {member_id} no existe en la copia; se salta")
            continue
        if not r.get("contrasena"):
            warn(f"Cuenta {r['id']} sin contraseña: se salta")
            continue
        current = by_member.get(member_id)
        if current is None or preference(r) > preference(current):
            if current is not None:
                warn(f"Integrante {member_id} tiene varias cuentas: se descarta {current['id']}")
            by_member[member_id] = r
        else:
            warn(f"Integrante {member_id} tiene varias cuentas: se descarta {r['id']}")

    rows = []
    usernames = set()
    for member_id, r in by_member.items():
        # Igual que hacía el frontend antiguo: usuarioLogin = usuario || nombre
        username = (r.get("usuario") or members[member_id]["nombre"]).strip()
        if username.lower() == ADMIN_USERNAME or username.lower() in usernames:
            warn(f"Cuenta {r['id']}: el usuario '{username}' está repetido o reservado; se salta")
            continue
        usernames.add(username.lower())
        password_hash = bcrypt.hashpw(
            r["contrasena"].encode("utf-8"), bcrypt.gensalt(BCRYPT_ROUNDS)).decode("ascii")
        rows.append({
            **base_columns(r),
            "member_id": member_id,
            "username": username,
            "password_hash": password_hash,
            "disabled": bool(r.get("disabled")),
            "avatar_url": r.get("avatar_url"),
        })
    return rows


def import_app_config(entities):
    rows = []
    for r in entities.get("AppConfig", []):
        if not r.get("clave"):
            warn(f"AppConfig {r['id']} sin clave: se salta")
            continue
        value = r.get("valor")
        if not isinstance(value, str):
            value = json.dumps(value, ensure_ascii=False) if value is not None else ""
        rows.append({**base_columns(r), "key": r["clave"], "value": value})
    return rows


# --- cerveza ---
#
# En Base44, CervezaEntrada tenía un contador por persona (cervezas, pagado) y
# ConsumoCerveza/CervezaPago apuntaban a la persona por nombre o por el id de la
# entrada. Ahora no hay contador: las cervezas son la suma de beer_consumption y
# lo pagado la suma de beer_payment (sin archivar), todo por member_id.
#
# Para que nadie deba ni más ni menos que antes, manda el contador antiguo:
# - Si la entrada tenía más cervezas que consumos, se añade un consumo sin tipo
#   por la diferencia.
# - Si tenía menos (p. ej. tras "limpiar" el contador), se quedan sin archivar
#   los consumos más recientes y el resto se importa archivado. Como en la app
#   antigua esos consumos sí restaban stock, su cantidad se suma al
#   consumido_ajuste del último lote de ese tipo: el inventario queda igual.
# - Si lo pagado no coincide con la suma de los pagos sin archivar, se añade un
#   pago de ajuste por la diferencia.

INVITADOS = "invitados"
DESCARTAR = object()  # nombre que el mapa dice que se descarte
SIN_RESOLVER = object()  # nombre que no se encuentra (o está repetido)

MAPA_CERVEZA = {}  # se rellena en main() con --mapa
_beer_plan = None


def resolve_member(name, members_by_name, member_ids):
    """Nombre de Base44 -> member_id, None (invitados), DESCARTAR o SIN_RESOLVER."""
    name = (name or "").strip()
    if name in MAPA_CERVEZA:
        target = MAPA_CERVEZA[name]
        if target is False:
            return DESCARTAR
        if target is not None and target not in member_ids:
            sys.exit(f"ERROR: el mapa apunta '{name}' a {target}, que no es un integrante de la copia")
        return target
    if name.casefold() == INVITADOS:
        return None
    matches = members_by_name.get(name.casefold(), [])
    return matches[0] if len(matches) == 1 else SIN_RESOLVER


def year_of(value):
    return int(value[:4]) if value else None


def plan_beer(entities):
    """Calcula las filas de beer_batch, beer_consumption y beer_payment de una vez."""
    global _beer_plan
    if _beer_plan is not None:
        return _beer_plan

    members = [m for m in entities.get("Integrante", []) if (m.get("nombre") or "").strip()]
    member_ids = {m["id"] for m in members}
    members_by_name = defaultdict(list)
    for m in members:
        members_by_name[m["nombre"].strip().casefold()].append(m["id"])

    entries = {e["id"]: e for e in entities.get("CervezaEntrada", [])}
    consumos_by_entry = defaultdict(list)
    for c in entities.get("ConsumoCerveza", []):
        if to_int(c.get("cantidad"), 0) <= 0:
            warn(f"ConsumoCerveza {c['id']} sin cantidad: se salta")
            continue
        consumos_by_entry[c.get("integrante_id")].append(c)

    pagos_by_name = defaultdict(list)
    for p in entities.get("CervezaPago", []):
        pagos_by_name[(p.get("integrante_nombre") or "").strip()].append(p)

    # Personas: una por entrada, más los consumos sin entrada y los pagos
    # (que iban por nombre)
    people = {}  # nombre -> {"entry": ..., "consumos": [...], "pagos": [...]}

    def person(name):
        return people.setdefault(name, {"entry": None, "consumos": [], "pagos": []})

    for entry_id, e in entries.items():
        p = person((e.get("nombre") or "").strip())
        if p["entry"] is not None:
            warn(f"Hay dos CervezaEntrada de '{e.get('nombre')}': se suman")
            p["entry"] = {**p["entry"],
                          "cervezas": to_int(p["entry"].get("cervezas"), 0) + to_int(e.get("cervezas"), 0),
                          "pagado": to_money(p["entry"].get("pagado")) + to_money(e.get("pagado"))}
        else:
            p["entry"] = e
        p["consumos"] += consumos_by_entry.pop(entry_id, [])
    for entry_id, consumos in consumos_by_entry.items():
        warn(f"{len(consumos)} consumos apuntan a una CervezaEntrada que no existe ({entry_id}); se usa su integrante_nombre")
        for c in consumos:
            person((c.get("integrante_nombre") or "").strip())["consumos"].append(c)
    for name, pagos in pagos_by_name.items():
        person(name)["pagos"] += pagos

    consumptions, payments = [], []
    archived_by_type = defaultdict(int)  # tipo -> cervezas que pasan a consumido_ajuste
    unresolved = []

    for name, p in people.items():
        entry = p["entry"] or {}
        counter = to_int(entry.get("cervezas"), 0)
        paid = to_money(entry.get("pagado"))
        consumos = sorted(p["consumos"], key=lambda c: c.get("created_date") or "", reverse=True)
        pagos = p["pagos"]

        # Qué cervezas siguen contando (las más recientes, hasta el contador)
        keep, archive, left = [], [], counter
        for c in consumos:
            qty = to_int(c["cantidad"])
            kept = min(qty, left)
            left -= kept
            if kept:
                keep.append((c, kept))
            if qty - kept:
                archive.append((c, qty - kept))
        missing = left  # cervezas del contador que no tenían consumo
        open_paid = to_money(sum(to_money(x.get("importe")) for x in pagos if not x.get("archivado")))
        paid_adjustment = to_money(paid - open_paid) if p["entry"] else 0

        member_id = resolve_member(name, members_by_name, member_ids)
        has_money = counter > 0 or paid_adjustment != 0 or bool(pagos)
        if member_id is SIN_RESOLVER or member_id is DESCARTAR:
            if member_id is SIN_RESOLVER and has_money:
                unresolved.append(name)
                continue
            # Solo historial sin deuda: se descarta, pero lo consumido sigue restando stock
            for c, qty in keep + archive:
                if c.get("tipo"):
                    archived_by_type[c["tipo"]] += qty
            what = "está en el mapa como descartado" if member_id is DESCARTAR else "no es ningún integrante (o está repetido)"
            if has_money:
                warn(f"'{name}' {what}: se descartan {counter} cervezas y {len(pagos)} pagos")
            elif consumos:
                warn(f"'{name}' {what} y no debe nada: sus {len(consumos)} consumos antiguos se descartan "
                     "(su cantidad pasa a consumido_ajuste)")
            continue

        for c, qty in keep:
            consumptions.append({
                **base_columns(c), "member_id": member_id, "type": c.get("tipo") or None,
                "quantity": qty, "archived": False, "archive_year": None})
        for c, qty in archive:
            row_id = c["id"] if not any(k is c for k, _ in keep) else str(uuid.uuid4())
            consumptions.append({
                **base_columns(c), "id": row_id, "member_id": member_id, "type": c.get("tipo") or None,
                "quantity": qty, "archived": True, "archive_year": year_of(c.get("created_date"))})
            if c.get("tipo"):
                archived_by_type[c["tipo"]] += qty
        if missing:
            consumptions.append({
                **base_columns(entry), "id": str(uuid.uuid4()), "member_id": member_id, "type": None,
                "quantity": missing, "archived": False, "archive_year": None})

        for x in pagos:
            amount = to_money(x.get("importe"))
            if amount == 0:
                warn(f"CervezaPago {x['id']} con importe 0: se salta")
                continue
            payments.append({
                **base_columns(x), "member_id": member_id, "amount": amount,
                "date": timestamp(x.get("fecha")) or timestamp(x.get("created_date")),
                "notes": x.get("notas") or None, "archived": bool(x.get("archivado")),
                "archive_year": to_int(x.get("anio_archivo"))})
        if paid_adjustment:
            payments.append({
                **base_columns(entry), "id": str(uuid.uuid4()), "member_id": member_id,
                "amount": paid_adjustment, "date": timestamp(entry.get("updated_date")),
                "notes": "Ajuste al importar de Base44", "archived": False, "archive_year": None})

    if unresolved:
        lines = "\n".join(f'    "{n}": "<id del integrante>",' for n in sorted(unresolved))
        sys.exit("ERROR: estos nombres de la cerveza tienen cervezas o pagos pero no se sabe de qué integrante son\n"
                 "(no existen o hay varios con ese nombre). Añádelos a un mapa y pásalo con --mapa:\n"
                 "  {\n" + lines + "\n  }")

    # Lotes, con lo consumido que ya no cuenta pasado a consumido_ajuste
    batches = []
    for r in entities.get("LoteCerveza", []):
        if r.get("cantidad") in (None, "") or not r.get("fecha"):
            warn(f"LoteCerveza {r['id']} sin cantidad o sin fecha: se salta")
            continue
        batches.append({
            **base_columns(r), "quantity": to_int(r["cantidad"]),
            "consumed_adjustment": to_int(r.get("consumido_ajuste"), 0),
            "cost": to_money(r.get("coste")), "date": r["fecha"][:10],
            "notes": r.get("notas") or None, "minimum_stock": to_int(r.get("stock_minimo")),
            "type": r.get("tipo") or None})
    for tipo, qty in archived_by_type.items():
        same_type = [b for b in batches if b["type"] == tipo]
        if not same_type:
            warn(f"{qty} cervezas '{tipo}' ya no cuentan y no hay ningún lote de ese tipo: el stock no se ajusta")
            continue
        latest = max(same_type, key=lambda b: b["date"])
        latest["consumed_adjustment"] += qty
        warn(f"{qty} cervezas '{tipo}' ya no cuentan (archivadas o descartadas): se suman al consumido_ajuste del lote del {latest['date']}")

    _beer_plan = {"beer_batch": batches, "beer_consumption": consumptions, "beer_payment": payments}
    return _beer_plan


def import_beer_batch(entities):
    return plan_beer(entities)["beer_batch"]


def import_beer_consumption(entities):
    return plan_beer(entities)["beer_consumption"]


def import_beer_payment(entities):
    return plan_beer(entities)["beer_payment"]


# Orden de inserción: primero las tablas a las que apuntan las claves foráneas
IMPORTERS = [
    ("member", import_member),
    ("user_account", import_user_account),
    ("app_config", import_app_config),
    ("beer_batch", import_beer_batch),
    ("beer_consumption", import_beer_consumption),
    ("beer_payment", import_beer_payment),
]


def main():
    parser = argparse.ArgumentParser(description="Importa una copia de Base44 (ver el comentario del principio).")
    parser.add_argument("copia", help="JSON de la copia de seguridad")
    parser.add_argument("--mapa", help="JSON nombre -> id de integrante para la cerveza")
    args = parser.parse_args()

    with open(args.copia, encoding="utf-8") as f:
        entities = json.load(f)["entities"]
    if args.mapa:
        with open(args.mapa, encoding="utf-8") as f:
            MAPA_CERVEZA.update({k.strip(): v for k, v in json.load(f).items()})

    out = ["\\set ON_ERROR_STOP on", "SET client_encoding = 'UTF8';", "BEGIN;"]
    tables = ", ".join(table for table, _ in IMPORTERS)
    # Sin CASCADE: si otra tabla apunta a una de estas y no está en IMPORTERS,
    # TRUNCATE falla en vez de vaciarla sin avisar.
    out.append(f"TRUNCATE {tables};")

    for table, importer in IMPORTERS:
        rows = importer(entities)
        print(f"{table}: {len(rows)} filas", file=sys.stderr)
        for row in rows:
            columns = ", ".join(f'"{c}"' for c in row)
            values = ", ".join(sql_literal(v) for v in row.values())
            out.append(f"INSERT INTO {table} ({columns}) VALUES ({values});")

    out.append("COMMIT;")
    print("\n".join(out))


if __name__ == "__main__":
    main()
