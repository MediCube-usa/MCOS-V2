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
interface EstRow {
  product: string;
  barcode: string | null;
  units_sold: number | null;
  machines: number | null;
  tracking_since: string;
  last_update: string;
}

export function SalesBoard() {
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [est, setEst] = useState<EstRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const real = await dbSelect<SaleRow>('product_sales', 'select=*&order=qty.desc');
        setRows(real);
        if (real.length === 0) {
          setEst(await dbSelect<EstRow>('product_sales_estimate', 'select=*&order=units_sold.desc.nullslast'));
        }
        setStatus('ready');
      } catch (e) { setStatus('error'); setMsg(e instanceof Error ? e.message : 'load failed'); }
    })();
  }, []);

  const totals = useMemo(() => rows.reduce(
    (a, r) => ({ qty: a.qty + (r.qty || 0), amount: a.amount + (r.amount || 0) }),
    { qty: 0, amount: 0 },
  ), [rows]);

  if (status === 'loading') return <div className="section"><p>Loading sales…</p></div>;
  if (status === 'error') return <div className="banner building">Could not load sales: {msg}</div>;

  // ---- live sell-through counter (from 20-min stock snapshots) ----
  if (rows.length === 0) {
    const since = est[0] ? new Date(est[0].tracking_since).toLocaleString() : '';
    const sold = est.reduce((a, r) => a + (r.units_sold || 0), 0);
    return (
      <div>
        <p className="hub-note"><b>Live sell-through counter.</b> The fleet sync reads every machine&apos;s exact
          stock every 20 minutes; when stock drops, that&apos;s a sale. Counting runs automatically —
          started <b>{since || 'just now'}</b>, and totals below grow with every vend from here on.
          (Refills show as stock increases and are excluded. OurVend&apos;s own sales report can be folded in
          later for exact history — this counter needs nothing from anyone.)</p>
        <div className="sb-bar">
          <div className="sb-counts">
            <span className="sb-count"><b>{sold.toLocaleString()}</b> units sold since tracking began</span>
            <span className="sb-count"><b>{est.length}</b> products tracked</span>
          </div>
        </div>
        <div className="tablewrap">
          <table className="dtable">
            <thead><tr><th>Product</th><th className="num">Units sold</th><th className="num">On machines</th></tr></thead>
            <tbody>
              {est.map((r) => (
                <tr key={`${r.product}-${r.barcode}`}>
                  <td>{r.product}</td>
                  <td className="num">{(r.units_sold || 0).toLocaleString()}</td>
                  <td className="num">{r.machines || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="tbl-cap">Where-it-sells detail (per machine) and cost/margin math land here as the counter
          accumulates. Cost and sell price per product are on the <b>Products</b> tab.</p>
      </div>
    );
  }

  // ---- exact OurVend sales window, once that feed lands ----
  const windowLabel = rows[0] ? `${rows[0].period_start} → ${rows[0].period_end}` : '';
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
      <p className="tbl-cap">Window {windowLabel}, synced from OurVend Sale Summarize (read-only).</p>
    </div>
  );
}
