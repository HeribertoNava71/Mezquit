import { useEffect, useId, useRef, useState } from 'react'
import { deleteUser, type AdminUser } from '@/api/adminUsers'
import { Avatar, Button, Callout, Modal } from '@/components/ui'
import { Correo } from './Correo'
import { errorAlEliminar, type ErrorDeAccion } from './errores'
import { nombreCompleto } from './formato'
import './ConfirmarEliminacion.css'

export interface ConfirmarEliminacionProps {
  /** Usuario que se va a eliminar. Con null, el modal está cerrado. */
  usuario: AdminUser | null
  /** Cancelar, Escape o clic fuera, sin eliminar. No responde mientras se elimina. */
  onCancelar: () => void
  /**
   * DELETE /api/admin/users/{id} respondió con éxito. El modal no se cierra
   * solo: quien lo usa decide qué sigue (recargar la lista o volver a ella).
   */
  onEliminado: (usuario: AdminUser) => void
}

/**
 * Confirmación de «Eliminar usuario» (alertdialog con el lenguaje de los modales
 * del prototipo, Strata.dc.html:1323-1418). El foco inicial va a «Cancelar», la
 * acción menos destructiva. Si DELETE falla, el error se muestra dentro del
 * modal, con ícono y texto (D-22); el 409 dice «No puedes eliminar tu propia
 * cuenta.» y deja «Eliminar usuario» deshabilitado, porque repetirlo no sirve.
 */
export function ConfirmarEliminacion({ usuario, onCancelar, onEliminado }: ConfirmarEliminacionProps) {
  if (!usuario) return null
  // Una instancia por usuario: el error de un intento no pasa al siguiente.
  return <DialogoEliminar key={usuario.id} usuario={usuario} onCancelar={onCancelar} onEliminado={onEliminado} />
}

interface DialogoEliminarProps extends ConfirmarEliminacionProps {
  usuario: AdminUser
}

function DialogoEliminar({ usuario, onCancelar, onEliminado }: DialogoEliminarProps) {
  const [eliminando, setEliminando] = useState(false)
  // Se borra al reintentar: si vuelve a fallar, el aviso se monta (y se anuncia) de nuevo.
  const [error, setError] = useState<ErrorDeAccion | null>(null)
  const cancelarRef = useRef<HTMLButtonElement>(null)
  const montado = useRef(false)
  const errorId = useId()
  const nombre = nombreCompleto(usuario)

  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
    }
  }, [])

  async function eliminar() {
    if (eliminando || error?.definitivo) return
    setEliminando(true)
    setError(null)
    try {
      await deleteUser(usuario.id)
      if (montado.current) onEliminado(usuario)
    } catch (fallo) {
      if (!montado.current) return
      setError(errorAlEliminar(fallo))
      setEliminando(false)
    }
  }

  function cerrar() {
    if (!eliminando) onCancelar()
  }

  const sinSalida = error?.definitivo === true

  return (
    <Modal
      open
      onClose={cerrar}
      role="alertdialog"
      title={`¿Eliminar a ${nombre}?`}
      description="Esta acción no se puede deshacer."
      initialFocusRef={cancelarRef}
      footer={
        <>
          <Button ref={cancelarRef} variant="neutral" disabled={eliminando} onClick={cerrar}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            loading={eliminando}
            loadingText="Eliminando…"
            disabled={sinSalida}
            aria-describedby={error ? errorId : undefined}
            onClick={eliminar}
          >
            Eliminar usuario
          </Button>
        </>
      }
    >
      <div className="st-eliminar-usuario__ficha">
        <Avatar name={nombre} shape="square" tone="sky" size="md" />
        <div className="st-eliminar-usuario__persona">
          <p className="st-eliminar-usuario__nombre">{nombre}</p>
          <p className="st-eliminar-usuario__correo">
            <Correo valor={usuario.email} />
          </p>
        </div>
      </div>
      <p className="st-eliminar-usuario__texto">La persona ya no podrá entrar con esta cuenta.</p>
      {error && (
        <Callout id={errorId} tone="error" live="alert">
          {error.mensaje}
        </Callout>
      )}
    </Modal>
  )
}
