function getApiUrl() {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl) return "";

  try {
    const url = new URL(apiUrl);

    if (url.hostname === "localhost" && url.port === "8080") {
      return url.pathname.replace(/\/$/, "");
    }
  } catch {
    return apiUrl.replace(/\/$/, "");
  }

  return apiUrl.replace(/\/$/, "");
}

export const ENV = {
  API_URL: getApiUrl(),
};
