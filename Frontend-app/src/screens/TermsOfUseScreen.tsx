import { ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, List } from 'react-native-paper';
import { designSystem } from '../styles/designSystem';

export default function TermsOfUseScreen() {
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Terms of Service</Title>
          <Paragraph style={styles.paragraph}>These Terms govern your use of Mathematico</Paragraph>
          <Paragraph style={styles.paragraph}>
            These Terms of Service ("Terms") govern your use of Mathematico. By accessing or
            using our app, you agree to these Terms.
          </Paragraph>

          <List.Section>
            <List.Subheader style={styles.subheader}>1. Eligibility</List.Subheader>
            <Paragraph style={styles.paragraph}>You must be at least 13 years old (or legal age in your country) to use our app.</Paragraph>
          </List.Section>

          <List.Section>
            <List.Subheader style={styles.subheader}>2. User Accounts</List.Subheader>
            <List.Item title="You are responsible for maintaining account and password confidentiality" left={(p) => <List.Icon {...p} icon="shield-account" />} />
            <List.Item title="Do not share your account or use another person's account" left={(p) => <List.Icon {...p} icon="account-off" />} />
            <List.Item title="We may suspend or terminate accounts that violate these Terms" left={(p) => <List.Icon {...p} icon="account-cancel" />} />
          </List.Section>

          <List.Section>
            <List.Subheader style={styles.subheader}>3. Acceptable Use</List.Subheader>
            <List.Item title="Do not use the app for illegal or harmful purposes" left={(p) => <List.Icon {...p} icon="gavel" />} />
            <List.Item title="Do not hack, disrupt, or misuse our systems" left={(p) => <List.Icon {...p} icon="alert" />} />
            <List.Item title="Do not upload malicious content or spam" left={(p) => <List.Icon {...p} icon="spam" />} />
          </List.Section>

          <List.Section>
            <List.Subheader style={styles.subheader}>4. Intellectual Property</List.Subheader>
            <Paragraph style={styles.paragraph}>
              All content, trademarks, and software are owned by Mathematico or our licensors. You
              may not copy, modify, or distribute without permission.
            </Paragraph>
          </List.Section>

          <List.Section>
            <List.Subheader style={styles.subheader}>5. Limitation of Liability</List.Subheader>
            <Paragraph style={styles.paragraph}>
              We provide the app "as is" and are not responsible for interruptions, errors, or data loss.
            </Paragraph>
            <Paragraph style={styles.paragraph}>
              To the maximum extent permitted by law, we are not liable for damages resulting from use of our app.
            </Paragraph>
          </List.Section>

          <List.Section>
            <List.Subheader style={styles.subheader}>6. Termination</List.Subheader>
            <Paragraph style={styles.paragraph}>We may suspend or terminate your access if you violate these Terms.</Paragraph>
          </List.Section>

          <List.Section>
            <List.Subheader style={styles.subheader}>7. Changes to Terms</List.Subheader>
            <Paragraph style={styles.paragraph}>We may update these Terms at any time. Continued use of the app means you accept the updated Terms.</Paragraph>
          </List.Section>

          <List.Section>
            <List.Subheader style={styles.subheader}>8. Governing Law</List.Subheader>
            <Paragraph style={styles.paragraph}>These Terms are governed by the laws of India.</Paragraph>
          </List.Section>

          <List.Section>
            <List.Subheader style={styles.subheader}>Questions About These Terms?</List.Subheader>
            <Paragraph style={styles.paragraph}>If you have any questions about these Terms of Service, please contact us at: dipanjanchatterjee23@gmail.com</Paragraph>
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


