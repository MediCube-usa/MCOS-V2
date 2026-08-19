'use client';

import { useEffect, useMemo, useState } from 'react';
import { dbSelect } from '@/lib/db';

interface SaleRow {
  id: string;
  period_start: string;
  period_end: string;
  pr_id: string | null;
  product_name: string | null;
  qty: number | null;
  amount: number | null;
}

export function SalesBoard() {
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    dbSelect<SaleRow>('product_sales', 'select=*&order=qty.desc')
      .then((r) => { setRows(r); setStatus('ready'); })
      .catch((e) => { setStatus('error'); setMsg(e instanceof Error ? e.message : 'load failed'); });
  }, []);

  const windowLabel = rows[0] ? `${rows[0].period_start} → ${rows[0].period_end}` : '';
  const totals = useMemo(() => rows.reduce(
    (a, r) => ({ qty: a.qty + (r.qty || 0), amount: a.amount + (r.amount || 0) }),
    { qty: 0, amount: 0 },
  ), [rows]);

  if (status === 'loading') return <div className="section"><p>Loading sales…</p></div>;
  if (status === 'error') return <div className="banner building">Could not load sales: {msg}</div>;

  if (rows.length === 0) {
    return (
      <div>
        <p className="hub-note"><b>What this tab shows, per product:</b> how many we sell in total, where it
          sells and where it does not, cost vs. sell price — the numbers behind promos, launches and pre-orders.</p>
        <div className="banner building">
          <b>The sales reader is built and deployed (`ourvend-sales`) — it needs one 2-minute unlock.</b> OurVend&apos;s
          sales grid sits behind the same bot-wall the catalog module had. Fix is identical to the catalog fix:
          open OurVend → Sale Summarize → run a search → F12 Network tab → right-click the <b>ListJson</b> request →
          Copy as cURL → paste it to Claude. That carries the working session context; the reader then syncs
          product sales on a schedule permanently, no more pastes.
        </div>
        <div className="section">
          <h3>Available today</h3>
          <p>Cost, sell price and which machines carry each product are on the <b>Products</b> tab.
            Stock movement between 20-minute syncs is on the Inventory block.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="sb-bar">
        <div className="sb-counts">
          <span className="sb-count"><b>{rows.length}</b> products sold · {windowLabel}</span>
          <span className="sb-count"><b>{totals.qty.toLocaleString()}</b> units</span>
          <span className="sb-count"><b>${totals.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</b> gross</span>
        </div>
      </div>
      <div className="tablewrap">
        <table className="dtable">
          <thead><tr><th>Product</th><th className="num">Units sold</th><th className="num">Gross</th><th className="num">Share</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.product_name || r.pr_id}</td>
                <td className="num">{(r.qty || 0).toLocaleString()}</td>
                <td className="num">${(r.amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                <td className="num">{totals.qty ? Math.round(100 * (r.qty || 0) / totals.qty) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="tbl-cap">Window {windowLabel}, synced from OurVend Sale Summarize (read-only). Per-machine
        where-it-sells breakdown comes next once the by-machine report is captured the same way.</p>
    </div>
  );
}
