import { getVectorStore } from "@/lib/rag/vector-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Deterministic wireframe thumbnail for a stored section.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const store = getVectorStore();
  const row = store.getAll().find((s) => s.externalId === id);
  if (!row) return new Response("not found", { status: 404 });

  const [c1 = "#4f46e5", c2 = "#0f172a"] = row.colorPalette ?? [];
  const blocks: string[] = [];
  const layout = row.layoutType;
  const push = (x: number, y: number, w: number, h: number, fill: string, r = 6) =>
    blocks.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`);

  if (layout === "split") {
    push(24, 36, 150, 14, c2);
    push(24, 60, 190, 10, "#cbd5e1");
    push(24, 78, 160, 10, "#cbd5e1");
    push(24, 104, 80, 24, c1, 8);
    push(240, 30, 136, 110, "#e2e8f0", 10);
  } else if (layout === "grid") {
    for (let i = 0; i < 6; i++) push(24 + (i % 3) * 120, 40 + Math.floor(i / 3) * 56, 104, 44, i === 1 ? c1 : "#e2e8f0");
  } else if (layout === "asymmetric") {
    push(24, 30, 180, 112, c1, 10);
    push(216, 30, 160, 52, "#e2e8f0");
    push(216, 90, 160, 52, c2, 8);
  } else if (layout === "banner") {
    push(24, 46, 352, 80, c1, 12);
    push(150, 72, 100, 12, "#ffffff");
    push(166, 94, 68, 16, "#ffffff", 8);
  } else if (layout === "stacked") {
    for (let i = 0; i < 4; i++) push(60, 32 + i * 30, 280, 22, i === 0 ? c1 : "#e2e8f0");
  } else {
    push(110, 36, 180, 16, c2);
    push(80, 62, 240, 10, "#cbd5e1");
    push(140, 82, 120, 10, "#cbd5e1");
    push(160, 106, 80, 24, c1, 8);
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="172" viewBox="0 0 400 172" role="img" aria-label="${row.sectionType} ${layout} wireframe">
<rect width="400" height="172" fill="#f8fafc"/>
<rect x="0" y="0" width="400" height="18" fill="#eef2f7"/>
<circle cx="14" cy="9" r="3.5" fill="#cbd5e1"/><circle cx="26" cy="9" r="3.5" fill="#cbd5e1"/><circle cx="38" cy="9" r="3.5" fill="#cbd5e1"/>
${blocks.join("")}
<text x="12" y="166" font-family="ui-monospace,monospace" font-size="9" fill="#94a3b8">${row.sectionType} · ${layout} · ${row.tone}</text>
</svg>`;

  return new Response(svg, {
    headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=3600" },
  });
}
