import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text
} from '@react-email/components';
import { emailStyles } from './styles';

export const OrderUpdateTemplate = ({
    customerName = '[Prénom]',
    companyName = '[Nom de ta marque]',
    orderId = '#12345',
    orderDate = '[date]',
    status = 'confirmed', // confirmed, in_transit, delivered, cancelled, processing
    trackingNumber = null,
    trackingUrl = null,
    estimatedDelivery = null,
    items = [{ name: 'T-shirt « Soleil »', size: 'M', quantity: 1 }],
    total = '30.00',
    orderUrl = 'https://yourapp.com/orders/12345',
    supportEmail = 'ton.email@domaine.com',
    customMessage = null // Optional custom message from admin
}) => {
    const logo_img = 'https://bplw5mbobnwdstj8.public.blob.vercel-storage.com/logo.png';

    // Status configuration
    const statusConfig = {
        confirmed: {
            emoji: '✅',
            title: 'Commande Confirmée',
            message:
                'Super ! Ton paiement a été validé et ta commande est maintenant confirmée. On prépare ton colis avec amour ! 💝',
            color: '#059669',
            backgroundColor: '#ECFDF5',
            borderColor: '#86EFAC'
        },
        processing: {
            emoji: '📦',
            title: 'Commande en Préparation',
            message: "Ça y est, on prépare ton colis ! Nos équipes s'activent pour que tout soit parfait. 🎯",
            color: '#D97706',
            backgroundColor: '#FFF7ED',
            borderColor: '#FDBA74'
        },
        in_transit: {
            emoji: '🚚',
            title: 'Commande Expédiée',
            message:
                'Ton colis est en route ! Il voyage vers toi et devrait arriver bientôt. Tu peux suivre sa progression en temps réel. 🛣️',
            color: '#2563EB',
            backgroundColor: '#EEF2FF',
            borderColor: '#A5B4FC'
        },
        delivered: {
            emoji: '🎉',
            title: 'Commande Livrée',
            message:
                "Félicitations ! Ton colis est arrivé à destination. On espère que tout te plaît ! N'hésite pas à nous faire un retour. ✨",
            color: '#7C3AED',
            backgroundColor: '#F3E8FF',
            borderColor: '#C4B5FD'
        },
        cancelled: {
            emoji: '❌',
            title: 'Commande Annulée',
            message:
                "Ta commande a été annulée. Si tu n'es pas à l'origine de cette annulation, n'hésite pas à nous contacter. 💭",
            color: '#DC2626',
            backgroundColor: '#FEF2F2',
            borderColor: '#FCA5A5'
        }
    };

    const currentStatus = statusConfig[status] || statusConfig.confirmed;
    const previewText = `${currentStatus.emoji} ${currentStatus.title} - Commande ${orderId}`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={emailStyles.main}>
                <Container style={emailStyles.container}>
                    {/* Logo */}
                    <Section style={emailStyles.logoSection}>
                        <Img src={logo_img} width="150" height="50" alt={companyName} style={emailStyles.logo} />
                    </Section>

                    {/* Heading */}
                    <Heading style={emailStyles.heading}>Salut {customerName} ! 👋</Heading>

                    {/* Status Update Section */}
                    <Section
                        style={{
                            ...emailStyles.featuresSection,
                            backgroundColor: currentStatus.backgroundColor,
                            border: `2px solid ${currentStatus.borderColor}`,
                            textAlign: 'center'
                        }}>
                        <Text
                            style={{
                                fontSize: '48px',
                                margin: '0 0 16px 0',
                                lineHeight: '1'
                            }}>
                            {currentStatus.emoji}
                        </Text>
                        <Text
                            style={{
                                ...emailStyles.featuresTitle,
                                color: currentStatus.color,
                                fontSize: '24px',
                                margin: '0 0 16px 0'
                            }}>
                            {currentStatus.title}
                        </Text>
                        <Text
                            style={{
                                ...emailStyles.featureText,
                                fontSize: '16px',
                                lineHeight: '24px',
                                margin: '0'
                            }}>
                            {currentStatus.message}
                        </Text>
                    </Section>

                    {/* Custom Message from Admin */}
                    {customMessage && (
                        <Section
                            style={{
                                ...emailStyles.featuresSection,
                                backgroundColor: '#F8FAFC',
                                border: '1px solid #CBD5E1'
                            }}>
                            <Text style={emailStyles.featuresTitle}>💬 Message de notre équipe :</Text>
                            <Text
                                style={{
                                    ...emailStyles.featureText,
                                    fontStyle: 'italic',
                                    color: '#475569'
                                }}>
                                "{customMessage}"
                            </Text>
                        </Section>
                    )}

                    {/* Divider */}
                    <Section style={emailStyles.dividerSection}>
                        <div style={emailStyles.divider}>⸻</div>
                    </Section>

                    {/* Order Details */}
                    <Section style={emailStyles.featuresSection}>
                        <Text style={emailStyles.featuresTitle}>📋 Détails de ta commande :</Text>

                        <div style={emailStyles.orderDetailItem}>
                            • <strong>Commande :</strong> {orderId}
                        </div>
                        <div style={emailStyles.orderDetailItem}>
                            • <strong>Passée le :</strong> {orderDate}
                        </div>
                        <div style={emailStyles.orderDetailItem}>
                            • <strong>Montant :</strong> {total}€
                        </div>
                        <div style={emailStyles.orderDetailItem}>
                            • <strong>Statut actuel :</strong>{' '}
                            <span style={{ color: currentStatus.color, fontWeight: 'bold' }}>
                                {currentStatus.title}
                            </span>
                        </div>

                        {/* Products */}
                        <div style={emailStyles.productsSection}>
                            <div style={emailStyles.productsSectionTitle}>
                                <strong>Articles :</strong>
                            </div>
                            {items.map((item, index) => (
                                <div key={index} style={emailStyles.orderDetailItem}>
                                    • {item.name}
                                    {item.size ? ` – ${item.size}` : ''} – {item.quantity}x
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Tracking Information */}
                    {(status === 'in_transit' || status === 'delivered') && (trackingNumber || trackingUrl) && (
                        <Section
                            style={{
                                ...emailStyles.featuresSection,
                                backgroundColor: '#EEF2FF',
                                border: '1px solid #A5B4FC'
                            }}>
                            <Text
                                style={{
                                    ...emailStyles.featuresTitle,
                                    color: '#2563EB'
                                }}>
                                🔍 Suivi de ton colis :
                            </Text>

                            {trackingNumber && (
                                <div style={emailStyles.orderDetailItem}>
                                    • <strong>Numéro de suivi :</strong> {trackingNumber}
                                </div>
                            )}

                            {estimatedDelivery && (
                                <div style={emailStyles.orderDetailItem}>
                                    • <strong>Livraison estimée :</strong> {estimatedDelivery}
                                </div>
                            )}

                            {trackingUrl && (
                                <Section style={emailStyles.buttonSection}>
                                    <Button
                                        style={{
                                            ...emailStyles.button,
                                            backgroundColor: '#2563EB'
                                        }}
                                        href={trackingUrl}>
                                        🔍 Suivre mon colis
                                    </Button>
                                </Section>
                            )}
                        </Section>
                    )}

                    {/* Next Steps */}
                    {status !== 'delivered' && status !== 'cancelled' && (
                        <Section style={emailStyles.shippingSection}>
                            <Text style={emailStyles.featuresTitle}>🚀 Et maintenant ?</Text>

                            {status === 'confirmed' && (
                                <Text style={emailStyles.paragraph}>
                                    Maintenant que ta commande est confirmée, on va la préparer dans les prochaines
                                    24-48h. Tu recevras un nouveau mail dès qu'elle sera expédiée !
                                </Text>
                            )}

                            {status === 'processing' && (
                                <Text style={emailStyles.paragraph}>
                                    Ton colis est en cours de préparation dans notre entrepôt. Dès qu'il sera prêt et
                                    expédié, on t'enverra le numéro de suivi !
                                </Text>
                            )}

                            {status === 'in_transit' && (
                                <Text style={emailStyles.paragraph}>
                                    Plus qu'à attendre que le transporteur livre ton colis ! Tu peux suivre sa
                                    progression en temps réel avec le lien de suivi.
                                </Text>
                            )}
                        </Section>
                    )}

                    {/* Thank You Section for Delivered Orders */}
                    {status === 'delivered' && (
                        <Section style={emailStyles.shippingSection}>
                            <Text style={emailStyles.featuresTitle}>💛 Merci pour ta confiance !</Text>

                            <Text style={emailStyles.paragraph}>
                                On espère que ta commande te plaît ! Si tu as un moment, n'hésite pas à nous laisser un
                                avis ou à partager une photo sur les réseaux sociaux. Ça nous fait toujours très plaisir
                                ! 📸
                            </Text>
                        </Section>
                    )}

                    {/* CTA Button */}
                    <Section style={emailStyles.buttonSection}>
                        <Button style={emailStyles.button} href={orderUrl}>
                            Voir ma commande
                        </Button>
                    </Section>

                    {/* Divider */}
                    <Section style={emailStyles.dividerSection}>
                        <div style={emailStyles.divider}>⸻</div>
                    </Section>

                    {/* Support Section */}
                    <Section style={emailStyles.questionSection}>
                        <Text style={emailStyles.featuresTitle}>Une question ?</Text>

                        <Text style={emailStyles.paragraph}>
                            Tu peux nous écrire à{' '}
                            <Link href={`mailto:${supportEmail}`} style={emailStyles.link}>
                                {supportEmail}
                            </Link>
                            , ou répondre directement à ce mail. On est là pour t'aider ! 😊
                        </Text>
                    </Section>

                    {/* Footer */}
                    <Section style={emailStyles.footer}>
                        <Text style={emailStyles.footerText}>
                            À très bientôt,
                            <br />
                            L'équipe {companyName} 💚
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default OrderUpdateTemplate;
