import { parse } from 'csv-parse/sync';

export function parseCsv<T=Record<string,string>>(csvString: string): T[] {
  return parse(csvString, { columns: true, skip_empty_lines: true, trim: true });
}