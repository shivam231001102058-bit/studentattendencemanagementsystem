import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <section className="panel empty-state not-found">
      <div className="not-found-code">404</div>
      <h3>Page not found</h3>
      <p>The page you’re looking for doesn’t exist or may have moved.</p>
      <Link className="button button-primary" to="/">Return to dashboard</Link>
    </section>
  )
}

export default NotFound
