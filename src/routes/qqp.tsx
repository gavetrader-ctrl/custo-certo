import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  brl,
  pct,
  qqpInicial,
  formacaoInicial,
  calcularFormacaoItem,
  calcularQQP,
  QQP_STORAGE_KEY,
  type QQPData,
  type ItemQQP,
  type FormacaoPreco,
  type FormacaoItem,
  type EncargosSociais,
} from "@/lib/pricing";
import { EncargosSociaisComponent } from "@/components/encargos-sociais";

export const Route = createFileRoute("/qqp")({
  head: () => ({
    meta: [
      { title: "QQP — Quadro de Quantidades e Preços" },
      {
        name: "description",
        content: "Quadro de Quantidades e Preços para formação de preço de serviços.",
      },
    ],
  }),
  component: QQPPage,
});

const novoId = () => Math.random().toString(36).slice(2, 10);

function NumeroInput({
  value,
  onChange,
  className = "",
  step = "0.01",
  disabled = false,
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  step?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type="number"
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      disabled={disabled}
      className={`rounded-md border border-line bg-card px-2 py-1 text-right font-mono text-[12px] text-ink outline-none focus:border-brand disabled:opacity-50 ${className}`}
    />
  );
}

// ── Formação de preço para um item QQP ──────────────────────────────

