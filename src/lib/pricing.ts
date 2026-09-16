export type Grupo =
  "maoDeObra" | "servicosTerceiros" | "ferramentas" | "equipamentos" | "materiais";

export type Item = {
  id: string;
  grupo: Grupo;
  descricao: string;
  quantidade: number;
  quantidadeProfissionais?: number;
  unidade: string;
  valorUnitario: number;
};

export type Percentuais = {
  encargosSociais: number;
  bdi: {
    administracaoCentral: number;
    lucro: number;
    riscos: number;
    seguros: number;
  };
  impostos: { id: string; nome: string; aliquota: number }[];
};

export type CatalogoItem = {
  id: string;
  grupo: Grupo;
  descricao: string;
  unidade: string;
  valorUnitario: number;
};

export type Orcamento = {
  nomeServico: string;
  itens: Item[];
  catalogo: CatalogoItem[];
  percentuais: Percentuais;
};

export const GRUPOS: { id: Grupo; label: string }[] = [
  { id: "maoDeObra", label: "Mão de obra" },
  { id: "servicosTerceiros", label: "Serviços de terceiros" },
  { id: "ferramentas", label: "Ferramentas" },
  { id: "equipamentos", label: "Equipamentos" },
  { id: "materiais", label: "Materiais" },
];

export const STORAGE_KEY = "obraforma:orcamento:v1";

