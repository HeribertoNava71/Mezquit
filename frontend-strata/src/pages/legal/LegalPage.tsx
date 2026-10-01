import PageHeader from '@/sections/PageHeader'
import './LegalPage.css'

export default function LegalPage({ title, body }: { title: string; body: string }) {
  return (
    <>
      <PageHeader title={title} />
      <section className="legal">
        <div className="legal__inner">
          <p className="legal__body">{body}</p>
        </div>
      </section>
    </>
  )
}
