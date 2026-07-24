'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'

interface OrderItem {
  id: string
  name: string
  quantity: number
  unit?: string
  category?: string
}

interface Vendor {
  id: string
  name: string
  template_type: string
  gst_number: string | null
  address: string | null
  bank_name: string | null
  bank_account: string | null
  bank_ifsc: string | null
  terms: string | null
}

interface Props {
  vendor: Vendor
  items: OrderItem[]
  orderNumber: string
  orderDate: string
  branchName: string
  companyName: string
  categoryLabel?: string
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

async function generatePadmakalaEstimate(
  vendor: Vendor,
  items: OrderItem[],
  orderNumber: string,
  orderDate: string,
  branchName: string,
  companyName: string,
  categoryLabel: string,
) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW  = doc.internal.pageSize.getWidth()
  const pageH  = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentW = pageW - margin * 2

  // ── Header ────────────────────────────────────────────────────────────
  doc.setFillColor(87, 4, 57)
  doc.rect(0, 0, pageW, 28, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text(vendor.name.toUpperCase(), margin, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(220, 180, 210)
  if (vendor.address) doc.text(vendor.address, margin, 18)
  if (vendor.gst_number) doc.text(`GST: ${vendor.gst_number}`, margin, 23)

  // ESTIMATE label
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text('ESTIMATE', pageW - margin, 14, { align: 'right' })

  // ── Estimate meta ─────────────────────────────────────────────────────
  let y = 35
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(62, 0, 30)
  doc.text(`Estimate No : ${orderNumber}${categoryLabel ? `_${categoryLabel}` : ''}`, margin, y)
  doc.text(`Date        : ${formatDate(orderDate)}`, margin, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  doc.text(`To: ${companyName}`, pageW - margin, y, { align: 'right' })
  doc.text(`Branch: ${branchName}`, pageW - margin, y + 6, { align: 'right' })

  // ── Divider ───────────────────────────────────────────────────────────
  y += 14
  doc.setDrawColor(62, 0, 30)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageW - margin, y)

  // ── Items table ───────────────────────────────────────────────────────
  const tableBody = items.map((item, idx) => [
    idx + 1,
    item.name + (item.category ? `\n(${item.category})` : ''),
    '',           // HSN/SAC — blank
    item.quantity,
    '',           // Rate — blank
    '',           // IGST 18% — blank
    '',           // Amount — blank
  ])

  autoTable(doc, {
    startY: y + 4,
    head: [['No', 'Item & Description', 'HSN/SAC', 'Qty', 'Rate', 'IGST 18%', 'Amount']],
    body: tableBody,
    headStyles: {
      fillColor:  [87, 4, 57],
      textColor:  [255, 255, 255],
      fontStyle:  'bold',
      fontSize:   8.5,
      halign:     'center',
    },
    bodyStyles: {
      fontSize:   9,
      textColor:  [40, 40, 40],
    },
    alternateRowStyles: { fillColor: [252, 246, 250] },
    columnStyles: {
      '0': { cellWidth: 10, halign: 'center' },
      '2': { cellWidth: 20, halign: 'center' },
      '3': { cellWidth: 14, halign: 'center' },
      '4': { cellWidth: 22, halign: 'right' },
      '5': { cellWidth: 22, halign: 'right' },
      '6': { cellWidth: 28, halign: 'right' },
    },
    margin: { left: margin, right: margin },
    theme: 'grid',
  })

  // ── Totals block ──────────────────────────────────────────────────────
  const afterY = (doc as any).lastAutoTable.finalY + 4
  const totalsX = pageW - margin - 70
  const totalsW = 70

  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)

  const rows = [
    ['Sub Total',   ''],
    ['IGST 18%',    ''],
    ['Grand Total', ''],
  ]
  let ty = afterY
  rows.forEach(([label, val], i) => {
    const isLast = i === rows.length - 1
    if (isLast) {
      doc.setFillColor(87, 4, 57)
      doc.rect(totalsX, ty - 4, totalsW, 8, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
    }
    doc.setFontSize(9)
    doc.text(label, totalsX + 4, ty + 1)
    doc.text(val || '', totalsX + totalsW - 4, ty + 1, { align: 'right' })
    if (!isLast) {
      doc.setDrawColor(220, 220, 220)
      doc.line(totalsX, ty + 4, totalsX + totalsW, ty + 4)
    }
    ty += 8
  })

  // ── Notes & Signature ─────────────────────────────────────────────────
  const sigY = Math.max(ty + 10, afterY + 30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(62, 0, 30)
  doc.text('Notes:', margin, sigY)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120)
  doc.text('_____________________________________________', margin, sigY + 6)
  doc.text('_____________________________________________', margin, sigY + 12)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(62, 0, 30)
  doc.text('Authorized Signature', pageW - margin - 40, sigY + 20)
  doc.setDrawColor(62, 0, 30)
  doc.line(pageW - margin - 40, sigY + 22, pageW - margin, sigY + 22)

  // ── Footer ────────────────────────────────────────────────────────────
  doc.setDrawColor(200)
  doc.setLineWidth(0.3)
  doc.line(margin, pageH - 14, pageW - margin, pageH - 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(150)
  doc.text('This is a computer-generated estimate.', pageW / 2, pageH - 8, { align: 'center' })

  const filename = `${orderNumber}${categoryLabel ? `_${categoryLabel}` : ''}_OrderSheet.pdf`
  doc.save(filename)
}

async function generateThasQuotation(
  vendor: Vendor,
  items: OrderItem[],
  orderNumber: string,
  orderDate: string,
  branchName: string,
  companyName: string,
  categoryLabel: string,
) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW  = doc.internal.pageSize.getWidth()
  const pageH  = doc.internal.pageSize.getHeight()
  const margin = 14

  // ── Header ────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(30, 30, 30)
  doc.text(vendor.name.toUpperCase(), pageW / 2, 14, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(80)
  if (vendor.address) doc.text(vendor.address, pageW / 2, 20, { align: 'center' })
  if (vendor.gst_number) doc.text(`GST No: ${vendor.gst_number}`, pageW / 2, 26, { align: 'center' })

  // QUOTATION label
  doc.setFillColor(30, 30, 30)
  doc.rect(margin, 32, pageW - margin * 2, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text('QUOTATION', pageW / 2, 37.5, { align: 'center' })

  // ── Meta ──────────────────────────────────────────────────────────────
  let y = 46
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(40)
  doc.text(`Ref No: ${orderNumber}${categoryLabel ? `_${categoryLabel}` : ''}`, margin, y)
  doc.text(`Date: ${formatDate(orderDate)}`, pageW - margin, y, { align: 'right' })
  y += 6
  doc.text(`To: ${companyName} — ${branchName}`, margin, y)

  // ── Items table ───────────────────────────────────────────────────────
  const tableBody = items.map((item, idx) => [
    idx + 1,
    item.name,
    '',           // Size (cm) — blank
    item.quantity,
    '',           // Rate/pcs — blank
    '',           // Total — blank
  ])

  autoTable(doc, {
    startY: y + 6,
    head: [['SL NO', 'ITEM DESCRIPTION', 'SIZE (CM)', 'QTY', 'RATE/PCS', 'TOTAL']],
    body: tableBody,
    headStyles: {
      fillColor:  [30, 30, 30],
      textColor:  [255, 255, 255],
      fontStyle:  'bold',
      fontSize:   8.5,
      halign:     'center',
    },
    bodyStyles: {
      fontSize:   9,
      textColor:  [40, 40, 40],
      minCellHeight: 10,
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      '0': { cellWidth: 14, halign: 'center' },
      '2': { cellWidth: 24, halign: 'center' },
      '3': { cellWidth: 14, halign: 'center' },
      '4': { cellWidth: 28, halign: 'right' },
      '5': { cellWidth: 28, halign: 'right' },
    },
    margin: { left: margin, right: margin },
    theme: 'grid',
  })

  // ── Totals ────────────────────────────────────────────────────────────
  const afterY = (doc as any).lastAutoTable.finalY + 4
  const totalsX = pageW - margin - 70

  const totRows = [
    ['Total',       ''],
    ['GST 5%',      ''],
    ['Grand Total', ''],
  ]
  let ty = afterY
  totRows.forEach(([label, val], i) => {
    const isLast = i === totRows.length - 1
    if (isLast) {
      doc.setFillColor(30, 30, 30)
      doc.rect(totalsX, ty - 4, 70, 8, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
    } else {
      doc.setFont(i === 0 ? 'helvetica' : 'helvetica', i === 0 ? 'normal' : 'normal')
      doc.setTextColor(40, 40, 40)
    }
    doc.setFontSize(9)
    doc.text(label, totalsX + 4, ty + 1)
    doc.text(val || '', totalsX + 66, ty + 1, { align: 'right' })
    if (!isLast) {
      doc.setDrawColor(200)
      doc.line(totalsX, ty + 4, totalsX + 70, ty + 4)
    }
    ty += 8
  })

  // ── Bank details ──────────────────────────────────────────────────────
  const bankY = ty + 6
  if (vendor.bank_account || vendor.bank_ifsc || vendor.bank_name) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(30)
    doc.text('Bank Details:', margin, bankY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60)
    let by = bankY + 6
    if (vendor.bank_name)    { doc.text(`Bank: ${vendor.bank_name}`, margin, by); by += 5 }
    if (vendor.bank_account) { doc.text(`A/C No: ${vendor.bank_account}`, margin, by); by += 5 }
    if (vendor.bank_ifsc)    { doc.text(`IFSC: ${vendor.bank_ifsc}`, margin, by) }
  }

  // ── Terms ─────────────────────────────────────────────────────────────
  if (vendor.terms) {
    const termsY = bankY
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(30)
    doc.text('Terms & Conditions:', pageW / 2 + 5, termsY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(80)
    const lines = doc.splitTextToSize(vendor.terms, pageW / 2 - margin - 5) as string[]
    doc.text(lines, pageW / 2 + 5, termsY + 6)
  }

  // ── Footer ────────────────────────────────────────────────────────────
  doc.setDrawColor(200)
  doc.setLineWidth(0.3)
  doc.line(margin, pageH - 14, pageW - margin, pageH - 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(150)
  doc.text('This is a computer-generated quotation request.', pageW / 2, pageH - 8, { align: 'center' })

  const filename = `${orderNumber}${categoryLabel ? `_${categoryLabel}` : ''}_OrderSheet.pdf`
  doc.save(filename)
}

export default function GenerateOrderSheetButton({
  vendor, items, orderNumber, orderDate, branchName, companyName, categoryLabel = '',
}: Props) {
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    try {
      if (vendor.template_type === 'thas_quotation') {
        await generateThasQuotation(vendor, items, orderNumber, orderDate, branchName, companyName, categoryLabel)
      } else {
        await generatePadmakalaEstimate(vendor, items, orderNumber, orderDate, branchName, companyName, categoryLabel)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-40"
    >
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4" />
        {loading ? 'Generating…' : `Order Sheet — ${vendor.name.split(' ')[0]}`}
      </div>
      {loading && <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />}
    </button>
  )
}
