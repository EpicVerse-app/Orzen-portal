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

// ── THAS-style Quotation Excel ────────────────────────────────────────────────
async function generateThasExcel(
  vendor: Vendor, items: OrderItem[],
  orderNumber: string, orderDate: string,
  branchName: string, companyName: string, categoryLabel: string,
) {
  const exceljs = await import('exceljs')
  const ExcelJS = (exceljs as any).default ?? exceljs
  const wb      = new ExcelJS.Workbook() as import('exceljs').Workbook
  const ws      = wb.addWorksheet('Sheet1')
  const COLS    = 7

  const ref = refNo(orderNumber, categoryLabel)
  const thinBorder = (color = 'FFCCCCCC') => ({
    top:    { style: 'thin' as const, color: { argb: color } },
    left:   { style: 'thin' as const, color: { argb: color } },
    bottom: { style: 'thin' as const, color: { argb: color } },
    right:  { style: 'thin' as const, color: { argb: color } },
  })

  // Column widths
  ws.columns = [
    { width: 10 },  // A SL NO
    { width: 14 },  // B IMAGES
    { width: 38 },  // C ITEM DESCRIPTION
    { width: 16 },  // D SIZE (CM)
    { width: 9  },  // E QTY
    { width: 15 },  // F RATE/PCS
    { width: 15 },  // G TOTAL
  ]

  function mergedCell(row: number, col: number, endCol: number, value: string | number | null) {
    ws.mergeCells(row, col, row, endCol)
    const cell = ws.getCell(row, col)
    cell.value = value
    return cell
  }

  // ── Row 1: Vendor name ────────────────────────────────────────────────────
  ws.getRow(1).height = 22
  const r1 = mergedCell(1, 1, COLS, vendor.name.toUpperCase())
  r1.font      = { bold: true, size: 14, name: 'Arial' }
  r1.alignment = { horizontal: 'center', vertical: 'middle' }
  r1.border    = { bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } } }

  // ── Row 2: Address ────────────────────────────────────────────────────────
  ws.getRow(2).height = 14
  const r2 = mergedCell(2, 1, COLS, vendor.address ?? '')
  r2.font      = { size: 9, name: 'Arial' }
  r2.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }

  // ── Row 3: GSTIN ─────────────────────────────────────────────────────────
  ws.getRow(3).height = 13
  const r3 = mergedCell(3, 1, COLS, vendor.gst_number ? `GSTIN : ${vendor.gst_number}` : '')
  r3.font      = { size: 9, name: 'Arial' }
  r3.alignment = { horizontal: 'center', vertical: 'middle' }

  // ── Row 4: spacer ────────────────────────────────────────────────────────
  ws.getRow(4).height = 5

  // ── Row 5: QUOTATION bar ─────────────────────────────────────────────────
  ws.getRow(5).height = 18
  const r5 = mergedCell(5, 1, COLS, 'QUOTATION')
  r5.font      = { bold: true, size: 12, name: 'Arial', color: { argb: 'FFFFFFFF' } }
  r5.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E1E1E' } }
  r5.alignment = { horizontal: 'center', vertical: 'middle' }

  // ── Rows 6–7: meta (issued to / quotation ref) ───────────────────────────
  ws.getRow(6).height = 14
  ws.getRow(7).height = 14

  const labelFont = { size: 9, name: 'Arial' } as const
  const valFont   = { size: 9, name: 'Arial', bold: true } as const

  // Row 6
  const r6l = mergedCell(6, 1, 3, 'ISSUED TO :')
  r6l.font = labelFont

  const r6m = mergedCell(6, 4, 5, 'QUOTATION DATE:')
  r6m.font = labelFont

  const r6v = mergedCell(6, 6, COLS, fmtDate(orderDate))
  r6v.font = valFont

  // Row 7
  const r7l = mergedCell(7, 1, 3, `${companyName} — ${branchName}`)
  r7l.font      = valFont
  r7l.alignment = { wrapText: true, vertical: 'middle' }

  const r7m = mergedCell(7, 4, 5, 'QUOTATION NO:')
  r7m.font = labelFont

  const r7v = mergedCell(7, 6, COLS, ref)
  r7v.font = valFont

  // ── Row 8: spacer ────────────────────────────────────────────────────────
  ws.getRow(8).height = 6

  // ── Rows 9–10: order date / order through ────────────────────────────────
  ws.getRow(9).height  = 14
  ws.getRow(10).height = 14

  const r9m = mergedCell(9, 4, 5, 'Order date :')
  r9m.font = labelFont
  const r9v = mergedCell(9, 6, COLS, fmtDate(orderDate))
  r9v.font = valFont

  const r10m = mergedCell(10, 4, 5, 'Order through :')
  r10m.font = labelFont
  const r10v = mergedCell(10, 6, COLS, 'MAIL')
  r10v.font = valFont

  // ── Row 11: spacer ───────────────────────────────────────────────────────
  ws.getRow(11).height = 6

  // ── Row 12: table header ─────────────────────────────────────────────────
  ws.getRow(12).height = 18
  const heads = ['SL NO', 'IMAGES', 'ITEM DESCRIPTION', 'SIZE (CM)', 'QTY', 'RATE/PCS', 'TOTAL']
  heads.forEach((h, i) => {
    const cell = ws.getCell(12, i + 1)
    cell.value     = h
    cell.font      = { bold: true, size: 9, name: 'Arial', color: { argb: 'FFFFFFFF' } }
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E1E1E' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border    = thinBorder('FF444444')
  })

  // ── Item rows ─────────────────────────────────────────────────────────────
  let rowIdx = 13
  items.forEach((item, idx) => {
    ws.getRow(rowIdx).height = 22
    const values = [idx + 1, '', item.name, item.unit ?? '', item.quantity, '', '']
    values.forEach((v, i) => {
      const cell = ws.getCell(rowIdx, i + 1)
      cell.value     = v
      cell.font      = { size: 9, name: 'Arial' }
      cell.alignment = {
        horizontal: (i === 0 || i === 4) ? 'center' : 'left',
        vertical: 'middle',
        wrapText: true,
      }
      cell.border = thinBorder()
    })
    rowIdx++
  })

  // ── Spacer row ────────────────────────────────────────────────────────────
  ws.getRow(rowIdx).height = 8
  rowIdx++

  // ── Bank details + totals ─────────────────────────────────────────────────
  const bankLines: [string, string][] = []
  if (vendor.bank_name)    bankLines.push([`Bank Details : ${vendor.bank_name}`, 'TOTAL :'])
  if (vendor.bank_account) bankLines.push([`A/C No : ${vendor.bank_account}`,    'GST % :'])
  if (vendor.bank_ifsc)    bankLines.push([`IFSC : ${vendor.bank_ifsc}`,         'GRAND TOTAL :'])

  if (bankLines.length === 0) {
    bankLines.push(['', 'TOTAL :'], ['', 'GST % :'], ['', 'GRAND TOTAL :'])
  } else {
    while (bankLines.length < 3) bankLines.push(['', ''])
  }

  bankLines.forEach(([bankText, totLabel], i) => {
    ws.getRow(rowIdx).height = 16
    const isGrand = totLabel === 'GRAND TOTAL :'

    if (bankText) {
      const bc = mergedCell(rowIdx, 1, 3, bankText)
      bc.font = { size: 9, name: 'Arial', bold: i === 0 }
    }
    if (totLabel) {
      const tc = mergedCell(rowIdx, 4, 5, totLabel)
      tc.font = { size: 9, name: 'Arial', bold: true }
      const vc = mergedCell(rowIdx, 6, COLS, '')
      vc.font   = { size: 9, name: 'Arial', bold: isGrand }
      vc.border = thinBorder()
    }
    rowIdx++
  })

  // ── Spacer ────────────────────────────────────────────────────────────────
  ws.getRow(rowIdx).height = 8
  rowIdx++

  // ── Terms & Conditions ────────────────────────────────────────────────────
  if (vendor.terms) {
    ws.getRow(rowIdx).height = 14
    const tc = mergedCell(rowIdx, 1, COLS, 'TERMS & CONDITIONS :')
    tc.font = { bold: true, size: 9, name: 'Arial' }
    rowIdx++

    vendor.terms.split('\n').filter(Boolean).forEach((line, i) => {
      ws.getRow(rowIdx).height = 14
      ws.getCell(rowIdx, 1).value = i + 1
      ws.getCell(rowIdx, 1).font  = { size: 9, name: 'Arial' }
      const lc = mergedCell(rowIdx, 2, COLS, line.trim())
      lc.font      = { size: 9, name: 'Arial' }
      lc.alignment = { wrapText: true, vertical: 'middle' }
      rowIdx++
    })

    ws.getRow(rowIdx).height = 8
    rowIdx++
  }

  // ── Prepared By ───────────────────────────────────────────────────────────
  ws.getRow(rowIdx).height = 14
  ws.getCell(rowIdx, 2).value = 'Prepared By :'
  ws.getCell(rowIdx, 2).font  = { bold: true, size: 9, name: 'Arial' }
  ws.getCell(rowIdx, 3).value = ''

  // ── Download ──────────────────────────────────────────────────────────────
  const buffer = await (wb.xlsx as any).writeBuffer() as ArrayBuffer
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = `${ref}_OrderSheet.xlsx`
  a.click()
  URL.revokeObjectURL(url)
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
        await generateThasExcel(vendor, items, orderNumber, orderDate, branchName, companyName, categoryLabel)
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
