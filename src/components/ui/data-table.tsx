
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Column {
  header: string;
  accessorKey: string;
  cell?: (props: { row: { original: any } }) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  onRowClick?: (row: any) => void;
}

export function DataTable({ data, columns, onRowClick }: DataTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.accessorKey}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
            >
              {columns.map((column) => (
                <TableCell key={column.accessorKey}>
                  {column.cell
                    ? column.cell({ row: { original: row } })
                    : row[column.accessorKey]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

