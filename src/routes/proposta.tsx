import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  brl,
  pct,
  qqpInicial,
  calcularQQP,
  totalFormacaoItem,
  QQP_STORAGE_KEY,
  CLIENTES_STORAGE_KEY,
  PROPOSALS_STORAGE_KEY,
  EMPRESA_STORAGE_KEY,
  clientesIniciais,
  proposalsIniciais,
  type QQPData,
  type Cliente,
  type ProposalRecord,
  type EmpresaData,
} from "@/lib/pricing";

export const Route = createFileRoute("/proposta")({
  head: () => ({
    meta: [
      { title: "Proposta Comercial" },
      { name: "description", content: "Geração de proposta comercial com dados da QQP." },
    ],
  }),
  component: PropostaPage,
});

type FornecimentoMaterial = "contratada" | "contratante" | "parcial";

const TEXTO_FORNECIMENTO_CONTRATADA_COMPLETO = `Fornecimento da alimentação;
Mão-de-obra especializada direta e indireta;
Material de aplicação;
Material de aplicação e consumo;
Transporte do pessoal;
Uniformes e equipamentos de proteção individual (EPI's).`;

const TEXTO_FORNECIMENTO_CONTRATADA_SEM_MATERIAL = `Fornecimento da alimentação;
Mão-de-obra especializada direta e indireta;
Material de consumo;
Transporte do pessoal;
Uniformes e equipamentos de proteção individual (EPI's).`;

const TEXTO_FORNECIMENTO_CONTRATANTE_BASE = `Fiscalização;
Informações técnicas necessárias à execução do serviço;`;

const TEXTO_FORNECIMENTO_CONTRATANTE_COM_MATERIAL = `Fiscalização;
Informações técnicas necessárias à execução do serviço;
Material de aplicação (Tubos/ Chapas / Perfil).`;

type PropostaData = {
  fornecimentoMaterial: FornecimentoMaterial;
  fornecimentoContratada: string;
  fornecimentoContratante: string;
  empresaRazaoSocial: string;
  empresaCnpj: string;
  empresaEndereco: string;
  empresaContato: string;
  empresaEmail: string;
  empresaBanco: string;
  empresaAgencia: string;
  empresaConta: string;
  cliente: string;
  comprador: string;
  consulta: string;
  propostaNumero: string;
  data: string;
  objeto: string;
  mobilizacao: string;
  prazoExecucao: string;
  garantia: string;
  adiantamento: string;
  condicaoPagamento: string;
  cargaHoraria: string;
  validadeProposta: string;
  responsavel: string;
  cargoResponsavel: string;
};

const propostaInicial: PropostaData = {
  fornecimentoMaterial: "contratada",
  fornecimentoContratada: TEXTO_FORNECIMENTO_CONTRATADA_COMPLETO,
  fornecimentoContratante: TEXTO_FORNECIMENTO_CONTRATANTE_BASE,
  empresaRazaoSocial: "",
  empresaCnpj: "",
  empresaEndereco: "",
  empresaContato: "",
  empresaEmail: "",
  empresaBanco: "",
  empresaAgencia: "",
  empresaConta: "",
  cliente: "",
  comprador: "",
  consulta: "",
  propostaNumero: "",
  data: new Date().toLocaleDateString("pt-BR"),
  objeto: "",
  mobilizacao: "Imediato.",
  prazoExecucao: "20 (Vinte) dias.",
  garantia: "4 (QUATRO) MESES",
  adiantamento: "0",
  condicaoPagamento:
    "O pagamento do valor dos serviços acordado nesta PROPOSTA deve ser efetuado pela CONTRATANTE, em até 90 (Noventa) dias da data de emissão da nota fiscal, por meio de depósito ou transferência bancária, na conta corrente informada no item 10.",
  cargaHoraria:
    "SEGUNDA À QUINTA-FEIRA — 08H00MIN ÀS 18H00MIN;\nSEXTA-FEIRA — 08H00MIN ÀS 17H00MIN;\nINTERVALO PARA ALMOÇO — 01H00MIN.",
  validadeProposta: "30 (Trinta) dias corridos.",
  responsavel: "",
  cargoResponsavel: "GERENTE COMERCIAL",
};

const STORAGE_KEY_PROPOSTA = "obraforma:proposta:v1";

function InputField({
  label,
  value,
  onChange,
  className = "",
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  multiline?: boolean;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-[11px] font-medium text-muted-ink">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-line bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-line bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
        />
      )}
    </div>
  );
}

