import { ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, List } from 'react-native-paper';
import { designSystem } from '../styles/designSystem';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Privacy Policy for Mathematico Mobile App</Title>
          <Paragraph style={styles.paragraph}>
            At Mathematico, we value your privacy. This Privacy Policy explains how our
            Mathematico mobile application handles user information.
          </Paragraph>

          <List.Section>
            <List.Subheader style={styles.subheader}>1. Information We Collect</List.Subheader>
            <Paragraph style={styles.paragraph}>
              To provide our educational services, Mathematico collects certain information from users:
            </Paragraph>
            <List.Item title="Account Information: Name, email address, and password for account creation" left={(p) => <List.Icon {...p} icon="account" />} />
            <List.Item title="Profile Data: User preferences, learning progress, and activity history" left={(p) => <List.Icon {...p} icon="chart-line" />} />
            <List.Item title="Authentication Data: Secure tokens for maintaining login sessions" left={(p) => <List.Icon {...p} icon="shield-key" />} />
            <List.Item title="Usage Analytics: App usage patterns to improve our educational content" left={(p) => <List.Icon {...p} icon="analytics" />} />
            <Paragraph style={styles.paragraph}>We do not collect:</Paragraph>
            <List.Item title="Precise location data or device identifiers" left={(p) => <List.Icon {...p} icon="map-marker-off" />} />
            <List.Item title="Contacts, photos, or files from your device" left={(p) => <List.Icon {...p} icon="folder-off" />} />
          </List.Section>

          <List.Section>
            <List.Subheader style={styles.subheader}>2. How We Use Your Information</List.Subheader>
            <Paragraph style={styles.paragraph}>
              We use the collected information for the following purposes:
            </Paragraph>
            <List.Item title="Account Management: To create and maintain your user account" left={(p) => <List.Icon {...p} icon="account-cog" />} />
            <List.Item title="Authentication: To securely log you in and maintain your session" left={(p) => <List.Icon {...p} icon="shield-check" />} />
            <List.Item title="Educational Services: To provide personalized learning experiences" left={(p) => <List.Icon {...p} icon="school" />} />
            <List.Item title="App Improvement: To analyze usage patterns and enhance our services" left={(p) => <List.Icon {...p} icon="trending-up" />} />
          </List.Section>

          <List.Section>
            <List.Subheader style={styles.subheader}>3. Data Sharing</List.Subheader>
            <Paragraph style={styles.paragraph}>
              We do not sell, trade, or share your personal information with third parties, except:
            </Paragraph>
            <List.Item title="Payment Processors: Razorpay for processing educational purchases" left={(p) => <List.Icon {...p} icon="credit-card" />} />
            <List.Item title="Service Providers: Cloud infrastructure for app functionality" left={(p) => <List.Icon {...p} icon="cloud" />} />
            <Paragraph style={styles.paragraph}>
              We share only necessary information required for these services to function.
            </Paragraph>
          </List.Section>

          <List.Section>
            <List.Subheader style={styles.subheader}>4. Children's Privacy</List.Subheader>
            <Paragraph style={styles.paragraph}>
              The Mathematico app is designed for educational purposes and is suitable for all age groups. 
              For children under 13 (or minimum legal age in your country), we require parental consent 
              before account creation. We limit data collection for children to what is necessary for 
              educational purposes only.
            </Paragraph>
          </List.Section>

          <List.Section>
            <List.Subheader style={styles.subheader}>5. Data Security</List.Subheader>
            <Paragraph style={styles.paragraph}>
              We implement industry-standard security measures to protect your information:
            </Paragraph>
            <List.Item title="Encryption: All data is encrypted in transit and at rest" left={(p) => <List.Icon {...p} icon="lock" />} />
            <List.Item title="Secure Authentication: JWT tokens and password hashing" left={(p) => <List.Icon {...p} icon="shield-key" />} />
            <List.Item title="Regular Security Updates: We maintain up-to-date security practices" left={(p) => <List.Icon {...p} icon="security" />} />
          </List.Section>

          <List.Section>
            <List.Subheader style={styles.subheader}>6. Changes to This Policy</List.Subheader>
            <Paragraph style={styles.paragraph}>
              We may update this Privacy Policy in the future. Any updates will be published on this page
              with a revised Effective Date.
            </Paragraph>
          </List.Section>

          <List.Section>
            <List.Subheader style={styles.subheader}>7. Contact Us</List.Subheader>
            <Paragraph style={styles.paragraph}>
              If you have any questions about this Privacy Policy or about the Mathematico app, you can contact us at:
            </Paragraph>
            <Paragraph style={styles.paragraph}>📧 Email: dipanjanchatterjee23@gmail.com</Paragraph>
          </List.Section>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.background,
  },
  card: {
    margin: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.lg,
    ...designSystem.shadows.md,
  },
  title: {
    ...designSystem.typography.h2,
    color: designSystem.colors.textPrimary,
    marginBottom: designSystem.spacing.sm,
  },
  subheader: {
    ...designSystem.typography.h4,
    color: designSystem.colors.textPrimary,
  },
  paragraph: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
    marginBottom: designSystem.spacing.md,
  },
});


