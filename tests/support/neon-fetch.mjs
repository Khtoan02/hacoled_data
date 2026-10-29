import "./push-transport.mjs";
// Imported only by the test runner process, never by application code.
const original = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  return original(
    url === "https://api.neon.tech/sql" &&
      String(new Headers(init?.headers).get("Neon-Connection-String")).includes(
        "ep-hacoled-test.neon.tech",
      )
      ? "http://127.0.0.1:54339/sql"
      : input,
    init,
  );
};
