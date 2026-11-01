// A normal form POST avoids CORS. Only an explicit Apps Script response confirms receipt.
export function initQuoteForms() {
  document.querySelectorAll<HTMLFormElement>("[data-quote-form]").forEach((form) => {
    if (form.dataset.configured !== "true" || form.dataset.initialized) return;
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const status = form.querySelector<HTMLElement>("[data-form-status]");
    const origin = form.querySelector<HTMLInputElement>('[name="origin"]');
    const requestId = form.querySelector<HTMLInputElement>('[name="requestId"]');
    if (!button || !status || !origin || !requestId) return;
    form.dataset.initialized = "true";
    const label = button.textContent || "Envoyer ma demande";
    const frame = document.createElement("iframe");
    frame.name = `quote-${crypto.randomUUID()}`;
    frame.title = "Réponse du formulaire de devis";
    frame.hidden = true;
    document.body.append(frame);
    form.target = frame.name;
    origin.value = window.location.origin;
    requestId.value = crypto.randomUUID();
    button.disabled = false;
    let pending = false;
    let uncertain = false;
    let timer: ReturnType<typeof setTimeout>;
    const controls = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-control]");

    const finish = (message: string) => {
      clearTimeout(timer);
      pending = false;
      form.removeAttribute("aria-busy");
      controls.forEach((control) => { control.readOnly = false; });
      button.disabled = false;
      button.textContent = label;
      status.textContent = message;
    };

    // Editing a previously submitted payload creates a new request; an unchanged retry
    // keeps its identifier so the server can return the existing receipt.
    form.addEventListener("input", () => {
      if (!pending && uncertain) {
        requestId.value = crypto.randomUUID();
        uncertain = false;
      }
    });

    form.addEventListener("submit", (event) => {
      if (pending || !form.reportValidity()) {
        event.preventDefault();
        return;
      }
      pending = true;
      uncertain = true;
      button.disabled = true;
      button.textContent = "Envoi en cours…";
      form.setAttribute("aria-busy", "true");
      controls.forEach((control) => { control.readOnly = true; });
      status.textContent = "Votre demande est en cours d’envoi.";
      timer = setTimeout(() => finish(
        "La réception n’a pas pu être confirmée. Réessayez sans modifier les champs, ou contactez-moi par téléphone ou par email.",
      ), 60000);
    });

    window.addEventListener("message", (event: MessageEvent) => {
      // Google HTML Service runs the response in a nested googleusercontent iframe.
      if (!/^https:\/\/[a-z0-9-]+\.googleusercontent\.com$/.test(event.origin)) return;
      const data = event.data;
      if (!data || data.type !== "courant:quote-result" ||
          data.requestId !== requestId.value || typeof data.ok !== "boolean" ||
          (!pending && !uncertain)) return;
      if (data.ok) {
        form.reset();
        origin.value = window.location.origin;
        requestId.value = crypto.randomUUID();
        uncertain = false;
        finish("Votre demande a bien été reçue. Je vous recontacte sous 48 à 72h.");
      } else {
        finish("La demande n’a pas pu être enregistrée. Vérifiez les champs et réessayez, ou contactez-moi directement.");
      }
    });
  });
}
