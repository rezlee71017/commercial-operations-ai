import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCents } from "@/core/money"
import { getDb } from "@/db/client"
import { listAudit, listOrders } from "@/db/runs"

export const dynamic = "force-dynamic"

export default async function OrdersPage() {
  const db = await getDb()
  const [orders, audit] = await Promise.all([listOrders(db, 50), listAudit(db, 30)])
  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Orders and activity</h1>
          <Badge variant="outline">demo data</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Orders created by approved workflows, and the audit trail behind them.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>Prices are copied into each order when it is created.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet. Approve a workflow to create one.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Created (UTC)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono">{o.id}</TableCell>
                    <TableCell>{o.items.map((i) => `${i.productId} x${i.qty}`).join(", ")}</TableCell>
                    <TableCell className="text-right">{o.discountPct}%</TableCell>
                    <TableCell className="text-right">{formatCents(o.totalCents)}</TableCell>
                    <TableCell>{o.createdAt.toISOString().replace("T", " ").slice(0, 19)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit trail</CardTitle>
          <CardDescription>Newest first. Who or what did what, and when.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time (UTC)</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audit.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.at.toISOString().replace("T", " ").slice(0, 19)}</TableCell>
                  <TableCell>{a.actor}</TableCell>
                  <TableCell className="font-mono">{a.action}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {a.entityType}:{a.entityId.slice(0, 12)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
