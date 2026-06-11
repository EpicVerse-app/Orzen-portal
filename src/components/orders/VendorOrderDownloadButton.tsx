'use client'

import { Download } from 'lucide-react'
import { useState } from 'react'

interface Item {
  quantity: number
  product: {
    name: string
    unit: string
    price?: number | null
    category?: { name: string } | null
  }
}

interface Props {
  orderId:     string
  createdAt:   string
  status:      string
  companyName: string
  branch?: {
    name?:    string
    address?: string
    city?:    string
    state?:   string
  } | null
  items: Item[]
}

const LOGO_URL =
  'https://muaqpangtwibnlmtjahn.supabase.co/storage/v1/object/public/product-images/malabar%20background/5.%20Landscape%20Logo%20(1).png'

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

async function loadImageAsBase64(url: string): Promise<string> {
  const res  = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default function VendorOrderDownloadButton({
  orderId, createdAt, status, companyName, branch, items,
}: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW    = doc.internal.pageSize.getWidth()
      const margin   = 15
      const contentW = pageW - margin * 2
      const poId     = shortId(orderId)
      const poDate   = formatDate(createdAt)
      const totalQty   = items.reduce((s, i) => s + i.quantity, 0)
      const hasPrices  = items.some(i => (i.product.price ?? 0) > 0)
      const totalPrice = items.reduce((s, i) => s + (i.product.price ?? 0) * i.quantity, 0)
      const branchAddr = [branch?.address, branch?.city, branch?.state]
        .filter(Boolean).join(', ')

      // ── Logo ─────────────────────────────────────────────────────────
      try {
        const logoB64 = await loadImageAsBase64(LOGO_URL)
        doc.addImage(logoB64, 'PNG', margin, 12, 60, 18)
      } catch {
        // logo failed silently
      }

      // ── "PURCHASE ORDER" heading ──────────────────────────────────────
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.setTextColor(62, 0, 30)        // maroon
      doc.text('PURCHASE ORDER', pageW - margin, 22, { align: 'right' })

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100)
      doc.text(`PO Number : ${poId}`, pageW - margin, 29, { align: 'right' })
      doc.text(`Date       : ${poDate}`, pageW - margin, 34, { align: 'right' })
      doc.text(`Status     : ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        pageW - margin, 39, { align: 'right' })

      // ── Divider ───────────────────────────────────────────────────────
      doc.setDrawColor(62, 0, 30)
      doc.setLineWidth(0.5)
      doc.line(margin, 45, pageW - margin, 45)

      // ── Bill From / Ship To ───────────────────────────────────────────
      let y = 52
      const colMid = margin + contentW / 2 + 5

      // Left — FROM
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(62, 0, 30)
      doc.text('FROM', margin, y)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(30, 30, 30)
      doc.text(companyName, margin, y + 6)

      // Right — SHIP TO
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(62, 0, 30)
      doc.text('SHIP TO', colMid, y)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(30, 30, 30)
      doc.text(branch?.name ?? '', colMid, y + 6)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(80, 80, 80)
      if (branchAddr) {
        const lines = doc.splitTextToSize(branchAddr, contentW / 2 - 5) as string[]
        doc.text(lines, colMid, y + 12)
      }

      // ── Items table ───────────────────────────────────────────────────
      const tableTop = y + 30

      const tableHead = hasPrices
        ? [['#', 'Product Name', 'Category', 'Unit', 'Qty', 'Unit Price', 'Total']]
        : [['#', 'Product Name', 'Category', 'Qty', 'Unit']]

      const tableBody = hasPrices
        ? items.map((item, idx) => [
            idx + 1,
            item.product?.name ?? '',
            item.product?.category?.name ?? '',
            item.product?.unit ?? '',
            item.quantity,
            `₹${(item.product?.price ?? 0).toLocaleString('en-IN')}`,
            `₹${((item.product?.price ?? 0) * item.quantity).toLocaleString('en-IN')}`,
          ])
        : items.map((item, idx) => [
            idx + 1,
            item.product?.name ?? '',
            item.product?.category?.name ?? '',
            item.quantity,
            item.product?.unit ?? '',
          ])

      const colStylesBase = hasPrices
        ? {
            0: { cellWidth: 10,  halign: 'center' as const },
            3: { cellWidth: 16,  halign: 'center' as const },
            4: { cellWidth: 14,  halign: 'center' as const },
            5: { cellWidth: 24,  halign: 'right'  as const },
            6: { cellWidth: 24,  halign: 'right'  as const },
          }
        : {
            0: { cellWidth: 10,  halign: 'center' as const },
            3: { cellWidth: 16,  halign: 'center' as const },
            4: { cellWidth: 18,  halign: 'center' as const },
          }

      autoTable(doc, {
        startY: tableTop,
        head: tableHead,
        body: tableBody,
        headStyles: {
          fillColor:  [62, 0, 30],
          textColor:  [255, 255, 255],
          fontStyle:  'bold',
          fontSize:   9,
          halign:     'left',
        },
        bodyStyles: {
          fontSize:   9,
          textColor:  [40, 40, 40],
        },
        alternateRowStyles: {
          fillColor: [250, 245, 248],
        },
        columnStyles: colStylesBase,
        margin: { left: margin, right: margin },
        theme:  'grid',
      })

      // ── Total row ─────────────────────────────────────────────────────
      const afterTable = (doc as any).lastAutoTable.finalY + 6
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(62, 0, 30)
      doc.text(`Total Quantity: ${totalQty} items`, pageW - margin, afterTable, { align: 'right' })
      if (hasPrices) {
        doc.text(`Total Amount: ₹${totalPrice.toLocaleString('en-IN')}`, pageW - margin, afterTable + 7, { align: 'right' })
      }

      // ── Footer ────────────────────────────────────────────────────────
      const footerY = doc.internal.pageSize.getHeight() - 18
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      doc.line(margin, footerY, pageW - margin, footerY)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(
        `This is a system-generated Purchase Order. | ${companyName}`,
        pageW / 2, footerY + 6, { align: 'center' },
      )

      doc.save(`${poId}_PO.pdf`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 py-3 px-4 rounded-xl text-sm font-semibold hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
    >
      <Download className="w-4 h-4" />
      {loading ? 'Generating PO…' : 'Download PO'}
    </button>
  )
}
