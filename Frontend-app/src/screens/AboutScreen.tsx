import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Divider, List } from 'react-native-paper';
import { designSystem } from '../styles/designSystem';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>About Us</Title>
          <Paragraph style={styles.paragraph}>Welcome to Mathematico, and thank you for being part of our journey!</Paragraph>

          <Divider style={styles.divider} />
          <Title style={styles.subtitle}>Who We Are</Title>
          <Paragraph style={styles.paragraph}>
            We are a passionate team of developers, designers, and innovators committed to creating
            solutions that make everyday life simpler, smarter, and more enjoyable. Our goal is to
            provide an app that not only works flawlessly but also delivers real value to our users.
          </Paragraph>
          <Divider style={styles.divider} />
          <Title style={styles.subtitle}>Our Mission</Title>
          <Paragraph style={styles.paragraph}>
            Our mission is to make learning accessible for everyone. We believe technology should be
            easy to use, reliable, and beneficial for everyone.
          </Paragraph>
          <Divider style={styles.divider} />
          <Title style={styles.subtitle}>What We Do</Title>
          <List.Section>
            <List.Item title="User-Centered Design" description="We design with our users in mind, ensuring smooth navigation and a great experience." left={(p) => <List.Icon {...p} icon="account" />} />
            <List.Item title="Constant Innovation" description="We are always improving and adding new features based on user feedback." left={(p) => <List.Icon {...p} icon="lightbulb-on" />} />
            <List.Item title="Secure & Reliable" description="We value your trust and work hard to keep your data secure and private." left={(p) => <List.Icon {...p} icon="shield-check" />} />
          </List.Section>

          <Divider style={styles.divider} />
          <Title style={styles.subtitle}>Why Choose Us?</Title>
          <List.Section>
            <List.Item title="A simple and intuitive interface" left={(p) => <List.Icon {...p} icon="gesture-tap" />} />
            <List.Item title="Fast and secure services" left={(p) => <List.Icon {...p} icon="speedometer" />} />
            <List.Item title="A dedicated support team always ready to help" left={(p) => <List.Icon {...p} icon="account-supervisor" />} />
            <List.Item title="Regular updates to meet user needs" left={(p) => <List.Icon {...p} icon="update" />} />
          </List.Section>

          <Divider style={styles.divider} />
          <Title style={styles.subtitle}>Our Vision</Title>
          <Paragraph style={styles.paragraph}>
            We envision a world where technology bridges gaps, solves everyday problems, and empowers
            people to achieve more. With Mathematico, we aim to be part of that change.
          </Paragraph>

          <Divider style={styles.divider} />
          <Title style={styles.subtitle}>Get in Touch</Title>
          <Paragraph style={styles.paragraph}>
            We love hearing from our users! If you have suggestions, feedback, or questions, please
            contact us at: dipanjanchatterjee23@gmail.com
          </Paragraph>
          <Paragraph style={styles.paragraph}>Together, let's build a better digital experience with Mathematico.</Paragraph>
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
  subtitle: {
    ...designSystem.typography.h3,
    color: designSystem.colors.textPrimary,
    marginTop: designSystem.spacing.md,
    marginBottom: designSystem.spacing.xs,
  },
  paragraph: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
  },
  divider: {
    marginVertical: designSystem.spacing.md,
  },
});


