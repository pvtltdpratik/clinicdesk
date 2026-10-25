"use client";

import { useActionState, useState } from "react";
import { createInvoice } from "@/app/actions/invoices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/app/form-error";

type Row = { description: string; quantity: number; unit_price: number };

export function InvoiceForm({ patientId, visitId }: { patientId: number; visitId: number | null }) {
  const [state, formAction, pending] = useActionState(createInvoice, {});
  const [rows, setRows] = useState<Row[]>([{ description: "Consultation fee", quantity: 1, unit_price: 500 }]);

  const update = (index: number, patch: Partial<Row>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const total = rows.reduce((sum, r) => sum + r.quantity * r.unit_price, 0);

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-5">
      <input type="hidden" name="patient_id" value={patientId} />
      {visitId && <input type="hidden" name="visit_id" value={visitId} />}
      {/* The rows are sent to the server as one JSON string. */}
      <input type="hidden" name="items" value={JSON.stringify(rows)} />

      <div className="flex flex-col gap-3">
        <div className="hidden grid-cols-[1fr_5rem_8rem_6rem_2rem] gap-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:grid">
          <span>Item</span><span>Qty</span><span>Price (₹)</span><span className="text-right">Amount</span><span />
        </div>
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_5rem_8rem_6rem_2rem] sm:items-center">
            <Input className="col-span-2 sm:col-span-1" value={row.description} placeholder="Description"
              aria-label="Item description" onChange={(e) => update(i, { description: e.target.value })} />
            <Input type="number" min={1} value={row.quantity} aria-label="Quantity"
              onChange={(e) => update(i, { quantity: Number(e.target.value) })} />
            <Input type="number" min={0} step="0.01" value={row.unit_price} aria-label="Unit price"
              onChange={(e) => update(i, { unit_price: Number(e.target.value) })} />
            <span className="text-right tabular-nums">₹{(row.quantity * row.unit_price).toFixed(2)}</span>
            <Button type="button" variant="ghost" size="icon-xs" aria-label="Remove item"
              onClick={() => setRows((current) => current.filter((_, j) => j !== i))}>✕</Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="w-fit"
          onClick={() => setRows((current) => [...current, { description: "", quantity: 1, unit_price: 0 }])}>
          + Add item
        </Button>
      </div>

      <p className="border-t pt-3 text-right font-heading text-xl tabular-nums">Total ₹{total.toFixed(2)}</p>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" placeholder="Optional" />
      </div>
      <FormError message={state.error} />
      <Button type="submit" disabled={pending} className="w-fit">{pending ? "Saving…" : "Create invoice"}</Button>
    </form>
  );
}
