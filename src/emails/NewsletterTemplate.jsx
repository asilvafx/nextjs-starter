// emails/NewsletterTemplate.jsx
import { Body, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text, Button } from '@react-email/components';

export const NewsletterTemplate = ({
    subject = 'Newsletter Update',
    content = 'Thank you for subscribing to our newsletter.',
    previewText = '',
    subscriberName = null,
    companyName = 'Your App Name',
    senderName = 'Your App Name',
    senderEmail = 'noreply@yourdomain.com',
    supportEmail = 'support@yourdomain.com',
    unsubscribeUrl = '#',
    webVersionUrl = '#'
}) => {
    const logo_img = 'https://bplw5mbobnwdstj8.public.blob.vercel-storage.com/logo.png';

    // Convert content to HTML if it's plain text
    const htmlContent = content.includes('<')
        ? content
        : content
              .split('\n')
              .map((line) => line.trim() ? `<p>${line}</p>` : '<br />')
              .join('');

    return (
        <Html>
            <Head />
            <Preview>{previewText || subject}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <div style={headerContent}>
                            <Img src={logo_img} width="150" height="50" alt={companyName} style={logo} />
                            <Text style={headerText}>
                                <Link href={webVersionUrl} style={linkStyle}>
                                    View this email in your browser
                                </Link>
                            </Text>
                        </div>
                    </Section>

                    {/* Main Content */}
                    <Section style={mainContent}>
                        <Heading style={heading}>{subject}</Heading>

                        {subscriberName && (
                            <Text style={greeting}>
                                Hi {subscriberName.split(' ')[0]},
                            </Text>
                        )}

                        {/* Content Section with better formatting */}
                        <Section style={contentSection}>
                            <div
                                style={contentHtml}
                                dangerouslySetInnerHTML={{ __html: htmlContent }}
                            />
                        </Section>

                        {/* Call to Action Section */}
                        <Section style={ctaSection}>
                            <Text style={ctaText}>
                                Thank you for being part of our community!
                            </Text>
                            <div style={buttonContainer}>
                                <Button href={webVersionUrl} style={primaryButton}>
                                    Visit Our Website
                                </Button>
                            </div>
                        </Section>
                    </Section>

                    <Hr style={separator} />

                    {/* Social Media Section */}
                    <Section style={socialSection}>
                        <Text style={socialText}>
                            Follow us for daily updates:
                        </Text>
                        <div style={socialLinks}>
                            <Link href="#" style={socialLink}>Facebook</Link>
                            <span style={socialDivider}>|</span>
                            <Link href="#" style={socialLink}>Twitter</Link>
                            <span style={socialDivider}>|</span>
                            <Link href="#" style={socialLink}>LinkedIn</Link>
                            <span style={socialDivider}>|</span>
                            <Link href="#" style={socialLink}>Instagram</Link>
                        </div>
                    </Section>

                    <Hr style={separator} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            You're receiving this email because you subscribed to our newsletter from {companyName}.
                        </Text>

                        <Text style={footerText}>
                            <Link href={unsubscribeUrl} style={unsubscribeLink}>
                                Unsubscribe from this newsletter
                            </Link>
                            {' | '}
                            <Link href={`mailto:${supportEmail}`} style={linkStyle}>
                                Contact Support
                            </Link>
                        </Text>

                        <Text style={footerText}>
                            Best regards,
                            <br />
                            <strong>{senderName}</strong>
                            <br />
                            <Link href={`mailto:${senderEmail}`} style={linkStyle}>
                                {senderEmail}
                            </Link>
                        </Text>

                        <Text style={footerAddress}>
                            {companyName}
                            <br />
                            © {new Date().getFullYear()} All rights reserved.
                        </Text>

                        {/* Trust indicators */}
                        <Text style={trustIndicators}>
                            🔒 Your email address is safe with us. We never share or sell your information.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

// Enhanced Styles
const main = {
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
    padding: '20px 0'
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    marginBottom: '64px',
    maxWidth: '600px',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
};

const header = {
    backgroundColor: '#ffffff',
    padding: '30px 40px 20px',
    borderBottom: '1px solid #e5e7eb'
};

const headerContent = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
};

const logo = {
    margin: '0'
};

const headerText = {
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'right',
    margin: '0'
};

const linkStyle = {
    color: '#3b82f6',
    textDecoration: 'none'
};

const mainContent = {
    padding: '40px'
};

const heading = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 30px',
    lineHeight: '1.2',
    textAlign: 'left'
};

const greeting = {
    fontSize: '18px',
    color: '#374151',
    margin: '0 0 25px',
    fontWeight: '500'
};

const contentSection = {
    margin: '30px 0'
};

const contentHtml = {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#374151',
    margin: '20px 0'
};

const ctaSection = {
    textAlign: 'center',
    margin: '40px 0 20px',
    padding: '30px 20px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
};

const ctaText = {
    fontSize: '16px',
    color: '#6b7280',
    margin: '0 0 20px',
    textAlign: 'center'
};

const buttonContainer = {
    textAlign: 'center'
};

const primaryButton = {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    padding: '12px 24px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '600',
    display: 'inline-block',
    fontSize: '16px',
    border: 'none',
    cursor: 'pointer'
};

const socialSection = {
    textAlign: 'center',
    padding: '20px 40px',
    backgroundColor: '#f9fafb'
};

const socialText = {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 15px',
    textAlign: 'center'
};

const socialLinks = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px'
};

const socialLink = {
    color: '#3b82f6',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500'
};

const socialDivider = {
    color: '#d1d5db',
    margin: '0 5px'
};

const separator = {
    borderColor: '#e5e7eb',
    margin: '0'
};

const footer = {
    backgroundColor: '#f9fafb',
    padding: '40px',
    textAlign: 'center'
};

const footerText = {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#6b7280',
    margin: '15px 0',
    textAlign: 'center'
};

const unsubscribeLink = {
    color: '#dc2626',
    textDecoration: 'underline'
};

const footerAddress = {
    fontSize: '12px',
    color: '#9ca3af',
    margin: '25px 0 15px 0',
    textAlign: 'center',
    lineHeight: '1.4'
};

const trustIndicators = {
    fontSize: '11px',
    color: '#9ca3af',
    margin: '15px 0 0 0',
    textAlign: 'center',
    fontStyle: 'italic'
};

export default NewsletterTemplate;
