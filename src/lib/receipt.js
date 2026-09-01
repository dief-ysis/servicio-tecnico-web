// Se descarga en vez de abrir una pestaña nueva: `window.open` se llamaba
// siempre después de un `await` (crear la orden, pedir el PDF), o sea fuera del
// gesto del usuario, y los navegadores bloquean ese popup. Como además no se
// comprobaba el retorno (null cuando lo bloquean), el comprobante simplemente
// no aparecía y el usuario no recibía ningún aviso. Una descarga vía <a download>
// no depende del gesto y funciona siempre.
export function downloadReceipt(blob, nombreArchivo = 'comprobante.pdf') {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
