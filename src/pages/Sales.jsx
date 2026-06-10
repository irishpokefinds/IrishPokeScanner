import { useMemo, useState } from 'react'

function Sales({ sales }) {
  const [searchDate, setSearchDate] = useState('')
  const [searchEvent, setSearchEvent] = useState('')

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const matchesDate = searchDate ? sale.date.includes(searchDate) : true
      const matchesEvent = searchEvent ? sale.event.toLowerCase().includes(searchEvent.toLowerCase()) : true
      return matchesDate && matchesEvent
    })
  }, [sales, searchDate, searchEvent])

  const totals = useMemo(() => {
    return filteredSales.reduce(
      (summary, sale) => {
        summary.items += 1
        summary.revenue += Number(sale.price)
        return summary
      },
      { items: 0, revenue: 0 },
    )
  }, [filteredSales])

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Sales Records</p>
          <h2>Track every scanned item and event</h2>
        </div>
        <div className="chip">Live ledger</div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <p>Visible Sales</p>
          <strong>{totals.items}</strong>
        </div>
        <div className="metric-card">
          <p>Total Revenue</p>
          <strong>€{totals.revenue.toFixed(2)}</strong>
        </div>
      </div>

      <div className="panel">
        <div className="search-row">
          <input
            value={searchDate}
            onChange={(event) => setSearchDate(event.target.value)}
            placeholder="Search by date"
          />
          <input
            value={searchEvent}
            onChange={(event) => setSearchEvent(event.target.value)}
            placeholder="Search by event"
          />
        </div>

        <table className="sales-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Event</th>
              <th>SKU</th>
              <th>Card</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((sale) => (
              <tr key={sale.id}>
                <td>{sale.date}</td>
                <td>{sale.event}</td>
                <td>{sale.sku}</td>
                <td>{sale.name}</td>
                <td>€{sale.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default Sales
