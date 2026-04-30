import { formatCurrency, formatDateTime } from '../lib/api';

export function ReceiptTemplate({ order, storeSettings = {} }) {
    if (!order) return null;

    const paymentMethodLabel = {
        cash: '💵 Cash',
        card: '💳 Card',
        upi: '📱 UPI',
        bank_transfer: '🏦 Bank Transfer',
        mixed: '🔄 Mixed'
    };

    return (
        <div className="print-receipt" id="print-receipt">
            {/* Store Header */}
            <div className="receipt-header">
                <h2 className="receipt-store-name">{storeSettings.store_name || 'Jewellery Palace'}</h2>
                <p className="receipt-store-address">{storeSettings.store_address || '123 Gold Market, Lahore'}</p>
                <p className="receipt-store-phone">Tel: {storeSettings.store_phone || '+92-300-1234567'}</p>
                {storeSettings.store_gst && (
                    <p className="receipt-store-gst">GST: {storeSettings.store_gst}</p>
                )}
            </div>

            <div className="receipt-divider receipt-divider--double"></div>

            {/* Invoice & Meta */}
            <div className="receipt-meta">
                <div className="receipt-meta-title">TAX INVOICE</div>
                <div className="receipt-meta-row">
                    <span>Invoice:</span>
                    <span className="receipt-meta-value">{order.invoiceNumber}</span>
                </div>
                <div className="receipt-meta-row">
                    <span>Date:</span>
                    <span>{formatDateTime(order.createdAt)}</span>
                </div>
                <div className="receipt-meta-row">
                    <span>Customer:</span>
                    <span>{order.customer?.fullName || 'Walk-in Customer'}</span>
                </div>
                {order.customer?.phone && (
                    <div className="receipt-meta-row">
                        <span>Phone:</span>
                        <span>{order.customer.phone}</span>
                    </div>
                )}
                <div className="receipt-meta-row">
                    <span>Cashier:</span>
                    <span>{order.cashier?.fullName || 'Admin'}</span>
                </div>
            </div>

            <div className="receipt-divider"></div>

            {/* Items Table */}
            <table className="receipt-table">
                <thead>
                    <tr>
                        <th align="left">Item</th>
                        <th align="center">Qty</th>
                        <th align="right">Rate</th>
                        <th align="right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {(order.items || []).map((item, idx) => (
                        <tr key={item.id || idx}>
                            <td>
                                <div className="receipt-item-name">{item.product?.name || 'Item'}</div>
                                <div className="receipt-item-detail">
                                    {item.product?.sku && <span>{item.product.sku}</span>}
                                    {item.product?.weightGrams && <span> • {item.product.weightGrams}g</span>}
                                    {item.product?.metalType && <span> • {item.product.metalType.toUpperCase()}</span>}
                                </div>
                            </td>
                            <td align="center">{item.quantity}</td>
                            <td align="right">{formatCurrency(item.unitPrice)}</td>
                            <td align="right">{formatCurrency(item.lineTotal)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="receipt-divider"></div>

            {/* Totals */}
            <div className="receipt-totals">
                <div className="receipt-total-row">
                    <span>Subtotal ({(order.items || []).length} items):</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discountAmount > 0 && (
                    <div className="receipt-total-row receipt-total-row--discount">
                        <span>Discount:</span>
                        <span>- {formatCurrency(order.discountAmount)}</span>
                    </div>
                )}
                {order.taxAmount > 0 && (
                    <div className="receipt-total-row">
                        <span>GST/Tax:</span>
                        <span>+ {formatCurrency(order.taxAmount)}</span>
                    </div>
                )}
                <div className="receipt-divider receipt-divider--thin"></div>
                <div className="receipt-total-row receipt-grand-total">
                    <span>GRAND TOTAL:</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                </div>
            </div>

            <div className="receipt-divider"></div>

            {/* Payment Info */}
            <div className="receipt-payment">
                <div className="receipt-payment-title">PAYMENT</div>
                <div className="receipt-total-row">
                    <span>Method:</span>
                    <span>{paymentMethodLabel[order.payment?.method] || order.payment?.method || 'Cash'}</span>
                </div>
                <div className="receipt-total-row">
                    <span>Amount Paid:</span>
                    <span>{formatCurrency(order.payment?.amountPaid || order.totalAmount)}</span>
                </div>
                {(order.payment?.changeGiven || 0) > 0 && (
                    <div className="receipt-total-row">
                        <span>Change:</span>
                        <span>{formatCurrency(order.payment.changeGiven)}</span>
                    </div>
                )}
                {order.payment?.transactionRef && (
                    <div className="receipt-total-row">
                        <span>Ref:</span>
                        <span>{order.payment.transactionRef}</span>
                    </div>
                )}
            </div>

            <div className="receipt-divider receipt-divider--double"></div>

            {/* Footer */}
            <div className="receipt-footer">
                <p className="receipt-footer-thanks">✨ Thank you for your purchase! ✨</p>
                <p className="receipt-footer-policy">Exchange within 7 days with receipt.</p>
                <p className="receipt-footer-policy">No refund on gold items once sold.</p>
                {storeSettings.store_phone && (
                    <p className="receipt-footer-contact">Queries: {storeSettings.store_phone}</p>
                )}
            </div>

            <style jsx>{`
                .print-receipt {
                    width: 80mm;
                    padding: 5mm;
                    background: white;
                    color: #000;
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 12px;
                    line-height: 1.4;
                }
                .receipt-header {
                    text-align: center;
                    margin-bottom: 8px;
                }
                .receipt-store-name {
                    font-size: 20px;
                    font-weight: bold;
                    margin: 0 0 2px 0;
                    letter-spacing: 1px;
                }
                .receipt-store-address,
                .receipt-store-phone,
                .receipt-store-gst {
                    margin: 1px 0;
                    font-size: 10px;
                    color: #333;
                }
                .receipt-divider {
                    border-top: 1px dashed #000;
                    margin: 8px 0;
                }
                .receipt-divider--double {
                    border-top: 3px double #000;
                }
                .receipt-divider--thin {
                    border-top: 1px solid #000;
                    margin: 4px 0;
                }
                .receipt-meta {
                    margin-bottom: 8px;
                }
                .receipt-meta-title {
                    text-align: center;
                    font-size: 13px;
                    font-weight: bold;
                    letter-spacing: 2px;
                    margin-bottom: 6px;
                }
                .receipt-meta-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 10px;
                    line-height: 1.5;
                }
                .receipt-meta-value {
                    font-weight: bold;
                }
                .receipt-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 8px;
                }
                .receipt-table th {
                    border-bottom: 1px solid #000;
                    padding-bottom: 4px;
                    font-size: 10px;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .receipt-table td {
                    padding: 4px 0;
                    font-size: 10px;
                    vertical-align: top;
                }
                .receipt-item-name {
                    font-weight: bold;
                    font-size: 11px;
                }
                .receipt-item-detail {
                    font-size: 9px;
                    color: #555;
                }
                .receipt-totals {
                    margin-bottom: 8px;
                }
                .receipt-total-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    line-height: 1.6;
                }
                .receipt-total-row--discount {
                    color: #c00;
                }
                .receipt-grand-total {
                    font-weight: bold;
                    font-size: 15px;
                    margin-top: 4px;
                    padding-top: 4px;
                }
                .receipt-payment {
                    margin-bottom: 8px;
                }
                .receipt-payment-title {
                    font-size: 10px;
                    font-weight: bold;
                    letter-spacing: 1px;
                    margin-bottom: 4px;
                }
                .receipt-footer {
                    text-align: center;
                    margin-top: 10px;
                    padding-top: 8px;
                }
                .receipt-footer-thanks {
                    font-size: 12px;
                    font-weight: bold;
                    margin-bottom: 4px;
                }
                .receipt-footer-policy {
                    font-size: 9px;
                    color: #555;
                    margin: 1px 0;
                }
                .receipt-footer-contact {
                    font-size: 9px;
                    margin-top: 4px;
                    color: #333;
                }
            `}</style>
        </div>
    );
}

export function BarcodeLabel({ product, storeSettings = {} }) {
    return (
        <div className="print-label" id="barcode-label">
            <div className="label-content">
                <div className="label-store">{storeSettings.store_name || 'JEWELLERY'}</div>
                <div className="label-name">{product.name}</div>
                <div className="label-sku">{product.sku}</div>
                <div className="label-weight">Wt: {product.weightGrams}g | {product.metalType?.toUpperCase()}</div>
                <div className="label-barcode-image">
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
