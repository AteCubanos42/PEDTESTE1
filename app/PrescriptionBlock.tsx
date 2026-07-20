"use client";

import { useState } from "react";

type CopyState = "idle" | "copied" | "error";

async function copyText(text: string) {
  let copied = false;
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      // O fallback abaixo cobre navegadores sem permissão para a API moderna.
    }
  }

  const fallback = document.createElement("textarea");
  fallback.value = text;
  fallback.setAttribute("readonly", "");
  fallback.style.position = "fixed";
  fallback.style.opacity = "0";
  document.body.appendChild(fallback);
  fallback.select();
  const fallbackCopied = document.execCommand("copy");
  document.body.removeChild(fallback);
  if (!copied && !fallbackCopied) throw new Error("Não foi possível copiar o texto.");
}

export function PrescriptionBlock({
  text,
  valid = true,
  invalidMessage = "Revise os campos destacados antes de liberar a cópia.",
}: {
  text: string;
  valid?: boolean;
  invalidMessage?: string;
}) {
  const [confirmedText, setConfirmedText] = useState("");
  const [copyResult, setCopyResult] = useState<{ text: string; state: CopyState }>({ text: "", state: "idle" });
  const confirmed = valid && confirmedText === text;
  const copyState = copyResult.text === text ? copyResult.state : "idle";

  const handleCopy = async () => {
    if (!valid || !confirmed) return;
    try {
      await copyText(text);
      setCopyResult({ text, state: "copied" });
      window.setTimeout(() => setCopyResult({ text: "", state: "idle" }), 2400);
    } catch {
      setCopyResult({ text, state: "error" });
    }
  };

  return (
    <section className="prescription-ready" aria-live="polite">
      <div className="prescription-ready-heading">
        <div>
          <span className="eyebrow">OBSERVAÇÃO DO PEP</span>
          <h3>Texto pronto para copiar</h3>
        </div>
        <span className="draft-badge">RASCUNHO · REVISAR</span>
      </div>
      <textarea
        aria-label="Texto da prescrição para copiar"
        onFocus={(event) => event.currentTarget.select()}
        readOnly
        rows={Math.max(5, text.split("\n").length + 1)}
        value={text}
      />
      {!valid ? <p className="prescription-invalid">{invalidMessage}</p> : null}
      <label className="prescription-confirm">
        <input
          checked={confirmed}
          disabled={!valid}
          onChange={(event) => setConfirmedText(event.target.checked ? text : "")}
          type="checkbox"
        />
        <span>Conferi paciente, dose, apresentação, via, diluente, volume e velocidade.</span>
      </label>
      <div className="prescription-actions">
        <button disabled={!valid || !confirmed} onClick={handleCopy} type="button">
          {copyState === "copied" ? "✓ COPIADO" : "COPIAR PRESCRIÇÃO"}
        </button>
        <small>
          {copyState === "error"
            ? "A cópia automática falhou. Selecione o texto acima e copie manualmente."
            : "O site não inclui nome ou prontuário do paciente."}
        </small>
      </div>
    </section>
  );
}
