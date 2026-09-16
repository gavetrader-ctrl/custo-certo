import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { brl, PROPOSALS_STORAGE_KEY, proposalsIniciais, type ProposalRecord } from "@/lib/pricing";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Gestão de Propostas" },
      { name: "description", content: "Painel de gestão de propostas comerciais." },
    ],
  }),
  component: DashboardPage,
});

const CORES = [
  "#1e3a5f",
  "#2563eb",
  "#3b82f6",
  "#60a5fa",
  "#93c5fd",
  "#bfdbfe",
  "#06b6d4",
  "#14b8a6",
  "#10b981",
  "#22c55e",
  "#84cc16",
  "#eab308",
];

const STATUS_LABELS: Record<ProposalRecord["status"], string> = {
  pendente: "Pendente",
  enviada: "Enviada",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
};

const STATUS_COLORS: Record<ProposalRecord["status"], string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  enviada: "bg-blue-100 text-blue-800",
  aprovada: "bg-green-100 text-green-800",
  rejeitada: "bg-red-100 text-red-800",
};

function DashboardPage() {
  const [propostas, setPropostas] = useState<ProposalRecord[]>(proposalsIniciais);
  const [carregado, setCarregado] = useState(false);
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [filtroMes, setFiltroMes] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROPOSALS_STORAGE_KEY);
      if (raw) setPropostas(JSON.parse(raw));
    } catch {
      /* ignora */
    }
    setCarregado(true);
  }, []);

  const atualizarStatus = (id: string, status: ProposalRecord["status"]) => {
    const atualizada = propostas.map((p) => (p.id === id ? { ...p, status } : p));
    setPropostas(atualizada);
    localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(atualizada));
  };

  const excluir = (id: string) => {
    if (!confirm("Excluir esta proposta do registro?")) return;
    const atualizada = propostas.filter((p) => p.id !== id);
    setPropostas(atualizada);
    localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(atualizada));
  };

  const clientes = useMemo(() => {
    const set = new Set(propostas.map((p) => p.cliente).filter(Boolean));
    return Array.from(set).sort();
  }, [propostas]);

  const propostasFiltradas = useMemo(() => {
    return propostas.filter((p) => {
      if (filtroCliente && p.cliente !== filtroCliente) return false;
      if (filtroStatus && p.status !== filtroStatus) return false;
      if (filtroMes) {
        const mesProposta = p.dataISO?.slice(0, 7);
        if (mesProposta !== filtroMes) return false;
      }
      return true;
    });
  }, [propostas, filtroCliente, filtroStatus, filtroMes]);

  const resumo = useMemo(() => {
    const lista = propostasFiltradas;
    const total = lista.reduce((s, p) => s + p.valorTotal, 0);
    const media = lista.length > 0 ? total / lista.length : 0;
    const aprovadas = lista.filter((p) => p.status === "aprovada").length;
    const valorAprovadas = lista
      .filter((p) => p.status === "aprovada")
      .reduce((s, p) => s + p.valorTotal, 0);
    return { total, media, count: lista.length, aprovadas, valorAprovadas };
  }, [propostasFiltradas]);

  const dadosMensal = useMemo(() => {
    const mapa = new Map<string, { mes: string; valor: number; quantidade: number }>();
    for (const p of propostasFiltradas) {
      const key = p.dataISO?.slice(0, 7) || "Sem data";
      const existing = mapa.get(key);
      if (existing) {
        existing.valor += p.valorTotal;
        existing.quantidade += 1;
      } else {
        mapa.set(key, { mes: key, valor: p.valorTotal, quantidade: 1 });
      }
    }
    return Array.from(mapa.values())
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .map((d) => ({
        ...d,
        mesFormatado: d.mes === "Sem data" ? "N/D" : formatarMes(d.mes),
      }));
  }, [propostasFiltradas]);

  const dadosCliente = useMemo(() => {
    const mapa = new Map<string, { cliente: string; valor: number; quantidade: number }>();
    for (const p of propostasFiltradas) {
      const nome = p.cliente || "Sem cliente";
      const existing = mapa.get(nome);
      if (existing) {
        existing.valor += p.valorTotal;
        existing.quantidade += 1;
      } else {
        mapa.set(nome, { cliente: nome, valor: p.valorTotal, quantidade: 1 });
      }
    }
    return Array.from(mapa.values()).sort((a, b) => b.valor - a.valor);
  }, [propostasFiltradas]);

  const dadosStatus = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const p of propostasFiltradas) {
      mapa.set(p.status, (mapa.get(p.status) || 0) + 1);
    }
    return Array.from(mapa.entries()).map(([status, count]) => ({
      name: STATUS_LABELS[status as ProposalRecord["status"]] || status,
      value: count,
    }));
  }, [propostasFiltradas]);

  const mesesDisponiveis = useMemo(() => {
    const set = new Set(propostas.map((p) => p.dataISO?.slice(0, 7)).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [propostas]);

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
              <p className="text-sm font-semibold tracking-tight">Dashboard</p>
              <p className="text-[11px] text-muted-ink">Gestão de propostas comerciais</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/proposta"
              className="rounded-lg border border-line bg-card/70 px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-card"
            >
              + Nova proposta
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1440px] px-6 py-6">
        {/* Cards de resumo */}
        <div className="animate-rise mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <CardResumo label="Total de propostas" valor={String(resumo.count)} />
          <CardResumo label="Valor total" valor={brl(resumo.total)} />
          <CardResumo label="Valor médio" valor={brl(resumo.media)} />
          <CardResumo label="Aprovadas" valor={String(resumo.aprovadas)} />
          <CardResumo label="Valor aprovado" valor={brl(resumo.valorAprovadas)} destaque />
        </div>

        {/* Filtros */}
        <div className="animate-rise mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-line/80 bg-card/65 p-4 backdrop-blur-xl">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-ink">Cliente</label>
            <select
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              className="rounded-md border border-line bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
            >
              <option value="">Todos</option>
              {clientes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-ink">Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="rounded-md border border-line bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
            >
              <option value="">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="enviada">Enviada</option>
              <option value="aprovada">Aprovada</option>
              <option value="rejeitada">Rejeitada</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-ink">Mês</label>
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="rounded-md border border-line bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
            >
              <option value="">Todos</option>
              {mesesDisponiveis.map((m) => (
                <option key={m} value={m}>
                  {formatarMes(m)}
                </option>
              ))}
            </select>
          </div>
          {(filtroCliente || filtroStatus || filtroMes) && (
            <button
              onClick={() => {
                setFiltroCliente("");
                setFiltroStatus("");
                setFiltroMes("");
              }}
              className="rounded-md border border-line bg-card px-3 py-2 text-[12px] font-medium text-muted-ink transition-colors hover:text-ink"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Gráficos */}
        <div className="animate-rise mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Gráfico de valores mensais */}
          <div className="rounded-2xl border border-line/80 bg-card/65 p-5 backdrop-blur-xl lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold tracking-tight">Valores mensais</h3>
            {dadosMensal.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosMensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mesFormatado" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip formatter={(v: number) => brl(v)} labelFormatter={(l) => `Mês: ${l}`} />
                  <Bar dataKey="valor" fill="#1e3a5f" radius={[4, 4, 0, 0]} name="Valor" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-[13px] text-muted-ink">Sem dados para exibir.</p>
            )}
          </div>

          {/* Gráfico de status */}
          <div className="rounded-2xl border border-line/80 bg-card/65 p-5 backdrop-blur-xl">
            <h3 className="mb-4 text-sm font-semibold tracking-tight">Por status</h3>
            {dadosStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dadosStatus}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {dadosStatus.map((_, i) => (
                      <Cell key={i} fill={CORES[i % CORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-[13px] text-muted-ink">Sem dados para exibir.</p>
            )}
          </div>
        </div>

        {/* Gráfico por cliente */}
        {dadosCliente.length > 0 && (
          <div className="animate-rise mb-6 rounded-2xl border border-line/80 bg-card/65 p-5 backdrop-blur-xl">
            <h3 className="mb-4 text-sm font-semibold tracking-tight">Valores por cliente</h3>
            <ResponsiveContainer width="100%" height={Math.max(200, dadosCliente.length * 40)}>
              <BarChart data={dadosCliente} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <YAxis type="category" dataKey="cliente" tick={{ fontSize: 11 }} width={120} />
                <Tooltip formatter={(v: number) => brl(v)} />
                <Bar dataKey="valor" fill="#2563eb" radius={[0, 4, 4, 0]} name="Valor" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tabela de propostas */}
        <div className="animate-rise overflow-x-auto rounded-2xl border border-line/80 bg-card/65 backdrop-blur-xl">
          <table className="w-full min-w-[800px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted-ink">
                <th className="py-3 pl-4 font-medium">Data</th>
                <th className="py-3 px-3 font-medium">Nº Proposta</th>
                <th className="py-3 px-3 font-medium">Cliente</th>
                <th className="py-3 px-3 font-medium">Comprador</th>
                <th className="py-3 px-3 font-medium">Objeto</th>
                <th className="py-3 px-3 text-right font-medium">Valor</th>
                <th className="py-3 px-3 text-center font-medium">Status</th>
                <th className="py-3 pr-4 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {propostasFiltradas.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center font-sans text-[13px] text-muted-ink"
                  >
                    Nenhuma proposta registrada. Crie propostas em "/proposta" e salve.
                  </td>
                </tr>
              )}
              {propostasFiltradas.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-line/60 transition-colors hover:bg-brand-soft/40"
                >
                  <td className="py-3 pl-4 text-[12px]">{p.data}</td>
                  <td className="py-3 px-3 font-medium">{p.propostaNumero || "—"}</td>
                  <td className="py-3 px-3">{p.cliente || "—"}</td>
                  <td className="py-3 px-3 text-muted-ink">{p.comprador || "—"}</td>
                  <td className="max-w-[200px] truncate py-3 px-3 text-muted-ink">
                    {p.objeto || "—"}
                  </td>
                  <td className="py-3 px-3 text-right font-medium">{brl(p.valorTotal)}</td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[p.status]}`}
                    >
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <select
                      value={p.status}
                      onChange={(e) =>
                        atualizarStatus(p.id, e.target.value as ProposalRecord["status"])
                      }
                      className="mr-1 rounded-md border border-line bg-card px-1.5 py-0.5 text-[11px] text-ink outline-none focus:border-brand"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="enviada">Enviada</option>
                      <option value="aprovada">Aprovada</option>
                      <option value="rejeitada">Rejeitada</option>
                    </select>
                    <button
                      onClick={() => excluir(p.id)}
                      className="rounded-md border border-line bg-card px-1.5 py-0.5 text-[11px] text-muted-ink transition-colors hover:text-ink"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function CardResumo({
  label,
  valor,
  destaque,
}: {
  label: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${destaque ? "border-positive/30 bg-positive/5" : "border-line/80 bg-card/65"}`}
    >
      <p className="text-[11px] font-medium text-muted-ink">{label}</p>
      <p
        className={`mt-1 font-mono text-[18px] font-bold ${destaque ? "text-positive" : "text-ink"}`}
      >
        {valor}
      </p>
    </div>
  );
}

function formatarMes(ym: string): string {
  const parts = ym.split("-");
  const ano = parts[0] ?? ym;
  const mes = parts[1] ?? "01";
  const nomes = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  const idx = parseInt(mes, 10) - 1;
  return `${nomes[idx] ?? mes}/${ano}`;
}
