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

export const OrderAdminConfirmationTemplate = ({
                                                   customerName = '[Customer Name]',
                                                   customerEmail = '[customer@email.com]',
                                                   companyName = '[Company Name]',
                                                   orderId = '#12345',
                                                   orderDate = '[date]',
                                                   shippingAddress = {
                                                       name: '[Name]',
                                                       address: '[Complete Address]'
                                                   },
                                                   items = [
                                                       { name: 'T-shirt « Soleil »', size: 'M', quantity: 1, price: 25.00 }
                                                   ],
                                                   subtotal = '25.00',
                                                   shippingCost = '5.00',
                                                   total = '30.00',
                                                   orderSummaryUrl = 'https://yourapp.com/admin/orders/12345',
                                               }) => {

    const logo_img = "https://bplw5mbobnwdstj8.public.blob.vercel-storage.com/logo.png";

    // Calculate total items count
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <Html>
            <Head />
            <Preview>🔔 Nouvelle commande #{orderId} - {customerName} - {total}€</Preview>
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
                    <Heading style={emailStyles.heading}>🎉 Nouvelle Commande Reçue !</Heading>

                    {/* Alert Section */}
                    <Section style={{
                        ...emailStyles.featuresSection,
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FCA5A5',
                        textAlign: 'center'
                    }}>
                        <Text style={{
                            ...emailStyles.featuresTitle,
                            color: '#DC2626',
                            fontSize: '20px',
                            margin: '0'
                        }}>
                            🔔 Action requise : Nouvelle commande à traiter
                        </Text>
                    </Section>

                    {/* Main Message */}
                    <Text style={emailStyles.paragraph}>
                        Une nouvelle commande vient d'être passée sur votre boutique. Voici tous les détails pour traiter cette commande :
                    </Text>

                    {/* Divider */}
                    <Section style={emailStyles.dividerSection}>
                        <div style={emailStyles.divider}>⸻</div>
                    </Section>

                    {/* Order Summary */}
                    <Section style={emailStyles.featuresSection}>
                        <Text style={emailStyles.featuresTitle}>📋 Détails de la commande :</Text>

                        <div style={emailStyles.orderDetailItem}>
                            • <strong>Commande :</strong> {orderId}
                        </div>
                        <div style={emailStyles.orderDetailItem}>
                            • <strong>Date :</strong> {orderDate}
                        </div>
                        <div style={emailStyles.orderDetailItem}>
                            • <strong>Montant total :</strong> <span style={{ color: '#059669', fontWeight: 'bold', fontSize: '18px' }}>{total}€</span>
                        </div>
                        <div style={emailStyles.orderDetailItem}>
                            • <strong>Nombre d'articles :</strong> {totalItems}
                        </div>
                    </Section>

                    {/* Customer Info */}
                    <Section style={emailStyles.featuresSection}>
                        <Text style={emailStyles.featuresTitle}>👤 Informations client :</Text>

                        <div style={emailStyles.orderDetailItem}>
                            • <strong>Nom :</strong> {customerName}
                        </div>
                        <div style={emailStyles.orderDetailItem}>
                            • <strong>Email :</strong> <Link href={`mailto:${customerEmail}`} style={emailStyles.link}>{customerEmail}</Link>
                        </div>
                        <div style={emailStyles.orderDetailItem}>
                            • <strong>Adresse de livraison :</strong><br />
                            &nbsp;&nbsp;{shippingAddress.name}<br />
                            &nbsp;&nbsp;{shippingAddress.address}
                        </div>
                    </Section>

                    {/* Products Section */}
                    <Section style={emailStyles.featuresSection}>
                        <Text style={emailStyles.featuresTitle}>📦 Produits commandés :</Text>

                        {items.map((item, index) => (
                            <div key={index} style={{
                                ...emailStyles.orderDetailItem,
                                backgroundColor: '#F9FAFB',
                                padding: '12px',
                                borderRadius: '6px',
                                marginBottom: '8px',
                                border: '1px solid #E5E7EB'
                            }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                    {item.name}
                                </div>
                                <div style={{ fontSize: '14px', color: '#6B7280' }}>
                                    Taille: {item.size || 'N/A'} | Quantité: {item.quantity} | Prix unitaire: {item.price}€
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#059669' }}>
                                    Sous-total: {(item.price * item.quantity).toFixed(2)}€
                                </div>
                            </div>
                        ))}

                        <div style={{
                            borderTop: '2px solid #E5E7EB',
                            marginTop: '16px',
                            paddingTop: '12px'
                        }}>
                            <div style={emailStyles.orderDetailItem}>
                                <strong>Sous-total produits :</strong> {subtotal}€
                            </div>
                            <div style={emailStyles.orderDetailItem}>
                                <strong>Frais de port :</strong> {shippingCost}€
                            </div>
                            <div style={{
                                ...emailStyles.orderDetailItem,
                                fontSize: '18px',
                                color: '#059669',
                                fontWeight: 'bold'
                            }}>
                                <strong>TOTAL :</strong> {total}€
                            </div>
                        </div>
                    </Section>

                    {/* CTA Button */}
                    <Section style={emailStyles.buttonSection}>
                        <Button style={{
                            ...emailStyles.button,
                            backgroundColor: '#DC2626',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }} href={orderSummaryUrl}>
                            🚀 Traiter cette commande
                        </Button>
                    </Section>

                    {/* Divider */}
                    <Section style={emailStyles.dividerSection}>
                        <div style={emailStyles.divider}>⸻</div>
                    </Section>

                    {/* Action Items */}
                    <Section style={{
                        ...emailStyles.featuresSection,
                        backgroundColor: '#FFF7ED',
                        border: '1px solid #FDBA74'
                    }}>
                        <Text style={emailStyles.featuresTitle}>⚡ Actions à effectuer :</Text>

                        <div style={emailStyles.orderDetailItem}>
                            1. ✅ Vérifier la disponibilité des produits
                        </div>
                        <div style={emailStyles.orderDetailItem}>
                            2. 📦 Préparer le colis
                        </div>
                        <div style={emailStyles.orderDetailItem}>
                            3. 🏷️ Imprimer l'étiquette d'expédition
                        </div>
                        <div style={emailStyles.orderDetailItem}>
                            4. 📧 Envoyer le numéro de suivi au client
                        </div>
                    </Section>

                    {/* Footer */}
                    <Section style={emailStyles.footer}>
                        <Text style={emailStyles.footerText}>
                            Cette notification a été générée automatiquement.<br />
                            Système de gestion des commandes - {companyName}
                        </Text>
                    </Section>

                    {/* Support Section */}
                    <Section style={emailStyles.supportSection}>
                        <Text style={emailStyles.supportText}>
                            Cet email a été envoyé à l'équipe administrative.<br />
                            Heure de la commande : {orderDate}
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default OrderAdminConfirmationTemplate;
