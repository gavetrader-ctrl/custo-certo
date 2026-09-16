import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  GRUPOS,
  STORAGE_KEY,
  brl,
  calcular,
  orcamentoInicial,
  pct,
  totalItem,
  type CatalogoItem,
  type Grupo,
  type Item,
  type Orcamento,
} from "@/lib/pricing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ObraForma — Formação de preço para serviços" },
      {
        name: "description",
        content:
          "Monte o preço de venda dos seus serviços: mão de obra com encargos sociais, ferramentas, equipamentos, materiais, BDI e impostos editáveis.",
      },
      { property: "og:title", content: "ObraForma — Formação de preço para serviços" },
      {
        property: "og:description",
        content:
          "Composição de custos com encargos sociais, BDI e impostos editáveis, com cálculo do preço final ao vivo.",
      },
    ],
  }),
  component: Index,
});

const novoId = () => Math.random().toString(36).slice(2, 10);

function NumeroInput({
  value,
  onChange,
  className = "",
  step = "0.01",
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  step?: string;
}) {
  return (
    <input
      type="number"
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className={`rounded-md border border-line bg-card px-2 py-1 text-right font-mono text-[12px] text-ink outline-none focus:border-brand ${className}`}
    />
  );
}

function Index() {
  const [orc, setOrc] = useState<Orcamento>(orcamentoInicial);
  const [grupoAtivo, setGrupoAtivo] = useState<Grupo>("maoDeObra");
  const [salvo, setSalvo] = useState(false);
  const [carregado, setCarregado] = useState(false);
  const [novoCadastro, setNovoCadastro] = useState({
    descricao: "",
    unidade: "h",
    valorUnitario: 0,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const salvo = JSON.parse(raw) as Orcamento;
        const normalizado = {
          ...salvo,
          itens: salvo.itens.map((i) => ({
            ...i,
            quantidadeProfissionais: i.quantidadeProfissionais ?? 1,
          })),
          catalogo: salvo.catalogo ?? orcamentoInicial.catalogo,
        };
        setOrc({ ...orcamentoInicial, ...normalizado });
      }
    } catch {
      /* ignora dados inválidos */
    }
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (!carregado) return;
    setSalvo(false);
    const t = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orc));
      setSalvo(true);
    }, 500);
    return () => clearTimeout(t);
  }, [orc, carregado]);

  const r = useMemo(() => calcular(orc), [orc]);
  const itens = orc.itens.filter((i) => i.grupo === grupoAtivo);

  const atualizarItem = (id: string, patch: Partial<Item>) =>
    setOrc((o) => ({ ...o, itens: o.itens.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));

  const adicionarItem = () =>
    setOrc((o) => ({
      ...o,
      itens: [
        ...o.itens,
        {
          id: novoId(),
          grupo: grupoAtivo,
          descricao: "",
          quantidade: 1,
          quantidadeProfissionais: grupoAtivo === "maoDeObra" ? 1 : 1,
          unidade: grupoAtivo === "maoDeObra" ? "h" : "un",
          valorUnitario: 0,
        },
      ],
    }));

  const removerItem = (id: string) =>
    setOrc((o) => ({ ...o, itens: o.itens.filter((i) => i.id !== id) }));

  const cadastro = orc.catalogo.filter((c) => c.grupo === grupoAtivo);

  const adicionarDoCadastro = (c: CatalogoItem) =>
    setOrc((o) => ({
      ...o,
      itens: [
        ...o.itens,
        {
          id: novoId(),
          grupo: c.grupo,
          descricao: c.descricao,
          quantidade: 1,
          quantidadeProfissionais: 1,
          unidade: c.unidade,
          valorUnitario: c.valorUnitario,
        },
      ],
    }));

  const salvarNoCadastro = (item: Item) => {
    if (!item.descricao.trim()) return;
    setOrc((o) => {
      const existe = o.catalogo.find(
        (c) =>
          c.grupo === item.grupo &&
          c.descricao.trim().toLowerCase() === item.descricao.trim().toLowerCase(),
      );
      const catalogo = existe
        ? o.catalogo.map((c) =>
            c.id === existe.id
              ? { ...c, unidade: item.unidade, valorUnitario: item.valorUnitario }
              : c,
          )
        : [
            ...o.catalogo,
            {
              id: novoId(),
              grupo: item.grupo,
              descricao: item.descricao.trim(),
              unidade: item.unidade,
              valorUnitario: item.valorUnitario,
            },
          ];
      return { ...o, catalogo };
    });
  };

  const removerDoCadastro = (id: string) =>
    setOrc((o) => ({ ...o, catalogo: o.catalogo.filter((c) => c.id !== id) }));

  const criarNoCadastro = () => {
    if (!novoCadastro.descricao.trim()) return;
    setOrc((o) => ({
      ...o,
      catalogo: [
        ...o.catalogo,
        {
          id: novoId(),
          grupo: grupoAtivo,
          descricao: novoCadastro.descricao.trim(),
          unidade: novoCadastro.unidade || "un",
          valorUnitario: novoCadastro.valorUnitario,
        },
      ],
    }));
    setNovoCadastro({
      descricao: "",
      unidade: grupoAtivo === "maoDeObra" ? "h" : "un",
      valorUnitario: 0,
    });
  };

  const setBdi = (campo: keyof Orcamento["percentuais"]["bdi"], v: number) =>
    setOrc((o) => ({
      ...o,
      percentuais: { ...o.percentuais, bdi: { ...o.percentuais.bdi, [campo]: v } },
    }));

  const setImposto = (id: string, patch: { nome?: string; aliquota?: number }) =>
    setOrc((o) => ({
      ...o,
      percentuais: {
        ...o.percentuais,
        impostos: o.percentuais.impostos.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      },
    }));

  const camposBdi: { campo: keyof Orcamento["percentuais"]["bdi"]; label: string }[] = [
    { campo: "administracaoCentral", label: "Administração central" },
    { campo: "lucro", label: "Lucro" },
    { campo: "riscos", label: "Riscos" },
    { campo: "seguros", label: "Seguros" },
  ];

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
            <div className="grid size-9 place-items-center rounded-lg bg-navy text-[13px] font-bold text-navy-foreground">
              OF
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">ObraForma</p>
              <p className="text-[11px] text-muted-ink">Formação de preço de serviços</p>
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
              to="/qqp"
              className="rounded-lg border border-line bg-card/70 px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-card"
            >
              QQP →
            </Link>
            <button
              onClick={() => setOrc(orcamentoInicial)}
              className="rounded-lg border border-line bg-card/70 px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-card"
            >
              Restaurar exemplo
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1440px] px-6 py-6">
        <div className="animate-rise mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">Serviço</p>
            <input
              value={orc.nomeServico}
              onChange={(e) => setOrc((o) => ({ ...o, nomeServico: e.target.value }))}
              className="mt-1 w-full min-w-[320px] bg-transparent text-2xl font-bold tracking-tight text-ink outline-none sm:text-[28px]"
            />
            <p className="mt-1 text-sm text-muted-ink">
              Composição de custos, encargos, BDI e impostos
            </p>
          </div>
          <button
            onClick={adicionarItem}
            className="rounded-lg bg-navy px-3.5 py-2 text-[13px] font-semibold text-navy-foreground transition-colors hover:bg-navy/90"
          >
            Novo item
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="animate-rise self-start rounded-2xl border border-line/80 bg-card/65 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight">Composição do serviço</h2>
              <span className="font-mono text-[11px] text-muted-ink">
                5 grupos · {orc.itens.length} itens
              </span>
            </div>

            <div className="mb-4 flex flex-wrap gap-1.5">
              {GRUPOS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGrupoAtivo(g.id)}
                  className={
                    g.id === grupoAtivo
                      ? "rounded-md bg-navy px-3 py-1.5 text-[12px] font-semibold text-navy-foreground"
                      : "rounded-md border border-line bg-card/60 px-3 py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-card"
                  }
                >
                  {g.label}
                </button>
              ))}
            </div>

            <div className="mb-4 rounded-xl border border-line/70 bg-card/50 p-3.5">
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-navy">
                  Cadastro de {GRUPOS.find((g) => g.id === grupoAtivo)?.label.toLowerCase()}
                </span>
                <span className="font-mono text-[11px] text-muted-ink">
                  {cadastro.length} cadastrados
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {cadastro.map((c) => (
                  <span
                    key={c.id}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-1 text-[12px] text-ink"
                  >
                    <button
                      onClick={() => adicionarDoCadastro(c)}
                      className="inline-flex items-center gap-1.5 transition-colors hover:text-brand"
                      title={`Adicionar ${c.descricao} à composição`}
                    >
                      <span className="font-medium">{c.descricao}</span>
                      <span className="font-mono text-[11px] text-muted-ink">
                        {brl(c.valorUnitario)}/{c.unidade}
                      </span>
                      <span className="text-[13px] leading-none text-brand">+</span>
                    </button>
                    <button
                      onClick={() => removerDoCadastro(c.id)}
                      aria-label={`Excluir ${c.descricao} do cadastro`}
                      className="text-[12px] leading-none text-muted-ink transition-colors hover:text-ink"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {cadastro.length === 0 && (
                  <span className="text-[12px] text-muted-ink">
                    Nenhum cadastro neste grupo — cadastre abaixo para reutilizar depois.
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line/60 pt-3">
                <input
                  value={novoCadastro.descricao}
                  placeholder={
                    grupoAtivo === "maoDeObra" ? "Ex.: Eletricista" : "Ex.: Tijolo cerâmico"
                  }
                  onChange={(e) => setNovoCadastro((n) => ({ ...n, descricao: e.target.value }))}
                  className="min-w-[180px] flex-1 rounded-md border border-line bg-card px-2 py-1.5 text-[13px] text-ink outline-none focus:border-brand"
                />
                <input
                  value={novoCadastro.unidade}
                  placeholder="un"
                  onChange={(e) => setNovoCadastro((n) => ({ ...n, unidade: e.target.value }))}
                  className="w-16 rounded-md border border-line bg-card px-2 py-1.5 text-center font-mono text-[12px] text-muted-ink outline-none focus:border-brand"
                />
                <NumeroInput
                  value={novoCadastro.valorUnitario}
                  onChange={(v) => setNovoCadastro((n) => ({ ...n, valorUnitario: v }))}
                  className="w-28 py-1.5"
                />
                <button
                  onClick={criarNoCadastro}
                  className="rounded-md border border-line bg-card px-3 py-1.5 text-[12px] font-semibold text-ink transition-colors hover:bg-brand-soft"
                >
                  Cadastrar
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted-ink">
                    <th className="py-2 pr-3 font-medium">Descrição</th>
                    {grupoAtivo === "maoDeObra" && (
                      <th className="px-2 py-2 text-right font-medium">Profissionais</th>
                    )}
                    <th className="px-2 py-2 text-right font-medium">
                      {grupoAtivo === "maoDeObra" ? "Horas/Dias" : "Qtd"}
                    </th>
                    <th className="px-2 py-2 text-right font-medium">
                      {grupoAtivo === "maoDeObra" ? "Tipo" : "Un"}
                    </th>
                    <th className="px-2 py-2 text-right font-medium">Valor unit.</th>
                    <th className="px-2 py-2 text-right font-medium">Total</th>
                    <th className="py-2 pl-2" />
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {itens.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-line/60 transition-colors hover:bg-brand-soft/40"
                    >
                      <td className="py-2 pr-3">
                        <input
                          value={item.descricao}
                          placeholder="Descrição do item"
                          onChange={(e) => atualizarItem(item.id, { descricao: e.target.value })}
                          className="w-full rounded-md border border-transparent bg-transparent px-1 py-1 font-sans text-[13px] text-ink outline-none focus:border-line focus:bg-card"
                        />
                      </td>
                      {item.grupo === "maoDeObra" && (
                        <td className="px-2 py-2 text-right">
                          <NumeroInput
                            value={item.quantidadeProfissionais ?? 1}
                            onChange={(v) => atualizarItem(item.id, { quantidadeProfissionais: v })}
                            className="w-20"
                          />
                        </td>
                      )}
                      <td className="px-2 py-2 text-right">
                        <NumeroInput
                          value={item.quantidade}
                          onChange={(v) => atualizarItem(item.id, { quantidade: v })}
                          className="w-20"
                        />
                      </td>
                      <td className="px-2 py-2 text-right">
                        {item.grupo === "maoDeObra" ? (
                          <select
                            value={item.unidade}
                            onChange={(e) => atualizarItem(item.id, { unidade: e.target.value })}
                            className="w-20 rounded-md border border-line bg-card px-2 py-1 text-right font-mono text-[12px] text-muted-ink outline-none focus:border-brand"
                          >
                            <option value="h">hora</option>
                            <option value="dia">dia</option>
                          </select>
                        ) : (
                          <input
                            value={item.unidade}
                            onChange={(e) => atualizarItem(item.id, { unidade: e.target.value })}
                            className="w-14 rounded-md border border-line bg-card px-2 py-1 text-right font-mono text-[12px] text-muted-ink outline-none focus:border-brand"
                          />
                        )}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <NumeroInput
                          value={item.valorUnitario}
                          onChange={(v) => atualizarItem(item.id, { valorUnitario: v })}
                          className="w-28"
                        />
                      </td>
                      <td className="px-2 py-2 text-right font-medium">
                        {brl(totalItem(item, orc.percentuais.encargosSociais))}
                      </td>
                      <td className="py-2 pl-2 text-right">
                        <button
                          onClick={() => salvarNoCadastro(item)}
                          aria-label={`Salvar ${item.descricao || "item"} no cadastro`}
                          className="mr-1 rounded-md border border-line bg-card px-2 py-1 font-sans text-[11px] text-muted-ink transition-colors hover:text-brand"
                        >
                          Salvar no cadastro
                        </button>
                        <button
                          onClick={() => removerItem(item.id)}
                          aria-label={`Remover ${item.descricao || "item"}`}
                          className="rounded-md border border-line bg-card px-2 py-1 font-sans text-[11px] text-muted-ink transition-colors hover:text-ink"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                  {itens.length === 0 && (
                    <tr>
                      <td
                        colSpan={grupoAtivo === "maoDeObra" ? 7 : 6}
                        className="py-8 text-center font-sans text-[13px] text-muted-ink"
                      >
                        Nenhum item neste grupo. Use “Novo item” para cadastrar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/70 bg-card/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-ink">Encargos sociais</span>
                <NumeroInput
                  value={orc.percentuais.encargosSociais}
                  onChange={(v) =>
                    setOrc((o) => ({ ...o, percentuais: { ...o.percentuais, encargosSociais: v } }))
                  }
                  className="w-20"
                />
                <span className="text-[11px] text-muted-ink">% aplicado sobre a mão de obra</span>
              </div>
              <div className="font-mono text-[13px]">
                <span className="text-muted-ink">Subtotal direto:</span>
                <span className="ml-1 font-semibold">{brl(r.custoDireto)}</span>
              </div>
            </div>
          </section>

          <aside className="animate-rise self-start rounded-2xl border border-line/80 bg-card/70 p-5 backdrop-blur-xl lg:sticky lg:top-[76px]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight">Resumo da formação</h2>
              <span className="rounded-full bg-brand-soft px-2 py-0.5 font-mono text-[10px] font-medium text-brand">
                AO VIVO
              </span>
            </div>

            <div className="space-y-2.5">
              {r.porGrupo.map((g) => (
                <div key={g.id} className="flex items-center justify-between">
                  <span className="text-[13px] text-muted-ink">{g.label}</span>
                  <span className="font-mono text-[13px]">{brl(g.total)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-line/60 pt-2">
                <span className="text-[13px] font-medium text-ink">Custo direto</span>
                <span className="font-mono text-[13px] font-semibold">{brl(r.custoDireto)}</span>
              </div>

              <div className="mt-3 rounded-xl border border-line/70 bg-card/50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-navy">
                    BDI
                  </span>
                  <span className="font-mono text-[12px] font-semibold text-ink">
                    {pct(r.bdiPercent)}
                  </span>
                </div>
                <div className="space-y-1.5 text-[12px]">
                  {camposBdi.map(({ campo, label }) => (
                    <div key={campo} className="flex items-center justify-between gap-2">
                      <span className="text-muted-ink">{label}</span>
                      <span className="flex items-center gap-1">
                        <NumeroInput
                          value={orc.percentuais.bdi[campo]}
                          onChange={(v) => setBdi(campo, v)}
                          className="w-16"
                        />
                        <span className="text-muted-ink">%</span>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-line/60 pt-2">
                  <span className="text-[12px] text-muted-ink">Valor do BDI</span>
                  <span className="font-mono text-[13px] font-medium">{brl(r.valorBdi)}</span>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-line/70 bg-card/50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-navy">
                    Impostos
                  </span>
                  <button
                    onClick={() =>
                      setOrc((o) => ({
                        ...o,
                        percentuais: {
                          ...o.percentuais,
                          impostos: [
                            ...o.percentuais.impostos,
                            { id: novoId(), nome: "Novo imposto", aliquota: 0 },
                          ],
                        },
                      }))
                    }
                    className="rounded-md border border-line bg-card px-1.5 py-0.5 font-mono text-[11px] text-muted-ink transition-colors hover:text-ink"
                  >
                    + adicionar
                  </button>
                </div>
                <div className="space-y-1.5 text-[12px]">
                  {orc.percentuais.impostos.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-2">
                      <input
                        value={t.nome}
                        onChange={(e) => setImposto(t.id, { nome: e.target.value })}
                        className="w-24 rounded-md border border-transparent bg-transparent px-1 py-1 text-[12px] text-muted-ink outline-none focus:border-line focus:bg-card"
                      />
                      <span className="flex items-center gap-1">
                        <NumeroInput
                          value={t.aliquota}
                          onChange={(v) => setImposto(t.id, { aliquota: v })}
                          className="w-16"
                        />
                        <span className="text-muted-ink">%</span>
                        <button
                          onClick={() =>
                            setOrc((o) => ({
                              ...o,
                              percentuais: {
                                ...o.percentuais,
                                impostos: o.percentuais.impostos.filter((x) => x.id !== t.id),
                              },
                            }))
                          }
                          aria-label={`Remover ${t.nome}`}
                          className="px-1 text-[12px] text-muted-ink transition-colors hover:text-ink"
                        >
                          ×
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-line/60 pt-2">
                  <span className="text-[12px] text-muted-ink">
                    Impostos ({pct(r.impostoPercent)})
                  </span>
                  <span className="font-mono text-[13px] font-medium">{brl(r.valorImpostos)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-navy p-4 text-navy-foreground">
              <p className="text-[11px] uppercase tracking-wider text-navy-foreground/60">
                Preço final de venda
              </p>
              <p className="mt-1 font-mono text-[26px] font-semibold tracking-tight">
                {brl(r.precoFinal)}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-navy-foreground/15 pt-2.5 text-[12px]">
                <span className="text-navy-foreground/70">Margem sobre custo</span>
                <span className="font-mono font-medium text-positive">
                  +{r.margem.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                </span>
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] text-muted-ink">
              Preço = (custo direto + BDI) ÷ (1 − impostos)
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}
