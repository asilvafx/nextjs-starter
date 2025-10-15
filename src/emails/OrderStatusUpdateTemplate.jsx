import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { styles } from "./styles";

export const OrderStatusUpdateTemplate = ({
  customerName = "",
  orderId = "",
  status = "",
  items = [],
  subtotal = 0,
  shippingCost = 0,
  discountAmount = 0,
  taxEnabled = false,
  taxRate = 0,
  taxAmount = 0,
  taxIncluded = false,
  total = 0,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Order Status Update - {orderId}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.logo}>
            <img
              src="https://your-domain.com/logo.png"
              width="40"
              height="40"
              alt="Logo"
            />
          </Section>
          <Heading style={styles.heading}>Order Status Update</Heading>
          <Text style={styles.text}>Hi {customerName},</Text>
          <Text style={styles.text}>
            Your order {orderId} has been updated to: <strong>{status}</strong>
          </Text>
          
          <Section style={styles.orderSection}>
            <Heading as="h2" style={styles.subheading}>
              Order Details
            </Heading>
            {items.map((item, index) => (
              <Text key={index} style={styles.item}>
                {item.quantity}x {item.name} - €{(item.price * item.quantity).toFixed(2)}
              </Text>
            ))}
            
            {/* Pricing Breakdown */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
              {subtotal > 0 && (
                <Text style={styles.priceItem}>
                  {taxEnabled && taxIncluded ? 'Subtotal (excl. tax)' : 'Subtotal'}: €{(taxEnabled && taxIncluded && taxAmount > 0 ? subtotal - taxAmount : subtotal).toFixed(2)}
                </Text>
              )}
              
              {taxEnabled && taxAmount > 0 && (
                <Text style={styles.priceItem}>
                  Tax ({taxRate}%): €{taxAmount.toFixed(2)}
                </Text>
              )}
              
              {shippingCost > 0 && (
                <Text style={styles.priceItem}>
                  Shipping: €{shippingCost.toFixed(2)}
                </Text>
              )}
              
              {discountAmount > 0 && (
                <Text style={styles.priceItem}>
                  Discount: -€{discountAmount.toFixed(2)}
                </Text>
              )}
              
              <Text style={styles.total}>Total: €{total.toFixed(2)}</Text>
            </div>
          </Section>

          <Text style={styles.text}>
            You can view your order details by clicking the button below:
          </Text>
          
          <Section style={styles.buttonContainer}>
            <Link
              style={styles.button}
              href={`https://your-domain.com/orders/${orderId}`}
            >
              View Order
            </Link>
          </Section>

          <Text style={styles.footer}>
            If you have any questions, please don't hesitate to contact us.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};