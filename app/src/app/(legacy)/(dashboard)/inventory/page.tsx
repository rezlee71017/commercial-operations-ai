import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCents } from "@/core/money"
import { getDb } from "@/db/client"
import { loadCatalog } from "@/db/repo"

export const dynamic = "force-dynamic"

export default async function InventoryPage() {
  const catalog = await loadCatalog(await getDb())
  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <Badge variant="outline">demo data</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Read straight from the database. Approved workflows reduce the stock shown here.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{catalog.length} products</CardTitle>
          <CardDescription>Cost and margin are internal and are never shown to customers or sent to the AI.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="text-right">In stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {catalog.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{p.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{p.id}</div>
                  </TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell className="text-right">{formatCents(p.priceCents)}</TableCell>
                  <TableCell className="text-right">{formatCents(p.costCents)}</TableCell>
                  <TableCell className="text-right">
                    {(((p.priceCents - p.costCents) / p.priceCents) * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {p.stock === 0 ? (
                      <Badge variant="destructive">out of stock</Badge>
                    ) : p.stock < 5 ? (
                      <Badge variant="secondary">{p.stock} low</Badge>
                    ) : (
                      p.stock
                    )}
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
