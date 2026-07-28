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

function fmtDate(d: string) {
  const dt = new Date(d)
  const dd = String(dt.getDate()).padStart(2, '0')
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${dt.getFullYear()}`
}

function refNo(orderNumber: string, categoryLabel: string) {
  return orderNumber + (categoryLabel ? `_${categoryLabel.toUpperCase().replace(/\s+/g, '_')}` : '')
}

// ── Padmakala-style Estimate PDF ──────────────────────────────────────────────
async function generatePadmakalaEstimate(
  vendor: Vendor, items: OrderItem[],
  orderNumber: string, orderDate: string,
  branchName: string, companyName: string, categoryLabel: string,
) {
  const { default: jsPDF }     = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW    = doc.internal.pageSize.getWidth()
  const pageH    = doc.internal.pageSize.getHeight()
  const margin   = 14
  const contentW = pageW - margin * 2
  const halfW    = contentW / 2 - 3
  const col2     = margin + contentW / 2 + 3
  const ref      = refNo(orderNumber, categoryLabel)

  // ── Vendor header — top-left ──────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(30, 30, 30)
  doc.text(vendor.name, margin, 13)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(80, 80, 80)
  let hy = 19
  if (vendor.address) {
    const al = doc.splitTextToSize(vendor.address, halfW) as string[]
    doc.text(al, margin, hy)
    hy += al.length * 4
  }
  if (vendor.gst_number) {
    doc.text(`GSTIN ${vendor.gst_number}`, margin, hy)
    hy += 4.5
  }

  // ── "Estimate" title — top-right, teal-blue ───────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(26, 148, 210)
  doc.text('Estimate', pageW - margin, 20, { align: 'right' })

  // ── Top separator ─────────────────────────────────────────────────────────
  const sep1 = Math.max(hy + 3, 32)
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.35)
  doc.line(margin, sep1, pageW - margin, sep1)

  // ── Estimate meta ─────────────────────────────────────────────────────────
  let y = sep1 + 6
  const metaLabelX = margin
  const metaValX   = margin + 26

  doc.setFontSize(8.5)
  ;[
    ['Estimate#',     ref],
    ['Estimate Date', fmtDate(orderDate)],
    ['Reference#',    'Purchase Order'],
  ].forEach(([lbl, val], i) => {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(50, 50, 50)
    doc.text(lbl, metaLabelX, y + i * 5.5)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60)
    doc.text(`: ${val}`, metaValX, y + i * 5.5)
  })

  doc.setFont('helvetica', 'bold'); doc.setTextColor(50, 50, 50)
  doc.text('Place Of Supply', col2, y)
  doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60)
  doc.text(`: ${branchName}`, col2 + 32, y)

  // ── Separator ─────────────────────────────────────────────────────────────
  y += 18
  doc.setDrawColor(200)
  doc.line(margin, y, pageW - margin, y)

  // ── Bill To / Ship To ─────────────────────────────────────────────────────
  y += 5
  doc.setFillColor(245, 245, 245)
  doc.rect(margin, y - 3, contentW, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(50, 50, 50)
  doc.text('Bill To', margin + 2, y + 1.5)
  doc.text('Ship To', col2, y + 1.5)

  // vertical divider
  doc.setDrawColor(200)
  doc.setLineWidth(0.3)
  doc.line(col2 - 3, y - 3, col2 - 3, y + 28)

  y += 8
  const addr = companyName
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(20, 20, 20)
  const nameLines = doc.splitTextToSize(addr, halfW) as string[]
  doc.text(nameLines, margin + 2, y)
  doc.text(nameLines, col2, y)

  y += nameLines.length * 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(70, 70, 70)
  doc.text(branchName, margin + 2, y)
  doc.text(branchName, col2, y)

  y += 14
  doc.setDrawColor(200)
  doc.line(margin, y, pageW - margin, y)

  // ── Items table ───────────────────────────────────────────────────────────
  const tableBody = items.map((item, idx) => [
    idx + 1,
    item.name + (item.category ? `\n(${item.category})` : ''),
    '',
    item.quantity,
    '',
    '',
    '',
    '',
  ])

  autoTable(doc, {
    startY: y + 4,
    head: [['No', 'Item & Description', 'HSN/SAC', 'Qty', 'Rate', 'IGST\n%', 'Amt', 'Amount']],
    body: tableBody,
    headStyles: {
      fillColor:   [50, 50, 50],
      textColor:   [255, 255, 255],
      fontStyle:   'bold',
      fontSize:    8,
      halign:      'center',
      cellPadding: 2,
    },
    bodyStyles: { fontSize: 8.5, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [245, 250, 255] },
    columnStyles: {
      '0': { cellWidth: 8,  halign: 'center' },
      '2': { cellWidth: 18, halign: 'center' },
      '3': { cellWidth: 12, halign: 'center' },
      '4': { cellWidth: 22, halign: 'right'  },
      '5': { cellWidth: 12, halign: 'center' },
      '6': { cellWidth: 18, halign: 'right'  },
      '7': { cellWidth: 22, halign: 'right'  },
    },
    margin: { left: margin, right: margin },
    theme: 'grid',
  })

  // ── Totals block ──────────────────────────────────────────────────────────
  const afterY = (doc as any).lastAutoTable.finalY + 5
  const totW   = 68
  const totX   = pageW - margin - totW

  const totRows: [string, boolean][] = [
    ['Sub Total',    false],
    ['IGST18 (18%)', false],
    ['Total',        true ],
  ]
  let ty = afterY
  totRows.forEach(([label, isBold]) => {
    if (isBold) {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(20, 20, 20)
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
    }
    doc.setFontSize(8.5)
    doc.text(label, totX + 4, ty + 4)
    doc.setDrawColor(210)
    doc.line(totX, ty + 7, totX + totW, ty + 7)
    ty += 8
  })

  // ── Total in Words + Notes ────────────────────────────────────────────────
  const noteY = afterY
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(50, 50, 50)
  doc.text('Total In Words', margin, noteY + 5)
  doc.setFont('helvetica', 'bolditalic')
  doc.setFontSize(8)
  doc.setTextColor(40, 40, 40)
  doc.text('(To be filled by vendor)', margin, noteY + 11)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(50, 50, 50)
  doc.text('Notes', margin, noteY + 20)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(110, 110, 110)
  doc.text('Looking forward for your business.', margin, noteY + 26)

  // ── Authorized Signature ──────────────────────────────────────────────────
  const sigY = ty + 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(50, 50, 50)
  doc.text('Authorized Signature', pageW - margin - 46, sigY)
  doc.setDrawColor(100)
  doc.setLineWidth(0.4)
  doc.line(pageW - margin - 46, sigY + 2, pageW - margin, sigY + 2)

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setDrawColor(200)
  doc.setLineWidth(0.3)
  doc.line(margin, pageH - 12, pageW - margin, pageH - 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(160)
  doc.text('This is a computer-generated estimate.', pageW / 2, pageH - 7, { align: 'center' })

  doc.save(`${ref}_OrderSheet.pdf`)
}

// ── THAS-style Quotation PDF ──────────────────────────────────────────────────
async function generateThasQuotation(
  vendor: Vendor, items: OrderItem[],
  orderNumber: string, orderDate: string,
  branchName: string, companyName: string, categoryLabel: string,
) {
  const { default: jsPDF }     = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW    = doc.internal.pageSize.getWidth()
  const pageH    = doc.internal.pageSize.getHeight()
  const margin   = 14
  const contentW = pageW - margin * 2
  const ref      = refNo(orderNumber, categoryLabel)

  // ── Vendor header — centered ──────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(20, 20, 20)
  doc.text(vendor.name.toUpperCase(), pageW / 2, 13, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(70, 70, 70)
  let hy = 19
  if (vendor.address) {
    const al = doc.splitTextToSize(vendor.address, contentW) as string[]
    doc.text(al, pageW / 2, hy, { align: 'center' })
    hy += al.length * 4
  }
  if (vendor.gst_number) {
    doc.text(`GSTIN : ${vendor.gst_number}`, pageW / 2, hy, { align: 'center' })
    hy += 5
  }

  // ── QUOTATION bar ─────────────────────────────────────────────────────────
  const barY = hy + 2
  doc.setFillColor(30, 30, 30)
  doc.rect(margin, barY, contentW, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text('QUOTATION', pageW / 2, barY + 5.5, { align: 'center' })

  // ── Meta ──────────────────────────────────────────────────────────────────
  let y = barY + 14
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(40, 40, 40)

  doc.setFont('helvetica', 'bold')
  doc.text('ISSUED TO :', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`${companyName} — ${branchName}`, margin + 26, y)

  doc.setFont('helvetica', 'bold')
  doc.text('QUOTATION DATE:', pageW - margin - 50, y)
  doc.setFont('helvetica', 'normal')
  doc.text(fmtDate(orderDate), pageW - margin, y, { align: 'right' })

  y += 6
  doc.setFont('helvetica', 'bold')
  doc.text('QUOTATION NO:', pageW - margin - 50, y)
  doc.setFont('helvetica', 'normal')
  doc.text(ref, pageW - margin, y, { align: 'right' })

  y += 6
  doc.setFont('helvetica', 'bold')
  doc.text('Order date :', pageW - margin - 50, y)
  doc.setFont('helvetica', 'normal')
  doc.text(fmtDate(orderDate), pageW - margin, y, { align: 'right' })

  y += 6
  doc.setFont('helvetica', 'bold')
  doc.text('Order through :', pageW - margin - 50, y)
  doc.setFont('helvetica', 'normal')
  doc.text('MAIL', pageW - margin, y, { align: 'right' })

  // ── Items table ───────────────────────────────────────────────────────────
  const tableBody = items.map((item, idx) => [
    idx + 1,
    item.name + (item.category ? `\n(${item.category})` : ''),
    item.unit ?? '',
    item.quantity,
    '',   // RATE/PCS — vendor fills
    '',   // TOTAL — vendor fills
  ])

  autoTable(doc, {
    startY: y + 6,
    head: [['SL NO', 'ITEM DESCRIPTION', 'SIZE (CM)', 'QTY', 'RATE/PCS', 'TOTAL']],
    body: tableBody,
    headStyles: {
      fillColor:   [30, 30, 30],
      textColor:   [255, 255, 255],
      fontStyle:   'bold',
      fontSize:    8.5,
      halign:      'center',
      cellPadding: 2.5,
    },
    bodyStyles: { fontSize: 9, textColor: [40, 40, 40], minCellHeight: 10 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      '0': { cellWidth: 14, halign: 'center' },
      '2': { cellWidth: 22, halign: 'center' },
      '3': { cellWidth: 12, halign: 'center' },
      '4': { cellWidth: 26, halign: 'right'  },
      '5': { cellWidth: 26, halign: 'right'  },
    },
    margin: { left: margin, right: margin },
    theme: 'grid',
  })

  // ── Bank details + totals ─────────────────────────────────────────────────
  const afterY  = (doc as any).lastAutoTable.finalY + 6
  const totX    = pageW - margin - 68
  const halfCol = margin + contentW / 2

  const totRows: [string, boolean][] = [
    ['Total :',       false],
    ['GST % :',       false],
    ['Grand Total :', true ],
  ]
  let ty = afterY
  totRows.forEach(([label, isBold]) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(isBold ? 20 : 60, isBold ? 20 : 60, isBold ? 20 : 60)
    doc.text(label, totX + 2, ty + 4)
    doc.setDrawColor(210)
    doc.line(totX, ty + 7, pageW - margin, ty + 7)
    ty += 8
  })

  if (vendor.bank_name || vendor.bank_account || vendor.bank_ifsc) {
    let by = afterY
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(30, 30, 30)
    if (vendor.bank_name)    { doc.text(`Bank Details : ${vendor.bank_name}`, margin, by + 4);   by += 8 }
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    if (vendor.bank_account) { doc.text(`A/C No : ${vendor.bank_account}`, margin, by + 4); by += 8 }
    if (vendor.bank_ifsc)    { doc.text(`IFSC : ${vendor.bank_ifsc}`,      margin, by + 4) }
  }

  // ── Terms & Conditions ────────────────────────────────────────────────────
  if (vendor.terms) {
    const termsY = ty + 6
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(30)
    doc.text('TERMS & CONDITIONS :', margin, termsY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(70)
    const lines = doc.splitTextToSize(vendor.terms, contentW) as string[]
    doc.text(lines, margin, termsY + 6)
    ty = termsY + 6 + lines.length * 4
  }

  // ── Prepared By ───────────────────────────────────────────────────────────
  const prepY = ty + 10
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(30)
  doc.text('Prepared By :', margin, prepY)
  doc.setDrawColor(150)
  doc.line(margin + 28, prepY + 1, margin + 70, prepY + 1)

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setDrawColor(200)
  doc.setLineWidth(0.3)
  doc.line(margin, pageH - 12, pageW - margin, pageH - 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(160)
  doc.text('This is a computer-generated quotation request.', pageW / 2, pageH - 7, { align: 'center' })

  doc.save(`${ref}_OrderSheet.pdf`)
}

// ── Button ────────────────────────────────────────────────────────────────────
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
