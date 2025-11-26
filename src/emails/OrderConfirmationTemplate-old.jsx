// emails/OrderConfirmationTemplate.jsx
import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text
} from '@react-email/components';
import { emailStyles } from './styles';

export const OrderConfirmationTemplate = ({
    userDisplayName = '[Customer Name]',
    companyName = '[Your Company]',
    orderId = '#12345',
    orderDate = '[Date]',
    deliveryAddress = {
        name: '[Name]',
        address: '[Complete Address]'
    },
    products = [{ name: 'Sample Product', size: 'M', quantity: 1, price: 0 }],
    subtotal = 0,
    shippingCost = 0,
    discountAmount = 0,
    taxEnabled = false,
    taxRate = 0,
    taxAmount = 0,
    taxIncluded = false,
    total = 0,
    orderSummaryUrl = 'https://yourapp.com/orders/12345',
    supportEmail = 'support@yourcompany.com',
    paymentMethod = null,
    bankTransferDetails = null,
    trackingNumber = null,
    estimatedDelivery = null
}) => {
    const logo_img = 'https://bplw5mbobnwdstj8.public.blob.vercel-storage.com/logo.png';
    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD' 
        }).format(amount || 0);
    };

    return (
        <Html>
            <Head />
            <Preview>Thank you {userDisplayName}! Your order has been confirmed 🧡</Preview>
            <Body style={emailStyles.main}>
                <Container style={emailStyles.container}>
                    {/* Header with Logo */}
                    <Section style={enhancedStyles.header}>
                        <div style={enhancedStyles.headerContent}>
                            <Img src={logo_img} width="150" height="50" alt={companyName} style={emailStyles.logo} />
                            <div style={enhancedStyles.orderBadge}>
                                <Text style={enhancedStyles.orderBadgeText}>Order Confirmed ✓</Text>
                            </div>
                        </div>
                    </Section>

                    {/* Main Content */}
                    <Section style={emailStyles.section}>
                        <Heading style={enhancedStyles.mainHeading}>
                            Thank you for your order!
                        </Heading>
                        
                        <Text style={enhancedStyles.greeting}>
                            Hi {userDisplayName},
                        </Text>
                        
                        <Text style={enhancedStyles.confirmationText}>
                            We've received your order and are preparing it for shipment. You'll receive another email when your order has been shipped.
                        </Text>

                        {/* Order Summary Card */}
                        <Section style={enhancedStyles.orderCard}>
                            <div style={enhancedStyles.orderHeader}>
                                <Text style={enhancedStyles.orderTitle}>Order Summary</Text>
                                <Text style={enhancedStyles.orderId}>{orderId}</Text>
                            </div>
                            
                            <div style={enhancedStyles.orderMeta}>
                                <div>
                                    <Text style={enhancedStyles.metaLabel}>Order Date</Text>
                                    <Text style={enhancedStyles.metaValue}>{orderDate}</Text>
                                </div>
                                {estimatedDelivery && (
                                    <div>
                                        <Text style={enhancedStyles.metaLabel}>Estimated Delivery</Text>
                                        <Text style={enhancedStyles.metaValue}>{estimatedDelivery}</Text>
                                    </div>
                                )}
                            </div>
                        </Section>

                        {/* Products */}
                        <Section style={enhancedStyles.productsSection}>
                            <Text style={enhancedStyles.sectionTitle}>Items Ordered</Text>
                            
                            {products.map((product, index) => (
                                <div key={index} style={enhancedStyles.productRow}>
                                    <div style={enhancedStyles.productInfo}>
                                        <Text style={enhancedStyles.productName}>{product.name}</Text>
                                        {product.size && (
                                            <Text style={enhancedStyles.productDetails}>Size: {product.size}</Text>
                                        )}
                                        <Text style={enhancedStyles.productDetails}>Qty: {product.quantity}</Text>
                                    </div>
                                    <Text style={enhancedStyles.productPrice}>
                                        {formatCurrency(product.price || 0)}
                                    </Text>
                                </div>
                            ))}
                        </Section>

                        {/* Order Totals */}
                        <Section style={enhancedStyles.totalsSection}>
                            <div style={enhancedStyles.totalRow}>
                                <Text style={enhancedStyles.totalLabel}>Subtotal</Text>
                                <Text style={enhancedStyles.totalValue}>{formatCurrency(subtotal)}</Text>
                            </div>
                            
                            {shippingCost > 0 && (
                                <div style={enhancedStyles.totalRow}>
                                    <Text style={enhancedStyles.totalLabel}>Shipping</Text>
                                    <Text style={enhancedStyles.totalValue}>{formatCurrency(shippingCost)}</Text>
                                </div>
                            )}
                            
                            {discountAmount > 0 && (
                                <div style={enhancedStyles.totalRow}>
                                    <Text style={enhancedStyles.totalLabel}>Discount</Text>
                                    <Text style={enhancedStyles.discountValue}>-{formatCurrency(discountAmount)}</Text>
                                </div>
                            )}
                            
                            {taxEnabled && taxAmount > 0 && (
                                <div style={enhancedStyles.totalRow}>
                                    <Text style={enhancedStyles.totalLabel}>
                                        Tax ({(taxRate * 100).toFixed(1)}%)
                                    </Text>
                                    <Text style={enhancedStyles.totalValue}>{formatCurrency(taxAmount)}</Text>
                                </div>
                            )}
                            
                            <Hr style={enhancedStyles.totalDivider} />
                            
                            <div style={enhancedStyles.finalTotalRow}>
                                <Text style={enhancedStyles.finalTotalLabel}>Total</Text>
                                <Text style={enhancedStyles.finalTotalValue}>{formatCurrency(total)}</Text>
                            </div>
                        </Section>

                        {/* Shipping Information */}
                        <Section style={enhancedStyles.shippingSection}>
                            <Text style={enhancedStyles.sectionTitle}>Shipping Address</Text>
                            <div style={enhancedStyles.addressCard}>
                                <Text style={enhancedStyles.addressName}>{deliveryAddress.name}</Text>
                                <Text style={enhancedStyles.addressDetails}>{deliveryAddress.address}</Text>
                            </div>
                        </Section>

                        {/* Payment Information */}
                        {paymentMethod && (
                            <Section style={enhancedStyles.paymentSection}>
                                <Text style={enhancedStyles.sectionTitle}>Payment Method</Text>
                                <Text style={enhancedStyles.paymentMethod}>{paymentMethod}</Text>
                                
                                {bankTransferDetails && (
                                    <div style={enhancedStyles.bankDetailsCard}>
                                        <Text style={enhancedStyles.bankDetailsTitle}>Bank Transfer Details</Text>
                                        <div style={enhancedStyles.bankDetails}>
                                            {Object.entries(bankTransferDetails).map(([key, value]) => (
                                                <div key={key} style={enhancedStyles.bankDetailRow}>
                                                    <Text style={enhancedStyles.bankDetailLabel}>
                                                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                                                    </Text>
                                                    <Text style={enhancedStyles.bankDetailValue}>{value}</Text>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Section>
                        )}

                        {/* Tracking Information */}
                        {trackingNumber && (
                            <Section style={enhancedStyles.trackingSection}>
                                <Text style={enhancedStyles.sectionTitle}>Tracking Information</Text>
                                <Text style={enhancedStyles.trackingNumber}>Tracking Number: {trackingNumber}</Text>
                            </Section>
                        )}

                        {/* Action Buttons */}
                        <Section style={enhancedStyles.actionSection}>
                            <Button href={orderSummaryUrl} style={enhancedStyles.primaryButton}>
                                View Order Details
                            </Button>
                            <Button href={`mailto:${supportEmail}`} style={enhancedStyles.secondaryButton}>
                                Contact Support
                            </Button>
                        </Section>

                        {/* Footer */}
                        <Section style={enhancedStyles.footer}>
                            <Text style={enhancedStyles.footerText}>
                                Thank you for choosing {companyName}! We appreciate your business.
                            </Text>
                            
                            <Text style={enhancedStyles.footerText}>
                                If you have any questions about your order, please contact us at{' '}
                                <Link href={`mailto:${supportEmail}`} style={enhancedStyles.footerLink}>
                                    {supportEmail}
                                </Link>
                            </Text>
                            
                            <Text style={enhancedStyles.footerCompany}>
                                {companyName}
                                <br />
                                © {new Date().getFullYear()} All rights reserved.
                            </Text>
                        </Section>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
                    </Section>

                    {/* Heading */}
                    <Heading style={emailStyles.heading}>Bonjour {userDisplayName},</Heading>

                    {/* Main Message */}
                    <Text style={emailStyles.paragraph}>
                        Merci pour ta commande chez nous, ça nous fait super plaisir ! 🙏 On a bien reçu ton paiement,
                        et ton colis va être préparé avec amour dans les prochaines 24 à 48h.
                    </Text>

                    {/* Divider */}
                    <Section style={emailStyles.dividerSection}>
                        <div style={emailStyles.divider}>⸻</div>
                    </Section>

                    {/* Order Summary */}
                    <Section style={emailStyles.featuresSection}>
                        <Text style={emailStyles.featuresTitle}>🧾 Voici le résumé de ta commande :</Text>

                        <div style={emailStyles.orderDetailItem}>
                            • <strong>Numéro de commande :</strong> {orderId}
                        </div>
                        <div style={emailStyles.orderDetailItem}>
                            • <strong>Commandé le :</strong> {orderDate}
                        </div>
                        <div style={emailStyles.orderDetailItem}>
                            • <strong>Adresse de livraison :</strong>
                            <br />
                            &nbsp;&nbsp;{deliveryAddress.name}
                            <br />
                            &nbsp;&nbsp;{deliveryAddress.address}
                        </div>

                        <div style={emailStyles.productsSection}>
                            <div style={emailStyles.productsSectionTitle}>
                                <strong>Produits :</strong>
                            </div>
                            {products.map((product, index) => (
                                <div key={index} style={emailStyles.orderDetailItem}>
                                    • {product.name} {product.size ? `– ${product.size}` : ''} – {product.quantity}x{' '}
                                    {product.price ? `(${product.price}€ chacun)` : ''}
                                </div>
                            ))}
                        </div>

                        {/* Pricing Details */}
                        {(subtotal > 0 || total > 0) && (
                            <div style={emailStyles.pricingSection}>
                                <div style={emailStyles.productsSectionTitle}>
                                    <strong>Récapitulatif des prix :</strong>
                                </div>

                                {subtotal > 0 && (
                                    <div style={emailStyles.orderDetailItem}>
                                        • {taxEnabled && taxIncluded ? 'Sous-total (HT)' : 'Sous-total'} :{' '}
                                        {(taxEnabled && taxIncluded && taxAmount > 0
                                            ? Number(subtotal) - Number(taxAmount)
                                            : Number(subtotal)
                                        ).toFixed(2)}
                                        €
                                    </div>
                                )}

                                {taxEnabled && taxAmount > 0 && (
                                    <div style={emailStyles.orderDetailItem}>
                                        • TVA ({taxRate}%) : {Number(taxAmount).toFixed(2)}€
                                    </div>
                                )}

                                {shippingCost > 0 && (
                                    <div style={emailStyles.orderDetailItem}>
                                        • Frais de port : {Number(shippingCost).toFixed(2)}€
                                    </div>
                                )}

                                {discountAmount > 0 && (
                                    <div style={emailStyles.orderDetailItem}>
                                        • Remise : -{Number(discountAmount).toFixed(2)}€
                                    </div>
                                )}

                                <div
                                    style={{
                                        ...emailStyles.orderDetailItem,
                                        fontWeight: 'bold',
                                        borderTop: '1px solid #e0e0e0',
                                        paddingTop: '8px',
                                        marginTop: '8px'
                                    }}>
                                    • <strong>Total : {Number(total).toFixed(2)}€</strong>
                                </div>
                            </div>
                        )}
                    </Section>

                    {/* Bank Transfer Details */}
                    {paymentMethod === 'bank_transfer' && bankTransferDetails && (
                        <>
                            \n {/* Divider */}
                            <Section style={emailStyles.dividerSection}>
                                <div style={emailStyles.divider}>⸻</div>
                            </Section>
                            <Section style={emailStyles.featuresSection}>
                                <Text style={emailStyles.featuresTitle}>🏦 Détails pour le virement bancaire :</Text>

                                <div style={emailStyles.productsSection}>
                                    {bankTransferDetails.bankName && (
                                        <div style={emailStyles.orderDetailItem}>
                                            • <strong>Banque :</strong> {bankTransferDetails.bankName}
                                        </div>
                                    )}
                                    {bankTransferDetails.accountHolder && (
                                        <div style={emailStyles.orderDetailItem}>
                                            • <strong>Titulaire du compte :</strong> {bankTransferDetails.accountHolder}
                                        </div>
                                    )}
                                    {bankTransferDetails.iban && (
                                        <div style={emailStyles.orderDetailItem}>
                                            • <strong>IBAN :</strong> {bankTransferDetails.iban}
                                        </div>
                                    )}
                                    {bankTransferDetails.bic && (
                                        <div style={emailStyles.orderDetailItem}>
                                            • <strong>BIC :</strong> {bankTransferDetails.bic}
                                        </div>
                                    )}
                                    <div style={emailStyles.orderDetailItem}>
                                        • <strong>Référence :</strong> {orderId}
                                    </div>
                                    <div style={emailStyles.orderDetailItem}>
                                        • <strong>Montant à virer :</strong> {Number(total).toFixed(2)}€
                                    </div>
                                    {bankTransferDetails.additionalInstructions && (
                                        <div
                                            style={{
                                                ...emailStyles.orderDetailItem,
                                                fontStyle: 'italic',
                                                marginTop: '12px'
                                            }}>
                                            ℹ️ <strong>Instructions :</strong>{' '}
                                            {bankTransferDetails.additionalInstructions}
                                        </div>
                                    )}
                                </div>

                                <Text style={emailStyles.paragraph}>
                                    <strong>Important :</strong> N'oublie pas d'indiquer le numéro de commande{' '}
                                    <strong>{orderId}</strong> en référence de ton virement. Ta commande sera traitée
                                    dès réception du paiement.
                                </Text>
                            </Section>
                        </>
                    )}

                    {/* Divider */}
                    <Section style={emailStyles.dividerSection}>
                        <div style={emailStyles.divider}>⸻</div>
                    </Section>

                    {/* Shipping Info */}
                    <Section style={emailStyles.shippingSection}>
                        <Text style={emailStyles.featuresTitle}>📦 Et maintenant ?</Text>

                        <Text style={emailStyles.paragraph}>
                            Dès que ton colis sera prêt, tu recevras un mail avec le suivi pour savoir où il se trouve.
                            Livraison prévue sous 2 à 6 jours ouvrés (selon l'adresse).
                        </Text>
                    </Section>

                    {/* CTA Button */}
                    <Section style={emailStyles.buttonSection}>
                        <Button style={emailStyles.button} href={orderSummaryUrl}>
                            Voir ma commande
                        </Button>
                    </Section>

                    {/* Divider */}
                    <Section style={emailStyles.dividerSection}>
                        <div style={emailStyles.divider}>⸻</div>
                    </Section>

                    {/* Support Section */}
                    <Section style={emailStyles.questionSection}>
                        <Text style={emailStyles.featuresTitle}>Une question, un doute ?</Text>

                        <Text style={emailStyles.paragraph}>
                            Tu peux nous écrire à{' '}
                            <Link href={`mailto:${supportEmail}`} style={emailStyles.link}>
                                {supportEmail}
                            </Link>
                            , ou répondre directement à ce mail. On répond toujours avec le sourire (et souvent très
                            vite !).
                        </Text>
                    </Section>

                    {/* Footer */}
                    <Section style={emailStyles.footer}>
                        <Text style={emailStyles.footerText}>
                            Encore merci pour ta confiance,
                            <br />À très bientôt 💛<br />
                            {companyName}
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default OrderConfirmationTemplate;