function PropostaPage() {
  const [proposta, setProposta] = useState<PropostaData>(propostaInicial);
  const [qqp, setQqp] = useState<QQPData>(qqpInicial);
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciais);
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string>("");
  const [carregado, setCarregado] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erros, setErros] = useState<string[]>([]);
  const [empresa, setEmpresa] = useState<EmpresaData>({} as EmpresaData);
  const [itensOrdem, setItensOrdem] = useState<string[]>([]);

  useEffect(() => {
    try {
      const rawProposta = localStorage.getItem(STORAGE_KEY_PROPOSTA);
      if (rawProposta) {
        const dados = JSON.parse(rawProposta) as PropostaData & { _salvo?: boolean };
        setProposta({ ...propostaInicial, ...dados });
        if (dados._salvo) setSalvo(true);
      }
      const rawEmpresa = localStorage.getItem(EMPRESA_STORAGE_KEY);
      if (rawEmpresa) {
        const emp = JSON.parse(rawEmpresa) as EmpresaData;
        setEmpresa(emp);
        if (!rawProposta) {
          setProposta((p) => ({
            ...p,
            empresaRazaoSocial: emp.razaoSocial,
            empresaCnpj: emp.cnpj,
            empresaEndereco: emp.endereco,
            empresaContato: emp.contato,
            empresaEmail: emp.email,
          }));
        }
      }
      const rawQqp = localStorage.getItem(QQP_STORAGE_KEY);
      if (rawQqp) {
        setQqp({ ...qqpInicial, ...JSON.parse(rawQqp) });
      }
      const rawClientes = localStorage.getItem(CLIENTES_STORAGE_KEY);
      if (rawClientes) {
        setClientes(JSON.parse(rawClientes));
      }
    } catch {
      /* ignora */
    }
    setCarregado(true);
  }, []);

  const r = useMemo(() => calcularQQP(qqp), [qqp]);
  const valorTotal = r.valorTotalGeral;
  const valorExtenso = valorTotal > 0 ? `(${valorParaExtenso(valorTotal)} reais)` : "";

  const itensOrdemCalculada = useMemo(() => {
    if (itensOrdem.length === 0) return r.itens;
    const itensMap = new Map(r.itens.map((i) => [i.id, i]));
    const ordenados = itensOrdem.map((id) => itensMap.get(id)).filter(Boolean);
    const novos = r.itens.filter((i) => !itensOrdem.includes(i.id));
    return [...ordenados, ...novos] as typeof r.itens;
  }, [r.itens, itensOrdem]);

  const moverItem = (id: string, direcao: -1 | 1) => {
    setItensOrdem((prev) => {
      const ids = prev.length > 0 ? [...prev] : r.itens.map((i) => i.id);
      const idx = ids.indexOf(id);
      if (idx < 0) return ids;
      const novoIdx = idx + direcao;
      if (novoIdx < 0 || novoIdx >= ids.length) return ids;
      const nova = [...ids];
      const temp = nova[novoIdx];
      const atual = nova[idx];
      if (temp === undefined || atual === undefined) return ids;
      nova[novoIdx] = atual;
      nova[idx] = temp;
      return nova;
    });
  };

  const resetarOrdem = () => setItensOrdem([]);

  const set = (patch: Partial<PropostaData>) => {
    setProposta((p) => ({ ...p, ...patch }));
    setSalvo(false);
    setErros([]);
  };

  const clienteSelecionado = clientes.find((c) => c.id === clienteSelecionadoId);

  const selecionarCliente = (id: string) => {
    setClienteSelecionadoId(id);
    const cliente = clientes.find((c) => c.id === id);
    if (cliente) {
      set({
        cliente: cliente.razaoSocial,
        comprador: cliente.compradores.length === 1 ? (cliente.compradores[0]?.nome ?? "") : "",
      });
    }
  };

  const camposObrigatorios: { campo: keyof PropostaData; label: string }[] = [
    { campo: "cliente", label: "Cliente" },
    { campo: "comprador", label: "Comprador" },
    { campo: "objeto", label: "Objeto" },
    { campo: "responsavel", label: "Responsável" },
  ];

  const validar = (): boolean => {
    const lista: string[] = [];
    for (const { campo, label } of camposObrigatorios) {
      if (!proposta[campo]?.trim()) lista.push(label);
    }
    if (!empresa.razaoSocial?.trim()) lista.push("Razão Social da empresa (Configurações)");
    if (!empresa.cnpj?.trim()) lista.push("CNPJ da empresa (Configurações)");
    if (!empresa.endereco?.trim()) lista.push("Endereço da empresa (Configurações)");
    if (!empresa.contato?.trim()) lista.push("Contato da empresa (Configurações)");
    if (valorTotal <= 0) lista.push("Valor total da QQP (adicione itens na QQP)");
    setErros(lista);
    return lista.length === 0;
  };

  const salvar = () => {
    if (!validar()) return;
    localStorage.setItem(STORAGE_KEY_PROPOSTA, JSON.stringify({ ...proposta, _salvo: true }));

    const registro: ProposalRecord = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      data: proposta.data,
      dataISO: new Date().toISOString(),
      cliente: proposta.cliente,
      comprador: proposta.comprador,
      propostaNumero: proposta.propostaNumero,
      consulta: proposta.consulta,
      objeto: proposta.objeto,
      valorTotal,
      status: "pendente",
    };

    try {
      const raw = localStorage.getItem(PROPOSALS_STORAGE_KEY);
      const lista: ProposalRecord[] = raw ? JSON.parse(raw) : [];
      const existente = lista.findIndex(
        (p) => p.propostaNumero === registro.propostaNumero && p.cliente === registro.cliente,
      );
      if (existente >= 0) {
        lista[existente] = { ...lista[existente], ...registro };
      } else {
        lista.unshift(registro);
      }
      localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(lista));
    } catch {
      /* ignora */
    }

    setSalvo(true);
    setErros([]);
  };

  const imprimir = () => {
    if (!salvo) {
      alert("Salve a proposta antes de imprimir.");
      return;
    }
    window.print();
  };

  const aplicarFornecimento = (modo: FornecimentoMaterial) => {
    if (modo === "contratada") {
      set({
        fornecimentoMaterial: modo,
        fornecimentoContratada: TEXTO_FORNECIMENTO_CONTRATADA_COMPLETO,
        fornecimentoContratante: TEXTO_FORNECIMENTO_CONTRATANTE_BASE,
      });
    } else if (modo === "contratante") {
      set({
        fornecimentoMaterial: modo,
        fornecimentoContratada: TEXTO_FORNECIMENTO_CONTRATADA_SEM_MATERIAL,
        fornecimentoContratante: TEXTO_FORNECIMENTO_CONTRATANTE_COM_MATERIAL,
      });
    } else {
      set({
        fornecimentoMaterial: modo,
        fornecimentoContratada: TEXTO_FORNECIMENTO_CONTRATADA_COMPLETO,
        fornecimentoContratante: TEXTO_FORNECIMENTO_CONTRATANTE_COM_MATERIAL,
      });
    }
  };

  const textoMedicoes = `A medição deverá ser feita em conjunto com os FISCAIS DA CONTRATANTE e da CONTRATADA através de BMM (Boletim de Medição Mensal) no qual constará o quantitativo e os valores dos serviços prestados.`;

  return (
    <div className="min-h-screen bg-wash font-sans text-ink antialiased">
      <div
        className="print-decoration pointer-events-none fixed -left-32 top-[-14%] h-[520px] w-[520px] rounded-full bg-brand/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="print-decoration pointer-events-none fixed right-[-10%] top-1/2 h-[480px] w-[480px] rounded-full bg-navy/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Header — oculto na impressão */}
      <header className="no-print sticky top-0 z-30 border-b border-line/70 bg-card/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="grid size-9 place-items-center rounded-lg bg-navy text-[13px] font-bold text-navy-foreground"
            >
              OF
            </Link>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">Proposta Comercial</p>
              <p className="text-[11px] text-muted-ink">Geração de proposta com dados da QQP</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-line bg-card/70 px-3 py-1.5 text-[11px] font-medium text-muted-ink sm:inline-flex">
              <span className={`size-1.5 rounded-full ${salvo ? "bg-positive" : "bg-muted-ink"}`} />
              {salvo ? "Salvo" : "Não salvo"}
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
              ← QQP
            </Link>
            <button
              onClick={salvar}
              className="rounded-lg border border-line bg-card/70 px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-card"
            >
              Salvar
            </button>
            <button
              onClick={imprimir}
              disabled={!salvo}
              className="rounded-lg bg-navy px-3.5 py-2 text-[13px] font-semibold text-navy-foreground transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Imprimir / PDF
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1000px] px-6 py-6">
        {/* Erros de validação */}
        {erros.length > 0 && (
          <div className="no-print mb-4 animate-rise rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="mb-2 text-[13px] font-semibold text-destructive">
              Preencha os campos obrigatórios:
            </p>
            <ul className="list-inside list-disc text-[12px] text-destructive/80">
              {erros.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Formulário de edição — oculto na impressão */}
        <div className="no-print animate-rise mb-6 rounded-2xl border border-line/80 bg-card/65 p-5 backdrop-blur-xl">
          <h2 className="mb-4 text-sm font-semibold tracking-tight">Dados da Proposta</h2>

          <div className="mb-4 rounded-xl border border-line/70 bg-card/50 p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-navy">
                Dados da Empresa
              </p>
              <Link
                to="/configuracoes"
                className="text-[11px] font-medium text-brand hover:underline"
              >
                Editar em Configurações →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[11px] text-muted-ink">Razão Social</p>
                <p className="text-[13px] font-medium">{empresa.razaoSocial || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-ink">CNPJ</p>
                <p className="text-[13px] font-medium">{empresa.cnpj || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-ink">Endereço</p>
                <p className="text-[13px] font-medium">
                  {[empresa.endereco, empresa.bairro, empresa.cidade, empresa.estado]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-ink">Contato</p>
                <p className="text-[13px] font-medium">{empresa.contato || "—"}</p>
              </div>
              {empresa.telefone && (
                <div>
                  <p className="text-[11px] text-muted-ink">Telefone</p>
                  <p className="text-[13px] font-medium">{empresa.telefone}</p>
                </div>
              )}
              {empresa.email && (
                <div>
                  <p className="text-[11px] text-muted-ink">E-mail</p>
                  <p className="text-[13px] font-medium">{empresa.email}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-line/70 bg-card/50 p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-navy">
                Dados do Cliente
              </p>
              <Link
                to="/clientes"
                className="text-[11px] font-medium text-brand transition-colors hover:text-brand/80"
              >
                Cadastrar / gerenciar clientes →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-ink">
                  Selecionar cliente
                </label>
                <select
                  value={clienteSelecionadoId}
                  onChange={(e) => selecionarCliente(e.target.value)}
                  className="w-full rounded-md border border-line bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
                >
                  <option value="">— Digite manualmente ou selecione —</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razaoSocial}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-ink">
                  Comprador
                </label>
                {clienteSelecionado && clienteSelecionado.compradores.length > 0 ? (
                  <select
                    value={proposta.comprador}
                    onChange={(e) => set({ comprador: e.target.value })}
                    className="w-full rounded-md border border-line bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
                  >
                    <option value="">— Selecione —</option>
                    {clienteSelecionado.compradores.map((cp) => (
                      <option key={cp.id} value={cp.nome}>
                        {cp.nome}
                        {cp.departamento ? ` (${cp.departamento})` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={proposta.comprador}
                    onChange={(e) => set({ comprador: e.target.value })}
                    className="w-full rounded-md border border-line bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
                  />
                )}
              </div>
              <InputField
                label="Cliente (razão social) *"
                value={proposta.cliente}
                onChange={(v) => set({ cliente: v })}
              />
              <InputField
                label="Comprador (nome) *"
                value={proposta.comprador}
                onChange={(v) => set({ comprador: v })}
              />
              <InputField
                label="Consulta"
                value={proposta.consulta}
                onChange={(v) => set({ consulta: v })}
              />
              <InputField
                label="Proposta Nº"
                value={proposta.propostaNumero}
                onChange={(v) => set({ propostaNumero: v })}
              />
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-line/70 bg-card/50 p-3.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-navy">
              Condições
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InputField
                label="Objeto *"
                value={proposta.objeto}
                onChange={(v) => set({ objeto: v })}
                multiline
              />
              <InputField
                label="Mobilização"
                value={proposta.mobilizacao}
                onChange={(v) => set({ mobilizacao: v })}
              />
              <InputField
                label="Prazo de Execução"
                value={proposta.prazoExecucao}
                onChange={(v) => set({ prazoExecucao: v })}
              />
              <InputField
                label="Garantia do Serviço"
                value={proposta.garantia}
                onChange={(v) => set({ garantia: v })}
              />
              <InputField
                label="Adiantamento (%)"
                value={proposta.adiantamento}
                onChange={(v) => set({ adiantamento: v })}
              />
              <InputField
                label="Validade da Proposta"
                value={proposta.validadeProposta}
                onChange={(v) => set({ validadeProposta: v })}
              />
              <InputField
                label="Condição de Pagamento"
                value={proposta.condicaoPagamento}
                onChange={(v) => set({ condicaoPagamento: v })}
                className="sm:col-span-2"
                multiline
              />
              <InputField
                label="Carga Horária"
                value={proposta.cargaHoraria}
                onChange={(v) => set({ cargaHoraria: v })}
                className="sm:col-span-2"
                multiline
              />
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-line/70 bg-card/50 p-3.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-navy">
              Fornecimento
            </p>
            <div className="mb-3 flex flex-col gap-2">
              <label className="text-[11px] font-medium text-muted-ink">
                Quem fornece o material de aplicação?
              </label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["contratada", "Contratada fornece"],
                    ["contratante", "Contratante fornece"],
                    ["parcial", "Parcial (ambos)"],
                  ] as const
                ).map(([modo, rotulo]) => (
                  <button
                    key={modo}
                    type="button"
                    onClick={() => aplicarFornecimento(modo)}
                    className={`rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                      proposta.fornecimentoMaterial === modo
                        ? "border-navy bg-navy text-navy-foreground"
                        : "border-line bg-card text-ink hover:bg-brand/10"
                    }`}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InputField
                label="Fornecimento da Contratada (editável)"
                value={proposta.fornecimentoContratada}
                onChange={(v) => set({ fornecimentoContratada: v })}
                multiline
              />
              <InputField
                label="Fornecimento da Contratante (editável)"
                value={proposta.fornecimentoContratante}
                onChange={(v) => set({ fornecimentoContratante: v })}
                multiline
              />
            </div>
          </div>

          <div className="rounded-xl border border-line/70 bg-card/50 p-3.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-navy">
              Assinatura
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InputField
                label="Responsável *"
                value={proposta.responsavel}
                onChange={(v) => set({ responsavel: v })}
              />
              <InputField
                label="Cargo"
                value={proposta.cargoResponsavel}
                onChange={(v) => set({ cargoResponsavel: v })}
              />
            </div>
          </div>
        </div>

        {/* Proposta — sempre visível, mas na impressão aparece sozinha */}
        <div className="animate-rise rounded-2xl border border-line/80 bg-card/65 p-8 backdrop-blur-xl print:border-0 print:bg-white print:p-0">
          <div className="proposta-print">
            <div className="mb-6 flex items-center gap-4 border-b-2 border-navy pb-4">
              {empresa.logo && (
                <img src={empresa.logo} alt="Logo" className="h-16 object-contain print:h-14" />
              )}
              <div className="flex-1">
                <p className="text-[16px] font-bold text-navy">
                  {empresa.razaoSocial || "Razão Social"}
                </p>
                <p className="text-[12px] text-muted-ink">
                  {[empresa.endereco, empresa.bairro, empresa.cidade, empresa.estado]
                    .filter(Boolean)
                    .join(", ")}
                  {empresa.telefone && ` | Tel: ${empresa.telefone}`}
                  {empresa.contato && ` | Contato: ${empresa.contato}`}
                  {empresa.email && ` | e-mail: ${empresa.email}`}
                </p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4 text-[13px]">
              <div>
                <span className="font-semibold">CLIENTE:</span> {proposta.cliente || "—"}
              </div>
              <div>
                <span className="font-semibold">CONSULTA:</span> {proposta.consulta || "—"}
              </div>
              <div>
                <span className="font-semibold">COMPRADOR:</span> {proposta.comprador || "—"}
              </div>
              <div>
                <span className="font-semibold">PROPOSTA Nº:</span> {proposta.propostaNumero || "—"}
              </div>
              <div>
                <span className="font-semibold">DATA:</span> {proposta.data}
              </div>
            </div>

            <div className="mb-4 text-[13px]">
              <span className="font-semibold">OBJETO:</span>{" "}
              {proposta.objeto || qqp.descricao || "—"}
            </div>

            <div className="mb-6 rounded-lg bg-card/50 p-4 text-[12px] leading-relaxed text-muted-ink">
              <p className="mb-2">Prezado Senhor,</p>
              <p>
                Após examinar e estudar cuidadosamente os documentos desta solicitação de proposta e
                tendo tomado pleno conhecimento da natureza e condições de execução/fornecimento
                nela contidos, no que possam afetá-los em custo e prazo, apresentamos proposta
                comercial para execução dos referidos serviços.
              </p>
              <p className="mt-2">
                Declaramos que a empresa assume inteira responsabilidade pela veracidade da
                documentação apresentada e expressamente autoriza qualquer pessoa física ou jurídica
                a fornecer à <strong>{proposta.cliente || "CONTRATANTE"}</strong>, as informações
                atinentes ao assunto que essa entidade julgar oportuno obter, bem como todas as
                informações complementares que a{" "}
                <strong>{proposta.cliente || "CONTRATANTE"}</strong> solicitar.
              </p>
            </div>

            <div className="space-y-4 text-[13px]">
              <section>
                <h3 className="mb-1 font-semibold">1. OBJETO</h3>
                <p>{proposta.objeto || qqp.descricao || "—"}</p>
              </section>
              <section>
                <h3 className="mb-1 font-semibold">2. PRAZO DE MOBILIZAÇÃO E DESMOBILIZAÇÃO</h3>
                <p>{proposta.mobilizacao}</p>
              </section>
              <section>
                <h3 className="mb-1 font-semibold">3. PRAZO DE EXECUÇÃO</h3>
                <p>{proposta.prazoExecucao}</p>
              </section>
              <section>
                <h3 className="mb-1 font-semibold">4. FORNECIMENTO DA CONTRATADA</h3>
                <pre className="whitespace-pre-wrap font-sans text-[13px]">
                  {proposta.fornecimentoContratada}
                </pre>
              </section>
              <section>
                <h3 className="mb-1 font-semibold">5. FORNECIMENTO DA CONTRATANTE</h3>
                <pre className="whitespace-pre-wrap font-sans text-[13px]">
                  {proposta.fornecimentoContratante}
                </pre>
              </section>
              <section>
                <h3 className="mb-1 font-semibold">6. VALOR</h3>
                <p className="text-[15px] font-bold">
                  {brl(valorTotal)}{" "}
                  <span className="text-[12px] font-normal text-muted-ink">{valorExtenso}</span>
                </p>
                {proposta.adiantamento !== "0" && (
                  <p className="mt-1 text-[12px] text-muted-ink">
                    OBS: É NECESSÁRIO O ADIANTAMENTO DE {proposta.adiantamento}% SOBRE O VALOR TOTAL
                    DOS SERVIÇOS PARA AQUISIÇÃO DE MATERIAL.
                  </p>
                )}
                <p className="mt-1 text-[12px] text-muted-ink">
                  — Anexo composição de preço/encargos sociais e BDI.
                </p>
              </section>
              <section>
                <h3 className="mb-1 font-semibold">7. MEDIÇÕES</h3>
                <p>{textoMedicoes}</p>
              </section>
              <section>
                <h3 className="mb-1 font-semibold">8. GARANTIA DO SERVIÇO</h3>
                <p>{proposta.garantia}</p>
              </section>
              <section>
                <h3 className="mb-1 font-semibold">9. CONDIÇÕES DE PAGAMENTO</h3>
                <p>{proposta.condicaoPagamento}</p>
              </section>
              <section>
                <h3 className="mb-1 font-semibold">10. CARGA HORÁRIA DO COLABORADOR</h3>
                <pre className="whitespace-pre-wrap font-sans text-[13px]">
                  {proposta.cargaHoraria}
                </pre>
              </section>
              <section>
                <h3 className="mb-1 font-semibold">11. DADOS DA EMPRESA E BANCÁRIOS</h3>
                <div className="space-y-0.5">
                  <p>
                    <span className="font-medium">RAZÃO SOCIAL:</span> {empresa.razaoSocial || "—"}
                  </p>
                  <p>
                    <span className="font-medium">CNPJ:</span> {empresa.cnpj || "—"}
                  </p>
                  <p>
                    <span className="font-medium">ENDEREÇO:</span>{" "}
                    {[empresa.endereco, empresa.bairro, empresa.cidade, empresa.estado]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </p>
                  <p>
                    <span className="font-medium">CONTATO:</span> {empresa.contato || "—"}
                  </p>
                  <p>
                    <span className="font-medium">EMAIL:</span> {empresa.email || "—"}
                  </p>
                  <p>
                    <span className="font-medium">TELEFONE:</span> {empresa.telefone || "—"}
                  </p>
                </div>
              </section>
              <section>
                <h3 className="mb-1 font-semibold">12. VALIDADE DA PROPOSTA</h3>
                <p>{proposta.validadeProposta}</p>
              </section>
            </div>

            <div className="mt-10 text-center">
              <p className="mb-8 text-[13px]">Atenciosamente,</p>
              <div className="inline-block border-t border-ink pt-2">
                <p className="text-[13px] font-semibold">
                  {proposta.responsavel || "____________________"}
                </p>
                <p className="text-[12px] text-muted-ink">{proposta.cargoResponsavel}</p>
              </div>
            </div>

            {/* ANEXO I — Quadro de Quantidades e Preços */}
            <div className="print-anexo mt-12 break-before-page">
              <div className="mb-4 border-b-2 border-navy pb-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-[15px] font-bold text-navy">
                    ANEXO I — QUADRO DE QUANTIDADES E PREÇOS (QQP)
                  </h2>
                  {itensOrdem.length > 0 && (
                    <button
                      onClick={resetarOrdem}
                      className="no-print rounded-md border border-line bg-card px-2 py-1 text-[11px] text-muted-ink transition-colors hover:text-ink"
                    >
                      ↻ Resetar ordem
                    </button>
                  )}
                </div>
                {qqp.descricao && (
                  <p className="mt-1 text-[12px] text-muted-ink">{qqp.descricao}</p>
                )}
              </div>

              {r.itens.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-muted-ink">Nenhum item na QQP.</p>
              ) : (
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-line bg-card/50">
                      <th className="border-r border-line px-2 py-1.5 text-left font-semibold">
                        Item
                      </th>
                      <th className="border-r border-line px-2 py-1.5 text-left font-semibold">
                        Descrição
                      </th>
                      <th className="border-r border-line px-2 py-1.5 text-center font-semibold">
                        Und
                      </th>
                      <th className="border-r border-line px-2 py-1.5 text-right font-semibold">
                        Qtd
                      </th>
                      <th className="border-r border-line px-2 py-1.5 text-right font-semibold">
                        Custo Unit.
                      </th>
                      <th className="border-r border-line px-2 py-1.5 text-right font-semibold">
                        BDI (%)
                      </th>
                      <th className="border-r border-line px-2 py-1.5 text-right font-semibold">
                        Preço Unit.
                      </th>
                      <th className="no-print px-2 py-1.5 text-center font-semibold">Ordem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itensOrdemCalculada.map((item, idx) => (
                      <tr key={item.id} className="border-b border-line/60">
                        <td className="border-r border-line px-2 py-1.5 text-center">{idx + 1}</td>
                        <td className="border-r border-line px-2 py-1.5">{item.descricao}</td>
                        <td className="border-r border-line px-2 py-1.5 text-center">
                          {item.unidade}
                        </td>
                        <td className="border-r border-line px-2 py-1.5 text-right font-mono">
                          {item.quantidade}
                        </td>
                        <td className="border-r border-line px-2 py-1.5 text-right font-mono">
                          {brl(item.formacaoCalculada.custoDireto)}
                        </td>
                        <td className="border-r border-line px-2 py-1.5 text-right font-mono">
                          {pct(item.formacaoCalculada.bdiPercent)}
                        </td>
                        <td className="border-r border-line px-2 py-1.5 text-right font-mono font-semibold">
                          {brl(item.precoUnitario)}
                        </td>
                        <td className="no-print border-r border-line px-1 py-1">
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              onClick={() => moverItem(item.id, -1)}
                              disabled={idx === 0}
                              className="grid size-6 place-items-center rounded border border-line bg-card text-[14px] text-muted-ink transition-colors hover:bg-brand/10 hover:text-ink disabled:opacity-30"
                              title="Mover para cima"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => moverItem(item.id, 1)}
                              disabled={idx === itensOrdemCalculada.length - 1}
                              className="grid size-6 place-items-center rounded border border-line bg-card text-[14px] text-muted-ink transition-colors hover:bg-brand/10 hover:text-ink disabled:opacity-30"
                              title="Mover para baixo"
                            >
                              ↓
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-navy bg-card/50 font-semibold">
                      <td colSpan={6} className="border-r border-line px-2 py-2 text-right">
                        VALOR TOTAL
                      </td>
                      <td className="border-r border-line px-2 py-2 text-right font-mono text-[13px]">
                        {brl(r.valorTotalGeral)}
                      </td>
                      <td className="no-print" />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {/* ANEXO II — Detalhamento da Formação de Preço por Item */}
            <div className="print-anexo mt-12 break-before-page">
              <div className="mb-4 border-b-2 border-navy pb-2">
                <h2 className="text-[15px] font-bold text-navy">
                  ANEXO II — FORMAÇÃO DE PREÇO POR ITEM
                </h2>
                <p className="mt-1 text-[12px] text-muted-ink">
                  Detalhamento dos custos por grupo (Mão de Obra, Ferramentas, Equipamentos,
                  Materiais, Serviços Terceiros) e encargos sociais.
                </p>
              </div>

              {r.itens.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-muted-ink">
                  Nenhum item para detalhar.
                </p>
              ) : (
                <div className="space-y-6">
                  {itensOrdemCalculada.map((itemCalculado, idx) => {
                    const itemOriginal = qqp.itens.find((i) => i.id === itemCalculado.id);
                    if (!itemOriginal) return null;
                    return (
                      <div key={itemOriginal.id} className="rounded-lg border border-line/70 p-4">
                        <h3 className="mb-3 text-[13px] font-bold">
                          Item {idx + 1} — {itemOriginal.descricao}
                        </h3>

                        {(
                          [
                            [
                              "maoDeObra",
                              "MÃO DE OBRA",
                              itemOriginal.formacao.maoDeObra,
                              itemCalculado.formacaoCalculada.custoMaoDeObraBase,
                            ],
                            [
                              "ferramentas",
                              "FERRAMENTAS",
                              itemOriginal.formacao.ferramentas,
                              itemCalculado.formacaoCalculada.custoFerramentas,
                            ],
                            [
                              "equipamentos",
                              "EQUIPAMENTOS",
                              itemOriginal.formacao.equipamentos,
                              itemCalculado.formacaoCalculada.custoEquipamentos,
                            ],
                            [
                              "materiais",
                              "MATERIAIS",
                              itemOriginal.formacao.materiais,
                              itemCalculado.formacaoCalculada.custoMateriais,
                            ],
                            [
                              "servicosTerceiros",
                              "SERVIÇOS DE TERCEIROS",
                              itemOriginal.formacao.servicosTerceiros,
                              itemCalculado.formacaoCalculada.custoServicosTerceiros,
                            ],
                          ] as const
                        ).map(([key, label, arr, subtotal]) => (
                          <div key={key} className="mb-3">
                            <p className="mb-1 text-[11px] font-bold text-navy">{label}</p>
                            <table className="w-full border-collapse text-[11px]">
                              <thead>
                                <tr className="border-b border-line bg-card/50">
                                  <th className="border-r border-line px-2 py-1 text-left font-semibold">
                                    Descrição
                                  </th>
                                  {key === "maoDeObra" && (
                                    <th className="border-r border-line px-2 py-1 text-center font-semibold">
                                      Prof.
                                    </th>
                                  )}
                                  <th className="border-r border-line px-2 py-1 text-center font-semibold">
                                    Qtd
                                  </th>
                                  <th className="border-r border-line px-2 py-1 text-center font-semibold">
                                    Unid.
                                  </th>
                                  <th className="border-r border-line px-2 py-1 text-right font-semibold">
                                    Valor Unit.
                                  </th>
                                  <th className="px-2 py-1 text-right font-semibold">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {arr.length === 0 ? (
                                  <tr className="border-b border-line/40">
                                    <td
                                      colSpan={key === "maoDeObra" ? 6 : 5}
                                      className="px-2 py-1 text-center text-muted-ink"
                                    >
                                      Sem itens neste grupo.
                                    </td>
                                  </tr>
                                ) : (
                                  arr.map((t) => (
                                    <tr key={t.id} className="border-b border-line/40">
                                      <td className="border-r border-line px-2 py-1">
                                        {t.descricao}
                                      </td>
                                      {key === "maoDeObra" && (
                                        <td className="border-r border-line px-2 py-1 text-center font-mono">
                                          {t.quantidadeProfissionais ?? 1}
                                        </td>
                                      )}
                                      <td className="border-r border-line px-2 py-1 text-center font-mono">
                                        {t.quantidade}
                                      </td>
                                      <td className="border-r border-line px-2 py-1 text-center font-mono">
                                        {t.unidade}
                                      </td>
                                      <td className="border-r border-line px-2 py-1 text-right font-mono">
                                        {brl(t.valorUnitario)}
                                      </td>
                                      <td className="px-2 py-1 text-right font-mono">
                                        {brl(totalFormacaoItem(t))}
                                      </td>
                                    </tr>
                                  ))
                                )}
                                {key === "maoDeObra" && (
                                  <tr className="border-b border-line/40">
                                    <td
                                      colSpan={5}
                                      className="border-r border-line px-2 py-1 text-right"
                                    >
                                      Encargos sociais (
                                      {pct(itemCalculado.formacaoCalculada.encargosPercent)})
                                    </td>
                                    <td className="px-2 py-1 text-right font-mono">
                                      {brl(itemCalculado.formacaoCalculada.valorEncargos)}
                                    </td>
                                  </tr>
                                )}
                                <tr className="border-t border-navy/40 bg-card/50 font-semibold">
                                  <td
                                    colSpan={key === "maoDeObra" ? 5 : 4}
                                    className="border-r border-line px-2 py-1 text-right"
                                  >
                                    SUBTOTAL {label}
                                  </td>
                                  <td className="px-2 py-1 text-right font-mono">
                                    {brl(
                                      key === "maoDeObra"
                                        ? itemCalculado.formacaoCalculada.custoMaoDeObra
                                        : subtotal,
                                    )}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        ))}

                        {/* Totais do item */}
                        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line/60 pt-3 text-[12px] sm:grid-cols-4">
                          <div>
                            <p className="text-[10px] text-muted-ink">Custo Direto</p>
                            <p className="font-mono font-semibold">
                              {brl(itemCalculado.formacaoCalculada.custoDireto)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-ink">
                              Encargos Sociais (
                              {pct(itemCalculado.formacaoCalculada.encargosPercent)})
                            </p>
                            <p className="font-mono font-semibold">
                              {brl(itemCalculado.formacaoCalculada.valorEncargos)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-ink">
                              BDI ({pct(itemCalculado.formacaoCalculada.bdiPercent)})
                            </p>
                            <p className="font-mono font-semibold">
                              {brl(itemCalculado.formacaoCalculada.valorBdi)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-ink">Preço Final Unit.</p>
                            <p className="font-mono font-bold">
                              {brl(itemCalculado.precoUnitario)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ANEXO III — Encargos Sociais */}
            <div className="print-anexo mt-12 break-before-page">
              <div className="mb-4 border-b-2 border-navy pb-2">
                <h2 className="text-[15px] font-bold text-navy">ANEXO III — ENCARGOS SOCIAIS</h2>
              </div>
              <div className="rounded-lg border border-line/70 p-4 text-[12px]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-card/50">
                      <th className="border-r border-line px-2 py-1 text-left font-semibold">
                        Grupo
                      </th>
                      <th className="border-r border-line px-2 py-1 text-left font-semibold">
                        Descrição
                      </th>
                      <th className="px-2 py-1 text-right font-semibold">Alíquota</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-line/40">
                      <td className="border-r border-line px-2 py-1 font-medium">A</td>
                      <td className="border-r border-line px-2 py-1">
                        Encargos Fixos (INSS, FGTS, SAT, etc.)
                      </td>
                      <td className="px-2 py-1 text-right font-mono">66,95%</td>
                    </tr>
                    <tr className="border-b border-line/40">
                      <td className="border-r border-line px-2 py-1 font-medium">B</td>
                      <td className="border-r border-line px-2 py-1">
                        Encargos Variáveis (FER, 13º, Abono, etc.)
                      </td>
                      <td className="px-2 py-1 text-right font-mono">37,40%</td>
                    </tr>
                    <tr className="border-b border-line/40">
                      <td className="border-r border-line px-2 py-1 font-medium">C</td>
                      <td className="border-r border-line px-2 py-1">
                        Provisão (Férias + 1/3 + Encargos)
                      </td>
                      <td className="px-2 py-1 text-right font-mono">8,33%</td>
                    </tr>
                    <tr className="border-b border-line/40">
                      <td className="border-r border-line px-2 py-1 font-medium">D</td>
                      <td className="border-r border-line px-2 py-1">
                        Encargos Complementares (Mensagem, Refeição)
                      </td>
                      <td className="px-2 py-1 text-right font-mono">2,67%</td>
                    </tr>
                    <tr className="border-t-2 border-navy font-bold">
                      <td className="border-r border-line px-2 py-1.5" />
                      <td className="border-r border-line px-2 py-1.5">TOTAL DE ENCARGOS</td>
                      <td className="px-2 py-1.5 text-right font-mono">115,35%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function valorParaExtenso(valor: number): string {
  if (valor === 0) return "zero";

  const unidades = [
    "",
    "um",
    "dois",
    "três",
    "quatro",
    "cinco",
    "seis",
    "sete",
    "oito",
    "nove",
    "dez",
    "onze",
    "doze",
    "treze",
    "quatorze",
    "quinze",
    "dezesseis",
    "dezessete",
    "dezoito",
    "dezenove",
  ];
  const dezenas = [
    "",
    "",
    "vinte",
    "trinta",
    "quarenta",
    "cinquenta",
    "sessenta",
    "setenta",
    "oitenta",
    "noventa",
  ];
  const centenas = [
    "",
    "cento",
    "duzentos",
    "trezentos",
    "quatrocentos",
    "quinhentos",
    "seiscentos",
    "setecentos",
    "oitocentos",
    "novecentos",
  ];

  function inteiroParaExtenso(n: number): string {
    if (n === 0) return "";
    if (n < 20) return unidades[n] ?? "";
    if (n < 100) {
      const d = Math.floor(n / 10);
      const u = n % 10;
      return dezenas[d] + (u > 0 ? ` e ${unidades[u]}` : "");
    }
    if (n < 1000) {
      const c = Math.floor(n / 100);
      const r = n % 100;
      return centenas[c] + (r > 0 ? ` e ${inteiroParaExtenso(r)}` : "");
    }
    if (n < 1000000) {
      const m = Math.floor(n / 1000);
      const r = n % 1000;
      return (
        (m === 1 ? "mil" : `${inteiroParaExtenso(m)} mil`) +
        (r > 0 ? ` ${inteiroParaExtenso(r)}` : "")
      );
    }
    if (n < 1000000000) {
      const mi = Math.floor(n / 1000000);
      const r = n % 1000000;
      return (
        (mi === 1 ? "um milhão" : `${inteiroParaExtenso(mi)} milhões`) +
        (r > 0 ? ` ${inteiroParaExtenso(r)}` : "")
      );
    }
    return String(n);
  }

  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);
  let resultado = inteiroParaExtenso(inteiro);
  if (centavos > 0) resultado += ` e ${inteiroParaExtenso(centavos)} centavos`;
  return resultado;
}
