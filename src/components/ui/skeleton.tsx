import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-input animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

function TableSkeleton(): React.ReactElement {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <div className="flex items-center justify-center">
              <Skeleton className="h-4 w-16" />
            </div>
          </TableHead>
          <TableHead>
            <Skeleton className="h-4 w-16 sm:mx-auto" />
          </TableHead>
          <TableHead>
            <div className="flex items-center justify-center">
              <Skeleton className="h-4 w-16" />
            </div>
          </TableHead>
          <TableHead>
            <div className="flex items-center justify-center">
              <Skeleton className="h-4 w-16" />
            </div>
          </TableHead>
          <TableHead>
            <Skeleton className="h-4 w-16 sm:ms-auto" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(5)].map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-26" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-26" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-14 sm:mx-auto" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24 sm:mx-auto" />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export { Skeleton, TableSkeleton }
