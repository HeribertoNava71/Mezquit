import './PageHeader.css'

interface PageHeaderProps {
  title: string
  intro?: string
}

export default function PageHeader({ title, intro }: PageHeaderProps) {
  return (
    <section className="page-header">
      <div className="page-header__inner">
        <h1 className="page-header__title">{title}</h1>
        {intro && <p className="page-header__intro">{intro}</p>}
      </div>
    </section>
  )
}
