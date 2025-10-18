// emails/NewsletterTemplate.jsx
import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Preview,
    Section,
    Text,
    Button,
    Hr,
    Link,
} from '@react-email/components';
import * as React from 'react';

export const NewsletterTemplate = ({
    subject = 'Newsletter Update',
    content = 'Thank you for subscribing to our newsletter.',
    previewText = '',
    subscriberName = null,
    companyName = 'Your App Name',
    unsubscribeUrl = '#',
    webVersionUrl = '#',
}) => {

    const logo_img = "https://bplw5mbobnwdstj8.public.blob.vercel-storage.com/logo.png";

    // Convert content to HTML if it's plain text
    const htmlContent = content.includes('<') ? content : content.split('\n').map(line => `<p>${line}</p>`).join('');

    return (
        <Html>
            <Head />
            <Preview>{previewText || subject}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Img
                            src={logo_img}
                            width="150"
                            height="50"
                            alt={companyName}
                            style={logo}
                        />
                        <Text style={headerText}>
                            <Link href={webVersionUrl} style={linkStyle}>
                                View this email in your browser
                            </Link>
                        </Text>
                    </Section>

                    {/* Main Content */}
                    <Section style={mainContent}>
                        <Heading style={heading}>{subject}</Heading>

                        {subscriberName && (
                            <Text style={greeting}>
                                Hi {subscriberName},
                            </Text>
                        )}

                        <Section style={contentSection}>
                            <div 
                                style={{
                                    fontSize: '16px',
                                    lineHeight: '26px',
                                    color: '#374151',
                                    margin: '20px 0'
                                }}
                                dangerouslySetInnerHTML={{ __html: htmlContent }} 
                            />
                        </Section>
                    </Section>

                    <Hr style={separator} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            You're receiving this email because you subscribed to our newsletter.
                        </Text>
                        
                        <Text style={footerText}>
                            <Link href={unsubscribeUrl} style={unsubscribeLink}>
                                Unsubscribe from this newsletter
                            </Link>
                        </Text>

                        <Text style={footerText}>
                            Best regards,<br />
                            The {companyName} Team
                        </Text>

                        <Text style={footerAddress}>
                            {companyName}<br />
                            © 2024 All rights reserved.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

// Styles
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    marginBottom: '64px',
    maxWidth: '600px',
};

const header = {
    backgroundColor: '#ffffff',
    padding: '20px 40px',
    borderBottom: '1px solid #e5e7eb',
};

const logo = {
    margin: '0',
};

const headerText = {
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'right',
    margin: '10px 0 0 0',
};

const linkStyle = {
    color: '#3b82f6',
    textDecoration: 'none',
};

const mainContent = {
    padding: '40px',
};

const heading = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 30px',
    lineHeight: '36px',
};

const greeting = {
    fontSize: '16px',
    color: '#374151',
    margin: '0 0 20px',
};

const contentSection = {
    fontSize: '16px',
    lineHeight: '26px',
    color: '#374151',
    margin: '20px 0',
};

const separator = {
    borderColor: '#e5e7eb',
    margin: '20px 0',
};

const footer = {
    backgroundColor: '#f9fafb',
    padding: '40px',
    textAlign: 'center',
};

const footerText = {
    fontSize: '14px',
    lineHeight: '20px',
    color: '#6b7280',
    margin: '10px 0',
    textAlign: 'center',
};

const unsubscribeLink = {
    color: '#dc2626',
    textDecoration: 'underline',
};

const footerAddress = {
    fontSize: '12px',
    color: '#9ca3af',
    margin: '20px 0 0 0',
    textAlign: 'center',
};

export default NewsletterTemplate;