import { useMemo } from 'react';
import useAppStore from '../store/useAppStore';

/**
 * Derives AG Grid columnDefs and rowData from the LLM grid spec stored in Zustand.
 * Falls back to a default spec if gridSpec is null.
 */
export function useGridSpec(fallbackRowData = [], fallbackColumnDefs = []) {
  const gridSpec = useAppStore((s) => s.gridSpec);

  const columnDefs = useMemo(() => {
    if (!gridSpec?.columns?.length) return fallbackColumnDefs;
    return gridSpec.columns.map((col) => ({
      field: col.field,
      headerName: col.headerName,
      width: col.width ?? 120,
      sortable: true,
      filter: true,
      resizable: true,
    }));
  }, [gridSpec, fallbackColumnDefs]);

  const rowData = useMemo(() => {
    if (!gridSpec || !fallbackRowData.length) return fallbackRowData;

    let rows = [...fallbackRowData];

    if (gridSpec.row_filter) {
      const { field, operator, value } = gridSpec.row_filter;
      rows = rows.filter((row) => {
        const cellVal = row[field];
        if (operator === '>') return cellVal > value;
        if (operator === '<') return cellVal < value;
        if (operator === '>=') return cellVal >= value;
        if (operator === '<=') return cellVal <= value;
        if (operator === '==') return cellVal == value; // eslint-disable-line eqeqeq
        if (operator === '!=') return cellVal != value; // eslint-disable-line eqeqeq
        return true;
      });
    }

    if (gridSpec.sort) {
      const { field, direction } = gridSpec.sort;
      rows = rows.sort((a, b) => {
        if (direction === 'asc') return a[field] > b[field] ? 1 : -1;
        return a[field] < b[field] ? 1 : -1;
      });
    }

    return rows;
  }, [gridSpec, fallbackRowData]);

  return { columnDefs, rowData, gridSpec };
}
