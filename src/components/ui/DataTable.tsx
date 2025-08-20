import React, { useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Search, ChevronLeft, ChevronRight, Plus, PenSquare, XSquare } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DataTableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessor: keyof T | ((item: T) => ReactNode);
    className?: string;
  }[];
  title?: string;
  description?: string;
  onRowClick?: (item: T) => void;
  searchPlaceholder?: string;
  searchKeys?: Array<keyof T>;
  className?: string;
  actions?: React.ReactNode;
  itemsPerPage?: number;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}

export function DataTable<T>({
  data,
  columns,
  title,
  description,
  onRowClick,
  searchPlaceholder = "Buscar...",
  searchKeys,
  className,
  actions,
  itemsPerPage = 10,
  onEdit,
  onDelete
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Search functionality
  const filteredData = searchKeys && searchQuery
    ? data.filter(item => {
        return searchKeys.some(key => {
          const value = item[key];
          return value && String(value).toLowerCase().includes(searchQuery.toLowerCase());
        });
      })
    : data;

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Render cell content
  const renderCell = (item: T, accessor: keyof T | ((item: T) => ReactNode)) => {
    if (typeof accessor === 'function') {
      return accessor(item);
    }
    return String(item[accessor] || '');
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
        <div>
          {title && <h2 className="text-xl font-semibold">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          {searchKeys && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-full sm:w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          )}
          
          {actions}
        </div>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground animate-scale-in">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th key={index} className={column.className}>
                    {column.header}
                  </th>
                ))}
                {(onEdit || onDelete) && <th className="text-right w-24">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item, rowIndex) => (
                  <tr 
                    key={rowIndex} 
                    onClick={(e) => {
                      // Only trigger onRowClick if the click wasn't on an action button
                      if (onRowClick && 
                          !(e.target as HTMLElement).closest('.action-button')) {
                        onRowClick(item);
                      }
                    }}
                    className={cn(onRowClick && "cursor-pointer")}
                  >
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} className={column.className}>
                        {renderCell(item, column.accessor)}
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td className="text-right">
                        <TooltipProvider>
                          <div className="flex justify-end space-x-2">
                            {onEdit && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEdit(item);
                                    }}
                                    className="action-button p-2 rounded-md hover:bg-primary/10 text-primary border border-border"
                                    title="Editar"
                                  >
                                    <PenSquare className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {onDelete && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDelete(item);
                                    }}
                                    className="action-button p-2 rounded-md hover:bg-destructive/10 text-destructive border border-border"
                                    title="Eliminar"
                                  >
                                    <XSquare className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Eliminar</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TooltipProvider>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                    No se encontraron resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2 border-t">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} de {filteredData.length}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-md hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-md hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const DataTableActions = ({
  onAdd,
  addLabel = "Agregar nuevo",
  children
}: {
  onAdd?: () => void;
  addLabel?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div className="flex items-center justify-end gap-2 w-full">
      {children}
      
      {onAdd && (
        <button
          onClick={onAdd}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          {addLabel}
        </button>
      )}
    </div>
  );
};
 