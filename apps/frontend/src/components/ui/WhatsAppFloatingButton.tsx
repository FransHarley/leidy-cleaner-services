const WHATSAPP_NUMBER = '5551980303740';
const WHATSAPP_MESSAGE = 'Ola! Vim pelo site da Leidy Cleaner Services e gostaria de atendimento.';

const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export function WhatsAppFloatingButton() {
  return (
    <a
      aria-label="Abrir conversa no WhatsApp da Leidy Cleaner Services"
      className="fixed bottom-4 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_16px_32px_rgba(37,211,102,0.32)] transition hover:scale-[1.03] hover:bg-[#20bd5c] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 md:bottom-5 md:right-5"
      href={whatsappUrl}
      rel="noreferrer"
      target="_blank"
    >
      <span className="sr-only">Falar no WhatsApp</span>
      <svg
        aria-hidden="true"
        className="h-7 w-7"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M19.05 4.91A9.82 9.82 0 0 0 12.03 2C6.6 2 2.2 6.4 2.2 11.83c0 1.74.45 3.44 1.31 4.94L2 22l5.39-1.41a9.8 9.8 0 0 0 4.64 1.18h.01c5.43 0 9.83-4.4 9.83-9.83 0-2.63-1.02-5.1-2.82-7.03Zm-7.02 15.2h-.01a8.15 8.15 0 0 1-4.15-1.13l-.3-.18-3.2.84.85-3.12-.2-.32a8.12 8.12 0 0 1-1.25-4.37c0-4.51 3.67-8.18 8.19-8.18 2.18 0 4.23.84 5.78 2.39a8.13 8.13 0 0 1 2.39 5.79c0 4.51-3.68 8.18-8.1 8.18Zm4.49-6.12c-.25-.12-1.47-.72-1.7-.8-.23-.08-.4-.12-.57.12-.17.25-.65.8-.8.97-.15.17-.3.19-.55.06-.25-.12-1.05-.39-2-1.25-.74-.66-1.24-1.48-1.39-1.73-.15-.25-.02-.38.11-.5.11-.11.25-.3.37-.45.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.57-1.36-.78-1.87-.21-.5-.42-.43-.57-.44h-.48c-.17 0-.43.06-.65.31-.22.25-.84.82-.84 1.99 0 1.17.86 2.31.98 2.47.12.17 1.68 2.56 4.07 3.59.57.25 1.02.4 1.37.51.58.18 1.11.15 1.53.09.47-.07 1.47-.6 1.68-1.19.21-.59.21-1.09.15-1.19-.06-.11-.23-.17-.48-.29Z" />
      </svg>
    </a>
  );
}