function FormacaoPrecoItem({
  formacao,
  onChange,
  onVoltar,
}: {
  formacao: FormacaoPreco;
  onChange: (f: FormacaoPreco) => void;
  onVoltar: () => void;
}) {
  const [aba, setAba] = useState<
    | "maoDeObra"
    | "ferramentas"
    | "equipamentos"
    | "materiais"
    | "servicosTerceiros"
    | "encargosSociais"
    | "bdi"
    | "impostos"
  >("maoDeObra");

  const r = useMemo(() => calcularFormacaoItem(formacao), [formacao]);

  const abas = [
    { id: "maoDeObra" as const, label: "Mão de obra" },
    { id: "encargosSociais" as const, label: "Encargos sociais" },
    { id: "ferramentas" as const, label: "Ferramentas" },
    { id: "equipamentos" as const, label: "Equipamentos" },
    { id: "materiais" as const, label: "Materiais" },
    { id: "servicosTerceiros" as const, label: "Serviços de terceiros" },
    { id: "bdi" as const, label: "BDI" },
    { id: "impostos" as const, label: "Impostos" },
  ];

  const camposBdi: { campo: keyof FormacaoPreco["bdi"]; label: string }[] = [
    { campo: "administracaoCentral", label: "Administração central" },
    { campo: "lucro", label: "Lucro" },
    { campo: "riscos", label: "Riscos" },
    { campo: "seguros", label: "Seguros" },
  ];

  const addItem = (grupo: keyof FormacaoPreco) => {
    if (grupo === "bdi" || grupo === "impostos" || grupo === "encargosSociais") return;
    const lista = formacao[grupo] as FormacaoItem[];
    onChange({
      ...formacao,
      [grupo]: [
        ...lista,
        { id: novoId(), descricao: "", quantidade: 1, unidade: "un", valorUnitario: 0 },
      ],
    });
  };

  const updateItem = (grupo: keyof FormacaoPreco, id: string, patch: Partial<FormacaoItem>) => {
    if (grupo === "bdi" || grupo === "impostos" || grupo === "encargosSociais") return;
    const lista = formacao[grupo] as FormacaoItem[];
    onChange({
      ...formacao,
      [grupo]: lista.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });
  };

  const removeItem = (grupo: keyof FormacaoPreco, id: string) => {
    if (grupo === "bdi" || grupo === "impostos" || grupo === "encargosSociais") return;
    const lista = formacao[grupo] as FormacaoItem[];
    onChange({
      ...formacao,
      [grupo]: lista.filter((i) => i.id !== id),
    });
  };

  const setBdi = (campo: keyof FormacaoPreco["bdi"], v: number) =>
    onChange({ ...formacao, bdi: { ...formacao.bdi, [campo]: v } });

  const addImposto = () =>
    onChange({
      ...formacao,
      impostos: [...formacao.impostos, { id: novoId(), nome: "Novo imposto", aliquota: 0 }],
    });

  const updateImposto = (id: string, patch: { nome?: string; aliquota?: number }) =>
    onChange({
      ...formacao,
      impostos: formacao.impostos.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });

  const removeImposto = (id: string) =>
    onChange({
      ...formacao,
      impostos: formacao.impostos.filter((t) => t.id !== id),
    });

  const renderListaGrupo = (
    grupo: "maoDeObra" | "ferramentas" | "equipamentos" | "materiais" | "servicosTerceiros",
  ) => {
    const lista = formacao[grupo];
    const labels: Record<string, string> = {
      maoDeObra: "Profissional",
      ferramentas: "Ferramenta",
      equipamentos: "Equipamento",
      materiais: "Material",
      servicosTerceiros: "Serviço",
    };
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-ink">{labels[grupo]}</span>
          <button
            onClick={() => addItem(grupo)}
            className="rounded-md border border-line bg-card px-2 py-1 text-[11px] font-medium text-muted-ink transition-colors hover:text-brand"
          >
            + adicionar
          </button>
        </div>
        {lista.length === 0 && (
          <p className="text-[12px] text-muted-ink">Nenhum item adicionado.</p>
        )}
        {lista.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-line/60 bg-card/50 p-2"
          >
            <input
              value={item.descricao}
              placeholder={labels[grupo]}
              onChange={(e) => updateItem(grupo, item.id, { descricao: e.target.value })}
              className="min-w-[140px] flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-[12px] text-ink outline-none focus:border-line focus:bg-card"
            />
            <NumeroInput
              value={item.quantidade}
              onChange={(v) => updateItem(grupo, item.id, { quantidade: v })}
              className="w-16"
            />
            <input
              value={item.unidade}
              onChange={(e) => updateItem(grupo, item.id, { unidade: e.target.value })}
              className="w-12 rounded-md border border-line bg-card px-1 py-1 text-center font-mono text-[11px] text-muted-ink outline-none focus:border-brand"
            />
            <NumeroInput
              value={item.valorUnitario}
              onChange={(v) => updateItem(grupo, item.id, { valorUnitario: v })}
              className="w-24"
            />
            <span className="font-mono text-[11px] text-muted-ink">
              {brl(item.quantidade * item.valorUnitario)}
            </span>
            <button
              onClick={() => removeItem(grupo, item.id)}
              className="px-1 text-[12px] text-muted-ink transition-colors hover:text-ink"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-line/80 bg-card/70 p-4 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-ink">Formação de preço do item</h3>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-navy px-2.5 py-0.5 font-mono text-[11px] font-semibold text-navy-foreground">
            Preço unitário: {brl(r.precoFinal)}
          </span>
          <button
            onClick={onVoltar}
            className="rounded-md border border-line bg-card px-3 py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-card"
          >
            Voltar à QQP
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1">
        {abas.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={
              a.id === aba
                ? "rounded-md bg-navy px-2.5 py-1 text-[11px] font-semibold text-navy-foreground"
                : "rounded-md border border-line bg-card/60 px-2.5 py-1 text-[11px] font-medium text-ink transition-colors hover:bg-card"
            }
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="min-h-[200px]">
        {(aba === "maoDeObra" ||
          aba === "ferramentas" ||
          aba === "equipamentos" ||
          aba === "materiais" ||
          aba === "servicosTerceiros") &&
          renderListaGrupo(aba)}

        {aba === "encargosSociais" && (
          <EncargosSociaisComponent
            encargos={formacao.encargosSociais}
            onChange={(encargos: EncargosSociais) =>
              onChange({ ...formacao, encargosSociais: encargos })
            }
          />
        )}

        {aba === "bdi" && (
          <div className="space-y-2">
            {camposBdi.map(({ campo, label }) => (
              <div key={campo} className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-muted-ink">{label}</span>
                <span className="flex items-center gap-1">
                  <NumeroInput
                    value={formacao.bdi[campo]}
                    onChange={(v) => setBdi(campo, v)}
                    className="w-20"
                  />
                  <span className="text-[11px] text-muted-ink">%</span>
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-line/60 pt-2">
              <span className="text-[12px] text-muted-ink">Total BDI</span>
              <span className="font-mono text-[12px] font-semibold">{pct(r.bdiPercent)}</span>
            </div>
          </div>
        )}

        {aba === "impostos" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-ink">Impostos</span>
              <button
                onClick={addImposto}
                className="rounded-md border border-line bg-card px-2 py-1 text-[11px] font-medium text-muted-ink transition-colors hover:text-brand"
              >
                + adicionar
              </button>
            </div>
            {formacao.impostos.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2">
                <input
                  value={t.nome}
                  onChange={(e) => updateImposto(t.id, { nome: e.target.value })}
                  className="w-28 rounded-md border border-transparent bg-transparent px-2 py-1 text-[12px] text-ink outline-none focus:border-line focus:bg-card"
                />
                <span className="flex items-center gap-1">
                  <NumeroInput
                    value={t.aliquota}
                    onChange={(v) => updateImposto(t.id, { aliquota: v })}
                    className="w-20"
                  />
                  <span className="text-[11px] text-muted-ink">%</span>
                  <button
                    onClick={() => removeImposto(t.id)}
                    className="px-1 text-[12px] text-muted-ink transition-colors hover:text-ink"
                  >
                    ×
                  </button>
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-line/60 pt-2">
              <span className="text-[12px] text-muted-ink">Total impostos</span>
              <span className="font-mono text-[12px] font-semibold">{pct(r.impostoPercent)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-line/70 bg-card/50 p-3">
        <div className="grid grid-cols-2 gap-2 text-[12px] sm:grid-cols-3">
          <div className="flex justify-between">
            <span className="text-muted-ink">Mão de obra (base)</span>
            <span className="font-mono">{brl(r.custoMaoDeObraBase)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-ink">Encargos ({pct(r.encargosPercent)})</span>
            <span className="font-mono">{brl(r.valorEncargos)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-ink">Mão deobra c/ encargos</span>
            <span className="font-mono font-medium">{brl(r.custoMaoDeObra)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-ink">Ferramentas</span>
            <span className="font-mono">{brl(r.custoFerramentas)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-ink">Equipamentos</span>
            <span className="font-mono">{brl(r.custoEquipamentos)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-ink">Materiais</span>
            <span className="font-mono">{brl(r.custoMateriais)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-ink">Serviços de terceiros</span>
            <span className="font-mono">{brl(r.custoServicosTerceiros)}</span>
          </div>
          <div className="flex justify-between border-t border-line/60 pt-1">
            <span className="font-medium text-ink">Custo direto</span>
            <span className="font-mono font-semibold">{brl(r.custoDireto)}</span>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-2 text-[12px]">
          <span className="text-muted-ink">BDI ({pct(r.bdiPercent)})</span>
          <span className="font-mono">{brl(r.valorBdi)}</span>
        </div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-muted-ink">Impostos ({pct(r.impostoPercent)})</span>
          <span className="font-mono">{brl(r.precoFinal - (r.custoDireto + r.valorBdi))}</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-2">
          <span className="text-[13px] font-semibold text-ink">Preço unitário</span>
          <span className="font-mono text-[14px] font-bold text-navy">{brl(r.precoFinal)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Página QQP ──────────────────────────────────────────────────────

function QQPPage() {
  const [qqp, setQqp] = useState<QQPData>(qqpInicial);
  const [carregado, setCarregado] = useState(false);
  const [itemEditando, setItemEditando] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(QQP_STORAGE_KEY);
      if (raw) {
        const salvo = JSON.parse(raw) as QQPData;
        const normalizado = {
          ...salvo,
          itens: salvo.itens.map((i) => ({
            ...i,
            formacao: {
              ...formacaoInicial(),
              ...i.formacao,
              encargosSociais: i.formacao?.encargosSociais ?? formacaoInicial().encargosSociais,
            },
          })),
        };
        setQqp({ ...qqpInicial, ...normalizado });
      }
    } catch {
      /* ignora */
    }
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (!carregado) return;
    setSalvo(false);
    const t = setTimeout(() => {
      localStorage.setItem(QQP_STORAGE_KEY, JSON.stringify(qqp));
      setSalvo(true);
    }, 500);
    return () => clearTimeout(t);
  }, [qqp, carregado]);

  const r = useMemo(() => calcularQQP(qqp), [qqp]);

  const atualizarItem = (id: string, patch: Partial<ItemQQP>) =>
    setQqp((q) => ({ ...q, itens: q.itens.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));

  const atualizarFormacao = (id: string, formacao: FormacaoPreco) =>
    setQqp((q) => ({ ...q, itens: q.itens.map((i) => (i.id === id ? { ...i, formacao } : i)) }));

  const adicionarItem = () => {
    const id = novoId();
    setQqp((q) => ({
      ...q,
      itens: [
        ...q.itens,
        {
          id,
          descricao: "",
          unidade: "UNID.",
          quantidade: 1,
          formacao: formacaoInicial(),
        },
      ],
    }));
    setItemEditando(id);
  };

  const removerItem = (id: string) => {
    setQqp((q) => ({ ...q, itens: q.itens.filter((i) => i.id !== id) }));
    if (itemEditando === id) setItemEditando(null);
  };

  const itemEditandoData = itemEditando ? r.itens.find((i) => i.id === itemEditando) : null;

  return (
    <div className="min-h-screen bg-wash font-sans text-ink antialiased">
      <div
        className="pointer-events-none fixed -left-32 top-[-14%] h-[520px] w-[520px] rounded-full bg-brand/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed right-[-10%] top-1/2 h-[480px] w-[480px] rounded-full bg-navy/10 blur-3xl"
        aria-hidden="true"
      />

      <header className="sticky top-0 z-30 border-b border-line/70 bg-card/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="grid size-9 place-items-center rounded-lg bg-navy text-[13px] font-bold text-navy-foreground"
            >
              OF
            </Link>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">QQP</p>
              <p className="text-[11px] text-muted-ink">Quadro de Quantidades e Preços</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-line bg-card/70 px-3 py-1.5 text-[11px] font-medium text-muted-ink sm:inline-flex">
              <span className={`size-1.5 rounded-full ${salvo ? "bg-positive" : "bg-brand"}`} />
              {salvo ? "Salvo neste navegador" : "Salvando…"}
            </span>
            <Link
              to="/dashboard"
              className="rounded-lg border border-line bg-card/70 px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-card"
            >
              Dashboard
            </Link>
            <Link
              to="/configuracoes"
              className="rounded-lg border border-line bg-card/70 px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-card"
            >
              ⚙ Config
            </Link>
            <Link
              to="/proposta"
              className="rounded-lg border border-line bg-card/70 px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-card"
            >
              Proposta →
            </Link>
            <Link
              to="/"
              className="rounded-lg border border-line bg-card/70 px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-card"
            >
              ← Formação de preço
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1440px] px-6 py-6">
        {itemEditando && itemEditandoData ? (
          <div className="animate-rise">
            <FormacaoPrecoItem
              formacao={itemEditandoData.formacao}
              onChange={(f) => atualizarFormacao(itemEditando, f)}
              onVoltar={() => setItemEditando(null)}
            />
          </div>
        ) : (
          <>
            <div className="animate-rise mb-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">
                QUADRO DE QUANTIDADES E PREÇOS — QQP
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted-ink">
                    Serviço
                  </label>
                  <input
                    value={qqp.nomeServico}
                    onChange={(e) => setQqp((q) => ({ ...q, nomeServico: e.target.value }))}
                    className="w-full rounded-md border border-line bg-card px-3 py-2 text-[13px] font-semibold text-ink outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted-ink">
                    Descrição
                  </label>
                  <input
                    value={qqp.descricao}
                    onChange={(e) => setQqp((q) => ({ ...q, descricao: e.target.value }))}
                    className="w-full rounded-md border border-line bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted-ink">SC</label>
                  <input
                    value={qqp.sc}
                    onChange={(e) => setQqp((q) => ({ ...q, sc: e.target.value }))}
                    className="w-full rounded-md border border-line bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted-ink">Data</label>
                  <input
                    value={qqp.data}
                    onChange={(e) => setQqp((q) => ({ ...q, data: e.target.value }))}
                    className="w-full rounded-md border border-line bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
                  />
                </div>
              </div>
              <p className="mt-2 text-[12px] text-muted-ink">{qqp.descricao}</p>
            </div>

            <div className="animate-rise flex items-center justify-between gap-3 mb-4">
              <h2 className="text-sm font-semibold tracking-tight">
                Quadro de Quantidades e Preços
              </h2>
              <button
                onClick={adicionarItem}
                className="rounded-lg bg-navy px-3.5 py-2 text-[13px] font-semibold text-navy-foreground transition-colors hover:bg-navy/90"
              >
                Novo item
              </button>
            </div>

            <div className="animate-rise overflow-x-auto rounded-2xl border border-line/80 bg-card/65 backdrop-blur-xl">
              <table className="w-full min-w-[700px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted-ink">
                    <th className="py-3 pl-4 font-medium w-12">Item</th>
                    <th className="py-3 px-3 font-medium">Descrição</th>
                    <th className="py-3 px-3 text-center font-medium w-20">Unid.</th>
                    <th className="py-3 px-3 text-right font-medium w-20">Quant.</th>
                    <th className="py-3 px-3 text-right font-medium w-32">Preço Unit. (R$)</th>
                    <th className="py-3 px-3 text-right font-medium w-32">Valor Total (R$)</th>
                    <th className="py-3 pr-4 w-24" />
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {r.itens.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="border-b border-line/60 transition-colors hover:bg-brand-soft/40"
                    >
                      <td className="py-3 pl-4 text-center text-[12px] font-medium text-muted-ink">
                        {String(idx + 1).padStart(2, "0")}
                      </td>
                      <td className="py-3 px-3">
                        <input
                          value={item.descricao}
                          placeholder="Descrição do item"
                          onChange={(e) => atualizarItem(item.id, { descricao: e.target.value })}
                          className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 font-sans text-[13px] text-ink outline-none focus:border-line focus:bg-card"
                        />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          value={item.unidade}
                          onChange={(e) => atualizarItem(item.id, { unidade: e.target.value })}
                          className="w-16 rounded-md border border-line bg-card px-2 py-1 text-center font-mono text-[12px] text-muted-ink outline-none focus:border-brand"
                        />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <NumeroInput
                          value={item.quantidade}
                          onChange={(v) => atualizarItem(item.id, { quantidade: v })}
                          className="w-20"
                        />
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-brand">
                        {brl(item.precoUnitario)}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold">{brl(item.valorTotal)}</td>
                      <td className="py-3 pr-4 text-right">
                        <button
                          onClick={() => setItemEditando(item.id)}
                          className="mr-1 rounded-md border border-line bg-card px-2 py-1 font-sans text-[11px] text-muted-ink transition-colors hover:text-brand"
                        >
                          Formação
                        </button>
                        <button
                          onClick={() => removerItem(item.id)}
                          className="rounded-md border border-line bg-card px-2 py-1 font-sans text-[11px] text-muted-ink transition-colors hover:text-ink"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                  {r.itens.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center font-sans text-[13px] text-muted-ink"
                      >
                        Nenhum item adicionado. Clique em "Novo item" para começar.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-navy/30 bg-navy/5">
                    <td colSpan={5} className="py-3 pl-4 text-[13px] font-semibold text-ink">
                      SOMA
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[14px] font-bold text-navy">
                      {brl(r.valorTotalGeral)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
