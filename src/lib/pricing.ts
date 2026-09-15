export type Grupo =
  | "maoDeObra"
  | "servicosTerceiros"
  | "ferramentas"
  | "equipamentos"
  | "materiais";

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
    { id: "1", grupo: "maoDeObra", descricao: "Pedreiro", quantidade: 18, quantidadeProfissionais: 1, unidade: "h", valorUnitario: 42 },
    { id: "2", grupo: "maoDeObra", descricao: "Ajudante geral", quantidade: 18, quantidadeProfissionais: 1, unidade: "h", valorUnitario: 28 },
    { id: "3", grupo: "servicosTerceiros", descricao: "Pintura externa (terceiro)", quantidade: 1, quantidadeProfissionais: 1, unidade: "vb", valorUnitario: 2400 },
    { id: "4", grupo: "ferramentas", descricao: "Kit de ferramentas manuais", quantidade: 1, unidade: "vb", valorUnitario: 180 },
    { id: "5", grupo: "equipamentos", descricao: "Betoneira 400 L (locação)", quantidade: 2, unidade: "dia", valorUnitario: 110 },
    { id: "6", grupo: "materiais", descricao: "Cimento CP-II", quantidade: 24, unidade: "sc", valorUnitario: 45 },
    { id: "7", grupo: "materiais", descricao: "Areia média", quantidade: 6, unidade: "m³", valorUnitario: 130 },
  ],
  catalogo: [
    { id: "c1", grupo: "maoDeObra", descricao: "Pedreiro", unidade: "h", valorUnitario: 42 },
    { id: "c2", grupo: "maoDeObra", descricao: "Ajudante geral", unidade: "h", valorUnitario: 28 },
    { id: "c3", grupo: "maoDeObra", descricao: "Pintor", unidade: "h", valorUnitario: 38 },
    { id: "c4", grupo: "servicosTerceiros", descricao: "Pintura externa (terceiro)", unidade: "vb", valorUnitario: 2400 },
    { id: "c5", grupo: "ferramentas", descricao: "Kit de ferramentas manuais", unidade: "vb", valorUnitario: 180 },
    { id: "c6", grupo: "equipamentos", descricao: "Betoneira 400 L (locação)", unidade: "dia", valorUnitario: 110 },
    { id: "c7", grupo: "equipamentos", descricao: "Andaime tubular (locação)", unidade: "dia", valorUnitario: 75 },
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

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const pct = (v: number) =>
  `${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

export function totalItem(item: Item, encargosSociais: number) {
  const base = item.quantidade * item.valorUnitario;
  if (item.grupo !== "maoDeObra") return base;
  return base * (item.quantidadeProfissionais ?? 1) * (1 + encargosSociais / 100);
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

  return { porGrupo, custoDireto, bdiPercent, valorBdi, impostoPercent, valorImpostos, precoFinal, margem };
}
