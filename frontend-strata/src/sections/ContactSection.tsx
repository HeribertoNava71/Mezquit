import { useState, type FormEvent, type ChangeEvent } from 'react'
import { SITE } from '@/config/site'
import Button from '@/components/ui/Button'
import api from '@/api/axios'
import './ContactSection.css'

interface FormState {
  name: string
  company: string
  email: string
  sector: string
  company_size: string
  evaluations_per_month: string
}

const EMPTY: FormState = {
  name: '',
  company: '',
  email: '',
  sector: '',
  company_size: '',
  evaluations_per_month: '',
}

export default function ContactSection() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormState]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      await api.post('/api/leads', form)
      setSent(true)
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } }).response?.status === 422
      ) {
        const apiErrors = (err as { response: { data: { errors: Record<string, string[]> } } }).response.data.errors
        const mapped: Partial<Record<keyof FormState, string>> = {}
        for (const key in apiErrors) {
          mapped[key as keyof FormState] = apiErrors[key][0]
        }
        setErrors(mapped)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="contact" id="contacto" aria-labelledby="contact-title">
      <div className="contact__inner">
        {/* Formulario */}
        <div className="contact__form-side">
          <h2 className="contact__title" id="contact-title">¿Listo para medir?</h2>

          {sent ? (
            <div className="contact__success" role="status">
              <p className="contact__success-title">¡Gracias!</p>
              <p>Tu solicitud fue recibida. Te contactamos en un día hábil.</p>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              {(
                [
                  { name: 'name', label: 'Nombre', type: 'text', placeholder: 'Tu nombre' },
                  { name: 'company', label: 'Empresa', type: 'text', placeholder: 'Nombre de la empresa' },
                  { name: 'email', label: 'Correo electrónico', type: 'email', placeholder: 'tu@empresa.com' },
                ] as const
              ).map(({ name, label, type, placeholder }) => (
                <div key={name} className="form-field">
                  <label className="form-label" htmlFor={name}>{label}</label>
                  <input
                    id={name}
                    name={name}
                    type={type}
                    placeholder={placeholder}
                    value={form[name]}
                    onChange={handleChange}
                    className={`form-input${errors[name] ? ' form-input--error' : ''}`}
                    aria-invalid={!!errors[name]}
                    aria-describedby={errors[name] ? `${name}-error` : undefined}
                    required
                  />
                  {errors[name] && (
                    <span id={`${name}-error`} className="form-error" role="alert">
                      <span aria-hidden="true">⚠</span> {errors[name]}
                    </span>
                  )}
                </div>
              ))}

              <div className="form-field">
                <label className="form-label" htmlFor="sector">Sector</label>
                <select
                  id="sector"
                  name="sector"
                  value={form.sector}
                  onChange={handleChange}
                  className={`form-select${errors.sector ? ' form-input--error' : ''}`}
                  aria-invalid={!!errors.sector}
                  required
                >
                  <option value="">Selecciona…</option>
                  <option value="comercio">Comercio</option>
                  <option value="manufactura">Manufactura o maquila</option>
                  <option value="servicios">Servicios</option>
                  <option value="otro">Otro</option>
                </select>
                {errors.sector && (
                  <span id="sector-error" className="form-error" role="alert">
                    <span aria-hidden="true">⚠</span> {errors.sector}
                  </span>
                )}
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="company_size">Tamaño de empresa</label>
                <select
                  id="company_size"
                  name="company_size"
                  value={form.company_size}
                  onChange={handleChange}
                  className={`form-select${errors.company_size ? ' form-input--error' : ''}`}
                  aria-invalid={!!errors.company_size}
                  required
                >
                  <option value="">Selecciona…</option>
                  <option value="1-10">1 – 10 personas</option>
                  <option value="11-50">11 – 50 personas</option>
                  <option value="51-250">51 – 250 personas</option>
                  <option value="250+">Más de 250</option>
                </select>
                {errors.company_size && (
                  <span className="form-error" role="alert">
                    <span aria-hidden="true">⚠</span> {errors.company_size}
                  </span>
                )}
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="evaluations_per_month">Evaluaciones al mes</label>
                <select
                  id="evaluations_per_month"
                  name="evaluations_per_month"
                  value={form.evaluations_per_month}
                  onChange={handleChange}
                  className={`form-select${errors.evaluations_per_month ? ' form-input--error' : ''}`}
                  aria-invalid={!!errors.evaluations_per_month}
                  required
                >
                  <option value="">Selecciona…</option>
                  <option value="<10">Menos de 10</option>
                  <option value="10-50">10 – 50</option>
                  <option value="50-200">50 – 200</option>
                  <option value="200+">Más de 200</option>
                </select>
                {errors.evaluations_per_month && (
                  <span className="form-error" role="alert">
                    <span aria-hidden="true">⚠</span> {errors.evaluations_per_month}
                  </span>
                )}
              </div>

              <Button type="submit" loading={loading}>
                Solicitar información
              </Button>
            </form>
          )}

          <p className="contact__reply-note">Te respondemos en un día hábil.</p>
        </div>

        {/* Agenda */}
        <div className="contact__agenda-side">
          <h3 className="contact__agenda-title">Agenda una demo de 30 minutos</h3>
          <p className="contact__agenda-desc">
            Muéstrame el sistema en acción y resuelve tus dudas antes de decidir.
          </p>
          {SITE.calendarUrl !== '[PENDIENTE: enlace de agenda]' ? (
            <Button href={SITE.calendarUrl} variant="ghost" size="lg">
              Reservar tiempo →
            </Button>
          ) : (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink)', opacity: 0.6 }}>
              [PENDIENTE: enlace de agenda]
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
