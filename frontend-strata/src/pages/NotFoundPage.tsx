import Button from '@/components/ui/Button'
import './NotFoundPage.css'

export default function NotFoundPage() {
  return (
    <div className="notfound">
      <p className="notfound__code">404</p>
      <p className="notfound__msg">Esta página no existe o fue movida.</p>
      <Button to="/">Volver al inicio</Button>
    </div>
  )
}
