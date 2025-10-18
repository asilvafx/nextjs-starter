// emails/WelcomeTemplate.jsx
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

export const WelcomeTemplate = ({
    userDisplayName = '[Prénom]',
    companyName = '[Nom de ton site]',
    shopUrl = 'https://yourshop.com'
}) => {
    const logo_img = 'https://bplw5mbobnwdstj8.public.blob.vercel-storage.com/logo.png';

    return (
        <Html>
            <Head />
            <Preview>Bienvenue dans la famille ! 👋🧡</Preview>
            <Body style={emailStyles.main}>
                <Container style={emailStyles.container}>
                    {/* Logo Section */}
                    <Section style={emailStyles.logoSection}>
                        <Img src={logo_img} width="150" height="50" alt={companyName} style={emailStyles.logo} />
                    </Section>

                    {/* Header */}
                    <Heading style={emailStyles.heading}>Hello {userDisplayName} ! 👋</Heading>

                    {/* Main Message */}
                    <Text style={emailStyles.paragraph}>On est super heureux de t'accueillir parmi nous 🎉</Text>

                    <Text style={emailStyles.paragraph}>
                        Tu viens de rejoindre la famille {companyName}, et on peut te le dire : tu vas te sentir ici
                        comme à la maison.
                    </Text>

                    <Text style={emailStyles.paragraph}>
                        Des vêtements stylés, confortables et pensés avec amour, c'est ce qu'on fait de mieux. Et
                        maintenant, c'est pour toi aussi !
                    </Text>

                    {/* Features Section */}
                    <Section style={emailStyles.featuresSection}>
                        <Text style={emailStyles.featuresTitle}>Garde un œil sur ta boîte mail :</Text>
                        <Text style={emailStyles.featureText}>
                            👉 Des surprises, des nouveautés, des offres exclusives (et un peu d'amour aussi 💌)
                            arrivent très vite.
                        </Text>
                    </Section>

                    {/* CTA Section */}
                    <Text style={emailStyles.paragraph}>
                        En attendant, fais comme chez toi et jette un œil à nos collections :
                    </Text>

                    <Section style={emailStyles.buttonSection}>
                        <Button style={emailStyles.button} href={shopUrl}>
                            🔗 Découvrir la boutique
                        </Button>
                    </Section>

                    <Text style={emailStyles.paragraph}>
                        Besoin d'un coup de main ou d'un conseil taille/style ? Écris-nous, on est là pour toi !
                    </Text>

                    {/* Footer */}
                    <Section style={emailStyles.footer}>
                        <Text style={emailStyles.footerText}>
                            Encore bienvenue,
                            <br />
                            L'équipe {companyName}
                        </Text>
                    </Section>

                    {/* Support Section */}
                    <Section style={emailStyles.supportSection}>
                        <Text style={emailStyles.supportText}>
                            Une question ?{' '}
                            <Link href="mailto:support@yourshop.com" style={emailStyles.link}>
                                Contacte-nous
                            </Link>{' '}
                            ou visite notre{' '}
                            <Link href="https://yourshop.com/aide" style={emailStyles.link}>
                                centre d'aide
                            </Link>
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default WelcomeTemplate;
