import React from 'react';
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
              We want to make it clear: Mathematico does not collect, store, or share any personal information from users.
            </Paragraph>
            <Paragraph style={styles.paragraph}>We do not request or access data such as:</Paragraph>
            <List.Item title="Names, email addresses, or phone numbers" left={(p) => <List.Icon {...p} icon="account-off" />} />
            <List.Item title="Device identifiers, IP addresses, or precise location data" left={(p) => <List.Icon {...p} icon="map-marker-off" />} />
            <List.Item title="Usage analytics or cookies" left={(p) => <List.Icon {...p} icon="chart-line-variant" />} />
          </List.Section>

          <List.Section>
            <List.Subheader style={styles.subheader}>2. How We Use Your Information</List.Subheader>
            <Paragraph style={styles.paragraph}>
              Since we do not collect any personal information, we do not use or process user data for any purpose.
            </Paragraph>
          </List.Section>

          <List.Section>
            <List.Subheader style={styles.subheader}>3. Data Sharing</List.Subheader>
            <Paragraph style={styles.paragraph}>As no data is collected, no information is shared with third parties.</Paragraph>
          </List.Section>

          <List.Section>
            <List.Subheader style={styles.subheader}>4. Children's Privacy</List.Subheader>
            <Paragraph style={styles.paragraph}>
              The Mathematico app is safe for all age groups. Since we do not collect any personal data,
              children under 13 (or the minimum legal age in your country) can use the app without risk
              of personal information being collected.
            </Paragraph>
          </List.Section>

          <List.Section>
            <List.Subheader style={styles.subheader}>5. Data Security</List.Subheader>
            <Paragraph style={styles.paragraph}>
              Because we do not collect or store any personal information, there is no risk of your data
              being exposed or misused.
            </Paragraph>
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


