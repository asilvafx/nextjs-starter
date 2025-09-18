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

export const UserUpdatedTemplate = ({
    userDisplayName,
    changes,
    loginUrl,
    companyName = process.env.NEXT_PUBLIC_APP_NAME || 'Our Platform'
}) => {
    const logo_img = "https://bplw5mbobnwdstj8.public.blob.vercel-storage.com/logo.png";
    
    return (
        <Html>
            <Head />
            <Preview>Your Account Has Been Updated</Preview>
            <Body style={emailStyles.main}>
                <Container style={emailStyles.container}>
                    <Section style={emailStyles.logoSection}>
                        <Img
                            src={logo_img}
                            width="150"
                            height="50"
                            alt={companyName}
                            style={emailStyles.logo}
                        />
                    </Section>

                    <Heading style={emailStyles.heading}>Account Update Notification</Heading>

                    <Text style={emailStyles.paragraph}>
                        Hello {userDisplayName},
                    </Text>

                    <Text style={emailStyles.paragraph}>
                        Your account information has been updated. Here are the changes:
                    </Text>

                    <Section style={emailStyles.featuresSection}>
                        {Object.entries(changes).map(([key, value]) => (
                            <Text key={key} style={emailStyles.featureText}>
                                {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
                            </Text>
                        ))}
                    </Section>

                    <Text style={emailStyles.paragraph}>
                        If you did not make these changes, please contact our support team immediately.
                    </Text>

                    <Section style={emailStyles.buttonSection}>
                        <Button style={emailStyles.button} href={loginUrl}>
                            Login to Your Account
                        </Button>
                    </Section>

                    <Section style={emailStyles.footer}>
                        <Text style={emailStyles.footerText}>
                            Best regards,<br />
                            The {companyName} Team
                        </Text>
                    </Section>

                    <Section style={emailStyles.supportSection}>
                        <Text style={emailStyles.supportText}>
                            Need help? Contact our support team at{' '}
                            <Link href={`mailto:${process.env.SUPPORT_EMAIL}`} style={emailStyles.link}>
                                {process.env.SUPPORT_EMAIL}
                            </Link>
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default UserUpdatedTemplate;