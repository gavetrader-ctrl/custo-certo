import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { EMPRESA_STORAGE_KEY, empresaInicial, type EmpresaData } from "@/lib/pricing";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Dados da Empresa" },
      { name: "description", content: "Cadastro dos dados da empresa para propostas comerciais." },
    ],
  }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const [empresa, setEmpresa] = useState<EmpresaData>(empresaInicial);
  const [carregado, setCarregado] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(EMPRESA_STORAGE_KEY);
      if (raw) {
        const dados = JSON.parse(raw) as EmpresaData;
        setEmpresa({ ...empresaInicial, ...dados });
      }
    } catch {
      /* ignora */
    }
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (!carregado) return;
    const t = setTimeout(() => {
      localStorage.setItem(EMPRESA_STORAGE_KEY, JSON.stringify(empresa));
      setSalvo(true);
    }, 400);
    return () => clearTimeout(t);
  }, [empresa, carregado]);

  const set = (patch: Partial<EmpresaData>) => {
    setEmpresa((e) => ({ ...e, ...patch }));
    setSalvo(false);
    setMensagem("");
  };

  const limpar = () => {
    if (!confirm("Limpar todos os dados da empresa?")) return;
    setEmpresa(empresaInicial);
    localStorage.removeItem(EMPRESA_STORAGE_KEY);
    setSalvo(false);
    setMensagem("Dados limpos.");
  };

  const testarEmail = () => {
    if (!empresa.email) {
      setMensagem("Preencha o campo E-mail primeiro.");
      return;
    }
    window.open(`mailto:${empresa.email}?subject=Teste de e-mail`, "_blank");
  };

  const camposObrigatorios: { campo: keyof EmpresaData; label: string }[] = [
    { campo: "razaoSocial", label: "Razão Social" },
    { campo: "cnpj", label: "CNPJ" },
    { campo: "endereco", label: "Endereço" },
    { campo: "cidade", label: "Cidade" },
    { campo: "estado", label: "Estado" },
  ];

  const erros = camposObrigatorios.filter((c) => !empresa[c.campo]?.trim());

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
              <p className="text-sm font-semibold tracking-tight">Configurações</p>
              <p className="text-[11px] text-muted-ink">Dados da empresa para propostas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-line bg-card/70 px-3 py-1.5 text-[11px] font-medium text-muted-ink sm:inline-flex">
              <span className={`size-1.5 rounded-full ${salvo ? "bg-positive" : "bg-brand"}`} />
              {salvo ? "Salvo" : "Não salvo"}
            </span>
            <Link
              to="/proposta"
              className="rounded-lg border border-line bg-card/70 px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-card"
            >
              ← Proposta
            </Link>
            <button
              onClick={limpar}
              className="rounded-lg border border-line bg-card/70 px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-card"
            >
              Limpar
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-[900px] px-6 py-6">
        {mensagem && (
          <div className="mb-4 rounded-xl border border-positive/30 bg-positive/10 px-4 py-3 text-[13px] text-positive">
            {mensagem}
          </div>
        )}

        <div className="animate-rise rounded-2xl border border-line/80 bg-card/65 p-6 backdrop-blur-xl">
          <h3 className="mb-1 text-sm font-semibold tracking-tight">Dados da Empresa</h3>
          <p className="mb-5 text-[12px] text-muted-ink">
            Esses dados são usados automaticamente nas propostas comerciais.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Razão Social *"
              value={empresa.razaoSocial}
              onChange={(v) => set({ razaoSocial: v })}
              className="md:col-span-2"
            />
            <Field
              label="CNPJ *"
              value={empresa.cnpj}
              onChange={(v) => set({ cnpj: v })}
              placeholder="00.000.000/0000-00"
            />
            <Field
              label="Telefone"
              value={empresa.telefone}
              onChange={(v) => set({ telefone: v })}
              placeholder="(00) 00000-0000"
            />
            <Field
              label="Endereço *"
              value={empresa.endereco}
              onChange={(v) => set({ endereco: v })}
              className="md:col-span-2"
            />
            <Field label="Bairro" value={empresa.bairro} onChange={(v) => set({ bairro: v })} />
            <Field label="Cidade *" value={empresa.cidade} onChange={(v) => set({ cidade: v })} />
            <Field
              label="Estado *"
              value={empresa.estado}
              onChange={(v) => set({ estado: v })}
              placeholder="UF"
            />
            <Field
              label="CEP"
              value={empresa.cep}
              onChange={(v) => set({ cep: v })}
              placeholder="00000-000"
            />
            <Field
              label="E-mail"
              value={empresa.email}
              onChange={(v) => set({ email: v })}
              className="md:col-span-2"
              type="email"
            />
            <Field label="Contato" value={empresa.contato} onChange={(v) => set({ contato: v })} />
            <Field
              label="Cargo do Contato"
              value={empresa.cargoContato}
              onChange={(v) => set({ cargoContato: v })}
            />
          </div>

          {erros.length > 0 && (
            <p className="mt-3 text-[12px] text-muted-ink">
              * Campos obrigatórios: {erros.map((e) => e.label).join(", ")}
            </p>
          )}

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={testarEmail}
              disabled={!empresa.email}
              className="rounded-lg border border-line bg-card/70 px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-card disabled:opacity-50"
            >
              Testar e-mail
            </button>
          </div>
        </div>

        {/* Logo */}
        <div className="animate-rise mt-6 rounded-2xl border border-line/80 bg-card/65 p-6 backdrop-blur-xl">
          <h3 className="mb-1 text-sm font-semibold tracking-tight">Logo da Empresa</h3>
          <p className="mb-4 text-[12px] text-muted-ink">
            A logo aparece no cabeçalho das propostas comerciais impressas.
          </p>

          <div className="flex items-start gap-6">
            <div className="flex-1">
              <label className="mb-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-card/50 p-6 text-center transition-colors hover:border-brand hover:bg-brand/5">
                <span className="mb-2 text-[24px]">📷</span>
                <span className="text-[13px] font-medium text-ink">
                  {empresa.logo ? "Trocar logo" : "Clique para enviar a logo"}
                </span>
                <span className="text-[11px] text-muted-ink">PNG, JPG ou SVG (máx. 2MB)</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) {
                      setMensagem("Arquivo muito grande. Máximo 2MB.");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      const result = reader.result as string;
                      set({ logo: result });
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            </div>

            {empresa.logo && (
              <div className="relative">
                <img
                  src={empresa.logo}
                  alt="Logo da empresa"
                  className="h-24 rounded-lg border border-line bg-white object-contain p-2"
                />
                <button
                  onClick={() => set({ logo: "" })}
                  className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-destructive text-[14px] font-bold text-destructive-foreground"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  className,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-[11px] font-medium text-muted-ink">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-line bg-card px-3 py-2 text-[13px] text-ink outline-none transition-colors placeholder:text-muted-ink focus:border-brand"
      />
    </div>
  );
}
