// emails/EmailVerificationTemplate.jsx
import { Body, Container, Head, Heading, Html, Img, Preview, Section, Text } from '@react-email/components';

export const EmailVerificationTemplate = ({
    verificationCode = '123456',
    userDisplayName = null,
    companyName = 'Your App Name'
}) => {
    const logo_img = 'https://bplw5mbobnwdstj8.public.blob.vercel-storage.com/logo.png';

    return (
        <Html>
            <Head />
            <Preview>Verify your email address: {verificationCode}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={logoSection}>
                        <Img src={logo_img} width="150" height="50" alt={companyName} style={logo} />
                    </Section>

                    <Heading style={heading}>Verify Your Email Address</Heading>

                    <Text style={paragraph}>{userDisplayName ? `Hi ${userDisplayName},` : 'Hi there,'}</Text>

                    <Text style={paragraph}>
                        Thank you for signing up with {companyName}! To complete your registration and secure your
                        account, please verify your email address using the code below:
                    </Text>

                    <Section style={codeSection}>
                        <Text style={codeText}>{verificationCode}</Text>
                    </Section>

                    <Text style={paragraph}>
                        Enter this code in the verification form to activate your account. This code will expire in 24
                        hours.
                    </Text>

                    <Text style={paragraph}>
                        If you didn't create an account with {companyName}, please ignore this email.
                    </Text>

                    <Section style={footer}>
                        <Text style={footerText}>
                            Best regards,
                            <br />
                            The {companyName} Team
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

// Shared styles for all templates
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
    color: '#10B981',
    backgroundColor: '#F3F4F6',
    padding: '20px 40px',
    borderRadius: '8px',
    letterSpacing: '6px',
    fontFamily: 'Monaco, "Lucida Console", monospace',
    display: 'inline-block',
    border: '2px solid #E5E7EB'
};

const _messageSection = {
    backgroundColor: '#EFF6FF',
    borderLeft: '4px solid #3B82F6',
    padding: '16px 20px',
    margin: '24px 20px',
    borderRadius: '0 6px 6px 0'
};

const _messageText = {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#1E40AF',
    margin: '0',
    fontWeight: '500'
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

export default EmailVerificationTemplate;
