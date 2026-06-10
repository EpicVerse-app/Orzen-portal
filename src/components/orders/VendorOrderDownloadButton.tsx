'use client'

import { Download } from 'lucide-react'

interface Item {
  quantity: number
  product: {
    name: string
    unit: string
    category?: { name: string } | null
  }
}

interface Props {
  orderId:    string
  createdAt:  string
  status:     string
  branch?: {
    name?:    string
    address?: string
    city?:    string
    state?:   string
  } | null
  items: Item[]
}

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function VendorOrderDownloadButton({ orderId, createdAt, status, branch, items }: Props) {
  async function handleDownload() {
    const XLSX = await import('xlsx')

    const summary = [
      ['Order ID',    shortId(orderId)],
      ['Date',        formatDate(createdAt)],
      ['Branch',      branch?.name ?? ''],
      ['Address',     [branch?.address, branch?.city, branch?.state].filter(Boolean).join(', ')],
      ['Status',      status],
      ['Total Items', items.reduce((s, i) => s + i.quantity, 0)],
    ]

    const productRows = [
      ['#', 'Product Name', 'Category', 'Quantity', 'Unit'],
      ...items.map((item, idx) => [
        idx + 1,
        item.product?.name ?? '',
        item.product?.category?.name ?? '',
        item.quantity,
        item.product?.unit ?? '',
      ]),
    ]

    const wb = XLSX.utils.book_new()

    const wsSummary  = XLSX.utils.aoa_to_sheet(summary)
    const wsProducts = XLSX.utils.aoa_to_sheet(productRows)

    wsSummary['!cols']  = [{ wch: 16 }, { wch: 40 }]
    wsProducts['!cols'] = [{ wch: 4 }, { wch: 32 }, { wch: 20 }, { wch: 10 }, { wch: 12 }]

    XLSX.utils.book_append_sheet(wb, wsSummary,  'Order Summary')
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Products')

    XLSX.writeFile(wb, `${shortId(orderId)}.xlsx`)
  }

  return (
    <button
      onClick={handleDownload}
      className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 py-3 px-4 rounded-xl text-sm font-semibold hover:bg-gray-50 active:scale-95 transition-all"
    >
      <Download className="w-4 h-4" />
      Download Order
    </button>
  )
}
