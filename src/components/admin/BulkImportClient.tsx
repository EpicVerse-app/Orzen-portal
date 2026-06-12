'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  Upload, Download, ChevronLeft, CheckCircle2, XCircle,
  AlertTriangle, Users, FileText, Loader2, Trash2,
} from 'lucide-react'
import { bulkCreateUsers, type BulkUserRow, type BulkUserResult } from '@/app/actions/bulkCreateUsers'

interface Branch {
  id: string
  name: string
  city?: string
  state?: string
  region?: string
}

const ROLE_LABELS: Record<string, string> = {
  store_manager: 'Store Manager',
  store_head:    'Store Head',
  super_manager: 'Regional Manager',
  vendor:        'Vendor',
}

const ROLE_COLORS: Record<string, string> = {
  store_manager: 'bg-green-100 text-green-700',
  store_head:    'bg-violet-100 text-violet-700',
  super_manager: 'bg-blue-100 text-blue-700',
  vendor:        'bg-orange-100 text-orange-700',
}

const TEMPLATE_HEADERS = 'full_name,email,password,role,branch_name,scope_state,scope_region'
const TEMPLATE_ROWS = [
  '"MG Road Store Manager","mgroad.manager@malabar.com","Pass@1234","store_manager","MG Road Store","",""',
  '"MG Road Store Head","mgroad.head@malabar.com","Pass@1234","store_head","MG Road Store","",""',
  '"Trivandrum City Centre Manager","tcc.manager@malabar.com","Pass@1234","store_manager","Trivandrum City Centre","",""',
  '"Trivandrum City Centre Head","tcc.head@malabar.com","Pass@1234","store_head","Trivandrum City Centre","",""',
  '"Kerala Regional Manager","kerala.rm@malabar.com","Pass@1234","super_manager","","Kerala","south"',
]

function parseCSV(text: string): BulkUserRow[] {
  const lines = text.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return []

  // Skip header row
  const dataLines = lines.slice(1)

  return dataLines.map(line => {
    // Handle quoted fields
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    fields.push(current.trim())

    return {
      full_name:    fields[0] || '',
      email:        fields[1] || '',
      password:     fields[2] || '',
      role:         fields[3] || '',
      branch_name:  fields[4] || '',
      scope_state:  fields[5] || '',
      scope_region: fields[6] || '',
    }
  }).filter(r => r.email || r.full_name)
}

