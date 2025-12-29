declare module 'escpos-usb' {
  class USB {
    constructor(device: any);
    open(callback: (error: any) => void): void;
    close(callback: () => void): void;
    static findPrinter(): any[];
  }

  export = USB;
}
