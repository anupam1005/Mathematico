import React from 'react';
import { ScrollView, View, Text, StyleSheet, Image } from 'react-native';
import { Card, Title, Paragraph, Divider } from 'react-native-paper';
import Icon from '../components/Icon';
import { designSystem } from '../styles/designSystem';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.introContainer}>
            <View style={styles.introTextContainer}>
              <Paragraph style={styles.introParagraph}>
                Welcome to Mathematico. Led by Dipanjan Chatterjee (M.Sc. in Pure Mathematics) with over 15 years of teaching experience, Mathematico focuses on deep understanding rather than memorization. Many of our students are now pursuing successful careers and higher studies across India and abroad.
              </Paragraph>
            </View>
            <View style={styles.imageContainer}>
              <Image
                source={require('../../assets/Owner.jpg')}
                style={styles.ownerImage}
                resizeMode="cover"
              />
            </View>
          </View>

          <Divider style={styles.divider} />
          
          <View style={styles.sectionHeader}>
            <Icon name="school" size={24} color={designSystem.colors.primary} />
            <Title style={styles.subtitle}>Who We Are</Title>
          </View>
          <Paragraph style={styles.paragraph}>
            We are an institute committed to building strong mathematical foundations from an early stage. Our aim is to guide students from Class 8 onwards, preparing them for prestigious exams such as IIT-JEE, ISI, IOQM, RMO, and more.
          </Paragraph>
          <Paragraph style={styles.paragraph}>
            We emphasize logical reasoning, puzzles, riddles, and problem-solving skills so that students don't just learn mathematics — they start thinking like mathematicians.
          </Paragraph>
          <Paragraph style={styles.paragraph}>
            We use selected high-quality foreign mathematics books of different languages and problem sets that are usually difficult to find or very costly, ensuring world-level exposure in learning.
          </Paragraph>

          <Divider style={styles.divider} />
          
          <View style={styles.sectionHeader}>
            <Icon name="target" size={24} color={designSystem.colors.primary} />
            <Title style={styles.subtitle}>Our Mission</Title>
          </View>
          <Paragraph style={styles.paragraph}>
            Our mission is to develop young minds to become analytical, confident, and competitive thinkers.
          </Paragraph>
          <Paragraph style={styles.paragraph}>
            We believe Mathematics is not about memorizing formulas but understanding the "why" behind every concept.
          </Paragraph>
          <Paragraph style={styles.paragraph}>We aim to:</Paragraph>
          
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Icon name="check-circle" size={16} color={designSystem.colors.primary} />
              <Text style={styles.bulletText}>Make Mathematics enjoyable and meaningful</Text>
            </View>
            <View style={styles.bulletItem}>
              <Icon name="check-circle" size={16} color={designSystem.colors.primary} />
              <Text style={styles.bulletText}>Encourage curiosity and independent thinking</Text>
            </View>
            <View style={styles.bulletItem}>
              <Icon name="check-circle" size={16} color={designSystem.colors.primary} />
              <Text style={styles.bulletText}>Prepare students for advanced problem-solving and competitive exams</Text>
            </View>
            <View style={styles.bulletItem}>
              <Icon name="check-circle" size={16} color={designSystem.colors.primary} />
              <Text style={styles.bulletText}>Give personal attention and individual support to every learner</Text>
            </View>
          </View>

          <Divider style={styles.divider} />
          
          <View style={styles.sectionHeader}>
            <Icon name="book-open-variant" size={24} color={designSystem.colors.primary} />
            <Title style={styles.subtitle}>What We Do</Title>
          </View>
          
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Icon name="account-group" size={16} color={designSystem.colors.primary} />
              <Text style={styles.bulletText}>Small batch size (maximum 15 students) for personal care and focused teaching</Text>
            </View>
            <View style={styles.bulletItem}>
              <Icon name="trophy" size={16} color={designSystem.colors.primary} />
              <Text style={styles.bulletText}>Special Geometry Program for IOQM / RMO aspirants</Text>
            </View>
            <View style={styles.bulletItem}>
              <Icon name="file-document-outline" size={16} color={designSystem.colors.primary} />
              <Text style={styles.bulletText}>Regular Monthly Exams (4 per month) to track progress and strengthen concepts</Text>
            </View>
            <View style={styles.bulletItem}>
              <Icon name="message-text-outline" size={16} color={designSystem.colors.primary} />
              <Text style={styles.bulletText}>Doubt Clearing Support through a dedicated WhatsApp group</Text>
            </View>
            <View style={styles.bulletItem}>
              <Icon name="message-text-outline" size={16} color={designSystem.colors.primary} />
              <Text style={styles.bulletText}>Online doubt clarification for offline classroom students</Text>
            </View>
            <View style={styles.bulletItem}>
              <Icon name="book-open-variant" size={16} color={designSystem.colors.primary} />
              <Text style={styles.bulletText}>Provide problem sheets and assignments from international mathematics books</Text>
            </View>
            <View style={styles.bulletItem}>
              <Icon name="lightbulb-outline" size={16} color={designSystem.colors.primary} />
              <Text style={styles.bulletText}>Encourage puzzle-solving and logical reasoning from early levels</Text>
            </View>
          </View>

          <Divider style={styles.divider} />
          
          <Paragraph style={styles.conclusionParagraph}>
            We work to ensure that every student not only scores well but also understands deeply and enjoys learning.
          </Paragraph>
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
  introContainer: {
    flexDirection: 'row',
    marginBottom: designSystem.spacing.sm,
    alignItems: 'flex-start',
  },
  introTextContainer: {
    flex: 1,
    paddingRight: designSystem.spacing.md,
  },
  introParagraph: {
    ...designSystem.typography.body,
    color: designSystem.colors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
  },
  imageContainer: {
    marginLeft: designSystem.spacing.md,
  },
  ownerImage: {
    width: 120,
    height: 150,
    borderRadius: designSystem.borderRadius.md,
    ...designSystem.shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: designSystem.spacing.md,
    marginBottom: designSystem.spacing.xs,
  },
  subtitle: {
    ...designSystem.typography.h3,
    color: designSystem.colors.textPrimary,
    marginLeft: designSystem.spacing.sm,
    flex: 1,
  },
  paragraph: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
    lineHeight: 22,
    marginBottom: designSystem.spacing.sm,
  },
  conclusionParagraph: {
    ...designSystem.typography.body,
    color: designSystem.colors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    marginTop: designSystem.spacing.sm,
  },
  divider: {
    marginVertical: designSystem.spacing.md,
  },
  bulletList: {
    marginTop: designSystem.spacing.sm,
    marginBottom: designSystem.spacing.sm,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: designSystem.spacing.sm,
    paddingRight: designSystem.spacing.sm,
  },
  bulletText: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
    lineHeight: 22,
    flex: 1,
    marginLeft: designSystem.spacing.sm,
  },
});


