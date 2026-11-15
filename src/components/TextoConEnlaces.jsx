import React from "react";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export default function TextoConEnlaces({ texto, className = "", linkClassName = "" }) {
  if (!texto) return null;
  const partes = texto.split(URL_REGEX);
  return (
    <span className={className}>
      {partes.map((parte, i) =>
        URL_REGEX.test(parte) ? (
          <a
            key={i}
            href={parte}
            target="_blank"
            rel="noreferrer"
            className={linkClassName || "underline opacity-80 hover:opacity-100"}
            onClick={e => e.stopPropagation()}
          >
            {parte}
          </a>
        ) : (
          <span key={i}>{parte}</span>
        )
      )}
    </span>
  );
}