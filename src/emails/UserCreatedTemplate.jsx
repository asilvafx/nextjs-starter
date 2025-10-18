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

export const UserCreatedTemplate = ({
    userDisplayName,
    email,
    password,
    loginUrl,
    companyName = process.env.NEXT_PUBLIC_APP_NAME || 'Our Platform'
}) => {
    const logo_img = 'https://bplw5mbobnwdstj8.public.blob.vercel-storage.com/logo.png';

    return (
        <Html>
            <Head />
            <Preview>Your Account Has Been Created</Preview>
            <Body style={emailStyles.main}>
                <Container style={emailStyles.container}>
                    <Section style={emailStyles.logoSection}>
                        <Img src={logo_img} width="150" height="50" alt={companyName} style={emailStyles.logo} />
                    </Section>

                    <Heading style={emailStyles.heading}>Welcome to {companyName}!</Heading>

                    <Text style={emailStyles.paragraph}>Hello {userDisplayName},</Text>

                    <Text style={emailStyles.paragraph}>
                        Your account has been successfully created. Here are your login details:
                    </Text>

                    <Section style={emailStyles.featuresSection}>
                        <Text style={emailStyles.featureText}>Email: {email}</Text>
                        <Text style={emailStyles.featureText}>Password: {password}</Text>
                    </Section>

                    <Text style={emailStyles.paragraph}>
                        Please login to your account and change your password as soon as possible.
                    </Text>

                    <Section style={emailStyles.buttonSection}>
                        <Button style={emailStyles.button} href={loginUrl}>
                            Login to Your Account
                        </Button>
                    </Section>

                    <Section style={emailStyles.footer}>
                        <Text style={emailStyles.footerText}>
                            Best regards,
                            <br />
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

export default UserCreatedTemplate;
