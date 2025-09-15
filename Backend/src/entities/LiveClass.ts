import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, Length, IsUrl, IsOptional, IsNumber, IsBoolean, IsUUID, IsDateString } from 'class-validator';
import { User } from './User';

@Entity('live_classes')
export class LiveClass {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  @Length(5, 255)
  title!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @IsNotEmpty()
  slug!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  description?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  category?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  subject?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  class?: string;

  @Column({ type: 'varchar', length: 50, default: 'Foundation' })
  @IsOptional()
  level?: string;

  @Column({ name: 'thumbnail_url', type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  thumbnailUrl?: string;

  @Column({ name: 'meeting_url', type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsUrl()
  meetingUrl?: string;

  @Column({ name: 'meeting_id', type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  meetingId?: string;

  @Column({ name: 'meeting_password', type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  meetingPassword?: string;

  @Column({ name: 'scheduled_at', type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDateString()
  scheduledAt?: Date;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDateString()
  startedAt?: Date;

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDateString()
  endedAt?: Date;

  @Column({ type: 'int', default: 60 })
  @IsOptional()
  @IsNumber()
  duration!: number; // in minutes

  @Column({ name: 'max_students', type: 'int', default: 50 })
  @IsOptional()
  @IsNumber()
  maxStudents!: number;

  @Column({ name: 'enrolled_students', type: 'int', default: 0 })
  @IsOptional()
  @IsNumber()
  enrolledStudents!: number;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  @IsOptional()
  status!: string; // draft, scheduled, live, completed, cancelled

  @Column({ name: 'is_published', type: 'boolean', default: false })
  @IsOptional()
  @IsBoolean()
  isPublished!: boolean;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured!: boolean;

  @Column({ name: 'is_recording_enabled', type: 'boolean', default: false })
  @IsOptional()
  @IsBoolean()
  isRecordingEnabled!: boolean;

  @Column({ name: 'recording_url', type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsUrl()
  recordingUrl?: string;

  @Column({ type: 'json', nullable: true })
  @IsOptional()
  topics?: string[];

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  prerequisites?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  materials?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  notes?: string;

  @Column({ name: 'instructor_id', type: 'varchar', length: 36 })
  @IsUUID()
  instructorId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'instructor_id' })
  instructor!: User;

  @Column({ name: 'course_id', type: 'varchar', length: 255 })
  @IsNotEmpty()
  courseId!: string;


  @Column({ name: 'created_by', type: 'varchar', length: 36 })
  @IsUUID()
  createdBy!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  creator!: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