export default function BulkImportClient({ branches }: { branches: Branch[] }) {
  const [rows, setRows]           = useState<BulkUserRow[]>([])
  const [results, setResults]     = useState<BulkUserResult[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [dragOver, setDragOver]   = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function downloadTemplate() {
    const csv = [TEMPLATE_HEADERS, ...TEMPLATE_ROWS].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = 'user_import_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a .csv file')
      return
    }
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      setRows(parsed)
      setResults(null)
    }
    reader.readAsText(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function removeRow(idx: number) {
    setRows(r => r.filter((_, i) => i !== idx))
  }

  async function handleImport() {
    if (rows.length === 0) return
    setImporting(true)
    try {
      const res = await bulkCreateUsers(rows)
      setResults(res)
    } finally {
      setImporting(false)
    }
  }

  const successCount = results?.filter(r => r.success).length ?? 0
  const failCount    = results?.filter(r => !r.success).length ?? 0

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard/admin/users"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Users
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Import Users</h1>
          <p className="text-sm text-gray-400 mt-0.5">Upload a CSV to create store managers, store heads, and regional managers at once</p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>
      </div>

      {/* CSV Format guide */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">CSV Column Guide</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { col: 'full_name',    req: true,  desc: 'User\'s full name' },
            { col: 'email',        req: true,  desc: 'Login email address' },
            { col: 'password',     req: true,  desc: 'Initial password (min 6 chars)' },
            { col: 'role',         req: true,  desc: 'store_manager / store_head / super_manager / vendor' },
            { col: 'branch_name',  req: false, desc: 'Exact branch name — required for store_manager & store_head' },
            { col: 'scope_state',  req: false, desc: 'State name — required for super_manager (e.g. Kerala)' },
            { col: 'scope_region', req: false, desc: 'Region — required for super_manager (e.g. south)' },
          ].map(({ col, req, desc }) => (
            <div key={col} className="flex items-start gap-2">
              <code className="text-[11px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono shrink-0">{col}</code>
              {req && <span className="text-[10px] text-red-500 font-semibold mt-0.5 shrink-0">required</span>}
              <span className="text-xs text-blue-600">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Available branches */}
      {branches.length > 0 && (
        <details className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-gray-700 flex items-center gap-2 list-none">
            <FileText className="w-4 h-4 text-gray-400" />
            View available branch names ({branches.length} branches)
            <span className="ml-auto text-xs text-gray-400 font-normal">click to expand</span>
          </summary>
          <div className="border-t border-gray-100 px-5 py-4 max-h-48 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              {branches.map(b => (
                <div key={b.id} className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono truncate">{b.name}</code>
                  {b.region && <span className="text-[10px] text-gray-400 capitalize shrink-0">{b.region}</span>}
                </div>
              ))}
            </div>
          </div>
        </details>
      )}

      {/* Upload zone */}
      {rows.length === 0 && !results && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl px-8 py-16 text-center cursor-pointer transition-all ${
            dragOver ? 'border-[#570439] bg-[#570439]/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700">Drop your CSV file here</p>
          <p className="text-xs text-gray-400 mt-1">or click to browse</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>
      )}

      {/* Preview table */}
      {rows.length > 0 && !results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">{rows.length} users ready to import</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setRows([]); setResults(null) }}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <Upload className="w-3.5 h-3.5" /> Replace file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch / Scope</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-300 font-mono">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {row.full_name || <span className="text-red-400 text-xs">missing</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {row.email || <span className="text-red-400 text-xs">missing</span>}
                      </td>
                      <td className="px-4 py-3">
                        {row.role ? (
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[row.role] || 'bg-gray-100 text-gray-600'}`}>
                            {ROLE_LABELS[row.role] || row.role}
                          </span>
                        ) : (
                          <span className="text-red-400 text-xs">missing</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {(row.role === 'store_manager' || row.role === 'store_head') && (
                          row.branch_name || <span className="text-red-400">missing branch</span>
                        )}
                        {row.role === 'super_manager' && (
                          <span>
                            {row.scope_state && <span className="font-medium">{row.scope_state}</span>}
                            {row.scope_region && <span className="text-gray-400 capitalize"> · {row.scope_region}</span>}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeRow(idx)}
                          className="text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Warnings */}
          {rows.some(r => !r.email || !r.full_name || !r.role) && (
            <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-700">Some rows have missing required fields. They will fail during import. Remove or fix them before proceeding.</p>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
            style={{ backgroundColor: '#570439' }}
          >
            {importing
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating {rows.length} users…</>
              : <><Users className="w-4 h-4" /> Import {rows.length} Users</>}
          </button>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-4 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0" />
              <div>
                <p className="text-2xl font-bold text-green-700">{successCount}</p>
                <p className="text-xs text-green-600 font-medium">Successfully created</p>
              </div>
            </div>
            <div className={`border rounded-2xl px-5 py-4 flex items-center gap-3 ${failCount > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
              <XCircle className={`w-8 h-8 shrink-0 ${failCount > 0 ? 'text-red-400' : 'text-gray-300'}`} />
              <div>
                <p className={`text-2xl font-bold ${failCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{failCount}</p>
                <p className={`text-xs font-medium ${failCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>Failed</p>
              </div>
            </div>
          </div>

          {/* Per-row results */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {results.map((res, idx) => (
                    <tr key={idx} className={res.success ? '' : 'bg-red-50/50'}>
                      <td className="px-4 py-3 text-xs text-gray-300 font-mono">{idx + 1}</td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{res.email}</td>
                      <td className="px-4 py-3">
                        {res.success
                          ? <span className="flex items-center gap-1 text-green-600 text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Created</span>
                          : <span className="flex items-center gap-1 text-red-500 text-xs font-semibold"><XCircle className="w-3.5 h-3.5" /> Failed</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-red-500">{res.error || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setRows([]); setResults(null) }}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Import More Users
            </button>
            <Link
              href="/dashboard/admin/users"
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white text-center transition-colors"
              style={{ backgroundColor: '#570439' }}
            >
              View All Users
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
