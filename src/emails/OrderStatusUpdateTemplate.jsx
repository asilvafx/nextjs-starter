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
                {item.quantity}x {item.name} - ${(item.price * item.quantity).toFixed(2)}
              </Text>
            ))}
            <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
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