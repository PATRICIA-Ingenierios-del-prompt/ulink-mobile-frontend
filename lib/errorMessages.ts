/**
 * Convierte un error de Axios en un mensaje en español que el usuario puede entender.
 *
 * Prioridad:
 *  1. Si el backend devolvió { "error": "..." } en el body (nuestros backends
 *     siempre lo hacen), se usa ese mensaje directamente.
 *  2. Si hay un status conocido, se usa el mensaje genérico.
 *  3. Sin respuesta del servidor → mensaje de conectividad.
 *  4. Si nada aplica, se usa el `fallback` provisto.
 */
const STATUS_MESSAGES: Record<number, string> = {
  401: 'Tu sesión no es válida o expiró. Inicia sesión de nuevo.',
  403: 'No tienes permiso para hacer esto.',
  404: 'No encontramos lo que buscas. Verifica la información e intenta de nuevo.',
  409: 'Ya existe un registro con esa información.',
  422: 'Algo no está bien con la información enviada. Revisa los datos e intenta de nuevo.',
  429: 'Demasiados intentos. Espera un momento y vuelve a intentar.',
  500: 'Tuvimos un problema en nuestro lado. Intenta de nuevo en un momento.',
  502: 'Tuvimos un problema en nuestro lado. Intenta de nuevo en un momento.',
  503: 'Tuvimos un problema en nuestro lado. Intenta de nuevo en un momento.',
  504: 'Tuvimos un problema en nuestro lado. Intenta de nuevo en un momento.',
};

export function friendlyError(e: any, fallback: string): string {
  if (!e?.response) {
    return 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.';
  }

  const status: number = e.response.status;
  const backendMsg: string | undefined = e.response.data?.error;

  // Para 400 y 4xx en general, preferimos el mensaje específico del backend
  // (nuestros backends ya hablan español desde las excepciones de dominio).
  if (backendMsg && backendMsg.trim().length > 0 && status >= 400 && status < 500) {
    return backendMsg;
  }

  if (STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];

  return fallback;
}
