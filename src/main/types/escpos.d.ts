declare module 'escpos' {
  export class Printer {
    constructor(device: any, options?: any);
    font(type: string): this;
    align(alignment: string): this;
    size(width: number, height: number): this;
    style(style: string): this;
    text(text: string): this;
    drawLine(): this;
    cut(): this;
    barcode(data: string, type: string, options?: any): this;
    qrcode(data: string, options?: any): this;
    close(callback?: (error: any) => void): void;
    options: {
      width: number;
      encoding?: string;
    };
  }

  export default {
    Printer,
  };
}
