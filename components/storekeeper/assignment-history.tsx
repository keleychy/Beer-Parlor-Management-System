"use client"

import { useEffect, useState } from "react"
import { getAssignments, removeAssignment } from "@/lib/storage"
import type { Assignment } from "@/lib/types"
import { formatNaira } from "@/lib/currency"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AssignmentHistory() {
  const [assignments, setAssignments] = useState<Assignment[]>([])

  useEffect(() => {
    setAssignments(getAssignments())
  }, [])

  const handleRemove = (id: string) => {
    removeAssignment(id)
    setAssignments(getAssignments())
  }

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
          <div className="overflow-x-auto">
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
                {assignments.map((assignment) => (
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
                          500,
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}
