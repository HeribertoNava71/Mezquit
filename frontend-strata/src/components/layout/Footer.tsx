import { Link } from 'react-router-dom'
import { SITE } from '@/config/site'
import './Footer.css'

const YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <img src="/logo.png" alt={SITE.name} className="footer__logo" width={47} height={32} />
          <span className="footer__name">{SITE.name}</span>
        </div>

        <ul className="footer__links">
          <li><Link to="/aviso-de-privacidad" className="footer__link">Aviso de privacidad</Link></li>
          <li><Link to="/terminos" className="footer__link">Términos y condiciones</Link></li>
          <li><Link to="/ayuda" className="footer__link">Ayuda</Link></li>
          <li><Link to="/evaluar" className="footer__link">¿Te invitaron a una evaluación?</Link></li>
          <li><a href={`mailto:${SITE.email}`} className="footer__link">Contacto</a></li>
        </ul>

        <p className="footer__legal">
          © {YEAR} [PENDIENTE: razón social del titular]<br />
          {SITE.email}
        </p>
      </div>
    </footer>
  )
}
