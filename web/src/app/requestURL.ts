export function publicRequestURL(request: Request): URL {
  const url = new URL(request.url);
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();

  if (protocol === "https" || protocol === "http")
    url.protocol = `${protocol}:`;
  if (host) {
    url.port = "";
    url.host = host.split(",")[0]!.trim();
  }
  return url;
}
