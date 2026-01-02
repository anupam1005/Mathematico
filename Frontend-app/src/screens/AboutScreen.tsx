<<<<<<< HEAD
import React from 'react';
import { ScrollView, View, Text, StyleSheet, Image } from 'react-native';
import { Card, Title, Paragraph, Divider } from 'react-native-paper';
import { GraduationCap, Target, BookOpen, Users, Award, FileText, MessageCircle, Lightbulb, CheckCircle } from 'lucide-react-native';
=======
// @ts-nocheck
import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Divider, List } from 'react-native-paper';
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
import { designSystem } from '../styles/designSystem';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
<<<<<<< HEAD
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
            <GraduationCap size={24} color={designSystem.colors.primary} />
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
            <Target size={24} color={designSystem.colors.primary} />
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
              <CheckCircle size={16} color={designSystem.colors.primary} />
              <Text style={styles.bulletText}>Make Mathematics enjoyable and meaningful</Text>
            </View>
            <View style={styles.bulletItem}>
              <CheckCircle size={16} color={designSystem.colors.primary} />
              <Text style={styles.bulletText}>Encourage curiosity and independent thinking</Text>
            </View>
            <View style={styles.bulletItem}>
              <CheckCircle size={16} color={designSystem.colors.primary} />
              <Text style={styles.bulletText}>Prepare students for advanced problem-solving and competitive exams</Text>
            </View>
            <View style={styles.bulletItem}>
              <CheckCircle size={16} color={designSystem.colors.primary} />
              <Text style={styles.bulletText}>Give personal attention and individual support to every learner</Text>
            </View>
          </View>

          <Divider style={styles.divider} />
          
          <View style={styles.sectionHeader}>
            <BookOpen size={24} color={designSystem.colors.primary} />
            <Title style={styles.subtitle}>What We Do</Title>
          </View>
          
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Users size={16} color={designSystem.colors.primary} />
              <Text style={styles.bulletText}>Small batch size (maximum 15 students) for personal care and focused teaching</Text>
            </View>
            <View style={styles.bulletItem}>
              <Award size={16} color={designSystem.colors.primary} />
              <Text style={styles.bulletText}>Special Geometry Program for IOQM / RMO aspirants</Text>
            </View>
            <View style={styles.bulletItem}>
              <FileText size={16} color={designSystem.colors.primary} />
              <Text style={styles.bulletText}>Regular Monthly Exams (4 per month) to track progress and strengthen concepts</Text>
            </View>
            <View style={styles.bulletItem}>
              <MessageCircle size={16} color={designSystem.colors.primary} />
              <Text style={styles.bulletText}>Doubt Clearing Support through a dedicated WhatsApp group</Text>
            </View>
            <View style={styles.bulletItem}>
              <MessageCircle size={16} color={designSystem.colors.primary} />
              <Text style={styles.bulletText}>Online doubt clarification for offline classroom students</Text>
            </View>
            <View style={styles.bulletItem}>
              <BookOpen size={16} color={designSystem.colors.primary} />
              <Text style={styles.bulletText}>Provide problem sheets and assignments from international mathematics books</Text>
            </View>
            <View style={styles.bulletItem}>
              <Lightbulb size={16} color={designSystem.colors.primary} />
              <Text style={styles.bulletText}>Encourage puzzle-solving and logical reasoning from early levels</Text>
            </View>
          </View>

          <Divider style={styles.divider} />
          
          <Paragraph style={styles.conclusionParagraph}>
            We work to ensure that every student not only scores well but also understands deeply and enjoys learning.
          </Paragraph>
=======
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
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
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
=======
  title: {
    ...designSystem.typography.h2,
    color: designSystem.colors.textPrimary,
    marginBottom: designSystem.spacing.sm,
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  },
  subtitle: {
    ...designSystem.typography.h3,
    color: designSystem.colors.textPrimary,
<<<<<<< HEAD
    marginLeft: designSystem.spacing.sm,
    flex: 1,
=======
    marginTop: designSystem.spacing.md,
    marginBottom: designSystem.spacing.xs,
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  },
  paragraph: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
<<<<<<< HEAD
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
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  },
  divider: {
    marginVertical: designSystem.spacing.md,
  },
<<<<<<< HEAD
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
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
});


