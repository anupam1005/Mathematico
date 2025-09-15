import { Table } from "@tanstack/react-table"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/components/admin/DataTableViewOptions"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchKey: string
  filterOptions?: {
    label: string
    value: string
    options: { label: string; value: string }[]
  }[]
  onAddNew?: () => void
  addNewLabel?: string
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  filterOptions = [],
  onAddNew,
  addNewLabel = "Add New",
}: DataTableToolbarProps<TData>) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${searchKey}...`}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="h-9 w-[150px] pl-8 lg:w-[250px]"
          />
        </div>
        {filterOptions.map((filter) => (
          <div key={filter.value} className="min-w-[150px]">
            <select
              value={(table.getColumn(filter.value)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(filter.value)?.setFilterValue(event.target.value)
              }
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">All {filter.label}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="flex items-center space-x-2
      ">
        <DataTableViewOptions table={table} />
        {onAddNew && (
          <Button onClick={onAddNew} size="sm" className="h-8">
            {addNewLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
