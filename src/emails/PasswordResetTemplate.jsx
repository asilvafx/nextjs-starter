// emails/PasswordResetTemplate.jsx
import { Body, Container, Head, Heading, Html, Img, Preview, Section, Text } from '@react-email/components';

export const PasswordResetTemplate = ({
    resetCode = '123456',
    userDisplayName = null,
    companyName = 'Your App Name'
}) => {
    const logo_img = 'https://bplw5mbobnwdstj8.public.blob.vercel-storage.com/logo.png';

    return (
        <Html>
            <Head />
            <Preview>Your password reset code: {resetCode}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Logo Section */}
                    <Section style={logoSection}>
                        <Img src={logo_img} width="150" height="50" alt={companyName} style={logo} />
                    </Section>

                    {/* Header */}
                    <Heading style={heading}>Password Reset Request</Heading>

                    {/* Greeting */}
                    <Text style={paragraph}>{userDisplayName ? `Hi ${userDisplayName},` : 'Hi there,'}</Text>

                    {/* Main Message */}
                    <Text style={paragraph}>
                        We received a request to reset your password for your {companyName} account. Use the
                        verification code below to reset your password:
                    </Text>

                    {/* Reset Code */}
                    <Section style={codeSection}>
                        <Text style={codeText}>{resetCode}</Text>
                    </Section>

                    <Text style={paragraph}>This code will expire in 15 minutes for security reasons.</Text>

                    <Text style={paragraph}>
                        If you didn't request this password reset, please ignore this email or contact our support team
                        if you have concerns.
                    </Text>

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            Best regards,
                            <br />
                            The {companyName} Team
                        </Text>
                    </Section>

                    {/* Security Notice */}
                    <Section style={securityNotice}>
                        <Text style={securityText}>
                            For security reasons, never share this code with anyone. {companyName} will never ask for
                            your password or verification codes via email or phone.
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
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif'
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    maxWidth: '580px'
};

const logoSection = {
    padding: '32px 20px',
    textAlign: 'center'
};

const logo = {
    margin: '0 auto'
};

const heading = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    margin: '0 0 30px',
    padding: '0 20px'
};

const paragraph = {
    fontSize: '16px',
    lineHeight: '26px',
    color: '#374151',
    padding: '0 20px',
    margin: '0 0 20px'
};

const codeSection = {
    textAlign: 'center',
    margin: '32px 0',
    padding: '0 20px'
};

const codeText = {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#4F46E5',
    backgroundColor: '#F3F4F6',
    padding: '20px 40px',
    borderRadius: '8px',
    letterSpacing: '6px',
    fontFamily: 'Monaco, "Lucida Console", monospace',
    display: 'inline-block',
    border: '2px solid #E5E7EB'
};

const footer = {
    padding: '0 20px',
    margin: '32px 0 0'
};

const footerText = {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#374151',
    margin: '0'
};

const securityNotice = {
    backgroundColor: '#FEF3C7',
    borderLeft: '4px solid #F59E0B',
    padding: '16px 20px',
    margin: '32px 20px 0',
    borderRadius: '0 6px 6px 0'
};

const securityText = {
    fontSize: '14px',
    lineHeight: '20px',
    color: '#92400E',
    margin: '0'
};

export default PasswordResetTemplate;
