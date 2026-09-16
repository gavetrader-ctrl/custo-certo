import { useMemo } from "react";
import {
  brl,
  pct,
  calcularEncargosSociais,
  type EncargosSociais,
  type EncargoItem,
} from "@/lib/pricing";

const novoId = () => Math.random().toString(36).slice(2, 10);

function NumeroInput({
  value,
  onChange,
  className = "",
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  return (
    <input
      type="number"
      step="0.01"
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className={`rounded-md border border-line bg-card px-2 py-1 text-right font-mono text-[12px] text-ink outline-none focus:border-brand ${className}`}
    />
  );
}

function GrupoEncargos({
  titulo,
  labelGrupo,
  itens,
  onChange,
  disabled,
}: {
  titulo: string;
  labelGrupo: string;
  itens: EncargoItem[];
  onChange: (itens: EncargoItem[]) => void;
  disabled?: boolean;
}) {
  const total = useMemo(() => itens.reduce((s, e) => s + e.percentual, 0), [itens]);

  const atualizar = (id: string, patch: Partial<EncargoItem>) =>
    onChange(itens.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const remover = (id: string) => onChange(itens.filter((i) => i.id !== id));

  const adicionar = () =>
    onChange([...itens, { id: novoId(), nome: "Novo encargo", percentual: 0 }]);

  return (
    <div className="rounded-lg border border-line/60 bg-card/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-semibold text-ink">{titulo}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted-ink">
            {labelGrupo}: {pct(total)}
          </span>
          {!disabled && (
            <button
              onClick={adicionar}
              className="rounded-md border border-line bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-ink transition-colors hover:text-brand"
            >
              +
            </button>
          )}
        </div>
      </div>
      <div className="space-y-1">
        {itens.map((item) => (
          <div key={item.id} className="flex items-center gap-2 rounded-md bg-card/30 px-2 py-1">
            <input
              value={item.nome}
              onChange={(e) => atualizar(item.id, { nome: e.target.value })}
              disabled={disabled}
              className="min-w-[160px] flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-[12px] text-ink outline-none focus:border-line focus:bg-card disabled:opacity-60"
            />
            <span className="flex items-center gap-1">
              <NumeroInput
                value={item.percentual}
                onChange={(v) => atualizar(item.id, { percentual: v })}
                className="w-20"
              />
              <span className="text-[11px] text-muted-ink">%</span>
            </span>
            {!disabled && (
              <button
                onClick={() => remover(item.id)}
                className="px-1 text-[12px] text-muted-ink transition-colors hover:text-ink"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function EncargosSociaisComponent({
  encargos,
  onChange,
  disabled,
}: {
  encargos: EncargosSociais;
  onChange: (e: EncargosSociais) => void;
  disabled?: boolean;
}) {
  const r = useMemo(() => calcularEncargosSociais(encargos), [encargos]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[13px] font-semibold text-ink">Encargos Sociais / Trabalhistas</h4>
        <span className="rounded-full bg-navy px-2.5 py-0.5 font-mono text-[11px] font-semibold text-navy-foreground">
          Total: {pct(r.total)}
        </span>
      </div>

      <GrupoEncargos
        titulo="A) Encargos Sociais Básicos"
        labelGrupo="Soma A"
        itens={encargos.grupoA}
        onChange={(grupoA) => onChange({ ...encargos, grupoA })}
        disabled={disabled ?? false}
      />

      <GrupoEncargos
        titulo="B) Encargos com incidência de A"
        labelGrupo="Soma B"
        itens={encargos.grupoB}
        onChange={(grupoB) => onChange({ ...encargos, grupoB })}
        disabled={disabled ?? false}
      />

      <GrupoEncargos
        titulo="C) Encargos sem incidência de A"
        labelGrupo="Soma C"
        itens={encargos.grupoC}
        onChange={(grupoC) => onChange({ ...encargos, grupoC })}
        disabled={disabled ?? false}
      />

      <div className="rounded-lg border border-line/60 bg-card/40 p-3">
        <div className="space-y-1 text-[12px]">
          <div className="flex items-center justify-between">
            <span className="text-muted-ink">D) Reincidência (A × B / 100)</span>
            <span className="font-mono font-medium">{pct(r.reincidencia)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-line/60 pt-1">
            <span className="font-semibold text-ink">TOTAL (A + B + C + D)</span>
            <span className="font-mono text-[13px] font-bold text-navy">{pct(r.total)}</span>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted-ink">
        Fórmula: Total incide sobre o custo base da mão de obra. Mão de obra com encargos = Base ×
        (1 + {pct(r.total)})
      </p>
    </div>
  );
}
