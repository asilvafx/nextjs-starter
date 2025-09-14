// emails/OrderConfirmationTemplate.jsx
import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Button,
} from '@react-email/components';
import * as React from 'react';
import { emailStyles } from './styles';

export const OrderConfirmationTemplate = ({
                                              userDisplayName = '[Prénom]',
                                              companyName = '[Nom de ta marque]',
                                              orderId = '#12345',
                                              orderDate = '[date]',
                                              deliveryAddress = {
                                                  name: '[Nom]',
                                                  address: '[Adresse complète]'
                                              },
                                              products = [
                                                  { name: 'T-shirt « Soleil »', size: 'M', quantity: 1 }
                                              ],
                                              orderSummaryUrl = 'https://yourapp.com/orders/12345',
                                              supportEmail = 'ton.email@domaine.com',
                                          }) => {

    const logo_img = "https://bplw5mbobnwdstj8.public.blob.vercel-storage.com/logo.png";

    return (
        <Html>
            <Head />
            <Preview>Merci {userDisplayName} ! Ta commande a bien été reçue 🧡</Preview>
            <Body style={emailStyles.main}>
                <Container style={emailStyles.container}>
                    {/* Logo */}
                    <Section style={emailStyles.logoSection}>
                        <Img
                            src={logo_img}
                            width="150"
                            height="50"
                            alt={companyName}
                            style={emailStyles.logo}
                        />
                    </Section>

                    {/* Heading */}
                    <Heading style={emailStyles.heading}>Bonjour {userDisplayName},</Heading>

                    {/* Main Message */}
                    <Text style={emailStyles.paragraph}>
                        Merci pour ta commande chez nous, ça nous fait super plaisir ! 🙏 On a bien reçu ton paiement, et ton colis va être préparé avec amour dans les prochaines 24 à 48h.
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
                            • <strong>Adresse de livraison :</strong><br />
                            &nbsp;&nbsp;{deliveryAddress.name}<br />
                            &nbsp;&nbsp;{deliveryAddress.address}
                        </div>

                        <div style={emailStyles.productsSection}>
                            <div style={emailStyles.productsSectionTitle}>
                                <strong>Produits :</strong>
                            </div>
                            {products.map((product, index) => (
                                <div key={index} style={emailStyles.orderDetailItem}>
                                    • {product.name} – {product.size} – {product.quantity}x
                                </div>
                            ))}
                        </div>
                    </Section>

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
                            Tu peux nous écrire à <Link href={`mailto:${supportEmail}`} style={emailStyles.link}>{supportEmail}</Link>, ou répondre directement à ce mail.
                            On répond toujours avec le sourire (et souvent très vite !).
                        </Text>
                    </Section>

                    {/* Footer */}
                    <Section style={emailStyles.footer}>
                        <Text style={emailStyles.footerText}>
                            Encore merci pour ta confiance,<br />
                            À très bientôt 💛<br />
                            {companyName}
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default OrderConfirmationTemplate;
