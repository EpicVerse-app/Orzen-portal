'use client'

import { useState } from 'react'
import { FileDown } from 'lucide-react'

const LOGO_URL =
  'https://muaqpangtwibnlmtjahn.supabase.co/storage/v1/object/public/product-images/malabar%20background/5.%20Landscape%20Logo%20(1).png'

interface Item {
  id: string
  name: string
  quantity: number
  unit?: string
  category?: string
}

interface Props {
  orderNumber: string          // e.g. MGD_VM_000001 or MGD_VM_000001_ROM
  orderDate: string
  companyName: string
  branchName: string
  branchAddress?: string
  vendorName: string
  vendorGst?: string | null
  vendorAddress?: string | null
  items: Item[]
  categoryLabel?: string
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

async function loadImageAsBase64(url: string): Promise<string> {
  const parsed = new URL(url)
  if (parsed.hostname !== 'muaqpangtwibnlmtjahn.supabase.co') throw new Error('Blocked: untrusted image host')
  const res  = await fetch(parsed.href)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function generatePO(props: Props) {
  const { default: jsPDF }    = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const {
    orderNumber, orderDate, companyName, branchName, branchAddress,
    vendorName, vendorGst, vendorAddress, items, categoryLabel,
  } = props

  const doc      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW    = doc.internal.pageSize.getWidth()
  const pageH    = doc.internal.pageSize.getHeight()
  const margin   = 15
  const contentW = pageW - margin * 2
  const totalQty = items.reduce((s, i) => s + i.quantity, 0)

  // ── Logo ────────────────────────────────────────────────────────────────
  try {
    const logoB64 = await loadImageAsBase64(LOGO_URL)
    doc.addImage(logoB64, 'PNG', margin, 17, 100, 11)
  } catch {
    // silent
  }

  // ── "PURCHASE ORDER" heading ─────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(62, 0, 30)
  doc.text('PURCHASE ORDER', pageW - margin, 22, { align: 'right' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(`PO Number : ${orderNumber}`, pageW - margin, 29, { align: 'right' })
  doc.text(`Date       : ${formatDate(orderDate)}`, pageW - margin, 34, { align: 'right' })

  // ── Divider ──────────────────────────────────────────────────────────────
  doc.setDrawColor(62, 0, 30)
  doc.setLineWidth(0.5)
  doc.line(margin, 45, pageW - margin, 45)

  // ── FROM / TO / VENDOR block ─────────────────────────────────────────────
  let y = 52
  const col2 = margin + contentW / 2 + 5

  // Left — FROM (our company)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(62, 0, 30)
  doc.text('FROM', margin, y)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30)
  doc.text(companyName, margin, y + 6)

  // Right — VENDOR TO WHOM PO IS ISSUED
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(62, 0, 30)
  doc.text('VENDOR', col2, y)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30)
  doc.text(vendorName, col2, y + 6)
  if (vendorGst) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(80)
    doc.text(`GST: ${vendorGst}`, col2, y + 12)
  }
  if (vendorAddress) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(80)
    const addrLines = doc.splitTextToSize(vendorAddress, contentW / 2 - 5) as string[]
    doc.text(addrLines, col2, vendorGst ? y + 18 : y + 12)
  }

  // ── Deliver To ───────────────────────────────────────────────────────────
  y += 28
  doc.setDrawColor(220)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageW - margin, y)

  y += 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(62, 0, 30)
  doc.text('DELIVER TO', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(30)
  doc.text(branchName, margin, y + 6)
  if (branchAddress) {
    doc.setFontSize(8.5)
    doc.setTextColor(80)
    const addrLines = doc.splitTextToSize(branchAddress, contentW / 2 - 5) as string[]
    doc.text(addrLines, margin, y + 12)
  }

  // ── Category label (if split PO) ─────────────────────────────────────────
  const tableStartY = y + (branchAddress ? 22 : 14)
  if (categoryLabel) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(62, 0, 30)
    doc.text(`Category: ${categoryLabel}`, margin, tableStartY - 4)
  }

  // ── Items table ───────────────────────────────────────────────────────────
  const tableBody = items.map((item, idx) => [
    idx + 1,
    item.name,
    item.category ?? '',
    item.unit ?? '',
    item.quantity,
  ])

  autoTable(doc, {
    startY: tableStartY,
    head: [['#', 'Product Name', 'Category', 'Unit', 'Qty']],
    body: tableBody,
    headStyles: {
      fillColor:  [62, 0, 30],
      textColor:  [255, 255, 255],
      fontStyle:  'bold',
      fontSize:   9,
      halign:     'left',
    },
    bodyStyles: {
      fontSize:  9,
      textColor: [40, 40, 40],
    },
    alternateRowStyles: { fillColor: [250, 245, 248] },
    columnStyles: {
      '0': { cellWidth: 10, halign: 'center' },
      '3': { cellWidth: 16, halign: 'center' },
      '4': { cellWidth: 14, halign: 'center' },
    },
    margin: { left: margin, right: margin },
    theme: 'grid',
  })

  // ── Totals ────────────────────────────────────────────────────────────────
  const afterY = (doc as any).lastAutoTable.finalY + 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(62, 0, 30)
  doc.text(`Total Quantity: ${totalQty} item${totalQty !== 1 ? 's' : ''}`, pageW - margin, afterY, { align: 'right' })

  // ── Authorised Signature ──────────────────────────────────────────────────
  const sigY = afterY + 20
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(62, 0, 30)
  doc.text('Authorised Signature', pageW - margin - 40, sigY)
  doc.setDrawColor(62, 0, 30)
  doc.line(pageW - margin - 40, sigY + 2, pageW - margin, sigY + 2)

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setDrawColor(200)
  doc.setLineWidth(0.3)
  doc.line(margin, pageH - 14, pageW - margin, pageH - 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(150)
  doc.text(
    `System-generated Purchase Order | ${companyName}`,
    pageW / 2, pageH - 8, { align: 'center' },
  )

  const filename = `${orderNumber}_PO.pdf`
  doc.save(filename)
}

export default function GeneratePOButton(props: Props) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      await generatePO(props)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-40"
    >
      <div className="flex items-center gap-2">
        <FileDown className="w-4 h-4" />
        {loading
          ? 'Generating PO…'
          : props.categoryLabel
            ? `Download PO — ${props.categoryLabel}`
            : 'Download Purchase Order'
        }
      </div>
      {loading
        ? <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        : null
      }
    </button>
  )
}
