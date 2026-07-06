function getApiUrl() {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl) return "";

  try {
    const url = new URL(apiUrl);
    const isLocalBackend =
      url.port === "8080" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);

    if (isLocalBackend) {
      return url.pathname.replace(/\/$/, "");
    }
  } catch {
    return normalizeApiPath(apiUrl);
  }

  return normalizeApiPath(apiUrl);
}

export const ENV = {
  API_URL: getApiUrl(),
};

function normalizeApiPath(value: string) {
  return value.replace(/\/$/, "");
}
