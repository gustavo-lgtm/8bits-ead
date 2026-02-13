import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB

function kindFromMime(mime: string | null | undefined): "IMAGE" | "VIDEO" | "FILE" {
  const m = (mime || "").toLowerCase();
  if (m.startsWith("image/")) return "IMAGE";
  if (m.startsWith("video/")) return "VIDEO";
  return "FILE";
}

function safeFileName(name: string) {
  // evita path traversal e caracteres estranhos, mantendo algo legível
  const base = name.split(/[/\\]/).pop() || "file";
  return base.replace(/[^\w.\-()\s]/g, "_").slice(0, 120);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const unitId = String(formData.get("unitId") || "").trim();

  if (!unitId) {
    return NextResponse.json({ error: "Missing unitId" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large. Max is ${MAX_BYTES} bytes (25MB).` },
      { status: 413 }
    );
  }

  const originalName = safeFileName(file.name || "file");
  const contentType = file.type || "application/octet-stream";

  // path organizado por unidade e usuário (facilita auditoria e limpeza)
  const blobPath = `activity/${unitId}/${userId}/${Date.now()}-${originalName}`;

  try {
    const blob = await put(blobPath, file, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });

    return NextResponse.json({
      ok: true,
      blob: {
        url: blob.url,
        pathname: blob.pathname,
        contentType,
        sizeBytes: file.size,
        fileName: originalName,
        kind: kindFromMime(contentType),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Upload failed", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