export const orcamentoInicial: Orcamento = {
  nomeServico: "Reforma de fachada — Bloco C",
  itens: [
    {
      id: "1",
      grupo: "maoDeObra",
      descricao: "Pedreiro",
      quantidade: 18,
      quantidadeProfissionais: 1,
      unidade: "h",
      valorUnitario: 42,
    },
    {
      id: "2",
      grupo: "maoDeObra",
      descricao: "Ajudante geral",
      quantidade: 18,
      quantidadeProfissionais: 1,
      unidade: "h",
      valorUnitario: 28,
    },
    {
      id: "3",
      grupo: "servicosTerceiros",
      descricao: "Pintura externa (terceiro)",
      quantidade: 1,
      quantidadeProfissionais: 1,
      unidade: "vb",
      valorUnitario: 2400,
    },
    {
      id: "4",
      grupo: "ferramentas",
      descricao: "Kit de ferramentas manuais",
      quantidade: 1,
      unidade: "vb",
      valorUnitario: 180,
    },
    {
      id: "5",
      grupo: "equipamentos",
      descricao: "Betoneira 400 L (locação)",
      quantidade: 2,
      unidade: "dia",
      valorUnitario: 110,
    },
    {
      id: "6",
      grupo: "materiais",
      descricao: "Cimento CP-II",
      quantidade: 24,
      unidade: "sc",
      valorUnitario: 45,
    },
    {
      id: "7",
      grupo: "materiais",
      descricao: "Areia média",
      quantidade: 6,
      unidade: "m³",
      valorUnitario: 130,
    },
  ],
  catalogo: [
    { id: "c1", grupo: "maoDeObra", descricao: "Pedreiro", unidade: "h", valorUnitario: 42 },
    { id: "c2", grupo: "maoDeObra", descricao: "Ajudante geral", unidade: "h", valorUnitario: 28 },
    { id: "c3", grupo: "maoDeObra", descricao: "Pintor", unidade: "h", valorUnitario: 38 },
    {
      id: "c4",
      grupo: "servicosTerceiros",
      descricao: "Pintura externa (terceiro)",
      unidade: "vb",
      valorUnitario: 2400,
    },
    {
      id: "c5",
      grupo: "ferramentas",
      descricao: "Kit de ferramentas manuais",
      unidade: "vb",
      valorUnitario: 180,
    },
    {
      id: "c6",
      grupo: "equipamentos",
      descricao: "Betoneira 400 L (locação)",
      unidade: "dia",
      valorUnitario: 110,
    },
    {
      id: "c7",
      grupo: "equipamentos",
      descricao: "Andaime tubular (locação)",
      unidade: "dia",
      valorUnitario: 75,
    },
    { id: "c8", grupo: "materiais", descricao: "Cimento CP-II", unidade: "sc", valorUnitario: 45 },
    { id: "c9", grupo: "materiais", descricao: "Areia média", unidade: "m³", valorUnitario: 130 },
  ],
  percentuais: {
    encargosSociais: 81.5,
    bdi: { administracaoCentral: 9, lucro: 12, riscos: 10, seguros: 7 },
    impostos: [
      { id: "iss", nome: "ISS", aliquota: 5 },
      { id: "pis", nome: "PIS", aliquota: 0.65 },
      { id: "cofins", nome: "COFINS", aliquota: 3 },
    ],
  },
};

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const pct = (v: number) =>
  `${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

export function totalItem(item: Item, encargosSociais: number) {
  const base = item.quantidade * item.valorUnitario;
  if (item.grupo !== "maoDeObra") return base;
  return base * (item.quantidadeProfissionais ?? 1) * (1 + encargosSociais / 100);
}

// ── Encargos Sociais ─────────────────────────────────────────────────

export type EncargoItem = {
  id: string;
  nome: string;
  percentual: number;
};

export type EncargosSociais = {
  grupoA: EncargoItem[];
  grupoB: EncargoItem[];
  grupoC: EncargoItem[];
};

export const encargosSociaisIniciais: EncargosSociais = {
  grupoA: [
    { id: "a1", nome: "INSS", percentual: 20 },
    { id: "a2", nome: "FGTS", percentual: 8 },
    { id: "a3", nome: "SESI / SESC", percentual: 2 },
    { id: "a4", nome: "SENAI / SENAC", percentual: 3 },
    { id: "a5", nome: "INCRA", percentual: 1 },
    { id: "a6", nome: "Salário Educação", percentual: 1 },
    { id: "a7", nome: "Seguro Acidente do Trabalho", percentual: 3 },
    { id: "a8", nome: "SEBRAE", percentual: 1 },
  ],
  grupoB: [
    { id: "b1", nome: "Repouso Semanal Remunerado", percentual: 21 },
    { id: "b2", nome: "Férias + Adicional", percentual: 11.11 },
    { id: "b3", nome: "13º Salário", percentual: 8.33 },
    { id: "b4", nome: "Auxílio Enfermidade", percentual: 4.1 },
    { id: "b5", nome: "Acidente de Trabalho", percentual: 4.1 },
    { id: "b6", nome: "Licença Paternidade", percentual: 0.14 },
    { id: "b7", nome: "Faltas Justificadas", percentual: 0.8 },
    { id: "b8", nome: "Aviso Prévio Trabalhado", percentual: 0 },
  ],
  grupoC: [
    { id: "c1", nome: "Multa Rescisória - FGTS", percentual: 4.25 },
    { id: "c2", nome: "Aviso Prévio Indenizado", percentual: 8.22 },
    { id: "c3", nome: "FGTS sobre Aviso Prévio Indenizado", percentual: 4.25 },
    { id: "c4", nome: "FGTS sobre 13º Salário do Aviso Indenizado", percentual: 1.18 },
  ],
};

export function calcularEncargosSociais(encargos: EncargosSociais | undefined) {
  if (!encargos) return { somaA: 0, somaB: 0, somaC: 0, reincidencia: 0, total: 0 };
  const somaA = encargos.grupoA.reduce((s, e) => s + e.percentual, 0);
  const somaB = encargos.grupoB.reduce((s, e) => s + e.percentual, 0);
  const somaC = encargos.grupoC.reduce((s, e) => s + e.percentual, 0);
  const reincidencia = (somaA * somaB) / 100;
  const total = somaA + somaB + somaC + reincidencia;
  return { somaA, somaB, somaC, reincidencia, total };
}

// ── QQP types ────────────────────────────────────────────────────────

export type FormacaoItem = {
  id: string;
  descricao: string;
  quantidade: number;
  quantidadeProfissionais?: number;
  unidade: string;
  valorUnitario: number;
};

export type FormacaoPreco = {
  maoDeObra: FormacaoItem[];
  ferramentas: FormacaoItem[];
  equipamentos: FormacaoItem[];
  materiais: FormacaoItem[];
  servicosTerceiros: FormacaoItem[];
  encargosSociais: EncargosSociais;
  bdi: {
    administracaoCentral: number;
    lucro: number;
    riscos: number;
    seguros: number;
  };
  impostos: { id: string; nome: string; aliquota: number }[];
};

export type ItemQQP = {
  id: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  formacao: FormacaoPreco;
};

export type QQPData = {
  nomeServico: string;
  descricao: string;
  sc: string;
  data: string;
  itens: ItemQQP[];
  catalogo: CatalogoItem[];
};

export const QQP_STORAGE_KEY = "obraforma:qqp:v1";

// ── Clientes ─────────────────────────────────────────────────────────

export type Comprador = {
  id: string;
  nome: string;
  departamento: string;
};

export type Cliente = {
  id: string;
  razaoSocial: string;
  cnpj: string;
  endereco: string;
  contato: string;
  email: string;
  compradores: Comprador[];
};

export const CLIENTES_STORAGE_KEY = "obraforma:clientes:v1";

export const clientesIniciais: Cliente[] = [];

// ── Registro de Propostas ────────────────────────────────────────────

export type ProposalRecord = {
  id: string;
  data: string;
  dataISO: string;
  cliente: string;
  comprador: string;
  propostaNumero: string;
  consulta: string;
  objeto: string;
  valorTotal: number;
  status: "pendente" | "enviada" | "aprovada" | "rejeitada";
};

export const PROPOSALS_STORAGE_KEY = "obraforma:propostas_registro:v1";

export const proposalsIniciais: ProposalRecord[] = [];

// ── Dados da Empresa (Configurações) ─────────────────────────────────

export type EmpresaData = {
  razaoSocial: string;
  cnpj: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  contato: string;
  cargoContato: string;
  logo: string;
};

export const EMPRESA_STORAGE_KEY = "obraforma:empresa:v1";

export const empresaInicial: EmpresaData = {
  razaoSocial: "",
  cnpj: "",
  endereco: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
  telefone: "",
  email: "",
  contato: "",
  cargoContato: "",
  logo: "",
};

export const formacaoInicial = (descricao = ""): FormacaoPreco => ({
  maoDeObra: [],
  ferramentas: [],
  equipamentos: [],
  materiais: [],
  servicosTerceiros: [],
  encargosSociais: JSON.parse(JSON.stringify(encargosSociaisIniciais)),
  bdi: { administracaoCentral: 9, lucro: 12, riscos: 10, seguros: 7 },
  impostos: [
    { id: "iss", nome: "ISS", aliquota: 5 },
    { id: "pis", nome: "PIS", aliquota: 0.65 },
    { id: "cofins", nome: "COFINS", aliquota: 3 },
  ],
});

export const catalogoQQPInicial: CatalogoItem[] = [
  { id: "c1", grupo: "maoDeObra", descricao: "Pedreiro", unidade: "h", valorUnitario: 42 },
  { id: "c2", grupo: "maoDeObra", descricao: "Ajudante geral", unidade: "h", valorUnitario: 28 },
  { id: "c3", grupo: "maoDeObra", descricao: "Pintor", unidade: "h", valorUnitario: 38 },
  {
    id: "c5",
    grupo: "ferramentas",
    descricao: "Kit de ferramentas manuais",
    unidade: "vb",
    valorUnitario: 180,
  },
  {
    id: "c6",
    grupo: "equipamentos",
    descricao: "Betoneira 400 L (locação)",
    unidade: "dia",
    valorUnitario: 110,
  },
  { id: "c8", grupo: "materiais", descricao: "Cimento CP-II", unidade: "sc", valorUnitario: 45 },
];

export const qqpInicial: QQPData = {
  nomeServico:
    "Serviços de reforma em 01 blunger completo e revitalização de um cone de alimentação",
  descricao:
    "Serviços de reforma em 01 blunger,s completo e revitalização de um cone de alimentação Mina da RCC em Ipixuna.",
  sc: "SN",
  data: new Date().toLocaleDateString("pt-BR"),
  itens: [],
  catalogo: catalogoQQPInicial,
};

export function totalFormacaoItem(item: FormacaoItem) {
  return item.quantidade * item.valorUnitario * (item.quantidadeProfissionais ?? 1);
}

export function calcularFormacaoItem(formacao: FormacaoPreco) {
  const custoMaoDeObraBase = formacao.maoDeObra.reduce((s, i) => s + totalFormacaoItem(i), 0);
  const encargos = calcularEncargosSociais(formacao.encargosSociais ?? encargosSociaisIniciais);
  const custoMaoDeObra = custoMaoDeObraBase * (1 + encargos.total / 100);
  const valorEncargos = custoMaoDeObraBase * (encargos.total / 100);

  const custoFerramentas = formacao.ferramentas.reduce(
    (s, i) => s + i.quantidade * i.valorUnitario,
    0,
  );
  const custoEquipamentos = formacao.equipamentos.reduce(
    (s, i) => s + i.quantidade * i.valorUnitario,
    0,
  );
  const custoMateriais = formacao.materiais.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
  const custoServicosTerceiros = formacao.servicosTerceiros.reduce(
    (s, i) => s + i.quantidade * i.valorUnitario,
    0,
  );

  const custoDireto =
    custoMaoDeObra + custoFerramentas + custoEquipamentos + custoMateriais + custoServicosTerceiros;

  const bdiPercent =
    formacao.bdi.administracaoCentral +
    formacao.bdi.lucro +
    formacao.bdi.riscos +
    formacao.bdi.seguros;
  const valorBdi = custoDireto * (bdiPercent / 100);
  const subtotal = custoDireto + valorBdi;

  const impostoPercent = formacao.impostos.reduce((s, t) => s + t.aliquota, 0);
  const divisor = 1 - impostoPercent / 100;
  const precoFinal = divisor > 0 ? subtotal / divisor : subtotal;

  return {
    custoMaoDeObraBase,
    valorEncargos,
    encargosPercent: encargos.total,
    custoMaoDeObra,
    custoFerramentas,
    custoEquipamentos,
    custoMateriais,
    custoServicosTerceiros,
    custoDireto,
    bdiPercent,
    valorBdi,
    impostoPercent,
    precoFinal,
  };
}

export function calcularQQP(qqp: QQPData) {
  const itensComTotal = qqp.itens.map((item) => {
    const formacao = calcularFormacaoItem(item.formacao);
    const valorTotal = formacao.precoFinal * item.quantidade;
    return { ...item, precoUnitario: formacao.precoFinal, valorTotal, formacaoCalculada: formacao };
  });

  const valorTotalGeral = itensComTotal.reduce((s, i) => s + i.valorTotal, 0);

  return { itens: itensComTotal, valorTotalGeral };
}

export function calcular(orc: Orcamento) {
  const { encargosSociais, bdi, impostos } = orc.percentuais;

  const porGrupo = GRUPOS.map((g) => ({
    ...g,
    total: orc.itens
      .filter((i) => i.grupo === g.id)
      .reduce((s, i) => s + totalItem(i, encargosSociais), 0),
  }));

  const custoDireto = porGrupo.reduce((s, g) => s + g.total, 0);
  const bdiPercent = bdi.administracaoCentral + bdi.lucro + bdi.riscos + bdi.seguros;
  const valorBdi = custoDireto * (bdiPercent / 100);
  const subtotal = custoDireto + valorBdi;

  const impostoPercent = impostos.reduce((s, t) => s + t.aliquota, 0);
  const divisor = 1 - impostoPercent / 100;
  const precoFinal = divisor > 0 ? subtotal / divisor : subtotal;
  const valorImpostos = precoFinal - subtotal;
  const margem = custoDireto > 0 ? (precoFinal / custoDireto - 1) * 100 : 0;

  return {
    porGrupo,
    custoDireto,
    bdiPercent,
    valorBdi,
    impostoPercent,
    valorImpostos,
    precoFinal,
    margem,
  };
}
