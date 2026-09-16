import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  clientesIniciais,
  CLIENTES_STORAGE_KEY,
  type Cliente,
  type Comprador,
} from "@/lib/pricing";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Cadastro" },
      { name: "description", content: "Cadastro de clientes e compradores." },
    ],
  }),
  component: ClientesPage,
});

const novoId = () => Math.random().toString(36).slice(2, 10);

type FormData = Omit<Cliente, "id" | "compradores">;

const formVazio: FormData = {
  razaoSocial: "",
  cnpj: "",
  endereco: "",
  contato: "",
  email: "",
};

function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciais);
  const [carregado, setCarregado] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState<FormData>(formVazio);
  const [novoComprador, setNovoComprador] = useState({ nome: "", departamento: "" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CLIENTES_STORAGE_KEY);
      if (raw) setClientes(JSON.parse(raw));
    } catch {
      /* ignora */
    }
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (!carregado) return;
    const t = setTimeout(() => {
      localStorage.setItem(CLIENTES_STORAGE_KEY, JSON.stringify(clientes));
    }, 500);
    return () => clearTimeout(t);
  }, [clientes, carregado]);

  const iniciarEdicao = (cliente?: Cliente) => {
    if (cliente) {
      setEditando(cliente.id);
      setForm({
        razaoSocial: cliente.razaoSocial,
        cnpj: cliente.cnpj,
        endereco: cliente.endereco,
        contato: cliente.contato,
        email: cliente.email,
      });
    } else {
      setEditando(null);
      setForm(formVazio);
    }
    setMostrarForm(true);
  };

  const salvar = () => {
    if (!form.razaoSocial.trim()) return;
    if (editando) {
      setClientes((cs) => cs.map((c) => (c.id === editando ? { ...c, ...form } : c)));
    } else {
      setClientes((cs) => [...cs, { id: novoId(), ...form, compradores: [] }]);
    }
    setMostrarForm(false);
    setForm(formVazio);
    setEditando(null);
  };

  const excluir = (id: string) => {
    if (!confirm("Excluir este cliente e todos os compradores?")) return;
    setClientes((cs) => cs.filter((c) => c.id !== id));
  };

  const adicionarComprador = (clienteId: string) => {
    if (!novoComprador.nome.trim()) return;
    setClientes((cs) =>
      cs.map((c) =>
        c.id === clienteId
          ? {
              ...c,
              compradores: [
                ...c.compradores,
                {
                  id: novoId(),
                  nome: novoComprador.nome.trim(),
                  departamento: novoComprador.departamento.trim(),
                },
              ],
            }
          : c,
      ),
    );
    setNovoComprador({ nome: "", departamento: "" });
  };

  const removerComprador = (clienteId: string, compradorId: string) => {
    setClientes((cs) =>
      cs.map((c) =>
        c.id === clienteId
          ? { ...c, compradores: c.compradores.filter((cp) => cp.id !== compradorId) }
          : c,
      ),
    );
  };

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
              <p className="text-sm font-semibold tracking-tight">Clientes</p>
              <p className="text-[11px] text-muted-ink">Cadastro de clientes e compradores</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
              ← Proposta
            </Link>
            <button
              onClick={() => iniciarEdicao()}
              className="rounded-lg bg-navy px-3.5 py-2 text-[13px] font-semibold text-navy-foreground transition-colors hover:bg-navy/90"
            >
              Novo cliente
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1000px] px-6 py-6">
        {mostrarForm && (
          <div className="animate-rise mb-6 rounded-2xl border border-line/80 bg-card/65 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight">
                {editando ? "Editar Cliente" : "Novo Cliente"}
              </h2>
              <button
                onClick={() => {
                  setMostrarForm(false);
                  setEditando(null);
                }}
                className="rounded-md border border-line bg-card px-3 py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-card"
              >
                Cancelar
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-ink">
                  Razão Social *
                </label>
                <input
                  value={form.razaoSocial}
                  onChange={(e) => setForm((f) => ({ ...f, razaoSocial: e.target.value }))}
                  className="w-full rounded-md border border-line bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-ink">CNPJ</label>
                <input
                  value={form.cnpj}
                  onChange={(e) => setForm((f) => ({ ...f, cnpj: e.target.value }))}
                  className="w-full rounded-md border border-line bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-ink">
                  Endereço
                </label>
                <input
                  value={form.endereco}
                  onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
                  className="w-full rounded-md border border-line bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-ink">Contato</label>
                <input
                  value={form.contato}
                  onChange={(e) => setForm((f) => ({ ...f, contato: e.target.value }))}
                  className="w-full rounded-md border border-line bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] font-medium text-muted-ink">E-mail</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-md border border-line bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={salvar}
                disabled={!form.razaoSocial.trim()}
                className="rounded-lg bg-navy px-4 py-2 text-[13px] font-semibold text-navy-foreground transition-colors hover:bg-navy/90 disabled:opacity-50"
              >
                {editando ? "Salvar alterações" : "Cadastrar cliente"}
              </button>
            </div>
          </div>
        )}

        <div className="animate-rise">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Clientes cadastrados</h2>
            <span className="font-mono text-[11px] text-muted-ink">
              {clientes.length} {clientes.length === 1 ? "cliente" : "clientes"}
            </span>
          </div>

          {clientes.length === 0 && (
            <div className="rounded-2xl border border-line/80 bg-card/65 p-12 text-center backdrop-blur-xl">
              <p className="text-[13px] text-muted-ink">
                Nenhum cliente cadastrado. Clique em "Novo cliente" para começar.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {clientes.map((cliente) => (
              <div
                key={cliente.id}
                className="rounded-2xl border border-line/80 bg-card/65 p-5 backdrop-blur-xl"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-[14px] font-semibold text-ink">{cliente.razaoSocial}</h3>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-ink">
                      {cliente.cnpj && <span>CNPJ: {cliente.cnpj}</span>}
                      {cliente.endereco && <span>{cliente.endereco}</span>}
                      {cliente.contato && <span>Contato: {cliente.contato}</span>}
                      {cliente.email && <span>{cliente.email}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => iniciarEdicao(cliente)}
                      className="rounded-md border border-line bg-card px-2.5 py-1 text-[11px] font-medium text-muted-ink transition-colors hover:text-brand"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => excluir(cliente.id)}
                      className="rounded-md border border-line bg-card px-2.5 py-1 text-[11px] font-medium text-muted-ink transition-colors hover:text-ink"
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-line/60 bg-card/40 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-navy">
                      Compradores
                    </span>
                    <span className="font-mono text-[11px] text-muted-ink">
                      {cliente.compradores.length}
                    </span>
                  </div>

                  {cliente.compradores.length > 0 && (
                    <div className="mb-2 space-y-1">
                      {cliente.compradores.map((cp) => (
                        <div
                          key={cp.id}
                          className="flex items-center justify-between rounded-md bg-card/30 px-2.5 py-1.5"
                        >
                          <div className="text-[12px]">
                            <span className="font-medium text-ink">{cp.nome}</span>
                            {cp.departamento && (
                              <span className="ml-2 text-muted-ink">— {cp.departamento}</span>
                            )}
                          </div>
                          <button
                            onClick={() => removerComprador(cliente.id, cp.id)}
                            className="px-1 text-[12px] text-muted-ink transition-colors hover:text-ink"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 border-t border-line/60 pt-2">
                    <input
                      value={novoComprador.nome}
                      placeholder="Nome do comprador"
                      onChange={(e) => setNovoComprador((n) => ({ ...n, nome: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") adicionarComprador(cliente.id);
                      }}
                      className="min-w-[160px] flex-1 rounded-md border border-line bg-card px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-brand"
                    />
                    <input
                      value={novoComprador.departamento}
                      placeholder="Departamento"
                      onChange={(e) =>
                        setNovoComprador((n) => ({ ...n, departamento: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") adicionarComprador(cliente.id);
                      }}
                      className="w-36 rounded-md border border-line bg-card px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-brand"
                    />
                    <button
                      onClick={() => adicionarComprador(cliente.id)}
                      disabled={!novoComprador.nome.trim()}
                      className="rounded-md border border-line bg-card px-2.5 py-1.5 text-[11px] font-semibold text-ink transition-colors hover:bg-brand-soft disabled:opacity-50"
                    >
                      + adicionar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
