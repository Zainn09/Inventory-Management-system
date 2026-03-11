import { formatCurrency, formatDateTime } from '../lib/api';

export function ReceiptTemplate({ order, storeSettings = {} }) {
    return (
        <div className="print-receipt" id="print-receipt">
            <div className="receipt-header">
                <h2 className="receipt-store-name">{storeSettings.store_name || 'Jewellery Store'}</h2>
                <p className="receipt-store-address">{storeSettings.store_address || 'Address not set'}</p>
                <p className="receipt-store-phone">Tel: {storeSettings.store_phone || 'N/A'}</p>
            </div>

            <div className="receipt-divider"></div>

            <div className="receipt-meta">
                <div>Inv: {order.invoiceNumber}</div>
                <div>Date: {formatDateTime(order.createdAt)}</div>
                <div>Customer: {order.customer?.fullName || 'Walk-in'}</div>
                <div>Cashier: {order.cashier?.fullName || 'Admin'}</div>
            </div>

            <div className="receipt-divider"></div>

            <table className="receipt-table">
                <thead>
                    <tr>
                        <th align="left">Item</th>
                        <th align="center">Qty</th>
                        <th align="right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map(item => (
                        <tr key={item.id}>
                            <td>{item.product.name}</td>
                            <td align="center">{item.quantity}</td>
                            <td align="right">{formatCurrency(item.lineTotal)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="receipt-divider"></div>

            <div className="receipt-totals">
                <div className="flex-between"><span>Subtotal:</span><span>{formatCurrency(order.subtotal)}</span></div>
                <div className="flex-between"><span>Discount:</span><span>-{formatCurrency(order.discountAmount)}</span></div>
                <div className="flex-between"><span>Tax:</span><span>+{formatCurrency(order.taxAmount)}</span></div>
                <div className="flex-between receipt-grand-total"><span>Total:</span><span>{formatCurrency(order.totalAmount)}</span></div>
            </div>

            <div className="receipt-divider"></div>

            <div className="receipt-footer">
                <p>Thank you for your business!</p>
                <p>No refund without receipt.</p>
            </div>

            <style jsx>{`
        .print-receipt {
          width: 80mm;
          padding: 5mm;
          background: white;
          color: black;
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
        }
        .receipt-header { text-align: center; margin-bottom: 10px; }
        .receipt-store-name { font-size: 18px; font-weight: bold; margin: 0; }
        .receipt-store-address, .receipt-store-phone { margin: 2px 0; font-size: 11px; }
        .receipt-divider { border-top: 1px dashed black; margin: 10px 0; }
        .receipt-meta { font-size: 11px; margin-bottom: 10px; line-height: 1.4; }
        .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .receipt-table th { border-bottom: 1px solid black; padding-bottom: 4px; }
        .receipt-table td { padding: 4px 0; font-size: 11px; }
        .receipt-totals { line-height: 1.6; }
        .receipt-grand-total { font-weight: bold; font-size: 14px; margin-top: 5px; }
        .receipt-footer { text-align: center; margin-top: 15px; font-size: 10px; line-height: 1.2; }
        .flex-between { display: flex; justify-content: space-between; }
      `}</style>
        </div>
    );
}

export function BarcodeLabel({ product, storeSettings = {} }) {
    // 50mm x 25mm label
    return (
        <div className="print-label" id="barcode-label">
            <div className="label-content">
                <div className="label-store">{storeSettings.store_name || 'JEWELLERY'}</div>
                <div className="label-name">{product.name}</div>
                <div className="label-sku">{product.sku}</div>
                <div className="label-weight">Wt: {product.weightGrams}g | {product.metalType?.toUpperCase()}</div>
                <div className="label-barcode-image">
                    {/* In a real app, we'd render an actual barcode image from the API here */}
                    <div className="barcode-placeholder">|||||||||||||||||||||||</div>
                    <div>{product.barcode?.barcodeValue || product.sku}</div>
                </div>
                <div className="label-price">{formatCurrency(product.sellingPrice)}</div>
            </div>
            <style jsx>{`
        .print-label {
          width: 50mm;
          height: 25mm;
          background: white;
          color: black;
          font-family: Arial, sans-serif;
          padding: 2mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .label-content { text-align: center; width: 100%; }
        .label-store { font-size: 8px; font-weight: bold; margin-bottom: 1px; color: #555; }
        .label-name { font-size: 10px; font-weight: bold; overflow: hidden; white-space: nowrap; }
        .label-sku { font-size: 8px; color: #666; }
        .label-weight { font-size: 8px; margin-bottom: 2px; }
        .label-barcode-image { margin: 2px 0; font-size: 8px; }
        .barcode-placeholder { font-family: monospace; font-size: 14px; letter-spacing: -1px; }
        .label-price { font-size: 12px; font-weight: bold; }
      `}</style>
        </div>
    );
}
