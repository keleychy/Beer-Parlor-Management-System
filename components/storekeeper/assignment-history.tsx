"use client"

import { useEffect, useState } from "react"
import { fetchAssignments, removeAssignmentRemote, fetchAttendants } from "@/lib/api"
import type { Assignment, User } from "@/lib/types"
import { formatNaira } from "@/lib/currency"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Period = 'all' | 'today' | '7' | '30' | 'custom'

export default function AssignmentHistory() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [attendants, setAttendants] = useState<User[]>([])
  const [selectedAttendantId, setSelectedAttendantId] = useState<string | null>(null)
  const [period, setPeriod] = useState<Period>('all')
  const [customStart, setCustomStart] = useState<string>('')
  const [customEnd, setCustomEnd] = useState<string>('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const a = await fetchAssignments()
      if (!mounted) return
      setAssignments(a)
      const at = await fetchAttendants()
      if (!mounted) return
      setAttendants(at)
    })()
    return () => { mounted = false }
  }, [])

  const handleRemove = async (id: string) => {
    if (!id) return
    await removeAssignmentRemote(id)
    // refresh local list
    const a = await fetchAssignments()
    setAssignments(a)
  }

  const clearFilters = () => {
    setSelectedAttendantId(null)
    setPeriod('all')
    setCustomStart('')
    setCustomEnd('')
  }

  const getRange = () => {
    const now = new Date()
    if (period === 'all') return null
    if (period === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      return { start, end }
    }
    if (period === '7') {
      const end = new Date()
      const start = new Date()
      start.setDate(end.getDate() - 7)
      return { start, end }
    }
    if (period === '30') {
      const end = new Date()
      const start = new Date()
      start.setDate(end.getDate() - 30)
      return { start, end }
    }
    if (period === 'custom' && customStart && customEnd) {
      const start = new Date(customStart)
      const end = new Date(customEnd)
      // include end of day
      end.setHours(23,59,59,999)
      return { start, end }
    }
    return null
  }

  const range = getRange()
  const filtered = assignments
    .filter((a) => (selectedAttendantId ? a.attendantId === selectedAttendantId : true))
    .filter((a) => {
      if (!range) return true;
      const d = new Date(a.assignedAt)
      return d >= range.start && d <= range.end
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignment History</CardTitle>
        <CardDescription>View all product assignments to attendants</CardDescription>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <p className="text-center text-secondary py-8">No assignments yet</p>
        ) : (
          <>
            {/* Filters: attendants list and period selector */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  className={`px-3 py-1 rounded ${!selectedAttendantId ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'}`}
                  onClick={() => setSelectedAttendantId(null)}
                >
                  All attendants
                </button>
                {attendants.map((a) => (
                  <button
                    key={a.id}
                    className={`px-3 py-1 rounded ${selectedAttendantId === a.id ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'}`}
                    onClick={() => setSelectedAttendantId(a.id)}
                  >
                    {a.name}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <select 
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as any)}
                  className="px-2 py-1 border rounded"
                  title="Filter by time period"
                  aria-label="Filter by time period"
                >
                  <option value="all">All</option>
                  <option value="today">Today</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="custom">Custom</option>
                </select>
                {period === 'custom' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="px-2 py-1 border rounded"
                      title="Start date"
                      aria-label="Start date"
                    />
                    <span className="text-sm">to</span>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="px-2 py-1 border rounded"
                      title="End date"
                      aria-label="End date"
                    />
                  </div>
                )}
                <button className="px-2 py-1 border rounded" onClick={clearFilters}>Clear</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {filtered.length === 0 ? (
                <p className="text-center text-secondary py-8">
                  {assignments.length > 0
                    ? "No results for these filters"
                    : "No assignments yet"}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Attendant</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.productName}</TableCell>
                    <TableCell>{assignment.attendantName}</TableCell>
                    <TableCell>
                      {assignment.assignmentType === "crates"
                        ? `${(assignment.quantityAssigned / (assignment.quantityPerCrate || 1)).toFixed(0)} crates`
                        : `${assignment.quantityAssigned} bottles`}
                    </TableCell>
                    <TableCell className="capitalize">{assignment.assignmentType}</TableCell>
                    <TableCell>
                      {formatNaira(
                        (assignment.quantityAssigned / (assignment.quantityPerCrate || 1)) *
                          (assignment.quantityPerCrate || 1) *
                          500
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-secondary">
                      {new Date(assignment.assignedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => assignment.id && handleRemove(assignment.id)}
                        className="text-error hover:text-error"
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
              )}
          </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
