import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/qqp" });
  },
  head: () => ({
    meta: [
      { title: "ObraForma — QQP e formação de preço" },
      {
        name: "description",
        content:
          "Monte o Quadro de Quantidades e Preços com formação de preço por item, encargos sociais, BDI e impostos.",
      },
      { property: "og:title", content: "ObraForma — QQP e formação de preço" },
      {
        property: "og:description",
        content: "Quadro de Quantidades e Preços com formação de preço detalhada por item.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => null,
});
