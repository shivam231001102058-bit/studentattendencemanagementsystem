function PageIntro({ eyebrow, title, description, children }) {
  return (
    <div className="page-intro">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        <p className="page-description">{description}</p>
      </div>
      {children && <div className="page-intro-actions">{children}</div>}
    </div>
  )
}

export default PageIntro
