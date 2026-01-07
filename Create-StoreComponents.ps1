function isValidExternalUrl(url?: string) {
  if (!url) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    // opcional: validar lista de domínios permitidos
    // const allowed = ["exemplo.com", "meudominio.com"];
    // if (!allowed.some(d => u.hostname.endsWith(d))) return false;
    return true;
  } catch {
    return false;
  }
}

// Uso:
if (isValidExternalUrl(payload.external_url)) {
  // salvar no DB (via supabase/admin client ou SQL)
} else {
  // ignorar ou salvar como NULL
}